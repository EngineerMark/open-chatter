import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router-dom";
import RouteHome from "./Routes/RouteHome";
import Sidenav from "./Components/Sidenav";
import RouteSettings from "./Routes/RouteSettings";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from "react";
import { GetAppSettings, GetGraphicsData, GetMemoryData } from "./Misc/Helpers";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
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

      console.log(_appData);

      setAppData(_appData);
    })();
  }, []);

  //system stats updater, every 5 or so seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      let systemStats = {};
      try{
        const gpuData = await GetGraphicsData();
        const total_vram = gpuData.reduce((acc, gpu) => acc + gpu.memoryTotal, 0);
        const total_vram_used = gpuData.reduce((acc, gpu) => acc + gpu.memoryUsed, 0);
        const total_ram = appData.memData.total;
        const total_ram_used = appData.memData.used;

        systemStats = {
          total_vram: total_vram,
          total_vram_used: total_vram_used,
          total_ram: total_ram,
          total_ram_used: total_ram_used
        };
      }
      catch(e){
        console.error(e);
      }

      setSystemStats(systemStats);
    }, 5000);

    return () => clearInterval(interval);
  }, [appData]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <CssBaseline />
        {
          appData ? <>
            <Sidenav systemStats={systemStats} />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <HashRouter future={{ v7_startTransition: true }}>
                <ToastContainer />
                <Routes>
                  <Route path="/" element={<RouteHome />} />
                  <Route path="/settings" element={<RouteSettings appData={appData} />} />
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
