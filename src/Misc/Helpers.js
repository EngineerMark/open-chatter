import { Typography } from "@mui/material";
import { toast } from "react-toastify";

export const Navigate = (path) => {
    window.location.hash = '#' + path;
}

export const ShowNotification = (title, message, severity) => {
    const toastRender = () => (
        <>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body1">{message}</Typography>
        </>
    )
    toast[severity](toastRender, {
        "position": "top-right",
        "theme": "dark",
    });
};

export const GetAppSettings = () => {
    try {
        const appSettings = window.electron.getSettings();
        return appSettings;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const SaveAppSettings = (settings) => {
    try {
        window.electron.saveSettings(settings);
        console.log(settings);
    } catch (e) {
        console.error(e);
    }
}

export const GetGraphicsData = async () => {
    try {
        const gpuData = await window.electron.getGraphicsCards();
        return gpuData;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const GetMemoryData = async () => {
    try {
        const memoryData = await window.electron.getMemoryData();
        return memoryData;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export const ConvertToReadableSize = (size, initialType) => {
    let type = initialType;
    let types = ["B", "KB", "MB", "GB", "TB"];
    while (size > 1024) {
        size /= 1024;
        type = types[types.indexOf(type) + 1];
    }
    return size.toFixed(2) + " " + type;
}

export const GetRamSizeColor = (size) => {
    //<8gb success
    //8-32gb warning
    //32+gb error
    if (size < 16) {
        return "success"
    } else if (size >= 16 && size < 32) {
        return "warning"
    } else {
        return "error"
    }
}
