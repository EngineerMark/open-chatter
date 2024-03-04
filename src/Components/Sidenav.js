import { Box, Button, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
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

function Sidenav(props) {
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
            <Divider />
            {/* show system stats like vram */}
            {
                props.systemStats ? <>
                    <Box>
                        <Typography variant="body1" noWrap component="div">
                            {"VRAM: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_vram_used : 0, "MB") + " / " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_vram : 0, "MB")}
                        </Typography>
                        <Typography variant="body1" noWrap component="div">
                            {"RAM: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_ram_used : 0, "B") + " / " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_ram : 0, "B")}
                        </Typography>
                    </Box>
                </> : <></>
            }
            {/* <List>
                <ListItem>
                    <ListItemText primary="System Stats" />
                </ListItem>
                <ListItem>
                    <ListItemText primary={"Total VRAM: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_vram : 0, "MB")} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={"Total VRAM Used: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_vram_used : 0, "MB")} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={"Total RAM: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_ram : 0, "B")} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={"Total RAM Used: " + ConvertToReadableSize(props.systemStats ? props.systemStats.total_ram_used : 0, "B")} />
                </ListItem>
            </List> */}
        </Drawer>
    </>
}

export default Sidenav;