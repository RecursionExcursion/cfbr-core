import assert from "node:assert";
import { describe, it } from "node:test";
import {
  RankedTeam,
  RankerGame,
  RankerStat,
  RankerTeam,
  RankerWeights,
} from "../lib/ranker-types";
import { rank } from "../lib/ranker.js";

function createGame(
  id: number,
  wk: number,
  home: RankerStat,
  away: RankerStat,
  type: number
): RankerGame {
  return {
    Id: id,
    Week: wk,
    Type: type,
    Stats: {
      home,
      away,
    },
  };
}

const mockTeams: RankerTeam[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

const mockGames: RankerGame[] = [
  // Week 1
  createGame(
    11,
    1,
    {
      id: 1,
      totalYards: 100,
      points: 7,
    },
    {
      id: 2,
      totalYards: 75,
      points: 5,
    },
    1
  ),

  createGame(
    12,
    1,
    {
      id: 3,
      totalYards: 150,
      points: 10,
    },
    {
      id: 4,
      totalYards: 25,
      points: 0,
    },
    1
  ),

  // Week 2
  createGame(
    13,
    2,
    {
      id: 1,
      totalYards: 100,
      points: 7,
    },
    {
      id: 3,
      totalYards: 150,
      points: 10,
    },
    1
  ),

  createGame(
    14,
    2,
    {
      id: 2,
      totalYards: 75,
      points: 5,
    },
    {
      id: 4,
      totalYards: 25,
      points: 0,
    },
    1
  ),

  //postseason
  createGame(
    15,
    1,
    {
      id: 1,
      totalYards: 100,
      points: 7,
    },
    {
      id: 3,
      totalYards: 150,
      points: 10,
    },
    2
  ),
];

const wts: RankerWeights = {
  stats: {
    wins: {
      totalWeight: 1,
      pgWeight: 1,
    },
    losses: {
      totalWeight: 1,
      pgWeight: 1,
    },
    offense: {
      totalWeight: 1,
      pgWeight: 1,
    },
    defense: {
      totalWeight: 1,
      pgWeight: 1,
    },
    pf: {
      totalWeight: 1,
      pgWeight: 1,
    },
    pa: {
      totalWeight: 1,
      pgWeight: 1,
    },
  },
  extra: {
    pi: 1,
    ss: 1,
  },
};

describe("Test rank", () => {
  const res = rank(mockTeams, mockGames, wts);
  it("Teams are captured", () => {
    const teamKeys = Array.from(res.teamMap.keys());
    const required = [1, 2, 3];
    assert.strictEqual(
      true,
      required.every((val) => teamKeys.includes(val))
    );
  });

  it("Games are captured", () => {
    const gameKeys = Array.from(res.gameMap.keys());
    const required = [11, 12, 13, 14, 15];
    assert.strictEqual(
      true,
      required.every((val) => gameKeys.includes(val))
    );
  });

  it("Season Map Created", () => {
    //contains 3 weeks
    assert.strictEqual(3, res.sznMap.size);
    //contains 3 teams per week
    for (let i = 0; i < res.sznMap.size; i++) {
      assert.strictEqual(3, res.sznMap.get(i)?.size);
    }
  });

  it("Stats are squashed", () => {
    const assertStat = (
      wk: number,
      teamId: number,
      field: keyof RankedTeam["Stats"],
      expectedTotal?: number,
      expectedPg?: number
    ) => {
      if (expectedTotal) {
        assert.strictEqual(
          res.sznMap.get(wk)?.get(teamId)?.Stats[field].total.val,
          expectedTotal
        );
      }
      if (expectedPg) {
        assert.strictEqual(
          res.sznMap.get(wk)?.get(teamId)?.Stats[field].pg.val,
          expectedPg
        );
      }
    };

    //tm3 (best team) //wk1
    assertStat(0, 3, "wins", 1, 1);
    assertStat(0, 3, "losses", 0, 0);
    assertStat(0, 3, "totalOffense", 150, 150);
    assertStat(0, 3, "pf", 10, 10);
    assertStat(0, 3, "pa", 0, 0);

    //tm3 (best team) //wk2
    assertStat(1, 3, "wins", 2, 1);
    assertStat(1, 3, "losses", 0, 0);
    assertStat(1, 3, "totalOffense", 300, 150);
    assertStat(1, 3, "pf", 20, 10);
    // assertStat(1, 3, "pa", 20, 7);

    //tm3 (best team) //wk3
    assertStat(2, 3, "wins", 3, 1);
    assertStat(2, 3, "losses", 0, 0);
    assertStat(2, 3, "totalOffense", 450, 150);
    assertStat(2, 3, "pf", 30, 10);
  });

  // it("Ranking Logic", () => {
  //   //tm3 Wk1, 1-0
  //   assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.wins.rank, 1);
  //   assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.losses.rank, 1);
  //   //tm1 Wk1, 1-0
  //   assert.strictEqual(res.sznMap.get(0)?.get(1)?.Stats.wins.rank, 1);
  //   assert.strictEqual(res.sznMap.get(0)?.get(1)?.Stats.losses.rank, 1);
  // });
});
