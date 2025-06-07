import { rank } from "./lib/ranker";
import { RankerGame, RankerTeam } from "./lib/ranker-types";

export function rankSeason(teams: RankerTeam[], games: RankerGame[]) {
  return rank(teams, games);
}
