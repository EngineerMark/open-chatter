import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Navigate } from "../Misc/Helpers";
import PageLoader from "../Components/PageLoader";

const CHARA_CARD_HEIGHT = 130;

function RouteCharacters() {
    const [characters, setCharacters] = useState([]);
    const [isWorking, setIsWorking] = useState(false);

    useEffect(() => {
        //load character files
        (async () => {
            setIsWorking(true);
            const chars = await window.electron.getCharacters();
            console.log(chars);
            setCharacters(chars);
            setIsWorking(false);
        })();
        //TODO
    }, []);

    return (
        <>
            <PageLoader open={isWorking} />
            <Grid container spacing={2}>
                {/* first card will always the button to create new */}
                <Grid item xs={6} md={12}>
                    <Card sx={{ height: CHARA_CARD_HEIGHT }}>
                        <CardActionArea
                            onClick={() => {
                                Navigate("/editor");
                            }}
                            sx={{
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            }}>
                            <CardContent>
                                {/* large + in the center */}
                                <Typography variant="h3" align="center" sx={{ opacity: 0.5 }}>
                                    +
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                {
                    characters && characters.length > 0 ? characters.map((char, index) => {
                        // background image filling the entire card, nearest neighbor scaling
                        return <Grid item xs={12}>
                            <CharacterCard height={CHARA_CARD_HEIGHT} character={char} />

                            {/* <Card sx={{
                                height: CHARA_CARD_HEIGHT,
                            }}>
                                <Button variant="contained" color="primary" size='small' fullWidth onClick={() => {
                                    Navigate("/editor/" + char.id);
                                }}>Edit</Button>
                                <CardActionArea
                                    onClick={() => {
                                        Navigate("/chat/" + char.id);
                                    }}
                                    sx={{
                                        height: "100%",
                                    }}>
                                    <CardMedia
                                        component="img"
                                        alt={char.name}
                                        height={CHARA_CARD_HEIGHT - 48}
                                        image={char.image} />
                                    <CardContent>
                                        <Typography variant="body1" align="center">
                                            {char.name}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card> */}
                        </Grid>
                    }) : null
                }
            </Grid>
        </>
    )
}

function CharacterCard(props) {
    return <>
        <Card sx={{ display: 'flex' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" color="primary" size='small' onClick={() => {
                        Navigate("/editor/" + props.character.id);
                    }}>Edit</Button>
                    <Button variant="outlined" color="secondary" size='small' onClick={() => {
                        Navigate("/chat/" + props.character.id);
                    }}>Chat</Button>
                </Stack>
            </Box>
            {/* make sure to vertically center the text */}
            <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }}>
                <Typography variant="h5">
                    {props.character.name}
                </Typography>
            </CardContent>
            {/* <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center' }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                    <Typography component="div" variant="h5">
                        {props.character.name}
                    </Typography>
                </CardContent>
            </Box> */}
            <CardMedia
                component="img"
                sx={{ width: CHARA_CARD_HEIGHT, height: CHARA_CARD_HEIGHT, objectFit: 'cover' }}
                image={props.character.image}
                alt={props.character.name}
            />
        </Card>
    </>
}

export default RouteCharacters;