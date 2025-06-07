import { RankerGame, RankerTeam } from "./lib/ranker-types";
export declare function rankSeason(teams: RankerTeam[], games: RankerGame[]): {
    teamMap: Map<number, RankerTeam>;
    gameMap: Map<number, RankerGame>;
    sznMap: Map<number, import("./lib/ranker-types").WeekTeamsMap>;
};
