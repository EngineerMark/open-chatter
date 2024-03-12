const { contextBridge, ipcRenderer } = require("electron");
const remote = require('@electron/remote');
const { dialog, app } = remote;
const si = require('systeminformation');
const path = require('node:path');
const fs = require('fs');
const { openAiValidate, openAiGetActiveModel, openAiGetPrompt, openAiRequestCompletion, openAiGetModels } = require("./openai");
const { v1: uuidv1, v4: uuidv4, } = require('uuid');
const { writeCharacter, readCharacter } = require("./charactercard");
const { loadChatList, loadChat, createChat, sendMessage, deleteMessage, editMessage, deleteChat, generateAIResponse } = require("./chat");

//settings etc live here
const app_data_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

const default_settings = {
    "openai_api": "",
    "openai_api_key": ""
};

const default_stats = {
    total_completion_tokens: 0,
    total_prompt_tokens: 0,
    total_user_messages: 0,
    total_ai_messages: 0,
    model_stats: {},
    character_stats: {}
}

const funcList = {
    getGraphicsCards: getGraphicsCards,
    getMemoryData: getMemoryData,
    
    getSettings: getSettings,
    saveSettings: saveSettings,
    setSetting: setSetting,
    getSetting: getSetting,
    
    getAPIStatus: getAPIStatus,
    getActiveModelName: getActiveModelName,
    
    getSelectFile: getSelectFile,
    
    createOrUpdateCharacter: createOrUpdateCharacter,
    loadCharacter: loadCharacter,
    getCharacters: getCharacters,
    getCharacter: loadCharacter,
    getOpenAIServer: getOpenAIServer,
    
    getChatList: loadChatList,
    getChat: loadChat,
    createChat: createChat,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    editMessage: editMessage,
    deleteChat: deleteChat,

    openAiGetPrompt: openAiGetPrompt,
    openAiRequestCompletion: openAiRequestCompletion,
    generateAIResponse: generateAIResponse,
    openAiGetModels: openAiGetModels,

    getStats: getStats,
    saveStats: saveStats,
    applyStats: applyStats,
}

// contextBridge.exposeInMainWorld("electron", {
// });

window.electron = funcList;

function getAppDataPath() {
    // const _path = path.join(app_data_path, "open-chatter");
    const _path = app.getPath('userData');
    return _path;
}

function getSettings() {
    const settings_path = path.join(getAppDataPath(), "settings.json");
    if (!fs.existsSync(settings_path)) {
        fs.writeFileSync(settings_path, JSON.stringify(default_settings, null, 4));
    }

    let settings = fs.readFileSync(settings_path, 'utf-8');
    //add potential missing settings (if new settings are added in the future)

    //clone default settings
    let default_settings_clone = JSON.parse(JSON.stringify(default_settings));

    //overwrite default settings with the loaded settings
    settings = JSON.parse(settings);
    for (const key in settings) {
        default_settings_clone[key] = settings[key];
    }

    saveSettings(default_settings_clone);

    return default_settings_clone;
}

async function getOpenAIServer() {
    const settings = getSettings();
    return settings.openai_api;
}

function saveSettings(settings) {
    const settings_path = path.join(getAppDataPath(), "settings.json");
    fs.writeFileSync(settings_path, JSON.stringify(settings, null, 4));
}

function setSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
}

function getSetting(key) {
    const settings = getSettings();
    return settings[key];
}

function getStats() {
    const stats_path = path.join(getAppDataPath(), "stats.json");
    if (!fs.existsSync(stats_path)) {
        fs.writeFileSync(stats_path, JSON.stringify(default_stats, null, 4));
    }

    let stats = fs.readFileSync(stats_path, 'utf-8');
    stats = JSON.parse(stats);
    return stats;
}

function saveStats(stats) {
    const stats_path = path.join(getAppDataPath(), "stats.json");
    fs.writeFileSync(stats_path, JSON.stringify(stats, null, 4));
}

function applyStats(data) {
    const stats = getStats();

    if(data.prompt_tokens){ stats.total_prompt_tokens += data.prompt_tokens; }
    if(data.completion_tokens){ stats.total_completion_tokens += data.completion_tokens; }
    if(data.is_ai){ stats.total_ai_messages += 1; } else { stats.total_user_messages += 1; }

    if(data.model){
        if(!stats.model_stats[data.model]){
            stats.model_stats[data.model] = {
                total_completion_tokens: 0,
                total_prompt_tokens: 0,
                total_user_messages: 0,
                total_ai_messages: 0
            }
        }

        if(data.prompt_tokens){ stats.model_stats[data.model].total_prompt_tokens += data.prompt_tokens; }
        if(data.completion_tokens){ stats.model_stats[data.model].total_completion_tokens += data.completion_tokens; }
        if(data.is_ai){ stats.model_stats[data.model].total_ai_messages += 1; } else { stats.model_stats[data.model].total_user_messages += 1; }
    }

    if(data.character){
        if(!stats.character_stats[data.character]){
            stats.character_stats[data.character] = {
                total_completion_tokens: 0,
                total_prompt_tokens: 0,
                total_user_messages: 0,
                total_ai_messages: 0
            }
        }

        if(data.prompt_tokens){ stats.character_stats[data.character].total_prompt_tokens += data.prompt_tokens; }
        if(data.completion_tokens){ stats.character_stats[data.character].total_completion_tokens += data.completion_tokens; }
        if(data.is_ai){ stats.character_stats[data.character].total_ai_messages += 1; } else { stats.character_stats[data.character].total_user_messages += 1; }
    }

    saveStats(stats);
    console.log(stats);
}


async function getGraphicsCards() {
    const data = await si.graphics();
    const controllers = data.controllers;
    return controllers;
}

async function getMemoryData() {
    const data = await si.mem();
    return data;
}

async function getAPIStatus() {
    //get settings
    const settings = getSettings();
    if (settings.openai_api === "") {
        return false;
    }

    const status = await openAiValidate();
    return status;
}

async function getActiveModelName() {
    //get settings
    const settings = getSettings();
    if (settings.openai_api === "") {
        return false;
    }

    const model = await openAiGetActiveModel();
    return model;
}

async function getSelectFile(title = "Select a file") {
    const options = {
        title: title,
        properties: ['openFile'],
    }
    const result = await dialog.showOpenDialog(options);
    return result;
}

async function createOrUpdateCharacter(character_data) {
    //if character exists, we just update image if it's different, and update the data
    //if character doesn't exist, we copy the selected image to the characters folder, and insert the data
    const characters_path = path.join(getAppDataPath(), "characters");

    if (!fs.existsSync(characters_path)) {
        fs.mkdirSync(characters_path, { recursive: true });
    }

    await writeCharacter(character_data.id, character_data);
}

async function loadCharacter(character_id) {
    return await readCharacter(character_id);
}

async function getCharacters() {
    const characters_path = path.join(getAppDataPath(), "characters");
    if (!fs.existsSync(characters_path)) {
        return [];
    }

    const files = fs.readdirSync(characters_path);
    let characters = [];
    if (files.length > 0) {
        for (const file of files) {
            if (!file.endsWith(".json")) {
                continue;
            }
            const character_id = file.split(".")[0];
            const character_data = await loadCharacter(character_id);
            characters.push(character_data);
        }
    }

    return characters;
}