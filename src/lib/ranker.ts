import {
  ComputedSeason,
  RankedStat,
  RankedTeam,
  RankerGame,
  RankerStat,
  RankerTeam,
  RankerWeights,
  SeasonMap,
  WeekTeamsMap,
} from "./ranker-types";

export function rank(
  teams: RankerTeam[],
  games: RankerGame[],
  weights: RankerWeights
): ComputedSeason {
  const res = compileSeason(teams, games);
  sqaushStats(res.sznMap);
  calcStatRankings(res.sznMap);
  calcExternalStat(res.sznMap, weights);
  assignFinalRanks(res.sznMap, weights);
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
    throw Error(`Team ${tmId} not found in game ${gm.Id}`);
  }

  //points
  tm.Stats.pf.val = curr.points;
  tm.Stats.pa.val = opp.points;

  //yards
  tm.Stats.totalOffense.val = curr.totalYards;
  tm.Stats.totalDefense.val = opp.totalYards;

  //W/L
  if (curr.points > opp.points) {
    tm.Stats.wins.val = 1;
  } else {
    tm.Stats.losses.val = 1;
  }

  //add game to schedule
  tm.Schedule.push({
    Id: gm.Id,
    OppId: opp.id,
    Week: gm.Week,
  });
}

function createRankableTeam(rt: RankerTeam): RankedTeam {
  const createNewRankedStat = (): RankedStat => {
    return {
      Rank: 0,
      val: 0,
      pgVal: 0,
    };
  };

  return {
    Id: rt.id,
    Week: 0,
    Rank: 0,
    Weight: 0,
    Schedule: [],
    Stats: {
      wins: createNewRankedStat(),
      losses: createNewRankedStat(),
      totalOffense: createNewRankedStat(),
      totalDefense: createNewRankedStat(),
      pf: createNewRankedStat(),
      pa: createNewRankedStat(),
    },
    ExternalStats: {
      PollIntertia: createNewRankedStat(),
      ScheduleStrength: createNewRankedStat(),
    },
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

          tm.Stats.wins.val += prevWkTm.Stats.wins.val;
          tm.Stats.losses.val += prevWkTm.Stats.losses.val;
          tm.Stats.totalOffense.val += prevWkTm.Stats.totalOffense.val;
          tm.Stats.totalDefense.val += prevWkTm.Stats.totalDefense.val;
          tm.Stats.pf.val += prevWkTm.Stats.pf.val;
          tm.Stats.pa.val += prevWkTm.Stats.pa.val;
        }
        //Assign per game stats
        const gmsPlayed = tm.Schedule.length || 1; //fallback if 0 games have been played
        tm.Stats.wins.pgVal = tm.Stats.wins.val / gmsPlayed;
        tm.Stats.losses.pgVal = tm.Stats.losses.val / gmsPlayed;
        tm.Stats.totalOffense.pgVal = tm.Stats.totalOffense.val / gmsPlayed;
        tm.Stats.totalDefense.pgVal = tm.Stats.totalDefense.val / gmsPlayed;
        tm.Stats.pf.pgVal = tm.Stats.pf.val / gmsPlayed;
        tm.Stats.pa.pgVal = tm.Stats.pa.val / gmsPlayed;
      });
      prev = wk;
    });
}

type RankerParams = {
  sortedTms: RankedTeam[];
  accessor: (tm: RankedTeam) => number;
  assigner: (tm: RankedTeam, rank: number) => void;
};

function makeStatRanker(
  wkArr: RankedTeam[],
  field: keyof RankedTeam["Stats"],
  desc?: boolean
): RankerParams {
  //Could pass in param that decided betwween total anbd pg
  const val: keyof RankedStat = "val";
  return {
    sortedTms: Array.from(wkArr).sort((a, b) => {
      return desc
        ? b.Stats[field][val] - a.Stats[field][val]
        : a.Stats[field][val] - b.Stats[field][val];
    }),
    accessor: (tm: RankedTeam) => tm.Stats[field][val],
    assigner: (tm: RankedTeam, rank: number) => (tm.Stats[field].Rank = rank),
  };
}

