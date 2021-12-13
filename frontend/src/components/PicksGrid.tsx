import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { makeStyles } from '@mui/styles';
import { Alert, Snackbar, Theme } from '@mui/material';
import { useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useDebouncedCallback } from 'use-debounce';
import { Picks, setPicks } from '../data';

interface Props {
    picks: Picks
}

// Check this https://codesandbox.io/s/react-material-ui-and-react-beautiful-dnd-uofv4?file=/src/MaterialTable.tsx
const useStyles = makeStyles<Theme>((theme) => ({
  header: {
    '& .MuiTableCell-head': {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.light,
    },
  },
  selected: {
    backgroundColor: theme.palette.success.light,
  },
}));

export const PicksGrid: React.FunctionComponent<Props> = ({ picks }: Props) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [picksState, setPicksState] = useState<Picks>(picks);
  const classes = useStyles();

  const updatePicksDebounced = useDebouncedCallback(
    // function
    () => {
      setPicks(picksState).then(() => {
        setSaving(false);
        setSaved(true);
      })
        .catch(() => setError(true));
    },
    // delay in ms
    5_000,
  );

  const updatePicks = (newPicks: Picks): void => {
    setPicksState(newPicks);
    setSaved(false);
    setSaving(true);
    updatePicksDebounced();
  };

  const clonePicks = (): Picks => JSON.parse(JSON.stringify(picksState));

  const selectWinner = (id: string, winner: string): void => {
    const clonedPicksState: Picks = clonePicks();

    const game = clonedPicksState.picks.find((p) => p.id === id)!;
    game.winner = winner;

    updatePicks(clonedPicksState);
  };

  const adjustConfidence = (id: string, modifer: number): void => {
    const clonedPicksState: Picks = clonePicks();

    for (let i = 0; i < clonedPicksState.picks.length; i += 1) {
      if (clonedPicksState.picks[i].id === id) {
        const temp = clonedPicksState.picks[i];

        clonedPicksState.picks[i] = clonedPicksState.picks[i + modifer];
        clonedPicksState.picks[i + modifer] = temp;
        break;
      }
    }

    updatePicks(clonedPicksState);
  };

  return (
    <>
      <Snackbar
        open={saving}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          Waiting for more changes before saving.
        </Alert>
      </Snackbar>
      <Snackbar
        open={saved}
        onClose={() => setSaved(false)}
        autoHideDuration={3000}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Saved!
        </Alert>
      </Snackbar>
      <Snackbar
        open={error}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          Save failed, contact the idiot in charge.
        </Alert>
      </Snackbar>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead className={classes.header}>
            <TableRow>
              <TableCell>Adjust Confidence</TableCell>
              <TableCell>Game</TableCell>
              <TableCell align="right">Home</TableCell>
              <TableCell align="right">Away (Spread)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {picksState.picks.map((pick) => (
              <TableRow
                key={pick.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  { pick.id !== picksState.picks[0].id
                    && (
                    <IconButton onClick={() => adjustConfidence(pick.id, -1)}>
                      <ArrowUpwardIcon />
                    </IconButton>
                    ) }
                  { pick.id !== picksState.picks[picksState.picks.length - 1].id
                    && (
                    <IconButton onClick={() => adjustConfidence(pick.id, 1)}>
                      <ArrowDownwardIcon />
                    </IconButton>
                    )}
                </TableCell>
                <TableCell component="th" scope="row">
                  {pick.id}
                </TableCell>
                <TableCell
                  align="right"
                  onClick={() => selectWinner(pick.id, pick.home)}
                  className={pick.winner === pick.home ? classes.selected : ''}
                >
                  {pick.home}
                </TableCell>
                <TableCell
                  align="right"
                  onClick={() => selectWinner(pick.id, pick.away)}
                  className={pick.winner === pick.away ? classes.selected : ''}
                >
                  {pick.away}
                  (
                  {pick.spread}
                  )
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
