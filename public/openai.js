const http = require('http');
const axios = require('axios');

async function openaiApiCall(url, method, data, apikey = null) {
    try{
        const response = await axios({
            method: method,
            url: url,
        });
        return response.data;                
    }catch(error){
        return null;
    }
}

async function openaiValidate(server, apikey = null) {
    return ((await openaiApiCall(server + 'v1/models', 'GET', null, apikey)) != null);
}

async function openaiGetActiveModel(server, apikey = null) {
    return (await openaiApiCall(server + 'v1/internal/model/info', 'GET', null, apikey));
    // try {
    //     const response = await axios.get(server + 'v1/internal/model/info');
    //     return response.data;
    // } catch (error) {
    //     return null;
    // }
}

module.exports = {
    openaiValidate,
    openaiGetActiveModel
}