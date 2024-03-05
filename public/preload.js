const { contextBridge } = require("electron");
const remote = require('@electron/remote');
const { dialog, app } = remote;
const si = require('systeminformation');
const path = require('node:path');
const fs = require('fs');
const { parseMetadata, fileTypeIntToString, estimateRamUsage } = require("./gguf");

//settings etc live here
const app_data_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

const default_settings = {
    "model_directory": "", //if no, the default is in appdata
    "koboldcpp_path": "",
    "selected_gpu": 0,
    "context_size": 4096,
};

contextBridge.exposeInMainWorld("electron", {
    getGraphicsCards: getGraphicsCards,
    getMemoryData: getMemoryData,

    getSettings: getSettings,
    saveSettings: saveSettings,

    promptForDirectory: promptForDirectory,
    promptForFile: promptForFile,

    getAllModels: getAllModels,
});

function getAppDataPath() {
    // const _path = path.join(app_data_path, "open-chatter");
    const _path = app.getPath('userData');
    return _path;
}
console.log(app.getPath('userData'));
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

function saveSettings(settings) {
    const settings_path = path.join(getAppDataPath(), "settings.json");
    fs.writeFileSync(settings_path, JSON.stringify(settings, null, 4));
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

async function promptForDirectory() {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) {
        return null;
    }
    return result.filePaths[0];
}

async function promptForFile() {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });

    if (result.canceled) {
        return null;
    }
    return result.filePaths[0];
}

async function getAllModels() {
    const settings = getSettings();
    const model_directory = settings.model_directory;
    if (!model_directory) {
        return [];
    }

    let files = fs.readdirSync(model_directory);
    //only .gguf files
    files = files.filter(file => file.endsWith(".gguf"));

    let modelData = [];

    for (const file of files) {
        const model = {};
        model.name = file;
        model.size = fs.statSync(path.join(model_directory, file)).size;

        //check for cached metadata
        let metadata = await getModelCachedMetadata(model);

        if(!metadata){
            metadata = await parseMetadata(path.join(model_directory, file));
            await setModelCachedMetadata(model, metadata);
        }

        model.metadata = metadata;
        model.fileType = fileTypeIntToString(metadata.general.file_type);

        estimateRamUsage(model);

        modelData.push(model);
    }

    return modelData;
}

async function getModelCachedMetadata(model) {
    const settings = getSettings();
    const model_directory = settings.model_directory;
    if (!model_directory) {
        return null;
    }

    const metadata_path = path.join(model_directory, model.name + ".metadata.json");
    if (!fs.existsSync(metadata_path)) {
        return null;
    }

    const metadata = fs.readFileSync(metadata_path, 'utf-8');
    return JSON.parse(metadata);
}

async function setModelCachedMetadata(model, metadata) {
    const settings = getSettings();
    const model_directory = settings.model_directory;
    if (!model_directory) {
        return null;
    }

    const metadata_path = path.join(model_directory, model.name + ".metadata.json");
    fs.writeFileSync(metadata_path, JSON.stringify(metadata, null, 4));
}