import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

function RouteHome(props) {
    const [modelData, setModelData] = useState(null);
    const [modelNames, setModelNames] = useState([]);

    useEffect(() => {
        if(!props.systemStats?.isApiActive){
            return;
        }

        (async () => {
            try {
                const { model_names } = await window.electron.openAiGetModels();
                setModelNames(model_names);
                // console.log(model_names);
                // if(props.systemStats?.activeApiModel?.model_name){
                //     const modelData = await window.electron.findModel(props.systemStats?.activeApiModel?.model_name);
                //     setModelData(modelData);
                // }
            } catch (e) {
                console.error(e);
            }
        })()
    }, [props.systemStats?.activeApiModel?.model_name])

    return (
        <>
            {/* center horizontally and vertically text */}
            <Box>
                {/* <Typography>
                    Welcome to the Home Page
                </Typography> */}
                {
                    !props.systemStats?.isApiActive ? <>
                        <Alert variant='outlined' severity="warning">
                            API not active or inaccessable
                        </Alert>
                    </> : <>
                        <Stack spacing={2}>
                            <Alert variant='outlined' severity="success">
                                API is active, if not done yet, load a model and start chatting!
                            </Alert>
                            <Alert variant='outlined' severity='info'>
                                Model management from this app is experimental and might not work. Use the text-generation-webui to load models in case of failure.
                            </Alert>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6">Loaded model</Typography>
                                <Typography variant="body1">
                                    {props.systemStats?.activeApiModel?.model_name ?? 'None'}
                                </Typography>
                            </Paper>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6">All models</Typography>
                                {
                                    modelNames?.length > 0 ? modelNames.map((model, index) => (
                                        <Typography key={index} variant="body1">{model}</Typography>
                                    )) : <Typography variant="body1">No models found</Typography>
                                }
                            </Paper>
                        </Stack>
                    </>
                }
            </Box>
        </>
    )
}

export default RouteHome;