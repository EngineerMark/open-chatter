const remote = require('@electron/remote');
const { BrowserWindow, app } = remote;
const axios = require('axios');
const { readCharacter } = require('./charactercard');
const { loadChat } = require('./chat');
const EventSourceStream = require('./EventSourceStream');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseGGUF, getQuantizationInfo } = require('./gguf');

let aiStatus = {
    tokensPerSecond: 0,
}

async function openAiApiCall(url, method, data) {
    try {
        const server = await window.electron.getOpenAIServer();
        const response = await axios({
            method: method,
            url: server + url,
            // body: JSON.stringify(data),
            data: data,
        });
        // const response = await axios[method.toLowerCase()](url, data);

        return response.data;
    } catch (error) {
        return null;
    }
}

async function openAiValidate() {
    return ((await openAiApiCall('v1/models', 'GET', null)) != null);
}

async function openAiGetActiveModel() {
    return (await openAiApiCall('v1/internal/model/info', 'GET', null));
}

async function openAiGetModels() {
    return (await openAiApiCall('v1/internal/model/list', 'GET', null));
}

async function openAiGetTokenCount(data) {
    return (await openAiApiCall('v1/internal/token-count', 'POST', {
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

            const { length: completion_tokens } = await openAiGetTokenCount(_response);
            const { length: prompt_tokens } = await openAiGetTokenCount(_prompt);
            const { model_name: model } = await openAiGetActiveModel();

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
        let _message = message.message.trim();
        prompt += name + ": " + _message + "\n";
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

async function openAiIsLocal() {
    //get server
    const server = await window.electron.getOpenAIServer();
    const ip = server.split(':')[0];

    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const addresses = interfaces[interfaceName];
        for (const addressInfo of addresses) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal && addressInfo.address === ip) {
                return true;
            }
        }
    }
    return false;
}

async function openAiValidateLocalTextGen() {
    if (!openAiIsLocal()) {
        return false;
    }

    const path = await window.electron.getSetting('ooba_path');
    //console.log(path);

    //directories to check if they exist
    const requiredDirs = [
        'models', 'modules', 'extensions', 'docker'
    ]

    for (const dir of requiredDirs) {
        if (!fs.existsSync(`${path}/${dir}`)) {
            return false;
        }
    }

    return true;
}

const MODEL_TYPES = {
    GGUF: 'gguf',
    GGML: 'ggml',
    UNKNOWN: 'unknown'
}

const CACHE_MODEL_REQUIRED_OBJECTS = [
    'metadata',
    'size',
    'total_parameters',
    'required_ram'
]

//api doesnt provide this, we need to read the actual file itself
//currently only supports gguf
async function openAiGetModelDetails(model_name) {
    const cache_folder = path.join(app.getPath('userData'), 'models');
    // const cache_path = path.join(app.getPath('userData'), 'models', model_name + '.json');
    const cache_path = path.join(cache_folder, model_name + '.json');

    if (!fs.existsSync(cache_folder)) {
        fs.mkdirSync(cache_folder);
    }

    if (!fs.existsSync(cache_path)) {
        fs.writeFileSync(cache_path, '{}', 'utf-8');
    }

    let cached_model = JSON.parse(fs.readFileSync(cache_path, 'utf-8'));

    const missing_objects = [];
    if (cached_model) {
        for (const required_object of CACHE_MODEL_REQUIRED_OBJECTS) {
            if (!cached_model[required_object]) {
                missing_objects.push(required_object);
            }
        }

        if (missing_objects.length === 0) {
            return cached_model;
        }
    } else {
        missing_objects.push(...CACHE_MODEL_REQUIRED_OBJECTS);
        cached_model = {};
    }

    const ooba_path = await window.electron.getSetting('ooba_path');
    const model_path = `${ooba_path}/models/${model_name}`;

    if (!fs.existsSync(model_path)) {
        BrowserWindow.getAllWindows()[0].webContents.send('sendError', `Model ${model_name} does not exist. Does path point to incorrect text-gen instance?`);
        return null;
    }

    if (missing_objects.includes('metadata')) {
        const metadata = await parseGGUF(model_path);
        cached_model.metadata = metadata;
    }

    if (missing_objects.includes('size')) {
        const size = fs.statSync(model_path).size;
        cached_model.size = size;
    }

    if (missing_objects.includes('total_parameters')) {
        const embed_parameters = cached_model.metadata.metadata.tokenizer.ggml.tokens.length * cached_model.metadata.metadata.llama.embedding_length;
        const num_layers = cached_model.metadata.metadata.llama.block_count; //???
        const attn_module_parameters = (4 * cached_model.metadata.metadata.llama.embedding_length) * (128 * 4) * 10; //magic number fuckery
        const mlp_block_parameters = 3 * cached_model.metadata.metadata.llama.embedding_length * cached_model.metadata.metadata.llama.feed_forward_length;
        const per_layer_rms_norm_parameters = 2 * cached_model.metadata.metadata.llama.embedding_length;
        const pre_lm_head_rms_norm_parameters = cached_model.metadata.metadata.llama.embedding_length;
        const lm_head_parameters = cached_model.metadata.metadata.llama.embedding_length * cached_model.metadata.metadata.tokenizer.ggml.tokens.length;
        const total_parameters = embed_parameters + num_layers * (attn_module_parameters + mlp_block_parameters + per_layer_rms_norm_parameters) + pre_lm_head_rms_norm_parameters + lm_head_parameters;
        cached_model.total_parameters = total_parameters;
    }

    if (missing_objects.includes('required_ram')) {
        const { name: qname, bits } = getQuantizationInfo(cached_model.metadata.metadata.general.file_type);
        const gb_per_token = 0.00028;
        const ram = (((cached_model.total_parameters / 1.0e+9) * 4) / (32 / bits) + gb_per_token * cached_model.metadata.metadata.llama.context_length) * 1.2;
        cached_model.required_ram = ram;
    }

    //save to cache
    fs.writeFileSync(cache_path, JSON.stringify(cached_model, null, 4), 'utf-8');

    return cached_model;
}

module.exports = {
    openAiValidate,
    openAiGetActiveModel,
    openAiRequestCompletion,
    openAiGetPrompt,
    openAiGetModels,
    openAiValidateLocalTextGen,
    openAiGetModelDetails
}