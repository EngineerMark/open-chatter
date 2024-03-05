const http = require('http');
const axios = require('axios');

async function openaiValidate(server, apikey = null) {
    try {
        await axios.get(server + 'v1/models');
        return true;
    } catch (error) {
        return false;
    }
}

async function openaiGetActiveModel(server, apikey = null) {
    try {
        const response = await axios.get(server + 'v1/internal/model/info');
        return response.data;
    } catch (error) {
        return null;
    }
}

module.exports = {
    openaiValidate,
    openaiGetActiveModel
}