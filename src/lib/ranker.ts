import { error } from "console";
import {
  RankedStat,
  RankedTeam,
  RankerGame,
  RankerStat,
  RankerTeam,
  SeasonMap,
  WeekTeamsMap,
} from "./ranker-types";

export function rank(teams: RankerTeam[], games: RankerGame[]) {
  const res = compileSeason(teams, games);
  sqaushStats(res.sznMap);
}

export function compileSeason(teams: RankerTeam[], games: RankerGame[]) {
  const teamMap = new Map<number, RankerTeam>();
  teams.forEach((t) => teamMap.set(t.id, t));

  const gameMap = new Map<number, RankerGame>();
  const sznTypeMap = new Map<number, SeasonMap>();

  games.forEach((g) => {
    gameMap.set(g.Id, g);

    const sznType = g.Type;
    let sznMap = sznTypeMap.get(sznType);
    if (!sznMap) {
      sznMap = new Map<number, WeekTeamsMap>();
      sznTypeMap.set(sznType, sznMap);
    }

    const wk = g.Week;

    let wkMap = sznMap.get(wk);
    if (!wkMap) {
      wkMap = new Map<number, RankedTeam>();
      Array.from(teamMap.entries()).forEach(([id, t]) => {
        const rankable = createRankableTeam(t);
        rankable.Week = wk;
        wkMap?.set(id, rankable);
      });
    }
    sznMap.set(wk, wkMap);

    const hmTm = wkMap.get(g.Stats.home.id);
    if (hmTm) {
      updateWeightedTeam(hmTm, g);
    }

    const awTm = wkMap.get(g.Stats.away.id);
    if (awTm) {
      updateWeightedTeam(awTm, g);
    }
  });

  //flatten the seasonTypeMap -> SeasonMap
  const sznMap = new Map<number, WeekTeamsMap>();

  let i = 0;

  Array.from(sznTypeMap.keys())
    .sort((a, b) => a - b)
    .forEach((st) => {
      const currSzn = sznTypeMap.get(st);
      if (currSzn) {
        Array.from(currSzn.entries())
          .sort((a, b) => a[0] - b[0])
          .forEach((wk) => {
            sznMap.set(i++, wk[1]);
          });
      }
    });

  return {
    teamMap,
    gameMap,
    sznMap,
  };
}

function updateWeightedTeam(tm: RankedTeam, gm: RankerGame) {
  const tmId = tm.Id;

  let curr = {} as RankerStat;
  let opp = {} as RankerStat;

  if (gm.Stats.home.id == tmId) {
    curr = gm.Stats.home;
    opp = gm.Stats.away;
  } else if (gm.Stats.away) {
    curr = gm.Stats.away;
    opp = gm.Stats.home;
  } else {
    throw error(`Team ${tmId} not found in game ${gm.Id}`);
  }

  //points
  tm.Stats.PF.Val = curr.points;
  tm.Stats.PA.Val = opp.points;

  //yards
  tm.Stats.TotalOffense.Val = curr.totalYards;
  tm.Stats.TotalDefense.Val = opp.totalYards;

  //W/L
  if (curr.points > opp.points) {
    tm.Stats.Wins.Val = 1;
  } else {
    tm.Stats.Losses.Val = 1;
  }

  //add game to schedule
  tm.Schedule.push({
    Id: gm.Id,
    OppId: opp.id,
    Week: gm.Week,
  });
}

function createRankableTeam(rt: RankerTeam): RankedTeam {
  return {
    Id: rt.id,
    Week: -1,
    Rank: -1,
    Weight: -1,
    Schedule: [],
    Stats: {
      Wins: createNewRankedStat(),
      Losses: createNewRankedStat(),
      TotalOffense: createNewRankedStat(),
      TotalDefense: createNewRankedStat(),
      PF: createNewRankedStat(),
      PA: createNewRankedStat(),
    },
    ExternalStats: {
      PollIntertia: createNewRankedStat(),
      ScheduleStrength: createNewRankedStat(),
    },
  };
}

function createNewRankedStat(): RankedStat {
  return {
    Rank: 0,
    Val: 0,
    PgVal: 0,
  };
}

