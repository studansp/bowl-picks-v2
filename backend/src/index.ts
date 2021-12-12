import { DataMapper } from '@aws/dynamodb-data-mapper';
import DynamoDB = require('aws-sdk/clients/dynamodb');
import { Game, Picks } from './model';

const client = new DynamoDB({ region: 'us-east-1' });
const mapper = new DataMapper({ client });

interface Response {
  statusCode: number;
  body: string;
  isBase64Encoded: boolean;
}

interface InputEvent {
  body: string;
  httpMethod: string;
  path: string;
  requestContext: {
    authorizer: {
      claims: {
        'cognito:username': string
      }
    }
  }
}

const success = (response: unknown): Response => ({
  statusCode: 200,
  body: JSON.stringify(response),
  isBase64Encoded: true,
});

const notFound = (): Response => ({
  statusCode: 404,
  body: 'Not found',
  isBase64Encoded: true,
});

const getGames = async (): Promise<Game[]> => {
  const iterator = mapper.scan(Game);

  const result: Game[] = [];

  for await (const game of iterator) {
    result.push(game);
  }

  return result;
};

const getPicks = async (username: string): Promise<Picks> => {
  const picks = new Picks();

  picks.username = username;

  try {
    return await mapper.get(picks);
  } catch (e) {
    const { name } = e as any;

    if (name !== 'ItemNotFoundException') {
      throw e;
    }

    picks.picks = await getGames();

    return picks;
  }
};

const setPicks = async (username: string, body: string): Promise<Picks> => {
  const picks = new Picks();

  picks.username = username;

  // TODO Invalid input?
  const parsed: Picks = JSON.parse(body);

  const allGames = await getGames();

  picks.picks = allGames.map((game) => {
    game.winner = parsed.picks.find((p) => p.id === game.id)?.winner;

    return game;
  });

  for (const game of parsed.picks) {
    picks.picks.push(game);
  }

  return mapper.put(picks);
};

export const handler = async (event: InputEvent): Promise<Response> => {
  const method = event.httpMethod;
  const { path } = event;
  const username = event.requestContext.authorizer.claims['cognito:username'];

  console.log(`Handling event ${method} ${path} ${username}`);

  let result: unknown;

  if (method === 'GET' && path === '/api/games') {
    result = await getGames();
  }

  if (method === 'GET' && path === '/api/picks') {
    result = await getPicks(username);
  }

  if (method === 'POST' && path === '/api/picks') {
    result = await setPicks(username, event.body);
  }

  if (result === undefined || result == null) {
    return notFound();
  }

  return success(result);
};
