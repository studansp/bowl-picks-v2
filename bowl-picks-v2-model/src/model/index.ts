export interface Game {
  id: string;
  home: string;
  away: string;
  canceled?: boolean;
  spread: string;
  winner?: string;
}

export interface Leader {
  username: string;
  points: number;
  possible: number;
}

export interface Picks {
  username: string;
  picks: Game[];
}
