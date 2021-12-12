import { Amplify, API, Auth } from 'aws-amplify';

export interface Game {
    id: string;
    home: string;
    away: string;
    spread: string;
    winner?: string;
}

export interface Picks {
    username: string;
    picks: Game[];
}

const API_NAME = 'Backend';

Amplify.configure({
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_t9E1VJ4mA',
  aws_user_pools_web_client_id: '1gs5daov64bncnpnaffb830mv0',
  aws_mandatory_sign_in: 'enable',
  API: {
    endpoints: [
      {
        name: API_NAME,
        endpoint: 'https://d27r3zos7l7xqs.cloudfront.net',
      },
    ],
  },
});

interface BaseRequest {
    headers: Record<string, string>
}

const getBaseRequest = async (): Promise<BaseRequest> => Auth.currentAuthenticatedUser()
  .then((user) => ({
    headers: {
      Authorization: user.signInUserSession.idToken.jwtToken,
    },
  }));

export const getGames = (): Promise<Game[]> => getBaseRequest()
  .then((request) => API.get(API_NAME, '/api/games', request));

export const getPicks = (): Promise<Picks> => getBaseRequest()
  .then((request) => API.get(API_NAME, '/api/picks', request));

export const setPicks = (picks: Picks): Promise<Picks> => getBaseRequest()
  .then((request) => API.post(API_NAME, '/api/picks', {
    ...request,
    body: picks,
  }));
