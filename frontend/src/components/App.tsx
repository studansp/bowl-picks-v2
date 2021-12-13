import React, { useEffect, useState } from 'react';

import {
  CircularProgress, createTheme, Grid, ThemeProvider,
} from '@mui/material';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import NavBar from './Navbar';

import { PicksPage } from './PicksPage';
import { LeaderboardPage } from './LeaderboardPage';
import { Login } from './Login';
import { isAuthenticatedFetch } from '../data';

const theme = createTheme();

const App: React.FunctionComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const setup = async () => setIsAuthenticated(await isAuthenticatedFetch());

  useEffect(() => {
    setup();
  }, []);

  if (isAuthenticated === null) {
    return (<CircularProgress />);
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <NavBar isAuthenticated={isAuthenticated} setAuthenticated={setIsAuthenticated} />
          </Grid>
          <Routes>
            <Route path="/" element={<PicksPage isAuthenticated={isAuthenticated} />} />
            <Route path="/picks" element={<PicksPage isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={<Login authenticated={isAuthenticated} setAuthenticated={setIsAuthenticated} />} />
            <Route path="/leaderboard" element={<LeaderboardPage isAuthenticated={isAuthenticated} />} />
          </Routes>
        </Grid>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
