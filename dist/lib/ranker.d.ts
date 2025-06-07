import { RankerGame, RankerTeam, SeasonMap, WeekTeamsMap } from "./ranker-types";
export declare function rank(teams: RankerTeam[], games: RankerGame[]): void;
export declare function compileSeason(teams: RankerTeam[], games: RankerGame[]): {
    teamMap: Map<number, RankerTeam>;
    gameMap: Map<number, RankerGame>;
    sznMap: Map<number, WeekTeamsMap>;
};
export declare function sqaushStats(sznMap: SeasonMap): void;
export declare function calcStatRankings(sznMap: SeasonMap): void;
