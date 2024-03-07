import { Box, Button, Chip, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, Toolbar, Tooltip, Typography, useTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import { ConvertToReadableSize, Navigate } from "../Misc/Helpers";

const drawerWidth = 170;

const NavItems = [
    {
        name: "Home",
        icon: <HomeIcon />,
        path: "/"
    },
    {
        name: "Chats",
        icon: <ChatIcon />,
        path: "/chat"
    },
    {
        name: "Characters",
        icon: <PeopleIcon />,
        path: "/characters"
    },
    {
        name: "Settings",
        icon: <SettingsIcon />,
        path: "/settings"
    }
]

function Sidenav(props) {
    const theme = useTheme();
    return <>
        <Box component="nav" sx={{ flexShrink: { md: 0 }, width: drawerWidth }}>
            <Drawer
                sx={{
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        color: theme.palette.text.primary,
                        borderRight: 'none',
                        [theme.breakpoints.up('md')]: {
                            top: '50px'
                        }
                    }
                }}
                variant='permanent'
                anchor="left"
                open={true}
            >
                <Paper sx={{height:'100%'}}>
                    <Box sx={{ m: 1 }}>
                        <Stack>
                            {
                                NavItems.map((navItem, index) => {
                                    return <>
                                        <Button variant="text" size='large' fullWidth startIcon={navItem.icon} onClick={() => {
                                            Navigate(navItem.path);
                                        }}>
                                            {navItem.name}
                                        </Button>
                                        {/* <IconButton size='large' onClick={() => {
                                            Navigate(navItem.path);
                                        }}>
                                            {
                                                navItem.icon
                                            }
                                        </IconButton> */}
                                        {/* <ListItem key={'sidenav_' + navItem.name}>
                                        <Tooltip title={navItem.name} placement="right">
                                            <ListItemButton
                                                selected={window.location.pathname.includes(navItem.path)}
                                                onClick={() => {
                                                    Navigate(navItem.path);
                                                }}>
                                                <ListItemIcon>
                                                    {
                                                        navItem.icon
                                                    }
                                                </ListItemIcon>
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem> */}
                                    </>
                                })
                            }
                        </Stack>
                    </Box>
                </Paper>
            </Drawer>
        </Box>
    </>
}

export default Sidenav;