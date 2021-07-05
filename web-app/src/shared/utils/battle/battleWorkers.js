/* globals window */
/* @flow */
/* :: import { type HeroProgress, type OwnedHeroRecord, type BuffMap, type BattleResult } from "../../../../../server/types"; */
import * as Comlink from "comlink";
/* $FlowFixMe */
import Worker from "worker-loader!./worker.js"; // eslint-disable-line

const makeBattleWorker = () => {
  const worker = new Worker();
  const obj = Comlink.wrap(worker);

  return async (
    attackerTeam/* : $ReadOnlyArray<OwnedHeroRecord> */,
    enemyTeam/* : $ReadOnlyArray<HeroProgress> */,
    ownTeamBuffMap/* :BuffMap */,
    enemyTeamBuffMap/* :BuffMap */,
    isX2/* :bool */
  )/* : Promise<BattleResult> */ => {
    return await obj.battleOnce(
      attackerTeam,
      enemyTeam,
      ownTeamBuffMap,
      enemyTeamBuffMap,
      isX2
    );
  };
};

const battleWorkers = [];

for (let i = 0; i < (window.navigator.hardwareConcurrency || 4) - 1; i++) {
  battleWorkers.push(makeBattleWorker());
}

if (!battleWorkers.length) {
  battleWorkers.push(makeBattleWorker());
}

export { battleWorkers };
