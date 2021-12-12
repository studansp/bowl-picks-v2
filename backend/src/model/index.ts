import {
  attribute,
  hashKey,
  table,
} from '@aws/dynamodb-data-mapper-annotations';

@table('BowlPicksStack-Game86FD83D5-1QWMA62T9C8ZO')
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

@table('BowlPicksStack-Picks6D45B940-1KQMZHLQT2K7D')
export class Picks {
    @hashKey()
    username: string;

    @attribute()
    picks: Game[];
}
