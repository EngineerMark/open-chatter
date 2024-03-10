const remote = require('@electron/remote');
const { dialog, app, ipcMain, BrowserWindow } = remote;
const path = require('node:path');
const fs = require('fs');
const { v1: uuidv1, v4: uuidv4, } = require('uuid');
const { openAiGetPrompt, openAiGetActiveModel } = require('./openai');

//stores current generation data
//particularly useful to kill the generation process if the user changes chat or something
//or to refuse to generate if one is already in progress
let generationData = {};

async function loadChatList() {
    const chat_folder = path.join(app.getPath('userData'), 'chats');
    console.log(chat_folder);

    if (!fs.existsSync(chat_folder)) {
        fs.mkdirSync(chat_folder);
    }

    const files = fs.readdirSync(chat_folder);

    const chat_list = [];

    for (const file of files) {
        const file_path = path.join(chat_folder, file);
        const data = fs.readFileSync(file_path, 'utf-8');
        const chat = JSON.parse(data);
        chat_list.push(chat);
    }

    return chat_list;
}

async function createChat(character_ids) {
    const new_chat_data = {
        id: uuidv4(),
        title: "New chat",
        characters: character_ids,
        messages: [],
        creation_date: new Date().toISOString()
    }

    await saveChat(new_chat_data.id, new_chat_data);

    return new_chat_data.id;
}

async function loadChat(id) {
    console.log('loading chat', id)
    const file_path = path.join(app.getPath('userData'), 'chats', id + ".json");
    const data = fs.readFileSync(file_path, 'utf-8');
    const chat = JSON.parse(data);
    return chat;
}

async function saveChat(id, chat_data) {
    const file_path = path.join(app.getPath('userData'), 'chats', id + ".json");

    //if exists, empty original file
    if (fs.existsSync(file_path)) {
        fs.unlinkSync(file_path);
    }

    //write the data to the file
    fs.writeFileSync(file_path, JSON.stringify(chat_data));
}

function createMessageObject(character_id, message_content, is_ai_message = false) {
    return {
        character_id: character_id,
        message: message_content,
        message_id: uuidv4(),
        creation_date: new Date().toISOString(),
        ai: is_ai_message
    }
}

async function sendMessage(chat_id, character_id, message_content, is_ai_message = false) {
    const chat = await loadChat(chat_id);
    chat.messages.push(createMessageObject(character_id, message_content, is_ai_message));
    console.log('message sent by ', character_id);
    await saveChat(chat_id, chat);

    if(!is_ai_message){
        await window.electron.applyStats({
            character_id: character_id,
            is_ai: false,
        });
    }
}

async function generateAIResponse(chat_id, character_id) {
    // if(generationData?.chat_id !== null){
    //     console.error('generation already in progress');
    //     BrowserWindow.getAllWindows()[0].webContents.send('sendError', 'AI is already busy');
    //     return;
    // }

    // console.log('generating AI response');
    BrowserWindow.getAllWindows()[0].webContents.send('set-app-state', {
        'ai-generating': {
            chat_id: chat_id,
            character_id: character_id
        }
    });

    generationData = {
        chat_id: chat_id,
        character_id: character_id,
        abortController: new AbortController()
    }

    const response = await window.electron.openAiRequestCompletion(chat_id, character_id, generationData.abortController);
    if (response?.length === 0) {
        console.error('AI response failed');
        BrowserWindow.getAllWindows()[0].webContents.send('sendError', 'AI response failed');
    } else {
        const message = response.trim();
        await sendMessage(chat_id, character_id, message, true);
        //wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
        BrowserWindow.getAllWindows()[0].webContents.send('ai-update-chat', chat_id); //chat_id so the frontend doesnt update if another chat is open
    }

    //reset the generation data
    generationData = {};

    BrowserWindow.getAllWindows()[0].webContents.send('set-app-state', { 'ai-generating': null });
}

async function deleteMessage(chat_id, message_id) {
    console.log('deleting message', message_id);
    const chat = await loadChat(chat_id);
    chat.messages = chat.messages.filter(message => message.message_id !== message_id);
    await saveChat(chat_id, chat);
}

async function editMessage(chat_id, message_id, message_content) {
    const chat = await loadChat(chat_id);
    const message_index = chat.messages.findIndex(message => message.message_id === message_id);
    chat.messages[message_index].message = message_content;
    await saveChat(chat_id, chat);
}

async function deleteChat(id) {
    const file_path = path.join(app.getPath('userData'), 'chats', id + ".json");
    fs.unlinkSync(file_path);
}

module.exports = {
    loadChatList,
    loadChat,
    saveChat,
    deleteChat,
    createChat,
    sendMessage,
    deleteMessage,
    editMessage,
    generateAIResponse
}