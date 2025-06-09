import { error } from "console";
import {
  ComputedSeason,
  RankedStat,
  RankedTeam,
  RankerGame,
  RankerStat,
  RankerTeam,
  SeasonMap,
  WeekTeamsMap,
} from "./ranker-types";

export function rank(teams: RankerTeam[], games: RankerGame[]): ComputedSeason {
  const res = compileSeason(teams, games);
  sqaushStats(res.sznMap);
  calcStatRankings(res.sznMap);
  calcExternalStat(res.sznMap);
  assignFinalRanks(res.sznMap);
  return res;
}

function compileSeason(teams: RankerTeam[], games: RankerGame[]) {
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

function sqaushStats(sznMap: SeasonMap) {
  let prev = -1;
  Array.from(sznMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([wk, tmMap]) => {
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
      prev = wk;
    });
}

type RankerParams = {
  sortedTms: RankedTeam[];
  // sortFn: (i: number, j: number) => boolean;
  accessor: (tm: RankedTeam) => number;
  assigner: (tm: RankedTeam, rank: number) => void;
};

function makeStatRanker(
  wkArr: RankedTeam[],
  field: keyof RankedTeam["Stats"],
  desc?: boolean
): RankerParams {
  //Could pass in param that decided betwween total anbd pg
  const val: keyof RankedStat = "PgVal";
  return {
    sortedTms: wkArr.sort((a, b) => {
      return desc
        ? b.Stats[field].Val - a.Stats[field][val]
        : a.Stats[field].Val - b.Stats[field][val];
    }),
    accessor: (tm: RankedTeam) => tm.Stats[field][val],
    assigner: (tm: RankedTeam, rank: number) => (tm.Stats[field].Rank = rank),
  };
}

function calcStatRankings(sznMap: SeasonMap) {
  Array.from(sznMap.values()).forEach((wkMap) => {
    const wkArr = Array.from(wkMap.values());

    const rankingConfig: RankerParams[] = [
      makeStatRanker(wkArr, "Wins", true),
      makeStatRanker(wkArr, "TotalOffense", true),
      makeStatRanker(wkArr, "PF", true),
      makeStatRanker(wkArr, "Losses"),
      makeStatRanker(wkArr, "TotalDefense"),
      makeStatRanker(wkArr, "PA"),
    ];

    rankingConfig.forEach((rc) => rankStat(rc));
  });
}

function calcExternalStat(sznMap: SeasonMap) {
  //Only needs to be donw for week 0, but we the whole season instead
  assignFinalRanks(sznMap);

  let last = -1;
  Array.from(sznMap.entries()).forEach(([wk, wkMap], i) => {
    if (i !== 0) {
      Array.from(wkMap).forEach(([id, tm]) => {
        calcPollInertia(tm, sznMap.get(last)?.get(id)!);
        calcStrengthOfSchedule(tm, sznMap.get(last)!);
      });
    }
    last = wk;

    const valAccessor: keyof RankedStat = "PgVal";

    rankStat({
      sortedTms: Array.from(wkMap.values()).sort(
        (a, b) =>
          a.ExternalStats.ScheduleStrength[valAccessor] -
          b.ExternalStats.ScheduleStrength[valAccessor]
      ),
      accessor: (tm: RankedTeam) =>
        tm.ExternalStats.ScheduleStrength[valAccessor],
      assigner: (tm: RankedTeam, rank: number) =>
        (tm.ExternalStats.ScheduleStrength.Rank = rank),
    });
  });
}

function calcPollInertia(currTm: RankedTeam, prevTm: RankedTeam) {
  currTm.ExternalStats.PollIntertia.Rank = prevTm.Rank;
  currTm.ExternalStats.PollIntertia.Val = prevTm.Rank;
  //Probably doesnt matter
  currTm.ExternalStats.PollIntertia.PgVal =
    prevTm.Rank / (currTm.Schedule.length || 1);
}

function calcStrengthOfSchedule(currTm: RankedTeam, prevWeek: WeekTeamsMap) {
  let oppWt = 0;
  currTm.Schedule.forEach((sg) => {
    const opp = prevWeek.get(sg.OppId);
    if (opp) {
      oppWt += opp.Rank;
    } else {
      oppWt += prevWeek.size + 1;
    }
  });

  currTm.ExternalStats.ScheduleStrength.Val = oppWt;
  currTm.ExternalStats.ScheduleStrength.PgVal =
    oppWt / (currTm.Schedule.length || 1);
}

function assignFinalRanks(sznMap: SeasonMap) {
  compileTeamWeights(sznMap);

  //rank teams on weights
  Array.from(sznMap.values()).forEach((wkMap) => {
    rankStat({
      sortedTms: Array.from(wkMap.values()).sort((a, b) => a.Weight - b.Weight),
      accessor: (tm: RankedTeam) => tm.Weight,
      assigner: (tm: RankedTeam, rank: number) => (tm.Rank = rank),
    });
  });
}

function compileTeamWeights(sznMap: SeasonMap) {
  //sum weights
  Array.from(sznMap.values()).forEach((wkMap) => {
    Array.from(wkMap.values()).forEach((tm) => sumWeights(tm));
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
