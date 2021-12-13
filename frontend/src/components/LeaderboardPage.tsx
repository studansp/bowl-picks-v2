import * as React from 'react';
import { Grid, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import CelebrationIcon from '@mui/icons-material/Celebration';

interface Props {
  isAuthenticated: boolean;
}

export const LeaderboardPage: React.FunctionComponent<Props> = ({ isAuthenticated }: Props) => {
  if (isAuthenticated === false) {
    return (
      <Navigate to={{ pathname: '/login' }} />
    );
  }

  return (

    <Grid item xs={12}>
      <Typography>
        We are all winners!
        <CelebrationIcon />
      </Typography>
    </Grid>
  );
};
