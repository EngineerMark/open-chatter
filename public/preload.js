const { contextBridge } = require("electron");
const si = require('systeminformation');

contextBridge.exposeInMainWorld("electron", {
    getSystemData: async () => {
        //return gpu info
        return await si.graphics();
    }
});