export type RankerWeights = {
  stats: {
    wins: StatWeight;
    losses: StatWeight;
    offense: StatWeight;
    defense: StatWeight;
    pf: StatWeight;
    pa: StatWeight;
  };
  extra: {
    pi: number;
    ss: number;
  };
};

export type ComputedSeason = {
  teamMap: Map<number, RankerTeam>;
  gameMap: Map<number, RankerGame>;
  sznMap: Map<number, WeekTeamsMap>;
};

//Import data types
export type RankerSeason = {
  teams: Record<number, RankerTeam>;
  games: Record<number, RankerGame>;
};

export type RankerTeam = {
  id: number;
};

export type RankerGame = {
  id: number;
  week: number;
  stats: RankerGameStats;
  type: number;
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

//Export data types
export type SeasonMap = Map<number, WeekTeamsMap>;
export type WeekTeamsMap = Map<number, RankedTeam>;
export type RankedTeam = {
  id: number;
  week: number;
  rank: number;
  weight: number;
  schedule: Array<{
    id: number;
    week: number;
    oppId: number;
  }>;
  stats: {
    wins: Stat;
    losses: Stat;
    offense: Stat;
    defense: Stat;
    pf: Stat;
    pa: Stat;
  };
  externalStats: {
    pollIntertia: Stat;
    scheduleStrength: Stat;
  };
};
export type RankedStat = {
  rank: number;
  val: number;
};

//misc
export type Week = {
  week: number;
  games: number[];
};

export type Stat = {
  total: RankedStat;
  pg: RankedStat;
};

export type StatWeight = {
  totalWeight: number;
  pgWeight: number;
};
