import { Avatar, Box, Button, Chip, Dialog, DialogContent, DialogContentText, DialogTitle, Divider, FilledInput, FormControl, Grid, IconButton, InputAdornment, InputLabel, Link, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Tooltip, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Scrollbar } from "react-scrollbars-custom";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { GetChatList, LoadChat, SendMessage } from "../Misc/Chat";
import { Navigate, ShowNotification } from "../Misc/Helpers";
import PageLoader from "../Components/PageLoader";
import SendIcon from '@mui/icons-material/Send';
import Markdown from "react-markdown";
const { ipcRenderer } = window.require('electron');

const CHAT_SIDEBAR_LEFT_WIDTH = 240;
const CHAT_SIDEBAR_RIGHT_WIDTH = 280;

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

    const unloadChat = () => {
        setActiveChat(null);
    }

    const createChat = async (characters) => {
        const id = await window.electron.createChat(characters);
        await reloadChatList();
        await loadChat(id);
    }

    const deleteChat = async (chat) => {
        if(activeChat && activeChat.id === chat.id){
            unloadChat();
        }

        await window.electron.deleteChat(chat.id);
        await reloadChatList();
    }

    const sendMessage = async (message) => {
        if (!activeChat) {
            ShowNotification("Error", "No chat selected", "error");
            return;
        }
        await SendMessage(activeChat.id, activeCharacter ?? null, message);

        //update the chat
        await loadChat(activeChat.id);

        //if we have only 1 character, we automatically call for AI response
        if (activeChat.characters.length === 1) {
            requestAiResponse(activeChat.characters[0]);
        }
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

    const requestAiResponse = async (character_id) => {
        window.electron.generateAIResponse(activeChat.id, character_id);
    }

    const requestAiRegenerate = async (message) => {
        if (!message) {
            ShowNotification("Warning", "No message to regenerate", "warning");
            return;
        }
        const char_id = message.character_id; //otherwise we lose it
        //delete the message
        await deleteMessage(message.message_id);
        //request ai response
        await requestAiResponse(char_id);
    }

    const handleIPCChatUpdateRequest = (event, arg) => {
        console.log(activeChat);
        console.log('active: ', activeChat?.id, 'reload: ', arg);
        const chat_id = arg;
        if (activeChat && activeChat.id === chat_id) {
            console.log("reloading chat");
            loadChat(chat_id);
        }
    }

    useEffect(() => {
        (async () => {
            const active_char = await window.electron.getSetting('user_character');
            if(active_char){
                setActiveCharacter(active_char);
            }

            //load chat list
            await reloadChatList();
        })();

    }, []);

    useEffect(() => {
        ipcRenderer.on('ai-update-chat', handleIPCChatUpdateRequest);

        return () => {
            ipcRenderer.removeListener('ai-update-chat', handleIPCChatUpdateRequest);
        }
    });

    useEffect(() => {
        console.warn("ACTIVE UPDATED: ", activeChat);
    }, [activeChat]);

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
        <ChatCreatorPopup open={isPopupOpen}
            createChat={createChat}
            onClose={() => {
                setIsPopupOpen(false);
            }} />
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: CHAT_SIDEBAR_LEFT_WIDTH, flexShrink: 0, height: '100%' }}>
                <ChatSidebar loadChat={loadChat} deleteChat={deleteChat} disabled={props.appState['ai-generating'] ?? false} onNewChat={() => setIsPopupOpen(true)} list={chatList} />
            </Box>
            <Box sx={{ flexGrow: 1, ml: 1, height: '100%' }}>
                <Chat disabled={props.appState['ai-generating'] ?? false} typing={props.appState['ai-generating'] ?? null} requestAiRegenerate={requestAiRegenerate} requestAiResponse={requestAiResponse} sendMessage={sendMessage} deleteMessage={deleteMessage} onEdit={editMessage} chat={activeChat} />
            </Box>
            <Box sx={{ width: CHAT_SIDEBAR_RIGHT_WIDTH, ml: 1, flexShrink: 0, height: '100%' }}>
                <ChatMemberList disabled={props.appState['ai-generating'] ?? false} requestAiResponse={requestAiResponse} chat={activeChat} />
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
        props?.createChat?.(selectedCharacters);
        // await window.electron.createChat(selectedCharacters);
        props.onClose?.();
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
    const [isDeletionPopupOpen, setIsDeletionPopupOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);

    const deleteChat = (chat) => {
        setSelectedChat(chat);
        setIsDeletionPopupOpen(true);
    }

    return <>
        {/* chat deletion confirmation popup */}
        <Dialog open={isDeletionPopupOpen} onClose={() => setIsDeletionPopupOpen(false)}>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete this chat?
                </DialogContentText>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button variant="contained" onClick={() => {
                        //delete chat
                        props.deleteChat?.(selectedChat);
                        setIsDeletionPopupOpen(false);
                    }}>Delete</Button>
                </Box>
            </DialogContent>
        </Dialog>

        <Paper sx={{ height: '100%' }}>
            {/* vertical flex box */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                    <Typography variant="body1">Chats</Typography>
                    {/* align right */}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button disabled={props.disabled} variant="outlined" size="small" onClick={() => {
                        //navigate to character list
                        props.onNewChat?.();
                    }}>New Chat</Button>
                </Box>
                <Divider />
                <Box sx={{ overflowY: 'auto' }}>
                    <Stack spacing={1}>
                        {
                            props.list.map((chat, index) => {
                                return <ChatListItem deleteChat={deleteChat} disabled={props.disabled} key={index} chat={chat} loadChat={props.loadChat} />
                            })
                        }
                    </Stack>
                </Box>
            </Box>
        </Paper>
    </>
}

