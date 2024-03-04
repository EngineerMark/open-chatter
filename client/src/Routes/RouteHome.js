import { Box, Typography } from "@mui/material";

function RouteHome(){
    return (
        <>
            {/* center horizontally and vertically text */}
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <Typography>
                    Welcome to the Home Page
                </Typography>
            </Box>
        </>
    )
}

export default RouteHome;