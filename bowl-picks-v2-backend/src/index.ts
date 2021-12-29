import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { DataMapper } from '@aws/dynamodb-data-mapper';
import * as AWS from 'aws-sdk';
import { Leader } from 'bowl-picks-v2-model';
import { Game, Picks } from './model';

const client = new AWS.DynamoDB({ region: 'us-east-1' });
const mapper = new DataMapper({ client });

const success = (response: unknown): APIGatewayProxyResult => ({
  statusCode: 200,
  body: JSON.stringify(response),
  isBase64Encoded: true,
});

const getGamesRaw = async (): Promise<Game[]> => {
  const iterator = mapper.scan(Game);

  const result: Game[] = [];

  for await (const game of iterator) {
    result.push(game);
  }

  return result;
};

export const getGames: APIGatewayProxyHandler = async () => success(await getGamesRaw());

export const getPicks: APIGatewayProxyHandler = async (event) => {
  const picks = new Picks();

  picks.username = event.pathParameters!.username!;

  try {
    return await success(await mapper.get(picks));
  } catch (e) {
    const { name } = e as any;

    if (name !== 'ItemNotFoundException') {
      throw e;
    }

    picks.picks = await getGamesRaw();

    return success(picks);
  }
};

export const getLeaders: APIGatewayProxyHandler = async () => {
  const result: Leader[] = [];
  const games = await getGamesRaw();

  const gamesMap = games.reduce((prev, current) => {
    prev[current.id] = current;

    return prev;
  }, {} as Record<string, Game>);

  const iterator = mapper.scan(Picks);

  for await (const rawPicks of iterator) {
    let totalPoints = 0;
    let possiblePoints = 0;
    let currentPoints = 1;

    const picks: Game[] = rawPicks.picks.reverse();

    for (const pick of picks) {
      const game = gamesMap[pick.id];

      if (game.canceled !== true) {
        if (game.winner) {
          if (pick.winner === game.winner) {
            totalPoints += currentPoints;
          }
        } else {
          possiblePoints += currentPoints;
        }

        currentPoints += 1;
      }
    }

    result.push({
      username: rawPicks.username,
      points: totalPoints,
      possible: possiblePoints + totalPoints,
    });
  }

  result.sort((a, b) => {
    if (a.points < b.points) {
      return 1;
    }
    if (a.points > b.points) {
      return -1;
    }
    if (a.possible < b.possible) {
      return 1;
    }
    if (a.possible > b.possible) {
      return -1;
    }

    return 0;
  });

  return success(result);
};

export const setPicks: APIGatewayProxyHandler = async (event) => {
  const picks = new Picks();
  picks.username = event.requestContext.authorizer!.claims['cognito:username'];

  const body: Picks = JSON.parse(event.body!);

  const allGames = await getGamesRaw();

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

    const someVeryLargeIndex = allGames.length + 1;

    prev.push({
      order: foundIndex ?? someVeryLargeIndex,
      game,
    });

    return prev;
  }, [] as GameWithOrder[]);

  picks.picks = picksWithOrder
    .sort((a, b) => a.order - b.order)
    .map((p) => p.game);

  return success(mapper.put(picks));
};
