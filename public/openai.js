const remote = require('@electron/remote');
const { BrowserWindow } = remote;
const http = require('http');
const axios = require('axios');
const { readCharacter } = require('./charactercard');
const { loadChat } = require('./chat');
const EventSourceStream = require('./EventSourceStream');

let aiStatus = {
    tokensPerSecond: 0,
}

async function openAiApiCall(url, method, data, apikey = null) {
    try {
        const response = await axios({
            method: method,
            url: url,
            // body: JSON.stringify(data),
            data: data,
        });
        // const response = await axios[method.toLowerCase()](url, data);

        return response.data;
    } catch (error) {
        return null;
    }
}

async function openAiValidate(server, apikey = null) {
    return ((await openAiApiCall(server + 'v1/models', 'GET', null, apikey)) != null);
}

async function openAiGetActiveModel(server, apikey = null) {
    return (await openAiApiCall(server + 'v1/internal/model/info', 'GET', null, apikey));
    // try {
    //     const response = await axios.get(server + 'v1/internal/model/info');
    //     return response.data;
    // } catch (error) {
    //     return null;
    // }
}

async function openAiGetTokenCount(server, data) {
    return (await openAiApiCall(server + 'v1/internal/token-count', 'POST', {
        text: data
    }));

}

async function openAiRequestCompletion(chat_id, character_id, abortController, _continue = false) {
    const server = await window.electron.getOpenAIServer();
    const url = server + 'v1/completions/';
    const input_prompt = await openAiGetPrompt(chat_id, character_id, _continue);
    const chat = await loadChat(chat_id);
    const characters = [];
    const stream_result = true;
    for (const character_id of chat.characters) {
        const character = await readCharacter(character_id);
        characters.push(character);
    }
    const chara_stop_strings = characters.map(c => `\n${c.name}:`);

    const payload = {
        server: server,
        prompt: input_prompt,
        max_new_tokens: 150, //TODO: setting
        max_tokens: 150, //TODO: setting
        temperature: 0.72,
        top_p: 0.73,
        typical_p: 1,
        typical: 1,
        sampler_seed: -1,
        min_p: 0,
        repetition_penalty: 1.1,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_k: 0,
        min_length: 0,
        min_tokens: 0,
        num_beams: 1,
        length_penalty: 1,
        early_stopping: false,
        add_bos_token: true,
        dynamic_temperature: false,
        dynatemp_low: 1,
        dynatemp_high: 1,
        dynatemp_range: 0,
        dynatemp_exponent: 1,
        smoothing_factor: 0,
        sampler_priority: [
            'temperature',
            'dynamic_temperature',
            'quadratic_sampling',
            'top_k',
            'top_p',
            'typical_p',
            'epsilon_cutoff',
            'eta_cutoff',
            'tfs',
            'top_a',
            'min_p',
            'mirostat'
        ],
        stopping_strings: ['\nUser:', ...chara_stop_strings],
        stop: ['\nUser:', ...chara_stop_strings],
        truncation_length: 4096, //TODO: setting
        ban_eos_token: false,
        skip_special_tokens: true,
        top_a: 0,
        tfs: 1,
        epsilon_cutoff: 0,
        eta_cutoff: 0,
        mirostat_mode: 0,
        mirostat_tau: 5,
        mirostat_eta: 0.1,
        custom_token_bans: '',
        rep_pen: 1.1,
        rep_pen_range: 0,
        repetition_penalty_range: 0,
        encoder_repetition_penalty: 1,
        no_repeat_ngram_size: 0,
        penalty_alpha: 0,
        temperature_last: true,
        do_sample: true,
        seed: -1,
        guidance_scale: 1,
        negative_prompt: '',
        grammar_string: '',
        repeat_penalty: 1.1,
        tfs_z: 1,
        repeat_last_n: 0,
        n_predict: 150,
        mirostat: 0,
        ignore_eos: false,
        stream: stream_result //TODO but difficult
    }

    //axios is bugged, cant stream POST requests

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
    });

    const eventStream = new EventSourceStream();
    response.body.pipeThrough(eventStream);
    const reader = eventStream.readable.getReader();

    let text = '';

    while (true) {
        const { done, value } = await reader.read();
        // if (done) break;
        // if (value.data === "[DONE]") break;
        if (done || value?.data === "[DONE]") {
            console.log(value);

            const _prompt = input_prompt;
            const _response = text;

            const { length: completion_tokens } = await openAiGetTokenCount(server, _response);
            const { length: prompt_tokens } = await openAiGetTokenCount(server, _prompt);
            const { model_name: model } = await openAiGetActiveModel(server);

            console.log('model', model);

            const stats = {
                completion_tokens: completion_tokens,
                prompt_tokens: prompt_tokens,
                model: model,
                character: character_id,
                is_ai: true
            }

            await window.electron.applyStats(stats);
            break;
        }
        const jsonData = JSON.parse(value.data);
        // console.log(jsonData);
        const newText = text + jsonData.choices[0]?.text;
        text = newText;

        BrowserWindow.getAllWindows()[0].webContents.send('ai-streaming', text);
    }
    BrowserWindow.getAllWindows()[0].webContents.send('ai-streaming-finished', '');

    return text;
}

