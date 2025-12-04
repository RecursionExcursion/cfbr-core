export function rank(params) {
    const { teams, games, weights } = params;
    const res = compileSeason(teams, games);
    sqaushStats(res.sznMap);
    /* at this point all the season stats are accumulated */
    calcStatRankings(res.sznMap);
    calcExternalStat(res.sznMap, weights);
    assignFinalRanks(res.sznMap, weights);
    return res;
}
function compileSeason(teams, games) {
    const teamMap = new Map();
    teams.forEach((t) => teamMap.set(t.id, t));
    const gameMap = new Map();
    const sznTypeMap = new Map();
    games.forEach((g) => {
        gameMap.set(g.id, g);
        const sznType = g.type;
        let sznMap = sznTypeMap.get(sznType);
        if (!sznMap) {
            sznMap = new Map();
            sznTypeMap.set(sznType, sznMap);
        }
        const wk = g.week;
        let wkMap = sznMap.get(wk);
        if (!wkMap) {
            wkMap = new Map();
            Array.from(teamMap.entries()).forEach(([id, t]) => {
                const rankable = createRankableTeam(t);
                rankable.week = wk;
                wkMap?.set(id, rankable);
            });
        }
        sznMap.set(wk, wkMap);
        const hmTm = wkMap.get(g.stats.home.id);
        if (hmTm) {
            updateWeightedTeam(hmTm, g);
        }
        const awTm = wkMap.get(g.stats.away.id);
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
    const tmId = tm.id;
    let curr = {};
    let opp = {};
    if (gm.stats.home.id == tmId) {
        curr = gm.stats.home;
        opp = gm.stats.away;
    }
    else if (gm.stats.away) {
        curr = gm.stats.away;
        opp = gm.stats.home;
    }
    else {
        throw Error(`Team ${tmId} not found in game ${gm.id}`);
    }
    //points
    tm.stats.pf.total.val = curr.points;
    tm.stats.pa.total.val = opp.points;
    //yards
    tm.stats.offense.total.val = curr.totalYards;
    tm.stats.defense.total.val = opp.totalYards;
    //W/L
    if (curr.points > opp.points) {
        tm.stats.wins.total.val = 1;
    }
    else {
        tm.stats.losses.total.val = 1;
    }
    //add game to schedule
    tm.schedule.push({
        id: gm.id,
        oppId: opp.id,
        week: gm.week,
    });
}
function createRankableTeam(rt) {
    const createStat = () => {
        return {
            total: {
                rank: 0,
                val: 0,
            },
            pg: {
                rank: 0,
                val: 0,
            },
        };
    };
    return {
        id: rt.id,
        week: 0,
        rank: 0,
        weight: 0,
        schedule: [],
        stats: {
            wins: createStat(),
            losses: createStat(),
            offense: createStat(),
            defense: createStat(),
            pf: createStat(),
            pa: createStat(),
        },
        externalStats: {
            pi: createStat(),
            ss: createStat(),
        },
    };
}
function sqaushStats(sznMap) {
    let prev = -1;
    Array.from(sznMap.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([wk, tmMap]) => {
        const prevWk = sznMap.get(prev);
        Array.from(tmMap.entries()).forEach(([id, tm]) => {
            const prevWkTm = prevWk?.get(id);
            //Will be null only on week 1
            if (prevWkTm) {
                tm.schedule = [...tm.schedule, ...prevWkTm.schedule];
                tm.stats.wins.total.val += prevWkTm.stats.wins.total.val;
                tm.stats.losses.total.val += prevWkTm.stats.losses.total.val;
                tm.stats.offense.total.val += prevWkTm.stats.offense.total.val;
                tm.stats.defense.total.val += prevWkTm.stats.defense.total.val;
                tm.stats.pf.total.val += prevWkTm.stats.pf.total.val;
                tm.stats.pa.total.val += prevWkTm.stats.pa.total.val;
            }
            //Assign per game stats
            const gmsPlayed = tm.schedule.length || 1; //fallback if 0 games have been played
            tm.stats.wins.pg.val = tm.stats.wins.total.val / gmsPlayed;
            tm.stats.losses.pg.val = tm.stats.losses.total.val / gmsPlayed;
            tm.stats.offense.pg.val = tm.stats.offense.total.val / gmsPlayed;
            tm.stats.defense.pg.val = tm.stats.defense.total.val / gmsPlayed;
            tm.stats.pf.pg.val = tm.stats.pf.total.val / gmsPlayed;
            tm.stats.pa.pg.val = tm.stats.pa.total.val / gmsPlayed;
        });
        prev = wk;
    });
}
function makeStatRanker(wkArr, field, type, desc) {
    //Could pass in param that decided betwween total anbd pg
    return {
        sortedTms: wkArr.sort((a, b) => {
            return desc
                ? b.stats[field][type].val - a.stats[field][type].val
                : a.stats[field][type].val - b.stats[field][type].val;
        }),
        accessor: (tm) => {
            return tm.stats[field][type].val;
        },
        assigner: (tm, rank) => {
            tm.stats[field][type].rank = rank;
        },
    };
}
function calcStatRankings(sznMap) {
    Array.from(sznMap.values()).forEach((wkMap) => {
        const wkArr = Array.from(wkMap.values());
        //TODO include pg rankings, could be as simple as doing both in the make stat ranker
        const rankingConfig = [
            makeStatRanker([...wkArr], "wins", "total", true),
            makeStatRanker([...wkArr], "offense", "total", true),
            makeStatRanker([...wkArr], "pf", "total", true),
            makeStatRanker([...wkArr], "losses", "total"),
            makeStatRanker([...wkArr], "defense", "total"),
            makeStatRanker([...wkArr], "pa", "total"),
            makeStatRanker([...wkArr], "wins", "pg", true),
            makeStatRanker([...wkArr], "offense", "pg", true),
            makeStatRanker([...wkArr], "pf", "pg", true),
            makeStatRanker([...wkArr], "losses", "pg"),
            makeStatRanker([...wkArr], "defense", "pg"),
            makeStatRanker([...wkArr], "pa", "pg"),
        ];
        rankingConfig.forEach((rc) => rankStat(rc));
    });
}
function calcExternalStat(sznMap, weights) {
    //Only needs to be donw for week 0, but we the whole season instead
    assignFinalRanks(sznMap, weights);
    let last = -1;
    Array.from(sznMap.entries()).forEach(([wk, wkMap], i) => {
        if (i !== 0) {
            Array.from(wkMap).forEach(([id, tm]) => {
                calcPollInertia(tm, sznMap.get(last)?.get(id));
                calcStrengthOfSchedule(tm, sznMap.get(last));
            });
        }
        last = wk;
        // const valAccessor: keyof RankedStat = "pgVal";
        //Currently rated pg
        rankStat({
            sortedTms: Array.from(wkMap.values()).sort((a, b) => a.externalStats.ss.pg.val - b.externalStats.ss.pg.val),
            accessor: (tm) => tm.externalStats.ss.pg.val,
            assigner: (tm, rank) => (tm.externalStats.ss.pg.rank = rank),
        });
    });
}
function calcPollInertia(currTm, prevTm) {
    currTm.externalStats.pi.total.rank = prevTm.rank;
    currTm.externalStats.pi.total.val = prevTm.rank;
    currTm.externalStats.pi.pg.val = prevTm.rank / (currTm.schedule.length || 1);
}
function calcStrengthOfSchedule(currTm, prevWeek) {
    let totalOppWt = 0;
    currTm.schedule.forEach((sg) => {
        const opp = prevWeek.get(sg.oppId);
        if (opp) {
            totalOppWt += opp.rank;
        }
        else {
            totalOppWt += prevWeek.size + 1;
        }
    });
    currTm.externalStats.ss.total.val = totalOppWt;
    currTm.externalStats.ss.pg.val = totalOppWt / (currTm.schedule.length || 1);
}
function assignFinalRanks(sznMap, weights) {
    compileTeamWeights(sznMap, weights);
    //rank teams on weights
    Array.from(sznMap.values()).forEach((wkMap) => {
        rankStat({
            sortedTms: Array.from(wkMap.values()).sort((a, b) => a.weight - b.weight),
            accessor: (tm) => tm.weight,
            assigner: (tm, rank) => (tm.rank = rank),
        });
    });
}
function compileTeamWeights(sznMap, weights) {
    //sum weights
    Array.from(sznMap.values()).forEach((wkMap) => {
        Array.from(wkMap.values()).forEach((tm) => sumWeights(tm, weights));
    });
}
function rankStat(params) {
    let rankedIndex = 1;
    let currVal = 0;
    params.sortedTms.forEach((team, index) => {
        const val = params.accessor(team);
        if (index === 0) {
            currVal = val;
        }
        if (val !== currVal) {
            rankedIndex = index + 1;
            currVal = val;
        }
        params.assigner(team, rankedIndex);
    });
}
function sumWeights(tm, weights) {
    let wt = 0;
    function calcWeight(s1, s2) {
        return s1.total.rank * s2.totalWeight + s1.pg.rank * s2.pgWeight;
    }
    wt += calcWeight(tm.stats.wins, weights.stats.wins);
    wt += calcWeight(tm.stats.losses, weights.stats.losses);
    wt += calcWeight(tm.stats.offense, weights.stats.offense);
    wt += calcWeight(tm.stats.defense, weights.stats.defense);
    wt += calcWeight(tm.stats.pf, weights.stats.pf);
    wt += calcWeight(tm.stats.pa, weights.stats.pa);
    wt += calcWeight(tm.externalStats.pi, weights.extra.pi);
    wt += calcWeight(tm.externalStats.ss, weights.extra.ss);
    tm.weight = wt;
}
