import { error } from "console";
export function rank(teams, games) {
    const res = compileSeason(teams, games);
    sqaushStats(res.sznMap);
}
export function compileSeason(teams, games) {
    const teamMap = new Map();
    teams.forEach((t) => teamMap.set(t.id, t));
    const gameMap = new Map();
    const sznTypeMap = new Map();
    games.forEach((g) => {
        gameMap.set(g.Id, g);
        const sznType = g.Type;
        let sznMap = sznTypeMap.get(sznType);
        if (!sznMap) {
            sznMap = new Map();
            sznTypeMap.set(sznType, sznMap);
        }
        const wk = g.Week;
        let wkMap = sznMap.get(wk);
        if (!wkMap) {
            wkMap = new Map();
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
    const sznMap = new Map();
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
function updateWeightedTeam(tm, gm) {
    const tmId = tm.Id;
    let curr = {};
    let opp = {};
    if (gm.Stats.home.id == tmId) {
        curr = gm.Stats.home;
        opp = gm.Stats.away;
    }
    else if (gm.Stats.away) {
        curr = gm.Stats.away;
        opp = gm.Stats.home;
    }
    else {
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
    }
    else {
        tm.Stats.Losses.Val = 1;
    }
    //add game to schedule
    tm.Schedule.push({
        Id: gm.Id,
        OppId: opp.id,
        Week: gm.Week,
    });
}
function createRankableTeam(rt) {
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
function createNewRankedStat() {
    return {
        Rank: 0,
        Val: 0,
        PgVal: 0,
    };
}
export function sqaushStats(sznMap) {
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
export function calcStatRankings(sznMap) {
    Array.from(sznMap.values()).forEach((wkMap) => {
        const wkArr = Array.from(wkMap.values());
        const rankingConfig = [
            {
                sortedTms: wkArr.sort((a, b) => b.Stats.Wins.Val - a.Stats.Wins.Val),
                accessor: (tm) => tm.Stats.Wins.Val,
                assigner: (tm, rank) => (tm.Stats.Wins.Rank = rank),
            },
            {
                sortedTms: wkArr.sort((a, b) => b.Stats.TotalOffense.Val - a.Stats.TotalOffense.Val),
                accessor: (tm) => tm.Stats.TotalOffense.Val,
                assigner: (tm, rank) => (tm.Stats.TotalOffense.Rank = rank),
            },
            {
                sortedTms: wkArr.sort((a, b) => b.Stats.PF.Val - a.Stats.PF.Val),
                accessor: (tm) => tm.Stats.PF.Val,
                assigner: (tm, rank) => (tm.Stats.PF.Rank = rank),
            },
            //stats below are sorted in ascending order
            {
                sortedTms: wkArr.sort((a, b) => a.Stats.Losses.Val - b.Stats.Losses.Val),
                accessor: (tm) => tm.Stats.Losses.Val,
                assigner: (tm, rank) => (tm.Stats.Losses.Rank = rank),
            },
            {
                sortedTms: wkArr.sort((a, b) => a.Stats.TotalDefense.Val - b.Stats.TotalDefense.Val),
                accessor: (tm) => tm.Stats.TotalDefense.Val,
                assigner: (tm, rank) => (tm.Stats.TotalDefense.Rank = rank),
            },
            {
                sortedTms: wkArr.sort((a, b) => a.Stats.PA.Val - b.Stats.PA.Val),
                accessor: (tm) => tm.Stats.PA.Val,
                assigner: (tm, rank) => (tm.Stats.PA.Rank = rank),
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
                sortedTms: Array.from(wkMap.values()).sort((a, b) => a.Weight - b.Weight),
                accessor: (tm) => tm.Weight,
                assigner: (tm, rank) => (tm.Rank = rank),
            });
        });
    });
}
function rankStat(params) {
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
function sumWeights(tm) {
    let wt = 0;
    Object.entries(tm.Stats).forEach((stat) => (wt += stat[1].Rank));
    tm.Weight = wt;
}
