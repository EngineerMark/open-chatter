import { Avatar, Box, Button, Chip, Dialog, DialogContent, DialogContentText, DialogTitle, Divider, FilledInput, FormControl, Grid, IconButton, InputAdornment, InputLabel, Link, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Scrollbar } from "react-scrollbars-custom";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { GetChatList, LoadChat, SendMessage } from "../Misc/Chat";
import { Navigate, ShowNotification } from "../Misc/Helpers";
import PageLoader from "../Components/PageLoader";
import SendIcon from '@mui/icons-material/Send';
const { ipcRenderer } = window.require('electron');

const CHAT_SIDEBAR_WIDTH = 240;

function RouteChat(props) {
    const { id } = useParams();
    const [chatList, setChatList] = useState([]);
    const [activeChat, setActiveChat] = useState(null); //active chat is the chat that is currently being displayed
    const [isPopupOpen, setIsPopupOpen] = useState(false); //is the chat creator popup open
    const [activeCharacter, setActiveCharacter] = useState(null);

    const reloadChatList = async () => {
        const chat_list = await GetChatList();
        console.log(chat_list);
        setChatList(chat_list);
    }

    const loadChat = async (id) => {
        //load chat
        const chat = await LoadChat(id);
        setActiveChat(chat);
    }

    const sendMessage = async (message) => {
        if (!activeChat) {
            ShowNotification("Error", "No chat selected", "error");
            return;
        }
        const messageResult = await SendMessage(activeChat.id, activeCharacter?.id ?? null, message);

        //update the chat
        await loadChat(activeChat.id);
    }

    const deleteMessage = async (id) => {
        //delete message
        await window.electron.deleteMessage(activeChat.id, id);
        await loadChat(activeChat.id);
    }

    const editMessage = async (id, message) => {
        //edit message
        await window.electron.editMessage(activeChat.id, id, message);
        await loadChat(activeChat.id);
    }

    useEffect(() => {
        (async () => {
            //load chat list
            await reloadChatList();
        })();

        ipcRenderer.on('ai-update-chat', (event, arg) => {
            //reload chat list
            const chat_id = arg;
            if (activeChat && activeChat.id === chat_id) {
                reloadChatList();
            }
        });
    }, []);

    useEffect(() => {
        if (activeChat) {
            return;
        }

        (async () => {
            let _chat = null;
            if (id) {
                //load chat
                loadChat(id);
            } else {
                //load the first chat
                if (chatList.length > 0) {
                    loadChat(chatList[0].id);
                }
            }
        })();
    }, [chatList])

    return <>
        {/* full height */}
        {/* sidebar static width, chat will fill the rest of the width */}
        <ChatCreatorPopup open={isPopupOpen} onClose={(refresh) => {
            setIsPopupOpen(false);
            if (refresh) {
                reloadChatList();
            }
        }} />
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: CHAT_SIDEBAR_WIDTH, flexShrink: 0, height: '100%' }}>
                <ChatSidebar onNewChat={() => setIsPopupOpen(true)} list={chatList} />
            </Box>
            <Box sx={{ flexGrow: 1, ml: 1, height: '100%' }}>
                <Chat sendMessage={sendMessage} deleteMessage={deleteMessage} onEdit={editMessage} chat={activeChat} />
            </Box>
        </Box>
    </>
}

function ChatCreatorPopup(props) {
    const [characters, setCharacters] = useState([]);
    const [selectedCharacters, setSelectedCharacters] = useState([]);
    const [isWorking, setIsWorking] = useState(false);

    useEffect(() => {
        //load characters
        (async () => {
            setIsWorking(true);
            const chara = await window.electron.getCharacters();
            setCharacters(chara);
            setIsWorking(false);
        })();
    }, []);

    const createChat = async () => {
        //create chat
        console.log(selectedCharacters);
        await window.electron.createChat(selectedCharacters);
        props.onClose?.(true);
    }

    return <>
        <PageLoader open={isWorking} />
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>Create new chat</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Select characters that will be part of this chat
                </DialogContentText>
                <Box sx={{ overflowY: 'auto', maxHeight: '300px' }}>
                    {
                        characters && characters.map((char, index) => {
                            return <Box sx={{ mb: 1 }}>
                                <Chip
                                    label={char.name}
                                    onClick={() => {
                                        //toggle selected
                                        if (selectedCharacters.includes(char.id)) {
                                            setSelectedCharacters(selectedCharacters.filter(id => id !== char.id));
                                        } else {
                                            setSelectedCharacters([...selectedCharacters, char.id]);
                                        }
                                    }}
                                    color={selectedCharacters.includes(char.id) ? "primary" : "default"}
                                    avatar={<Avatar src={char.image} />}
                                    variant="outlined"
                                />
                            </Box>
                        })
                    }
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button variant="contained"
                        disabled={selectedCharacters.length === 0}
                        onClick={() => {
                            createChat();
                        }
                        }>Create</Button>
                </Box>
            </DialogContent>
        </Dialog>
    </>
}

