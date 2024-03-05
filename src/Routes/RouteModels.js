import { Box, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ConvertToReadableSize } from "../Misc/Helpers";

function RouteModels() {
    const [localModels, setLocalModels] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        (async () => {
            //get all models
            setIsLoading(true);
            const models = await window.electron.getAllModels();
            console.log(models);
            setLocalModels(models);
            setIsLoading(false);
        })();
    }, []);
    return (
        <Box>
            <Typography variant="h4">Local Models</Typography>
            <Stack spacing={2}>
                {
                    isLoading ? <Typography>Loading...</Typography> : <>
                        {
                            !localModels || localModels.length === 0 ? <Typography>No models found</Typography> : localModels.map((model, index) => {
                                return (
                                    <Card sx={{ width: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" color="text.secondary">{model.name}</Typography>
                                            {/* horizontal chips */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                <Chip label={`${ConvertToReadableSize(model.size, 'B')}`} />
                                                <Chip label={`${model.fileType}`} />
                                                <Chip label={`${model.metadata.llama.embedding_length} tokens`} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        }
                    </>
                }
            </Stack>
        </Box>
    )
}

export default RouteModels;