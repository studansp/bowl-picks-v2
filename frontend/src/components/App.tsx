import React from 'react';

import { withAuthenticator } from '@aws-amplify/ui-react';
import { createTheme, Grid, ThemeProvider } from '@mui/material';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import NavBar from './Navbar';

import { PicksPage } from './PicksPage';
import { LeaderboardPage } from './LeaderboardPage';

const theme = createTheme();

const App: React.FunctionComponent = () => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <NavBar />
        </Grid>
        <Grid item xs={12}>
          <Routes>
            <Route path="/" element={<PicksPage />} />
            <Route path="/picks" element={<PicksPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </Grid>
      </Grid>
    </BrowserRouter>
  </ThemeProvider>
);

export default withAuthenticator(App);
