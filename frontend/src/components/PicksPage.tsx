import * as React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getPicks, Picks } from '../data';
import { PicksGrid } from './PicksGrid';

interface Props {
  isAuthenticated: boolean;
}

export const PicksPage: React.FunctionComponent<Props> = ({ isAuthenticated }: Props) => {
  if (isAuthenticated === false) {
    return (
      <Navigate to={{ pathname: '/login' }} />
    );
  }

  const [picks, setPicks] = useState<Picks | null>(null);

  const setup = async () => setPicks(await getPicks());

  useEffect(() => {
    setup();
  }, []);

  if (picks === null) {
    return (
      <CircularProgress />
    );
  }

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h5">Instructions</Typography>
        <List>
          <ListItem>
            Click the name of the team your think will win.
          </ListItem>
          <ListItem>
            Use the arrows to adjust confidence. The higher the game is, the more points you will
            get for a correct prediction.
          </ListItem>
        </List>
      </Grid>
      <Grid item xs={12}>
        <PicksGrid picks={picks} />
      </Grid>
    </>
  );
};
