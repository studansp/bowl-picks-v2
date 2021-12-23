import * as React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { Game, Picks } from 'bowl-picks-v2-model';
import { getGames, getPicks, getUsername } from '../data';
import { PicksGrid } from './PicksGrid';

interface Props {
  isAuthenticated: boolean;
}

const useStyles = makeStyles(() => ({
  instructionsAlert: {
    width: '300px',
  },
}));

export const PicksPage: React.FunctionComponent<Props> = ({ isAuthenticated }: Props) => {
  const classes = useStyles();

  if (isAuthenticated === false) {
    return (
      <Navigate to={{ pathname: '/login' }} />
    );
  }

  // TODO Make this configuration somewhere
  const canEdit = false;

  const [picks, setPicks] = useState<Picks | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);

  const setup = async () => {
    setGames(await getGames());
    setPicks(await getPicks(await getUsername()));
  };

  useEffect(() => {
    setup();
  }, []);

  if (picks === null || games === null) {
    return (
      <CircularProgress />
    );
  }

  return (
    <>
      {
        canEdit
        && (
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
        )
      }
      {
        !canEdit

      && (
      <Grid item xs={12}>
        <Typography variant="h5">Picks are Locked</Typography>
        <List disablePadding>
          <ListItem>
            <Alert severity="success" className={classes.instructionsAlert}>
              Indicates a correct pick
            </Alert>
          </ListItem>
          <ListItem>
            <Alert severity="info" className={classes.instructionsAlert}>
              Indicates a game that is not yet complete
            </Alert>
          </ListItem>
          <ListItem>
            <Alert severity="error" className={classes.instructionsAlert}>
              Indicates an incorrect pick
            </Alert>
          </ListItem>
        </List>
      </Grid>
      )
      }
      <Grid item xs={12}>
        <PicksGrid canEdit={canEdit} games={games!} picks={picks!} />
      </Grid>
    </>
  );
};
