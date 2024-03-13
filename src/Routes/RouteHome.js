import { Alert, Box, Chip, Grid, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ConvertToReadableSize } from "../Misc/Helpers";

function RouteHome(props) {
    const [isAiLocal, setIsAiLocal] = useState(false);
    const [modelData, setModelData] = useState(null);

    useEffect(() => {
        if (!isAiLocal) {
            setModelData(null);
            return;
        }

        (async () => {
            try {
                const { model_names } = await window.electron.openAiGetModels();
                const _model_data = [];
                // console.log(model_names);
                for await (const model_name of model_names) {
                    const metadata = await window.electron.openAiGetModelDetails(model_name);
                    if (metadata && metadata.metadata) {
                        // console.log(model_info);
                        _model_data.push({
                            file: model_name,
                            ...metadata
                        });
                    }

                    setModelData(_model_data); //update inbetween so the user can see the models as they load
                }

                console.log(_model_data);
                setModelData(_model_data); //just to be sure
            } catch (err) {
                console.error(err);
            }
        })()
    }, [isAiLocal])

    useEffect(() => {
        if (!props.systemStats?.isApiActive) {
            return;
        }

        (async () => {
            try {
                const _isApiLocal = window.electron.openAiValidateLocalTextGen();
                setIsAiLocal(_isApiLocal);
            } catch (e) {
                console.error(e);
            }
        })()
    }, [props.systemStats?.activeApiModel?.model_name, props.systemStats?.isApiActive])

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
                        {
                            isAiLocal ? <>
                                <Stack spacing={2}>
                                    <Alert variant='outlined' severity="success">
                                        Local AI is active. You can see and load your models from here.
                                    </Alert>
                                    <Grid container spacing={2}>
                                        {
                                            modelData ? modelData.map((model, index) => {
                                                return (
                                                    <Grid item xs={4}>
                                                        <Paper sx={{ p: 2 }}>
                                                            <Typography variant="body1">{model.file}</Typography>
                                                            <Stack spacing={0.5} direction={'row'}>
                                                                <Tooltip title='Total parameters'>
                                                                    <Chip variant='outlined' size='small' label={`${(model.total_parameters ? (Math.round(model.total_parameters / 1.0e+9)) : 0)}B`} />
                                                                </Tooltip>
                                                                <Tooltip title={`Max context tokens: ${model.metadata.metadata.llama.context_length}`}>
                                                                    <Chip variant='outlined' size='small' label={`${Math.round(model.metadata.metadata.llama.context_length / 1024)}k context`} />
                                                                </Tooltip>
                                                                <Tooltip title={`Required VRAM`}>
                                                                    <Chip variant='outlined' size='small' label={`${ConvertToReadableSize(Math.ceil(model.required_ram), 'GB', false)}+ RAM`} />
                                                                </Tooltip>
                                                            </Stack>
                                                        </Paper>
                                                    </Grid>
                                                )
                                            }) : <></>
                                        }
                                    </Grid>
                                </Stack>
                            </> : <>
                                <Alert variant='outlined' severity="warning">
                                    The text-generation-webui you use is not local. Model management is disabled.
                                </Alert>
                            </>
                        }
                    </>
                }
            </Box>
        </>
    )
}

export default RouteHome;