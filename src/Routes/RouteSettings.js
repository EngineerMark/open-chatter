import { Box, Button, Chip, Container, Divider, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Slider, Stack, TextField, Typography } from "@mui/material";
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useEffect, useRef, useState } from "react";
import { ConvertToReadableSize, GetAppSettings, SaveAppSettings, ShowNotification } from "../Misc/Helpers";

function RouteSettings(props) {
    const [appSettings, setAppSettings] = useState(null);
    const [openaiApi, setOpenAIAPI] = useState(null);
    const [openaiApiKey, setOpenAIAPIKey] = useState(null);

    useEffect(() => {
        //get app settings
        const _settings = GetAppSettings();
        setAppSettings(_settings);
        setOpenAIAPI(_settings.openai_api);
        setOpenAIAPIKey(_settings.openai_api_key);
    }, []);

    const saveSettings = () => {
        //save settings
        let _settings = appSettings;
        _settings.openai_api = openaiApi;
        _settings.openai_api_key = openaiApiKey;
        SaveAppSettings(_settings);
    }

    return (
        <>
            <Container>
                <Box>
                    <Stack spacing={2}>
                        <div>
                            <TextField
                                id="model-selector"
                                label="OpenAI-compatible API URL"
                                size="small"
                                value={openaiApi ? openaiApi : ""}
                                onChange={(e) => {
                                    setOpenAIAPI(e.target.value);
                                }}
                                fullWidth
                            />
                        </div>
                        <Divider />
                        <div>
                            <Button variant="contained" color="primary" onClick={() => {
                                //save settings
                                saveSettings();
                            }}>Save</Button>
                        </div>
                        <Divider />
                        <div>
                            <Typography variant="h6">System</Typography>
                            {
                                props.appData.gpuData.map((gpu, index) => {
                                    //inline
                                    return <Typography>
                                        {gpu.model} - {ConvertToReadableSize(gpu.memoryTotal, "MB")} VRAM
                                    </Typography>
                                })
                            }
                            <Typography>
                                {ConvertToReadableSize(props.appData.memData.total, "B")} RAM
                            </Typography>
                        </div>
                    </Stack>
                </Box>
            </Container>
        </>
    )
}

export default RouteSettings;