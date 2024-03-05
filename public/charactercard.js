var pngitxt = require('png-itxt')
const remote = require('@electron/remote');
const { dialog, app } = remote;
const path = require('node:path');
const fs = require('fs');
const { Duplex } = require('stream');

async function readCharacter(id) {
    const data_path = path.join(app.getPath('userData'), "characters", id + ".json");

    if (!fs.existsSync(data_path)) {
        return null;
    }

    const data = fs.readFileSync(data_path, 'utf-8');
    return JSON.parse(data);
}

async function writeCharacter(id, payload) {
    const data_path = path.join(app.getPath('userData'), "characters", id + ".json");

    //if exists, empty original file
    if (fs.existsSync(data_path)) {
        fs.unlinkSync(data_path);        
    }

    //read the image to base64 encoded url
    const image_path = payload.image;

    //figure out if the image is a base64 encoded string or a file path
    if (image_path.startsWith('data:image')) {
        //image is already base64 encoded
    } else {
        //read the image from the file
        const image = fs.readFileSync(image_path, 'base64');
        const imageType = image_path.split('.').pop();

        const image_base_64 = `data:image/${imageType};base64,${image}`;
        payload.image = image_base_64;
    }

    //write the data to the file
    fs.writeFileSync(data_path, JSON.stringify(payload));
}

module.exports = {
    readCharacter,
    writeCharacter
}