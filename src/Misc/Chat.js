import { v4 as uuidv4, v6 as uuidv6 } from 'uuid';

export const GetChatList = async () => {
    try{
        const chats = await window.electron.getChatList();
        return chats;
    }catch(e){
        console.error(e);
        return null;
    }
}

export const LoadChat = async (id) => {
    try{
        const chat = await window.electron.getChat(id);
        return chat;
    }catch(e){
        console.error(e);
        return null;
    }
}

export const SendMessage = async (chat_id, character_id, message, is_user) => {
    const message_data = {
        message_id: uuidv4(),
        character_id: character_id || null, //null is basically "user", they have not selected a character to play as. Requires no additional data /context from the character
        time: new Date().toISOString(),
        message: message
    }

    await window.electron.sendMessage(chat_id, message_data, is_user);

    return message_data;
}

export const DeleteMessage = async (chat_id, message_id) => {
    await window.electron.deleteMessage(chat_id, message_id);
}