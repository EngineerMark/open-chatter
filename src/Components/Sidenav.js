import { Box, Button, Chip, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import { ConvertToReadableSize, Navigate } from "../Misc/Helpers";

const drawerWidth = 240;

const NavItems = [
    {
        name: "Home",
        icon: <HomeIcon />,
        path: "/"
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
                        background: theme.palette.background.default,
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
                <List>
                    {
                        NavItems.map((navItem, index) => {
                            return <>
                                <ListItem key={'sidenav_' + navItem.name}>
                                    <ListItemButton onClick={() => {
                                        Navigate(navItem.path);
                                    }}>
                                        <ListItemIcon>
                                            {
                                                navItem.icon
                                            }
                                        </ListItemIcon>
                                        <ListItemText primary={navItem.name} />
                                    </ListItemButton>
                                </ListItem>
                            </>
                        })
                    }
                </List>
            </Drawer>
        </Box>
    </>
}

export default Sidenav;