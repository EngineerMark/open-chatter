import { Box, CssBaseline, ThemeProvider, createTheme, useTheme } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import RouteHome from "./Routes/RouteHome";
import Sidenav from "./Components/Sidenav";
import RouteSettings from "./Routes/RouteSettings";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";
import { GetAppSettings, GetGraphicsData, GetMemoryData } from "./Misc/Helpers";
import PageLoader from "./Components/PageLoader";
import Header from "./Components/Header";
import RouteCharacters from "./Routes/RouteCharacters";
import RouteCharacterEditor from "./Routes/RouteCharacterEditor";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const theme = useTheme();
  const [appData, setAppData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    (async () => {
      let _appData = {};
      try {
        const gpuData = await GetGraphicsData();
        const memData = await GetMemoryData();
        const appSettings = await GetAppSettings();
        _appData.gpuData = gpuData;
        _appData.memData = memData;
        _appData.appSettings = appSettings;
      } catch (e) {
        console.error(e);
      }

      setAppData(_appData);
    })();
  }, []);

  //system stats updater, every 5 or so seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      let systemStats = {};
      try {
        const gpuData = await GetGraphicsData();
        const isApiActive = await window.electron.getAPIStatus();
        const activeApiModel = await window.electron.getActiveModelName();
        const total_vram = gpuData.reduce((acc, gpu) => acc + gpu.memoryTotal, 0);
        const total_vram_used = gpuData.reduce((acc, gpu) => acc + gpu.memoryUsed, 0);
        const total_ram = appData.memData.total;
        const total_ram_used = appData.memData.used;

        systemStats = {
          total_vram: total_vram,
          total_vram_used: total_vram_used,
          total_ram: total_ram,
          total_ram_used: total_ram_used,
          isApiActive: isApiActive,
          activeApiModel: activeApiModel
        };
      }
      catch (e) {
        console.error(e);
      }

      setSystemStats(systemStats);
    }, 5000);

    return () => clearInterval(interval);
  }, [appData]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {
        appData ? <>
          <Box sx={{ display: 'flex' }}>
            <Header systemStats={systemStats} />
            <Sidenav systemStats={systemStats} />
            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 5 }}>
              <HashRouter future={{ v7_startTransition: true }}>
                <ToastContainer />
                <Routes>
                  <Route path="/" element={<RouteHome />} />
                  <Route path="/settings" element={<RouteSettings appData={appData} />} />
                  <Route path="/characters" element={<RouteCharacters />} />
                  {/* editor may contain ID in the url */}
                  <Route path="/editor/:id?" element={<RouteCharacterEditor />} />
                </Routes>
              </HashRouter>
            </Box>
          </Box>
        </> : <>
          {/* loading app, spinner in center of screen */}
          {/* <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <h1>Loading...</h1>
            </Box> */}
          <PageLoader open={true} />
        </>
      }
    </ThemeProvider>
  );
}

export default App;
