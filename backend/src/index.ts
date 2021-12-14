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

interface Leader {
  username: string;
  points: number;
  possible: number;
}

const getLeaders = async (): Promise<Leader[]> => {
  const result: Leader[] = [];
  const games = await getGames();

  const gamesMap = games.reduce((prev, current) => {
    prev[current.id] = current;

    return prev;
  }, {} as Record<string, Game>);

  const iterator = mapper.scan(Picks);

  for await (const picks of iterator) {
    let totalPoints = 0; let
      possiblePoints = 0;
    let currentPoints = games.length;

    for (const pick of picks.picks) {
      const game = gamesMap[pick.id];

      if (game.winner) {
        if (pick.winner === game.winner) {
          totalPoints += currentPoints;
        }
      } else {
        possiblePoints += currentPoints;
      }

      currentPoints -= 1;
    }

    result.push({
      username: picks.username,
      points: totalPoints,
      possible: possiblePoints + totalPoints,
    });
  }

  result.sort((a, b) => {
    if (a.points !== b.points) {
      return a.points - b.points;
    }
    if (a.possible !== b.possible) {
      return a.possible - a.possible;
    }

    return a.username.localeCompare(b.username);
  });

  return result;
};

const setPicks = async (username: string, body: Picks): Promise<Picks> => {
  const picks = new Picks();

  picks.username = username;

  const allGames = await getGames();

  interface GameWithOrder {
    order: number;
    game: Game;
  }

  // TODO Better invalid input?
  const picksWithOrder: GameWithOrder[] = allGames.reduce((prev, game) => {
    const foundIndex = body.picks.findIndex((p) => p.id === game.id);

    if (foundIndex !== -1) {
      const pickWinner = body.picks[foundIndex].winner;
      const validWinners = [game.home, game.away];

      if (pickWinner && validWinners.includes(pickWinner)) {
        game.winner = pickWinner;
      }
    }

    prev.push({
      order: foundIndex ?? 1000,
      game,
    });

    return prev;
  }, [] as GameWithOrder[]);

  picks.picks = picksWithOrder
    .sort((a, b) => a.order - b.order)
    .map((p) => p.game);

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

  if (method === 'GET' && path === '/api/leaders') {
    result = await getLeaders();
  }

  if (method === 'POST' && path === '/api/picks') {
    result = await setPicks(username, JSON.parse(event.body));
  }

  if (result === undefined || result == null) {
    return notFound();
  }

  return success(result);
};
