import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import RouteHome from "./Routes/RouteHome";
import Sidenav from "./Components/Sidenav";
import RouteSettings from "./Routes/RouteSettings";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    (async () => {
      let _appData = {};
      try {
        const gpuData = await window.electron.getSystemData();
        _appData.gpuData = gpuData;
      } catch (e) {
        console.error(e);
      }

      console.log(_appData);

      setAppData(_appData);
    })();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <CssBaseline />
        {
          appData ? <>
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
          </> : <>
            {/* loading app, spinner in center of screen */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <h1>Loading...</h1>
            </Box>
          </>
        }
      </Box>
    </ThemeProvider>
  );
}

export default App;
