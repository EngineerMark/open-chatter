import { Box, Button, Container, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useRef, useState } from "react";
import { showNotification } from "../Misc/Helpers";

function RouteSettings() {
    const llamaFileInput = useRef(null);
    const [llamaFile, setLlamaFile] = useState(null);

    const handleLlamaFileSelect = () => {
        if(llamaFileInput.current){
            llamaFileInput.current.click();
        }
    }

    const handleLlamaFileChange = (event) => {
        const files = event.target.files;
        //check if there is a main.exe file
        let mainFile = null;
        for(let i = 0; i < files.length; i++){
            if(files[i].name.includes("main.exe")){
                mainFile = files[i];
                break;
            }
        }

        if(!mainFile){
            showNotification("", "Invalid llama.cpp directory");
        }

        console.log(mainFile);
    }        

    return (
        <>
            <Container>
                <Box component="form"
                    noValidate
                    autoComplete="off">
                    <div>
                        <TextField
                            id="llama-selector"
                            label="Select llama.cpp main file"
                            size="small"
                            value={llamaFile ? llamaFile.path : ""}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {/* file selector */}
                                        <IconButton edge="end" color="primary" onClick={handleLlamaFileSelect}>
                                            <InsertDriveFileIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            fullWidth
                        />
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={llamaFileInput}
                            onChange={handleLlamaFileChange}
                            directory="" webkitdirectory=""
                        />
                    </div>
                </Box>
            </Container>
        </>
    )
}

export default RouteSettings;