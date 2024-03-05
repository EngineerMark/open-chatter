import { Backdrop, Box, CircularProgress, Typography } from "@mui/material";

function PageLoader(props) {
    return (
        <Backdrop
            open={props.open}
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <CircularProgress color="inherit" />
                {
                    props.text ? <Typography variant="h6">{props.text}</Typography> : null
                }
            </Box>
        </Backdrop>
    )
}

export default PageLoader;