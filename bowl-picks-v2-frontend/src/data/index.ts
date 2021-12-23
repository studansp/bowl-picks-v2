import { Amplify, API, Auth } from 'aws-amplify';
import { Game, Leader, Picks } from 'bowl-picks-v2-model';

const API_NAME = 'Backend';

const endpoint = location.hostname === 'localhost' ? 'https://bowl-picks.com' : `https://${location.host}`;

Amplify.configure({
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_EZBKICR23',
  aws_user_pools_web_client_id: '19t65ms6j6cf7t0k9df8viojvd',
  aws_mandatory_sign_in: 'enable',
  API: {
    endpoints: [
      {
        name: API_NAME,
        endpoint,
      },
    ],
  },
});

interface BaseRequest {
    headers: Record<string, string>
}

export const isAuthenticatedFetch = async (): Promise<boolean> => {
  try {
    await Auth.currentAuthenticatedUser();
    return true;
  } catch {
    return false;
  }
};

const getBaseRequest = async (): Promise<BaseRequest> => Auth.currentAuthenticatedUser()
  .then((user) => ({
    headers: {
      Authorization: user.signInUserSession.idToken.jwtToken,
    },
  }));

export const getUsername = async (): Promise<string> => {
  const user = await Auth.currentAuthenticatedUser();

  return user.username;
};

export const getGames = (): Promise<Game[]> => getBaseRequest()
  .then((request) => API.get(API_NAME, '/api/games', request));

export const getLeaders = (): Promise<Leader[]> => getBaseRequest()
  .then((request) => API.get(API_NAME, '/api/leaders', request));

export const getPicks = (username:string): Promise<Picks> => getBaseRequest()
  .then((request) => API.get(API_NAME, `/api/picks/${username}`, request));

export const setPicks = (picks: Picks): Promise<Picks> => getBaseRequest()
  .then((request) => API.post(API_NAME, '/api/picks', {
    ...request,
    body: picks,
  }));
