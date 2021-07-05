/* @flow */
import * as Comlink from "comlink";

import { battle } from "../shared/utils/battle/battle.mjs";

const obj = {
  battleOnce: (
    attackerTeam,
    defenderTeam,
    attackerTeamBuffMap,
    defenderTeamBuffMap,
    isX2
  ) => {
    const rndSeed = Math.round(Date.now() * Math.random());
    const result = battle(
      0.2,
      { type: "detailed", team: attackerTeam, buff: attackerTeamBuffMap, isX2 },
      { type: "basic", team: defenderTeam, buff: defenderTeamBuffMap },
      rndSeed
    );
    return result;
  },
};

Comlink.expose(obj);
