import { Box, CssBaseline, ThemeProvider, createTheme, useTheme } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import RouteHome from "./Routes/RouteHome";
import Sidenav from "./Components/Sidenav";
import RouteSettings from "./Routes/RouteSettings";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";
import { GetAppSettings, GetGraphicsData, GetMemoryData, ShowNotification } from "./Misc/Helpers";
import PageLoader from "./Components/PageLoader";
import Header from "./Components/Header";
import RouteCharacters from "./Routes/RouteCharacters";
import RouteCharacterEditor from "./Routes/RouteCharacterEditor";
import RouteChat from "./Routes/RouteChat";
const { ipcRenderer } = window.require('electron');

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const theme = useTheme();
  const [appData, setAppData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [appState, setAppState] = useState({});

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

    ipcRenderer.on('set-app-state', (event, arg) => {
      //reload chat list
      const _state = arg; //key value pair
      const _appState = { ...appState, ..._state };
      setAppState(_appState);
    });

    ipcRenderer.on('sendError', (event, arg) => {
      ShowNotification("Error", arg, "error");
    });
  }, []);

  //system stats updater, every 5 or so seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      let systemStats = {};
      try {
        const gpuData = await GetGraphicsData();
        const isApiActive = await window.electron.getAPIStatus();
        const activeApiModel = await window.electron.getActiveModelName();
        const stats = await window.electron.getStats();
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
          activeApiModel: activeApiModel,
          stats: stats
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
      <CssBaseline enableColorScheme />
      {
        appData ? <>
          <Box sx={{ display: 'flex', height: '100%' }}>
            <Header systemStats={systemStats} />
            <Sidenav systemStats={systemStats} />
            {/* the page should fill the entire height */}
            <Box sx={{ flexGrow: 1, p: 3, mt: 5 }}>
              <HashRouter future={{ v7_startTransition: true }}>
                <ToastContainer />
                <Box sx={{ height: '100%' }}>
                  <Routes>
                    <Route path="/" element={<RouteHome />} />
                    <Route path="/settings" element={<RouteSettings appData={appData} />} />
                    <Route path="/characters" element={<RouteCharacters />} />
                    <Route path="/editor/:id?" element={<RouteCharacterEditor />} />
                    <Route path="/chat/:id?" element={<RouteChat appState={appState} />} />
                  </Routes>
                </Box>
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
