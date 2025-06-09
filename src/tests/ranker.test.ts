import assert from "node:assert";
import { describe, it } from "node:test";
import {
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
  total: {
    wins: 1,
    losses: 1,
    offense: 1,
    defense: 1,
    pf: 1,
    pa: 1,
  },
  pg: {
    wins: 1,
    losses: 1,
    offense: 1,
    defense: 1,
    pf: 1,
    pa: 1,
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
    //tm3 (best team) //wk1
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.wins.val, 1);
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.wins.pgVal, 1);

    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.losses.val, 0);
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.losses.pgVal, 0);

    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.totalOffense.val, 150);
    assert.strictEqual(
      res.sznMap.get(0)?.get(3)?.Stats.totalOffense.pgVal,
      150
    );

    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.pf.val, 10);
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.pf.pgVal, 10);

    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.pa.val, 0);
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.pa.pgVal, 0);

    //tm3 (best team) //wk2
    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.wins.val, 2);
    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.wins.pgVal, 1);

    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.losses.val, 0);
    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.losses.pgVal, 0);

    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.totalOffense.val, 300);
    assert.strictEqual(
      res.sznMap.get(1)?.get(3)?.Stats.totalOffense.pgVal,
      150
    );

    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.pf.val, 20);
    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.pf.pgVal, 10);

    assert.strictEqual(res.sznMap.get(1)?.get(3)?.Stats.pa.val, 7);

    //tm3 (best team) //wk3
    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.wins.val, 3);
    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.wins.pgVal, 1);

    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.losses.val, 0);
    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.losses.pgVal, 0);

    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.totalOffense.val, 450);
    assert.strictEqual(
      res.sznMap.get(2)?.get(3)?.Stats.totalOffense.pgVal,
      150
    );

    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.pf.val, 30);
    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.pf.pgVal, 10);

    assert.strictEqual(res.sznMap.get(2)?.get(3)?.Stats.pa.val, 14);
  });

  it("Ranking Logic", () => {
    //tm3 Wk1, 1-0
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.wins.Rank, 1);
    assert.strictEqual(res.sznMap.get(0)?.get(3)?.Stats.losses.Rank, 1);
    //tm1 Wk1, 1-0
    assert.strictEqual(res.sznMap.get(0)?.get(1)?.Stats.wins.Rank, 1);
    assert.strictEqual(res.sznMap.get(0)?.get(1)?.Stats.losses.Rank, 1);
  });
});
