import { Box, Button, Chip, Container, Divider, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Slider, Stack, TextField, Typography } from "@mui/material";
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useEffect, useRef, useState } from "react";
import { ConvertToReadableSize, GetAppSettings, SaveAppSettings, ShowNotification } from "../Misc/Helpers";

function RouteSettings(props) {
    const [appSettings, setAppSettings] = useState(null);
    const [koboldcppFile, setkoboldcppFile] = useState(null);
    const [modelDirectory, setModelDirectory] = useState(null);
    const [selectedGPU, setSelectedGPU] = useState(0);
    const [contextSize, setContextSize] = useState(4096);

    useEffect(() => {
        //get app settings
        const _settings = GetAppSettings();
        setAppSettings(_settings);
        setModelDirectory(_settings.model_directory || null);
        setkoboldcppFile(_settings.koboldcpp_path || null);
        setSelectedGPU(_settings.selected_gpu || 0);
        setContextSize(_settings.context_size || 4096);
    }, []);

    const saveSettings = () => {
        //save settings
        let _settings = appSettings;
        _settings.model_directory = modelDirectory;
        _settings.koboldcpp_path = koboldcppFile;
        _settings.selected_gpu = selectedGPU;
        _settings.context_size = contextSize;
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
                                label="Select the directory containing your models"
                                size="small"
                                value={modelDirectory ? modelDirectory : ""}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {/* file selector */}
                                            <IconButton edge="end" color="primary" onClick={async ()=>{
                                                //open file selector
                                                const file = await window.electron.promptForDirectory();
                                                if(file){
                                                    setModelDirectory(file);
                                                }
                                            }}>
                                                <InsertDriveFileIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                fullWidth
                            />
                        </div>
                        <div>
                            <TextField
                                id="koboldcpp-selector"
                                label="Select koboldcpp binary"
                                size="small"
                                value={koboldcppFile ? koboldcppFile : ""}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {/* file selector */}
                                            <IconButton edge="end" color="primary" onClick={()=>{
                                                //open file selector
                                                window.electron.promptForFile().then((file) => {
                                                    if(file){
                                                        setkoboldcppFile(file);
                                                    }
                                                });
                                            }}>
                                                <InsertDriveFileIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                fullWidth
                            />
                        </div>
                        <div>
                            <FormControl>
                                <InputLabel>GPU</InputLabel>
                                <Select value={selectedGPU ?? 0} onChange={(event) => {

                                }}>
                                    {
                                        props.appData.gpuData.map((gpu, index) => {
                                            return <MenuItem value={index}>{gpu.model}</MenuItem>
                                        })
                                    }
                                </Select>
                            </FormControl>
                        </div>
                        <div>
                            <Typography gutterBottom>Context Size: {contextSize} (Recommended: 4096)</Typography>
                            <Slider
                                value={contextSize}
                                onChange={(event, newValue) => {
                                    setContextSize(newValue);
                                }}
                                valueLabelDisplay="auto"
                                step={1024}
                                marks
                                min={1024}
                                max={8192} />
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