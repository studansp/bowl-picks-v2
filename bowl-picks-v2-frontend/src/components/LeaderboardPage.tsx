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
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Game, Leader } from 'bowl-picks-v2-model';
import { getGames, getLeaders, getPicks } from '../data';
import { PicksGrid } from './PicksGrid';

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
  modal: {
    position: 'absolute',
    // top: '50%',
    // left: '50%',
    transform: 'translate(5%)',
    height: '100%',
    width: '90%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    // boxShadow: 24,
    p: 4,
    overflow: 'scroll',
  },
  userButton: {
    width: '200px',
  },
}));

export const LeaderboardPage: React.FunctionComponent<Props> = ({ isAuthenticated }: Props) => {
  if (isAuthenticated === false) {
    return (
      <Navigate to={{ pathname: '/login' }} />
    );
  }

  const progressElement = (
    <CircularProgress />
  );

  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  const [games, setGames] = useState<Game[] | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<JSX.Element>(progressElement);

  const openModel = async (username: string): Promise<void> => {
    setModalOpen(true);

    getPicks(username).then((picks) => setModalContent((
      <PicksGrid games={games!} picks={picks} />
    )));
  };

  const closeModel = async (): Promise<void> => {
    setModalOpen(false);
    setModalContent(progressElement);
  };

  const setup = async () => {
    setLeaders(await getLeaders());
    setGames(await getGames());
  };

  useEffect(() => {
    setup();
  }, []);

  const classes = useStyles();

  if (leaders === null || games === null) {
    return progressElement;
  }

  return (
    <Grid item xs={12}>
      <Modal
        open={isModalOpen}
        onClose={closeModel}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className={classes.modal}>
          {modalContent}
        </Box>
      </Modal>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead className={classes.header}>
            <TableRow>
              <TableCell />
              <TableCell>User</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Possible</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { leaders.map((leader) => (
              <TableRow key={leader.username}>
                <TableCell align="right" width="120px">
                  <Button onClick={() => openModel(leader.username)} variant="contained">
                    See picks
                  </Button>
                </TableCell>
                <TableCell>
                  {leader.username}
                </TableCell>
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
