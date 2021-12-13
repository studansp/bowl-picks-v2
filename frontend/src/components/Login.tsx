import * as React from 'react';
import {
  Alert, CircularProgress, Grid, TextField,
} from '@mui/material';
import { useState } from 'react';
import Button from '@mui/material/Button';
import { Navigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';

interface Props {
  authenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const Login: React.FC<Props> = ({ authenticated, setAuthenticated }: Props) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (event: React.MouseEvent) => {
    try {
      setLoading(true);
      await Auth.signIn(username, password);
      setAuthenticated(true);
    } catch (e) {
      const errorAsAny: any = e;
      setError(errorAsAny.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (<CircularProgress />);
  } if (authenticated) {
    return (
      <Navigate to={{ pathname: '/picks' }} />
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          required
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          type="password"
          required
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button type="submit" onClick={(event) => login(event)}>Login</Button>
      </Grid>
      { error && <Alert severity="error">{error}</Alert>}
    </Grid>
  );
};
