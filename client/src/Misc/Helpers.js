import { toast } from "react-toastify";

export const Navigate = (path) => {
    window.location.hash = '#' + path;
}

export const showNotification = (title, message, severity) => {
    toast(message, {
        "position": "top-right",
        "theme": "dark"
    });
};
