import { RankerGame, RankerTeam, WeekTeamsMap } from "./ranker-types";
export declare function rank(teams: RankerTeam[], games: RankerGame[]): {
    teamMap: Map<number, RankerTeam>;
    gameMap: Map<number, RankerGame>;
    sznMap: Map<number, WeekTeamsMap>;
};