export function sqaushStats(sznMap: SeasonMap) {
  let prev = -1;
  Array.from(sznMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([wk, tmMap]) => {
      // if (prev != -1) {
      const prevWk = sznMap.get(prev);

      Array.from(tmMap.entries()).forEach(([id, tm]) => {
        const prevWkTm = prevWk?.get(id);

        //Will be null only on week 1
        if (prevWkTm) {
          tm.Schedule = [...tm.Schedule, ...prevWkTm.Schedule];

          tm.Stats.Wins.Val += prevWkTm.Stats.Wins.Val;
          tm.Stats.Losses.Val += prevWkTm.Stats.Losses.Val;
          tm.Stats.TotalOffense.Val += prevWkTm.Stats.TotalOffense.Val;
          tm.Stats.TotalDefense.Val += prevWkTm.Stats.TotalDefense.Val;
          tm.Stats.PF.Val += prevWkTm.Stats.PF.Val;
          tm.Stats.PA.Val += prevWkTm.Stats.PA.Val;
        }
        //Assign per game stats
        const gmsPlayed = tm.Schedule.length || 1; //fallback if 0 games have been played
        tm.Stats.Wins.PgVal = tm.Stats.Wins.Val / gmsPlayed;
        tm.Stats.Losses.PgVal = tm.Stats.Losses.Val / gmsPlayed;
        tm.Stats.TotalOffense.PgVal = tm.Stats.TotalOffense.Val / gmsPlayed;
        tm.Stats.TotalDefense.PgVal = tm.Stats.TotalDefense.Val / gmsPlayed;
        tm.Stats.PF.PgVal = tm.Stats.PF.Val / gmsPlayed;
        tm.Stats.PA.PgVal = tm.Stats.PA.Val / gmsPlayed;
      });
      // }
      prev = wk;
    });
}

type RankerParams = {
  sortedTms: RankedTeam[];
  // sortFn: (i: number, j: number) => boolean;
  accessor: (tm: RankedTeam) => number;
  assigner: (tm: RankedTeam, rank: number) => void;
};

export function calcStatRankings(sznMap: SeasonMap) {
  Array.from(sznMap.values()).forEach((wkMap) => {
    const wkArr = Array.from(wkMap.values());

    const rankingConfig: RankerParams[] = [
      {
        sortedTms: wkArr.sort((a, b) => b.Stats.Wins.Val - a.Stats.Wins.Val),
        accessor: (tm: RankedTeam) => tm.Stats.Wins.Val,
        assigner: (tm: RankedTeam, rank: number) => (tm.Stats.Wins.Rank = rank),
      },
      {
        sortedTms: wkArr.sort(
          (a, b) => b.Stats.TotalOffense.Val - a.Stats.TotalOffense.Val
        ),
        accessor: (tm: RankedTeam) => tm.Stats.TotalOffense.Val,
        assigner: (tm: RankedTeam, rank: number) =>
          (tm.Stats.TotalOffense.Rank = rank),
      },
      {
        sortedTms: wkArr.sort((a, b) => b.Stats.PF.Val - a.Stats.PF.Val),
        accessor: (tm: RankedTeam) => tm.Stats.PF.Val,
        assigner: (tm: RankedTeam, rank: number) => (tm.Stats.PF.Rank = rank),
      },
      //stats below are sorted in ascending order
      {
        sortedTms: wkArr.sort(
          (a, b) => a.Stats.Losses.Val - b.Stats.Losses.Val
        ),
        accessor: (tm: RankedTeam) => tm.Stats.Losses.Val,
        assigner: (tm: RankedTeam, rank: number) =>
          (tm.Stats.Losses.Rank = rank),
      },
      {
        sortedTms: wkArr.sort(
          (a, b) => a.Stats.TotalDefense.Val - b.Stats.TotalDefense.Val
        ),
        accessor: (tm: RankedTeam) => tm.Stats.TotalDefense.Val,
        assigner: (tm: RankedTeam, rank: number) =>
          (tm.Stats.TotalDefense.Rank = rank),
      },
      {
        sortedTms: wkArr.sort((a, b) => a.Stats.PA.Val - b.Stats.PA.Val),
        accessor: (tm: RankedTeam) => tm.Stats.PA.Val,
        assigner: (tm: RankedTeam, rank: number) => (tm.Stats.PA.Rank = rank),
      },
    ];

    rankingConfig.forEach((rc) => rankStat(rc));

    //sum weights
    Array.from(sznMap.values()).forEach((wkMap) => {
      Array.from(wkMap.values()).forEach((tm) => sumWeights(tm));
    });

    //rank teams on weights
    Array.from(sznMap.values()).forEach((wkMap) => {
      rankStat({
        sortedTms: Array.from(wkMap.values()).sort(
          (a, b) => a.Weight - b.Weight
        ),
        accessor: (tm: RankedTeam) => tm.Weight,
        assigner: (tm: RankedTeam, rank: number) => (tm.Rank = rank),
      });
    });
  });
}

function rankStat(params: RankerParams) {
  let rankedIndex = 1;
  let currVal = 0;
  params.sortedTms.forEach((t, i) => {
    const val = params.accessor(t);
    if (i === 0) {
      currVal = val;
    }

    if (val !== currVal) {
      rankedIndex = i + 1;
      currVal = val;
    }
    params.assigner(t, rankedIndex);
  });
}

//TODO inject weights here in this fn
function sumWeights(tm: RankedTeam) {
  let wt = 0;
  Object.entries(tm.Stats).forEach((stat) => (wt += stat[1].Rank));
  tm.Weight = wt;
}
