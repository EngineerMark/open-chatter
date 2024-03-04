import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import RouteHome from "./Routes/RouteHome";
import Sidenav from "./Components/Sidenav";
import RouteSettings from "./Routes/RouteSettings";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <HashRouter future={{ v7_startTransition: true }}>
            <ToastContainer />
            <Routes>
              <Route path="/" element={<RouteHome />} />
              <Route path="/settings" element={<RouteSettings />} />
            </Routes>
          </HashRouter>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
