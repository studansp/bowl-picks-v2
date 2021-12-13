import * as React from 'react';
import { CircularProgress, Grid } from '@mui/material';
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
    <Grid item xs={12}>
      <PicksGrid picks={picks} />
    </Grid>
  );
};
