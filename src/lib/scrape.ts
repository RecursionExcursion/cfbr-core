import { ESPNCfbGame, ESPNCfbTeam, ESPNSeason } from "./scraper-types";

type CollectedGame = {
  gameId: string;
  oppId: string;
};

type SeasonOccurrence = {
  gamesPlayed: number;
  schedule: CollectedGame[];
};

type SeasonSchedules = Map<string, SeasonOccurrence>;
type SeasonGames = Map<string, ESPNCfbGame>;
type SeasonTeams = Map<string, ESPNCfbTeam>;

type Season = {
  year: number;
  schedules: SeasonSchedules;
  Games: SeasonGames;
  Teams: SeasonTeams;
};

const espnBase =
  "https://site.api.espn.com/apis/site/v2/sports/football/college-football";
const espnGroups = "/groups";
const espnSeason = "/scoreboard"; //dates=2024 or dates=20240921
const espnTeams = "/teams"; //</teamid>
const espnGame = "/summary"; //?event=<eventId>

export async function scrape(year: number) {
  const szn = await getZeroDay(year);
  if (!szn) return;
  const dateRanges = getSeasonDateRanges(szn);
  if (!dateRanges) return;
  const foo = collectSeasonDates(dateRanges.startDate, dateRanges.endDate);
}

function routeBuilders() {
  return {
    season(date: string) {
      return `${espnBase}${espnSeason}?dates=${date}`;
    },
  };
}

export function collectSeasonDates(startDate: Date, endDate: Date) {
  const tc: SeasonSchedules = new Map();
  let currDate = startDate;
  const ms = endDate.getTime() - startDate.getTime();
  const days = Math.round(ms / 86_400_000);

  console.log({ startDate, endDate });
  console.log(ms);
  console.log(days);

  const dates: string[] = [];

  for (let i = 1; currDate <= endDate; i++) {
    const y = String(currDate.getFullYear());
    const m = String(currDate.getMonth()).padStart(2, "0");
    const d = String(currDate.getDate()).padStart(2, "0");
    const formattedDate = y + m + d;
    console.log({ formattedDate });

    dates.push(formattedDate);
    currDate.setDate(currDate.getDate() + 1);
  }

  console.log({ dates });
}

export async function getZeroDay(
  year: number
): Promise<ESPNSeason | undefined> {
  const query = `${year}0801`;
  const req = routeBuilders().season(query);
  const res = await fetch(req);
  if (!res.ok) return;
  const pl = await res.json();
  return pl as ESPNSeason;
}

export function getSeasonDateRanges(szn: ESPNSeason) {
  if (szn.leagues.length === 0) {
    return undefined;
  }
  const { startDate, endDate } = szn.leagues[0].season;
  return {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  };
}
