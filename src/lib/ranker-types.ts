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
  Id: number;
  Week: number;
  Stats: RankerGameStats;
  Type: number;
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
  Id: number;
  Week: number;
  Rank: number;
  Weight: number;
  Schedule: Array<{
    Id: number;
    Week: number;
    OppId: number;
  }>;
  Stats: {
    wins: Stat;
    losses: Stat;
    totalOffense: Stat;
    totalDefense: Stat;
    pf: Stat;
    pa: Stat;
  };
  ExternalStats: {
    PollIntertia: Stat;
    ScheduleStrength: Stat;
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
