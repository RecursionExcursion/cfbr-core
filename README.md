# cfbr-core

`cfbr-core` is a TypeScript/JavaScript library designed to rank college football teams based on game and team statistics. It processes structured data inputs and produces team rankings using internal statistical computations.

## Features

- 📊 Rank teams based on stats like total yards and points  
- 🧠 Flexible API for integrating with football analysis tools  
- 🛠 Written in TypeScript with full type support  
- 🔄 Easy to integrate into data pipelines or simulations  

## Installation

```bash
npm install cfbr-core
```

## Usage

```ts
import { rank, RankerTeam, RankerGame } from 'cfbr-core';

const teams: RankerTeam[] = [
  { id: 1 },
  { id: 2 },
];

const games: RankerGame[] = [
  {
    Id: 101,
    Week: 1,
    Type: 0,
    Stats: {
      home: { id: 1, totalYards: 450, points: 35 },
      away: { id: 2, totalYards: 300, points: 14 },
    },
  },
];

const result = rank(teams, games);

console.log(result); // Contains season map and final rankings
```

## API

### `rank(teams, games): RankResult`

Computes team rankings based on provided game data.

#### Parameters

- `teams`: `RankerTeam[]` — List of team objects  
- `games`: `RankerGame[]` — List of game results  

#### Returns

An object containing internal season data and final rankings.

### Types

```ts
export type RankerTeam = {
  id: number;
};

export type RankerGame = {
  Id: number;
  Week: number;
  Type: number;
  Stats: RankerGameStats;
};

export type RankerGameStats = {
  home: RankerStat;
  away: RankerStat;
};

export type RankerStat = {
  id: number;
  totalYards: number;
  points: number;
};

export type WeekTeamsMap = Map<number, RankedTeam>;
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or pull requests.

## Author

Developed and maintained by Ryan Loupee
