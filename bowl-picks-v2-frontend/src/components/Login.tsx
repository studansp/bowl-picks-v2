import * as React from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import Button from '@mui/material/Button';
import { Navigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';

interface Props {
  authenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

type AuthState = 'login' | 'signup' | 'confirm';

export const Login: React.FC<Props> = ({ authenticated, setAuthenticated }: Props) => {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authState, setAuthState] = useState<AuthState>('login');

  const login = async () => {
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

  const register = async () => {
    try {
      if (!email) {
        setError('Email address is required');
      } else {
        setLoading(true);

        await Auth.signUp({
          username,
          password,
          attributes: {
            email,
          },
        });

        setError('');
        setAuthState('confirm');
      }
    } catch (e) {
      const errorAsAny: any = e;
      setError(errorAsAny.message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    try {
      setLoading(true);

      await Auth.confirmSignUp(username, code);
      setAuthState('login');
    } catch (e) {
      const errorAsAny: any = e;
      setError(errorAsAny.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Grid item xs={12}>
        <CircularProgress />
      </Grid>
    );
  } if (authenticated) {
    return (
      <Navigate to={{ pathname: '/picks' }} />
    );
  }

  return (
    <>
      <Grid item xs={12}>
        <ToggleButtonGroup
          color="primary"
          value={authState}
          exclusive
          onChange={(e, value) => setAuthState(value)}
        >
          <ToggleButton value="login">Login</ToggleButton>
          <ToggleButton value="signup">SignUp</ToggleButton>
          <ToggleButton value="confirm">Confirm</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={12}>
        <form>
          <Grid container spacing={2}>
            {
      authState === 'confirm'

    && (
    <Grid item xs={12}>
      <Typography>
        An email has been sent to
        {' '}
        {email}
        {' '}
        with a confirmation code. Copy the confirmation code
        below to finish account creation.
      </Typography>
    </Grid>
    )
    }
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
            {
      authState === 'signup'

    && (
    <Grid item xs={12}>
      <TextField
        type="email"
        required
        label="Email"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />
    </Grid>
    )
    }
            {
      authState === 'confirm'

    && (
    <Grid item xs={12}>
      <TextField
        type="code"
        required
        label="Code"
        value={code}
        onChange={(event) => setCode(event.currentTarget.value)}
      />
    </Grid>
    )
    }
            <Grid item xs={12}>
              {
        authState === 'signup'
        && <Button onClick={() => register()} type="submit">Register</Button>
      }
              {
        authState === 'login'
        && <Button onClick={() => login()} type="submit">Login</Button>
      }
              {
        authState === 'confirm'
        && <Button onClick={() => confirm()} type="submit">Confirm</Button>
      }
            </Grid>

          </Grid>
        </form>
      </Grid>
      {
        error

    && (
    <Grid item xs={12}>
      <Alert severity="error">{error}</Alert>
    </Grid>
    )
      }
    </>
  );
};
