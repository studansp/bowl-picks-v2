import {
  attribute,
  hashKey,
  table,
} from '@aws/dynamodb-data-mapper-annotations';

@table('BowlPicksStack-Game86FD83D5-1WS9SR9EQI6YC')
export class Game {
    @hashKey()
    id: string;

    @attribute()
    home: string;

    @attribute()
    away: string;

    @attribute()
    spread: string;

    @attribute()
    winner?: string;
}

@table('BowlPicksStack-Picks6D45B940-XO1FGRF6YFLT')
export class Picks {
    @hashKey()
    username: string;

    @attribute()
    picks: Game[];
}