function ChatMemberList(props) {
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        (async () => {
            setCharacters([]);
            if (!props.chat) {
                return;
            }

            const chars = [];
            for (const char_id of props.chat.characters) {
                const char = await window.electron.getCharacter(char_id);
                chars.push(char);
            }
            setCharacters(chars);
        })();
    }, [props.chat]);

    return <>
        <Paper sx={{ height: '100%' }}>
            <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                <Typography variant="body1">Members</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1 }}>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {
                        characters.map((char, index) => {
                            return <ListItem
                                key={index}
                                secondaryAction={<IconButton
                                    disabled={props.disabled}
                                    edge="end" size="small"
                                    onClick={() => {
                                        props.requestAiResponse?.(char.id);
                                    }}
                                >
                                    <Tooltip title="Send message">
                                        <SendIcon fontSize="inherit" />
                                    </Tooltip>
                                </IconButton>}
                            >
                                <ListItemAvatar>
                                    <Avatar src={char.image} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={char.name}
                                />
                                {/* button to the right that triggers a AI chat message */}

                            </ListItem>
                        })
                    }
                </List>
            </Box>
        </Paper>
    </>
}

function ChatListItem(props) {
    return <>
        <Box sx={{ display: 'flex', p: 1 }}>
            {/* <Typography variant="body1">{props.chat.title}</Typography> */}
            <Link
                disabled={props.disabled}
                component='button'
                variant="body1"
                onClick={() => {
                    //navigate to chat
                    props.loadChat?.(props.chat.id);
                }}
            >
                {props.chat.title}
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton size="small">
                <EditIcon fontSize="inherit" />
            </IconButton>
            <IconButton size="small"
                onClick={() => {
                    props.deleteChat?.(props.chat);
                }}>
                <DeleteIcon fontSize="inherit" />
            </IconButton>
        </Box>
        <Divider />
    </>
}

