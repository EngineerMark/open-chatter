import { Avatar, Box, Button, Divider, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Scrollbar } from "react-scrollbars-custom";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const CHAT_SIDEBAR_WIDTH = 240;

function RouteChat(props) {
    const { id } = useParams();

    useEffect(() => {
        //if ID is set, load that chat
        //otherwise, the most recent chat
    }, []);

    return <>
        {/* full height */}
        {/* sidebar static width, chat will fill the rest of the width */}
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: CHAT_SIDEBAR_WIDTH, flexShrink: 0, height: '100%' }}>
                <ChatSidebar />
            </Box>
            <Box sx={{ flexGrow: 1, ml: 1, height: '100%' }}>
                <Chat />
            </Box>
        </Box>
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
                    <Button variant="outlined" size="small">New Chat</Button>
                </Box>
                <Divider />
                <Box sx={{ overflowY: 'auto' }}>
                    <Stack spacing={1}>
                        {/* for test, for loop to generate */}
                        {
                            Array.from({ length: 50 }, (_, i) => {
                                return <ChatListItem key={i} name={`Chat ${i}`} />
                            })
                        }
                        {/* <Paper sx={{ p: 1 }}>
                            <Typography variant="body1">Chat 1</Typography>
                        }
                        {/* <Paper sx={{ p: 1 }}>
                            <Typography variant="body1">Chat 1</Typography>
                        </Paper>
                        <Paper sx={{ p: 1 }}>
                            <Typography variant="body1">Chat 2</Typography>
                        </Paper> */}
                    </Stack>
                </Box>
            </Box>
        </Paper>
    </>
}

function ChatListItem(props) {
    return <>
        <Box sx={{ display: 'flex', p: 1 }}>
            <Typography variant="body1">{props.name}</Typography>
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
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        //generate test message with smiley
        setMessages(Array.from({ length: 50 }, (_, i) => {
            return {
                id: i,
                sender: "Sender",
                time: new Date(),
                message: `Message ${i} 😊`
            }
        }));
    }, []);

    return <>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                <Typography variant="body1">Chat Name</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1, width: '100%' }}>
                <List sx={{ width: '100%', bgcolor: 'background.paper', flexDirection: 'column-reverse' }}>
                    {
                        messages.map((message, index) => {
                            return <ListItem sx={{ width: '100%' }} key={index} alignItems="flex-start">
                                <ChatMessage key={index} message={message} />
                            </ListItem>
                        })
                    }
                </List>
            </Box>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', height: '40px' }}>
                <input type="text" placeholder="Type a message" />
                <Button variant="outlined" size="small">Send</Button>
            </Box>
        </Paper>
    </>
}

function ChatMessage(props) {
    return <>
        <ListItemAvatar>
            <Avatar />
        </ListItemAvatar>
        <ListItemText
            primary={<React.Fragment>
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ display: 'inline' }}
                    color="text.primary"
                >
                    {props.message.sender}
                </Typography>
                {/* bullet symbol */}
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ display: 'inline' }}
                    color="text.secondary"
                >
                    {` • `}
                </Typography>
                <Typography
                    component="span"
                    variant="body2"
                    sx={{ display: 'inline' }}
                    color="text.secondary"
                >
                    {props.message.time.toLocaleString()}
                </Typography>
            </React.Fragment>}
            secondary={<React.Fragment>
                <Typography
                    component="span"
                    variant="body1"
                    sx={{ display: 'inline' }}
                    color="text.primary"
                >
                    {props.message.message}
                </Typography>
            </React.Fragment>}
        >
        </ListItemText>
    </>
}

export default RouteChat;