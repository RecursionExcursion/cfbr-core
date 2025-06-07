import { rank } from "./lib/ranker";
export function rankSeason(teams, games) {
    return rank(teams, games);
}