async function openAiGetPrompt(chat_id, respond_character_id = null, _continue = false) {
    //converts the chat messages to a prompt that AI can understand
    const chat = await window.electron.getChat(chat_id);
    const character_ids = [];
    //find all unique characters based on the chat messages (there can be duplicates)
    for (const message of chat.messages) {
        if (message.character_id && !character_ids.includes(message.character_id)) {
            character_ids.push(message.character_id);
        }
    }

    //also check the chat's character list
    for (const character_id of chat.characters) {
        if (!character_ids.includes(character_id)) {
            character_ids.push(character_id);
        }
    }

    const characters = [];
    for (const character_id of character_ids) {
        const character = await window.electron.getCharacter(character_id);
        characters.push(character);
    }

    // for (const character_id of chat.characters) {
    //     const character = await window.electron.getCharacter(character_id);
    //     characters.push(character);
    // }

    console.log('character ids', character_ids);
    console.log('responding', respond_character_id);
    const responding_character = characters.find(c => c.id === respond_character_id);
    let prompt = "";

    if (respond_character_id) {
        prompt += `## ${responding_character.name}\n`
        prompt += `- You're "${responding_character.name}" in this never-ending roleplay. Keep all replies short. Avoid writing replies for other characters.\n`
    }

    prompt += `### Input:\n`;

    for (const character of characters) {
        prompt += await openAiGetCharacterPrompt(character.id);
    }

    prompt += `### Response:\n`;
    prompt += `(OOC) Understood. I will take this info into account for the roleplay. (end OOC)\n`;
    prompt += `### New Roleplay:\n`;

    for (const message of chat.messages) {
        let name;
        if (!message.character_id) {
            name = "User";
        } else {
            const character = characters.find(c => c.id === message.character_id);
            name = character.name;
        }
        prompt += name + ": " + message.message + "\n";
    }

    if (!_continue && respond_character_id) {
        prompt += `${responding_character.name}: `
    }

    return prompt;
}

async function openAiGetCharacterPrompt(character_id) {
    //converts the character data to a prompt that AI can understand
    const character = await window.electron.getCharacter(character_id);
    let prompt = "";
    if (character.gender) {
        prompt += `[${character.name} is a ${character.gender}]\n`;
    }
    if (character.age) {
        prompt += `[${character.name} is ${character.age} years old]\n`;
    }
    if (character.personality) {
        prompt += `[${character.name}'s personality: ${character.personality}]\n`;
    }
    if (character.description) {
        prompt += `${character.description}]\n`;
    }
    return prompt;
}

module.exports = {
    openAiValidate,
    openAiGetActiveModel,
    openAiRequestCompletion,
    openAiGetPrompt
}