//chat itself
function Chat(props) {
    const [messageInput, setMessageInput] = useState("");
    const [typingStatus, setTypingStatus] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [canRegenerate, setCanRegenerate] = useState(false);

    const sendMessage = async () => {
        //send message
        props.sendMessage?.(messageInput);
        setMessageInput("");
    }

    const handleIPCStreamingMessage = (event, arg) => {
        setMessageInput(arg);
    }

    const handleIPCStreamingFinished = (event, arg) => {
        setMessageInput("");
    }

    useEffect(() => {
        ipcRenderer.on('ai-streaming', handleIPCStreamingMessage);
        ipcRenderer.on('ai-streaming-finished', handleIPCStreamingFinished);

        return () => {
            ipcRenderer.removeListener('ai-streaming', handleIPCStreamingMessage);
            ipcRenderer.removeListener('ai-streaming-finished', handleIPCStreamingFinished);
        }
    });

    useEffect(() => {
        //if pressing ctrl+r, also regenerate (if possible)
        const handleKeyDown = (e) => {
            if (e.key === 'r' && e.ctrlKey) {
                if (canRegenerate && lastMessage) {
                    props.requestAiRegenerate?.(lastMessage);
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    })

    useEffect(() => {
        if (props.chat && props.chat.messages?.length > 0) {
            const _last = props.chat.messages[props.chat.messages.length - 1];
            setLastMessage(_last);
            if (_last.ai) {
                setCanRegenerate(true);
            }
        } else {
            setCanRegenerate(false);
            setLastMessage(null);
        }

        //scroll to bottom
        const chatBox = document.getElementById('chat-message-list');
        chatBox?.scrollIntoView(false);
    }, [props.chat?.messages]);

    useEffect(() => {
        (async () => {
            if (props.typing) {
                const char_id = props.typing.character_id;
                const char = await window.electron.getCharacter(char_id);
                setTypingStatus(char);
            } else {
                setTypingStatus(null);
            }
        })();
    }, [props.typing]);

    return <>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                <Typography variant="body1">Chat Name</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1, width: '100%' }}>
                <List sx={{ width: '100%', bgcolor: 'background.paper', flexDirection: 'column-reverse' }} id='chat-message-list'>
                    {
                        props.chat && props.chat.messages?.length > 0 ?
                            props.chat.messages.map((message, index) => {
                                return <ListItem sx={{ width: '100%', mb: 1 }} key={index} alignItems="flex-start">
                                    <ChatMessage allowInteraction={!props.disabled} key={index} message={message} onDelete={props.deleteMessage} onEdit={props.onEdit} />
                                </ListItem>
                            }) : <Typography variant="body1" sx={{ textAlign: 'center' }}>No messages</Typography>
                    }
                </List>
            </Box>
            {
                props.typing ? <Box sx={{ p: 1 }}>
                    <Typography variant="body2">{typingStatus?.name} is typing...</Typography>
                    {/* display box what is being streamed */}
                    <Paper sx={{ p: 1 }} elevation={3}>
                        <Typography variant="body2">
                            <Markdown>
                                {messageInput}
                            </Markdown>
                        </Typography>
                    </Paper>
                </Box> :
                    <>
                        <Box sx={{ display: 'flex' }}>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box>
                                <Button variant="contained" size='small' disabled={!canRegenerate || !lastMessage || props.disabled} onClick={async () => {
                                    await props?.requestAiRegenerate?.(lastMessage);
                                }}>Regenerate</Button>
                            </Box>
                        </Box>
                        <FormControl fullWidth sx={{ pt: 2 }}>
                            <FilledInput
                                disabled={props.disabled}
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
                                        <IconButton disabled={props.disabled} edge="end" >
                                            <SendIcon onClick={() => sendMessage()} />
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                    </>
            }
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
            <Avatar
                src={character?.image}
                alt={character?.name}
                variant={character ? "circular" : "rounded"}
                sx={{ width: 40, height: 40 }}
            />
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
                            {props.message.creation_date}
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box>
                        {
                            props.allowInteraction ? <>
                                <Link
                                    disabled={!props.allowInteraction}
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
                                    disabled={!props.allowInteraction}
                                    component='button'
                                    variant="body1"
                                    onClick={() => {
                                        setTempEditMessage(props.message.message);
                                        setIsEditMode(true);
                                    }}
                                >
                                    edit
                                </Link>
                            </> : null
                        }
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
                            disabled={!props.allowInteraction}
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
                        {/* {props.message.message} */}
                        <Markdown>
                            {props.message.message}
                        </Markdown>
                    </Typography>
                }
            </React.Fragment>}
        >
        </ListItemText>
    </>
}

export default RouteChat;