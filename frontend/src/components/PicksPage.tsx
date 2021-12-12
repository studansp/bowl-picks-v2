import * as React from 'react';
import { CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { getPicks, Picks } from '../data';
import { PicksGrid } from './PicksGrid';

export const PicksPage: React.FunctionComponent = () => {
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
    <PicksGrid picks={picks} />
  );
};