function calcStatRankings(sznMap: SeasonMap) {
  Array.from(sznMap.values()).forEach((wkMap) => {
    const wkArr = Array.from(wkMap.values());

    const rankingConfig: RankerParams[] = [
      makeStatRanker(wkArr, "wins", true),
      makeStatRanker(wkArr, "totalOffense", true),
      makeStatRanker(wkArr, "pf", true),
      makeStatRanker(wkArr, "losses"),
      makeStatRanker(wkArr, "totalDefense"),
      makeStatRanker(wkArr, "pa"),
    ];

    rankingConfig.forEach((rc) => rankStat(rc));
  });
}

function calcExternalStat(sznMap: SeasonMap, weights: RankerWeights) {
  //Only needs to be donw for week 0, but we the whole season instead
  assignFinalRanks(sznMap, weights);

  let last = -1;
  Array.from(sznMap.entries()).forEach(([wk, wkMap], i) => {
    if (i !== 0) {
      Array.from(wkMap).forEach(([id, tm]) => {
        calcPollInertia(tm, sznMap.get(last)?.get(id)!);
        calcStrengthOfSchedule(tm, sznMap.get(last)!);
      });
    }
    last = wk;

    const valAccessor: keyof RankedStat = "pgVal";

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
  currTm.ExternalStats.PollIntertia.val = prevTm.Rank;
  //Probably doesnt matter
  currTm.ExternalStats.PollIntertia.pgVal =
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

  currTm.ExternalStats.ScheduleStrength.val = oppWt;
  currTm.ExternalStats.ScheduleStrength.pgVal =
    oppWt / (currTm.Schedule.length || 1);
}

function assignFinalRanks(sznMap: SeasonMap, weights: RankerWeights) {
  compileTeamWeights(sznMap, weights);

  //rank teams on weights
  Array.from(sznMap.values()).forEach((wkMap) => {
    rankStat({
      sortedTms: Array.from(wkMap.values()).sort((a, b) => a.Weight - b.Weight),
      accessor: (tm: RankedTeam) => tm.Weight,
      assigner: (tm: RankedTeam, rank: number) => (tm.Rank = rank),
    });
  });
}

function compileTeamWeights(sznMap: SeasonMap, weights: RankerWeights) {
  //sum weights
  Array.from(sznMap.values()).forEach((wkMap) => {
    Array.from(wkMap.values()).forEach((tm) => sumWeights(tm, weights));
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
function sumWeights(tm: RankedTeam, weights: RankerWeights) {
  let wt = 0;
  //wins
  wt += tm.Stats.wins.val * weights.total.wins;
  wt += tm.Stats.wins.pgVal * weights.pg.wins;

  //losses
  wt += tm.Stats.losses.val * weights.total.losses;
  wt += tm.Stats.losses.pgVal * weights.pg.losses;

  //offense
  wt += tm.Stats.totalOffense.val * weights.total.offense;
  wt += tm.Stats.totalOffense.pgVal * weights.pg.offense;

  //defense
  wt += tm.Stats.totalDefense.val * weights.total.defense;
  wt += tm.Stats.totalDefense.pgVal * weights.pg.defense;

  //pf
  wt += tm.Stats.pf.val * weights.total.pf;
  wt += tm.Stats.pf.pgVal * weights.pg.pf;

  //pa
  wt += tm.Stats.pa.val * weights.total.pa;
  wt += tm.Stats.pa.pgVal * weights.pg.pa;

  //pi
  wt += tm.ExternalStats.PollIntertia.val * weights.extra.pi;

  //ss
  wt += tm.ExternalStats.ScheduleStrength.pgVal * weights.extra.ss;

  // Object.entries(tm.Stats).forEach((stat) => (wt += stat[1].Rank));
  tm.Weight = wt;
}
