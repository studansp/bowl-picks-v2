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
import { Theme } from '@mui/material';
import { useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Picks } from '../data';

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
}));

export const PicksGrid: React.FunctionComponent<Props> = ({ picks }: Props) => {
  const [picksState, setPicksState] = useState<Picks>(picks);
  const classes = useStyles();

  const adjustConfidence = (id: string, modifer: number): void => {
    // eslint-disable-next-line
    debugger;
    const clonedPicksState: Picks = JSON.parse(JSON.stringify(picksState));

    for (let i = 0; i < clonedPicksState.picks.length; i += 1) {
      if (clonedPicksState.picks[i].id === id) {
        const temp = clonedPicksState.picks[i];

        clonedPicksState.picks[i] = clonedPicksState.picks[i + modifer];
        clonedPicksState.picks[i + modifer] = temp;
        break;
      }
    }

    setPicksState(clonedPicksState);
  };

  return (
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
              <TableCell align="right">{pick.home}</TableCell>
              <TableCell align="right">
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
  );
};
