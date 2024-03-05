import { Box, Button, Container, Grid, Stack, TextField, Typography } from "@mui/material";
import ImageSelect from "../Components/ImageSelect";
import { useEffect, useState } from "react";
import PageLoader from "../Components/PageLoader";
import { v4 as uuidv4, v6 as uuidv6 } from 'uuid';
import { ShowNotification } from "../Misc/Helpers";
import { useParams } from "react-router-dom";

function RouteCharacterEditor() {
    let { id } = useParams();
    const [imageFileType, setImageFileType] = useState(null);
    const [characterID, setCharacterID] = useState(null);
    const [characterImage, setCharacterImage] = useState(null);
    const [characterName, setCharacterName] = useState(null);
    const [characterAge, setCharacterAge] = useState(null);
    const [characterPersonality, setCharacterPersonality] = useState(null);
    const [characterDescription, setCharacterDescription] = useState(null);
    const [isWorking, setIsWorking] = useState(false);

    useEffect(() => {
        (async () => {
            setIsWorking(true);
            if (id) {
                try{
                    const data = await window.electron.loadCharacter(id);
                    setCharacterID(data.id);
                    setCharacterImage(data.image);
                    setImageFileType('base64');
                    setCharacterName(data.name);
                    setCharacterAge(data.age);
                    setCharacterPersonality(data.personality);
                    setCharacterDescription(data.description);
                }catch(err){
                    console.error(err);
                    ShowNotification("Error", "Failed to load character", "error");
                    setCharacterID(uuidv4());
                    setCharacterImage(null);
                    setImageFileType(null);
                    setCharacterName(null);
                    setCharacterAge(null);
                    setCharacterPersonality(null);
                    setCharacterDescription(null);
                }
            } else {
                setCharacterID(uuidv4());
            }
            setIsWorking(false);
        })();
        //check if the url has a character id to load

    }, []);

    const onSave = async () => {
        setIsWorking(true);

        const payload = {
            id: characterID,
            image: characterImage,
            name: characterName,
            age: characterAge,
            personality: characterPersonality,
            description: characterDescription
        }

        try {
            await window.electron.createOrUpdateCharacter(payload);
        } catch (err) {
            console.error(err);
            ShowNotification("Error", "Failed to save character", "error");
        }

        setIsWorking(false);
    }

    return (
        <>
            <PageLoader open={isWorking} />
            <Container>
                <Typography variant="h5">Character Editor</Typography>
                {/* image select 150px wide, the rest should expand to the remaining width */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Box sx={{
                        width: '150px',
                        height: '300px'
                    }}>
                        <ImageSelect onSelect={setCharacterImage} defaultImage={characterImage} sx={{ width: '100%', height: '100%' }} />
                    </Box>
                    <Box sx={{
                        ml: 2,
                        flexGrow: 1,
                        height: '300px'
                    }}>
                        <Stack spacing={2}>
                            <TextField variant='standard' label='Name' value={characterName ?? ''} onChange={(e) => setCharacterName(e.target.value)} />
                            <TextField variant='standard' label='Age' value={characterAge ?? ''} onChange={(e) => setCharacterAge(e.target.value)} />
                            <TextField variant='standard' label='Personality' value={characterPersonality ?? ''} onChange={(e) => setCharacterPersonality(e.target.value)} />
                        </Stack>
                    </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <TextField variant='standard' label='Description' value={characterDescription ?? ''} onChange={(e) => setCharacterDescription(e.target.value)} fullWidth multiline rows={4} />
                </Box>

                <Button disabled={
                    !characterImage || !characterName
                } variant="contained" color="primary" sx={{ mt: 2 }} onClick={onSave}>Save</Button>
            </Container>
        </>
    )
}

export default RouteCharacterEditor;