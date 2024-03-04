import { Button, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import { Navigate } from "../Misc/Helpers";

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
        name: "Models",
        icon: <StorageIcon />,
        path: "/models"
    },
    {
        name: "Settings",
        icon: <SettingsIcon />,
        path: "/settings"
    }
]

function Sidenav() {
    return <>
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Open Chatter
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {
                    NavItems.map((navItem, index) => {
                        return <>
                            <ListItem key={index}>
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
    </>
}

export default Sidenav;