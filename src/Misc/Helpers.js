import { toast } from "react-toastify";

export const Navigate = (path) => {
    window.location.hash = '#' + path;
}

export const ShowNotification = (title, message, severity) => {
    toast(message, {
        "position": "top-right",
        "theme": "dark"
    });
};

export const GetSystemInfo = async () => {
    return await window.electron.getSystemData();
}