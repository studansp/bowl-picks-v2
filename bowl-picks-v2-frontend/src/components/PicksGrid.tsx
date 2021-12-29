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

import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';

import { useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { useDebouncedCallback } from 'use-debounce';
import { useTheme, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
  DropResult,
} from 'react-beautiful-dnd';
import { Game, Picks } from 'bowl-picks-v2-model';

import { setPicks } from '../data';

interface Props {
    canEdit?: boolean;
    games: Game[];
    picks: Picks
}

const useStyles = makeStyles<Theme>((theme) => ({
  canceled: {
    '& .MuiTableCell-body': {
      fontWeight: 'bold',
      textDecoration: 'line-through',
    },
    '& .MuiAlert-message': {
      fontWeight: 'bold',
      textDecoration: 'line-through',
    },
  },
  tableCell: {
    '& .MuiTableCell-body': {
      padding: 0,
    },
  },
  header: {
    '& .MuiTableCell-head': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  selected: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  selectedCorrect: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  selectedIncorrect: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  actionsColumns: {
    width: '120px',
  },
}));

const formatSpread = (spread: number): string => {
  if (spread > 0) {
    return `+${spread}`;
  }

  return spread.toString();
};

export const PicksGrid: React.FunctionComponent<Props> = ({ canEdit = false, games, picks }: Props) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [picksState, setPicksState] = useState<Picks>(picks);
  const classes = useStyles();

  const updatePicksDebounced = useDebouncedCallback(
    () => {
      setPicks(picksState).then(() => {
        setSaving(false);
        setSaved(true);
      })
        .catch(() => setError(true));
    },
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
    if (!canEdit) return;

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const clonedPicksState: Picks = clonePicks();

    const element = clonedPicksState.picks[result.source.index];
    clonedPicksState.picks.splice(result.source.index, 1);
    clonedPicksState.picks.splice(result.destination.index, 0, element);

    updatePicks(clonedPicksState);
  };

  const theme = useTheme();
  const shouldShowGame = useMediaQuery(theme.breakpoints.up('md'));

  const getAlertColor = (pick: Game, team: string): AlertColor => {
    if (pick.winner !== team) {
      return 'info';
    }

    const game = games.find((g) => g.id === pick.id)!;

    if (!game.winner) {
      return 'info';
    }

    if (game.winner === pick.winner) {
      return 'success';
    }

    return 'error';
  };

  const getRowClass = (pick: Game): string => {
    const game = games.find((g) => g.id === pick.id)!;

    if (game.canceled === true) {
      return `${classes.tableCell} ${classes.canceled}`;
    }

    return classes.tableCell;
  };

  const getTeamCell = (pick: Game, team: string, spread: number): JSX.Element => {
    const spreadFormatted = formatSpread(spread);

    if (pick.winner !== team) {
      return (
        <TableCell>
          {team}
          (
          {spreadFormatted}
          )
        </TableCell>
      );
    }

    const alertSeverity: AlertColor = getAlertColor(pick, team);

    return (
      <TableCell
        align="right"
        onClick={() => selectWinner(pick.id, team)}
      >
        <Alert severity={alertSeverity}>
          {team}
          (
          {spreadFormatted}
          )
        </Alert>
      </TableCell>
    );
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
        <Table aria-label="simple table">
          <TableHead className={classes.header}>
            <TableRow>
              { shouldShowGame && <TableCell>Game</TableCell> }
              <TableCell align="right">Home (Spread)</TableCell>
              { canEdit && <TableCell className={classes.actionsColumns}>Adjust Confidence</TableCell>}
              <TableCell align="right">Away (Spread)</TableCell>
            </TableRow>
          </TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="droppable" direction="vertical">
              {(droppableProvided: DroppableProvided) => (
                <TableBody
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {picksState.picks.map((pick, index) => (

                    <Draggable
                      key={pick.id}
                      draggableId={pick.id}
                      index={index}
                    >
                      {(
                        draggableProvided: DraggableProvided,
                      ) => (
                        <TableRow
                          className={getRowClass(pick)}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          key={pick.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          { shouldShowGame
                    && (
                    <TableCell scope="row">
                      {pick.id}
                    </TableCell>
                    )}
                          {getTeamCell(pick, pick.home, 0 - parseFloat(pick.spread))}
                          {
                          canEdit
                          && (
                          <TableCell align="right" className={classes.actionsColumns}>
                            { pick.id !== picksState.picks[0].id
                        && (
                        <IconButton onClick={() => adjustConfidence(pick.id, -1)}>
                          <ArrowUpwardIcon />
                        </IconButton>
                        ) }
                            <span {...draggableProvided.dragHandleProps}>
                              <DragHandleIcon />
                            </span>
                            { pick.id !== picksState.picks[picksState.picks.length - 1].id
                        && (
                        <IconButton onClick={() => adjustConfidence(pick.id, 1)}>
                          <ArrowDownwardIcon />
                        </IconButton>
                        )}
                          </TableCell>
                          )

                          }
                          {getTeamCell(pick, pick.away, parseFloat(pick.spread))}
                        </TableRow>
                      )}

                    </Draggable>
                  ))}
                </TableBody>
              )}
            </Droppable>

          </DragDropContext>
        </Table>
      </TableContainer>
    </>
  );
};
