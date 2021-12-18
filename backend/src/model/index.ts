import {
  attribute,
  hashKey,
  table,
} from '@aws/dynamodb-data-mapper-annotations';

@table(process.env.GAME_TABLE!)
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

@table(process.env.PICKS_TABLE!)
export class Picks {
    @hashKey()
    username: string;

    @attribute()
    picks: Game[];
}
