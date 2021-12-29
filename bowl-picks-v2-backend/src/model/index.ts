import {
  attribute,
  hashKey,
  table,
} from '@aws/dynamodb-data-mapper-annotations';

import * as model from 'bowl-picks-v2-model';

@table(process.env.GAME_TABLE!)
export class Game implements Partial<model.Game> {
    @hashKey()
    id!: string;

    @attribute()
    canceled?: boolean;

    @attribute()
    home!: string;

    @attribute()
    away!: string;

    @attribute()
    spread!: string;

    @attribute()
    winner?: string;
}

@table(process.env.PICKS_TABLE!)
export class Picks implements Partial<model.Picks> {
    @hashKey()
    username!: string;

    @attribute()
    picks!: Game[];
}
