import { ComputedSeason, RankerGame, RankerTeam, RankerWeights } from "./ranker-types";
export declare function rank(params: {
    teams: RankerTeam[];
    games: RankerGame[];
    weights: RankerWeights;
}): ComputedSeason;
