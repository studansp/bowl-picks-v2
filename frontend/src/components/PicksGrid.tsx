import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Picks } from '../data';

interface Props {
    picks: Picks
}

// Check this https://codesandbox.io/s/react-material-ui-and-react-beautiful-dnd-uofv4?file=/src/MaterialTable.tsx

export const PicksGrid: React.FunctionComponent<Props> = ({ picks }: Props) => (
  <TableContainer component={Paper}>
    <Table sx={{ minWidth: 650 }} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell>Game</TableCell>
          <TableCell align="right">Home</TableCell>
          <TableCell align="right">Away</TableCell>
          <TableCell align="right">Spread</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {picks.picks.map((pick) => (
          <TableRow
            key={pick.id}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          >
            <TableCell component="th" scope="row">
              {pick.id}
            </TableCell>
            <TableCell align="right">{pick.home}</TableCell>
            <TableCell align="right">{pick.away}</TableCell>
            <TableCell align="right">{pick.spread}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
