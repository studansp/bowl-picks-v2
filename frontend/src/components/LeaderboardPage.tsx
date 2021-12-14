import * as React from 'react';

import Grid from '@mui/material/Grid';

import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { getLeaders, Leader } from '../data';

interface Props {
  isAuthenticated: boolean;
}

const useStyles = makeStyles<Theme>((theme) => ({
  header: {
    '& .MuiTableCell-head': {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.light,
    },
  },
}));

export const LeaderboardPage: React.FunctionComponent<Props> = ({ isAuthenticated }: Props) => {
  if (isAuthenticated === false) {
    return (
      <Navigate to={{ pathname: '/login' }} />
    );
  }

  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  const setup = async () => setLeaders(await getLeaders());

  useEffect(() => {
    setup();
  }, []);

  const classes = useStyles();

  if (leaders === null) {
    return (
      <CircularProgress />
    );
  }

  return (
    <Grid item xs={12}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead className={classes.header}>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Possible</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { leaders.map((leader) => (
              <TableRow key={leader.username}>
                <TableCell>{leader.username}</TableCell>
                <TableCell>{leader.points}</TableCell>
                <TableCell>{leader.possible}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );
};
