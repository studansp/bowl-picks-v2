import * as React from 'react';
import { CircularProgress, TextField } from '@mui/material';
import { useState } from 'react';
import Button from '@mui/material/Button';

export const SignUp: React.FunctionComponent = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  return (
    <form>
      <TextField
        required
        label="Username"
        value={username}
        onChange={(event) => setUsername(event.currentTarget.value)}
      />
      <TextField
        type="password"
        required
        label="Password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
      />
      <TextField
        type="email"
        required
        label="Email"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
      />
      <Button type="submit">Login</Button>
    </form>
  );
};