//list of chats
function ChatSidebar(props) {
    return <>
        <Paper sx={{ height: '100%' }}>
            {/* vertical flex box */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                    <Typography variant="body1">Chats</Typography>
                    {/* align right */}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" size="small" onClick={() => {
                        //navigate to character list
                        props.onNewChat?.();
                    }}>New Chat</Button>
                </Box>
                <Divider />
                <Box sx={{ overflowY: 'auto' }}>
                    <Stack spacing={1}>
                        {
                            props.list.map((chat, index) => {
                                return <ChatListItem key={index} chat={chat} />
                            })
                        }
                    </Stack>
                </Box>
            </Box>
        </Paper>
    </>
}

function ChatListItem(props) {
    return <>
        <Box sx={{ display: 'flex', p: 1 }}>
            <Typography variant="body1">{props.chat.title}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small">
                <EditIcon fontSize="inherit" />
            </IconButton>
            <IconButton size="small">
                <DeleteIcon fontSize="inherit" />
            </IconButton>
        </Box>
        <Divider />
    </>
}

//chat itself
function Chat(props) {
    const [messageInput, setMessageInput] = useState("");

    const sendMessage = async () => {
        //send message
        props.sendMessage?.(messageInput);
        setMessageInput("");
    }

    return <>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                <Typography variant="body1">Chat Name</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1, width: '100%' }}>
                <List sx={{ width: '100%', bgcolor: 'background.paper', flexDirection: 'column-reverse' }}>
                    {
                        props.chat && props.chat.messages?.length > 0 ?
                            props.chat.messages.map((message, index) => {
                                return <ListItem sx={{ width: '100%', mb: 1 }} key={index} alignItems="flex-start">
                                    <ChatMessage key={index} message={message} onDelete={props.deleteMessage} onEdit={props.onEdit} />
                                </ListItem>
                            }) : <Typography variant="body1" sx={{ textAlign: 'center' }}>No messages</Typography>
                    }
                </List>
            </Box>
            <FormControl fullWidth sx={{ pt: 2 }}>
                <FilledInput
                    placeholder="Type a message..."
                    id='chat-message-box-input'
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton edge="end" >
                                <SendIcon onClick={() => sendMessage()} />
                            </IconButton>
                        </InputAdornment>
                    }
                />
            </FormControl>
        </Paper>
    </>
}

function ChatMessage(props) {
    const [character, setCharacter] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempEditMessage, setTempEditMessage] = useState(props.message.message);

    useEffect(() => {
        (async () => {
            if (props.message.character_id) {
                const char = await window.electron.getCharacter(props.message.character_id);
                setCharacter(char);
            }
        })();
    }, []);

    return <>
        <ListItemAvatar>
            <Avatar />
        </ListItemAvatar>
        <ListItemText
            primary={<React.Fragment>
                <Box sx={{ display: 'flex' }}>
                    <Box>
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{ display: 'inline' }}
                            color="text.primary"
                        >
                            {character ? character.name : "User"}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ display: 'inline' }} color="text.secondary" > {` • `} </Typography>
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{ display: 'inline' }}
                            color="text.secondary"
                        >
                            {props.message.time}
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box>
                        <Link
                            component='button'
                            variant="body1"
                            onClick={() => {
                                props.onDelete?.(props.message.message_id);
                            }}
                        >
                            remove
                        </Link>
                        <Typography component="span" variant="body2" sx={{ display: 'inline' }} color="text.secondary" > {` • `} </Typography>
                        <Link
                            component='button'
                            variant="body1"
                            onClick={() => {
                                setTempEditMessage(props.message.message);
                                setIsEditMode(true);
                            }}
                        >
                            edit
                        </Link>
                    </Box>
                </Box>
            </React.Fragment>}
            secondary={<React.Fragment>
                {/* <Typography
                    component="span"
                    variant="body1"
                    sx={{ display: 'inline' }}
                    color="text.primary"
                >
                    {props.message.message}
                </Typography> */}
                {
                    isEditMode ? <FormControl fullWidth>
                        <FilledInput
                            value={tempEditMessage}
                            onChange={(e) => setTempEditMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    //send message
                                    props.onEdit?.(props.message.message_id, tempEditMessage);
                                    setIsEditMode(false);
                                } else if (e.key === "Escape") {
                                    setIsEditMode(false);
                                }
                            }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton edge="end" >
                                        <SendIcon onClick={() => {
                                            //send message
                                            props.onEdit?.(props.message.message_id, tempEditMessage);
                                            setIsEditMode(false);
                                        }} />
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </FormControl> : <Typography
                        component="span"
                        variant="body1"
                        sx={{ display: 'inline' }}
                        color="text.primary"
                        onClick={() => {
                            setIsEditMode(true);
                        }}
                    >
                        {props.message.message}
                    </Typography>
                }
            </React.Fragment>}
        >
        </ListItemText>
    </>
}

export default RouteChat;