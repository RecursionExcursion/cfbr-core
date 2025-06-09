export type RankerWeights = {
    total: {
        wins: number;
        losses: number;
        offense: number;
        defense: number;
        pf: number;
        pa: number;
    };
    pg: {
        wins: number;
        losses: number;
        offense: number;
        defense: number;
        pf: number;
        pa: number;
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
        wins: RankedStat;
        losses: RankedStat;
        totalOffense: RankedStat;
        totalDefense: RankedStat;
        pf: RankedStat;
        pa: RankedStat;
    };
    ExternalStats: {
        PollIntertia: RankedStat;
        ScheduleStrength: RankedStat;
    };
};
export type RankedStat = {
    Rank: number;
    val: number;
    pgVal: number;
};
export type Week = {
    week: number;
    games: number[];
};
