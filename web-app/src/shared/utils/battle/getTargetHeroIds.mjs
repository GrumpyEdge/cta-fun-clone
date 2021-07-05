/* @flow */
/* :: import type { TargetSelectionMethod, BattleResultStats, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */

import { DISTANCE_BETWEEN_CRYSTALS } from "../../constants/constants.mjs";
import { boundaryInt } from "../utils.mjs";
import { SP5_TYPES } from "../../constants/constants.mjs";

const makeComputeDistanceBetweenHeros = (heros) => (heroId1, heroId2) => {
  return Math.abs(
    DISTANCE_BETWEEN_CRYSTALS -
      heros[heroId1].position -
      heros[heroId2].position
  );
};

function getClosestHeroIdWithinRange(
  currentHeroId,
  enemiesIds,
  heros,
  herosStatsMap,
  isPossessed
) {
  if (enemiesIds.length === 0) return null;
  const enemiesIdsCopy = [...enemiesIds];
  const computeDistanceBetweenHeros = makeComputeDistanceBetweenHeros(heros);
  enemiesIdsCopy.sort(
    (id1, id2) =>
      computeDistanceBetweenHeros(currentHeroId, id1) -
      computeDistanceBetweenHeros(currentHeroId, id2)
  );

  const closestHeroId = enemiesIdsCopy[0];
  let distanceToEnemy =
    DISTANCE_BETWEEN_CRYSTALS -
    heros[closestHeroId].position -
    heros[currentHeroId].position;

  if (isPossessed) {
    distanceToEnemy = Math.abs(
      heros[closestHeroId].position - heros[currentHeroId].position
    );
  }

  if (distanceToEnemy > herosStatsMap[currentHeroId].atkrange) {
    return null;
  }

  return enemiesIdsCopy[0];
}

const CLASSES_THAT_CAN_HIT_FLYER /* :Array<CLS> */ = [
  "gunner",
  "magician",
  "ranger",
  "support",
];

export function getTargetHerosIds(
  currentHeroId /* :string */,
  selectionMethod /* : TargetSelectionMethod */,
  rndGenerator /* : () => number */,
  aoe /* : number */,
  _aliesIds /* :Array<string> */,
  _enemiesIds /* :Array<string> */,
  heros /* :HerosBattleStateMap */,
  herosStatsMap /* :HerosBattleStatsMap */,
  forceNoFlyer /* :bool */
) {
  const isPossessed = heros[currentHeroId].possessedTicks > 0;
  const canHitFlyer = CLASSES_THAT_CAN_HIT_FLYER.includes(
    herosStatsMap[currentHeroId].class
  );
  const filterInvalidTargets = (id) => {
    if (id === currentHeroId) {
      return false;
    }
    const { flying } = herosStatsMap[id];
    if (flying && !canHitFlyer) {
      return false;
    }
    if (flying && forceNoFlyer) {
      return false;
    }
    return true;
  };
  const aliesIds = (isPossessed ? _enemiesIds : _aliesIds).filter(
    filterInvalidTargets
  );
  const enemiesIds = (isPossessed ? _aliesIds : _enemiesIds).filter(
    filterInvalidTargets
  );
  let depthLimit = 0;
  let initialTargetId /* :string | null */ = null;
  let potentialTargets = enemiesIds;
  let ignoreAntiPushback = false;
  switch (selectionMethod) {
    case "closest-enemy": {
      initialTargetId = getClosestHeroIdWithinRange(
        currentHeroId,
        enemiesIds,
        heros,
        herosStatsMap,
        isPossessed
      );
      break;
    }
    case "enemy-backline": {
      const enemiesIdsCopy = enemiesIds.filter(
        (eid) => !eid.includes("portal")
      );
      const computeChance = (heroId) => {
        const heroState = heros[heroId];
        const heroStats = herosStatsMap[heroId];

        let value = DISTANCE_BETWEEN_CRYSTALS - heroState.position;
        if (heroStats.flying) {
          value *= 2;
        }
        return value;
      };
      const sortedTargetIds = enemiesIdsCopy.sort(
        (id1, id2) => computeChance(id2) - computeChance(id1)
      );

      initialTargetId =
        sortedTargetIds.find(() => {
          return rndGenerator() > 0.8;
        }) || sortedTargetIds[0];
      break;
    }
    case "random-within-2x-range": {
      const computeDistanceBetweenHeros = makeComputeDistanceBetweenHeros(
        heros
      );
      const enemiesIdsWithin2xRange = enemiesIds.filter(
        (enemyHeroId) =>
          !enemyHeroId.includes("portal") &&
          computeDistanceBetweenHeros(currentHeroId, enemyHeroId) <=
            herosStatsMap[currentHeroId].atkrange
      );

      const randomIndex = boundaryInt(
        0,
        enemiesIdsWithin2xRange.length - 1,
        Math.floor(rndGenerator() * enemiesIdsWithin2xRange.length)
      );
      initialTargetId = enemiesIdsWithin2xRange[randomIndex];
      break;
    }
    case "ally-with-least-hp-prc": {
      const copyOfAliesIds = [...aliesIds];
      const calcHpPrc = (id) => heros[id].hp / herosStatsMap[id].initialHp;
      copyOfAliesIds.sort((id1, id2) => calcHpPrc(id1) - calcHpPrc(id2));
      initialTargetId = copyOfAliesIds[0];
      potentialTargets = aliesIds;
      break;
    }
    case "weakest-enemy": {
      const copyOfEnemiesIds = [...enemiesIds];
      const calcHpPrc = (id) => heros[id].hp / herosStatsMap[id].initialHp;
      copyOfEnemiesIds.sort((id1, id2) => calcHpPrc(id1) - calcHpPrc(id2));
      initialTargetId = copyOfEnemiesIds[0];
      break;
    }
    case "random-ally": {
      const randomIndex = boundaryInt(
        0,
        aliesIds.length - 1,
        Math.floor(rndGenerator() * aliesIds.length)
      );
      initialTargetId = aliesIds[randomIndex];
      potentialTargets = aliesIds;
      break;
    }
    case "self": {
      initialTargetId = currentHeroId;
      potentialTargets = aliesIds;
      break;
    }
    case "wave4": {
      depthLimit = 2;
      initialTargetId = enemiesIds[0];
      aoe = 5000;
      ignoreAntiPushback = true;
      break;
    }
    case "wave10": {
      depthLimit = 5;
      initialTargetId = enemiesIds[0];
      aoe = 5000;
      ignoreAntiPushback = true;
      break;
    }
    default:
      // eslint-disable-next-line
      (selectionMethod /*: empty */);
  }

  if (!initialTargetId) {
    return [];
  }

  const initialTargetHeroState = heros[initialTargetId];
  const additionalTargets = (aoe
    ? potentialTargets.filter((potentialTargetHeroId) => {
        const potentialTargetHeroStats = herosStatsMap[potentialTargetHeroId];
        const potentialTargetHeroState = heros[potentialTargetHeroId];
        if (!canHitFlyer && potentialTargetHeroStats.flying) {
          return false;
        }

        if (
          depthLimit &&
          Math.abs(
            potentialTargetHeroState.depth - heros[currentHeroId].depth
          ) > depthLimit
        ) {
          return false;
        }

        if (
          ignoreAntiPushback &&
          (potentialTargetHeroStats.class === "barbarian" ||
            potentialTargetHeroStats.sp5 === SP5_TYPES.ANTI_PUSHBACK)
        ) {
          return false;
        }

        if (herosStatsMap[currentHeroId].class === "gunner") {
          if (
            Math.abs(
              DISTANCE_BETWEEN_CRYSTALS -
                potentialTargetHeroState.position -
                initialTargetHeroState.position
            ) <= aoe
          ) {
            return true;
          }
        } else {
          const distanceFromCurrentHeroToTargetHero = Math.abs(
            DISTANCE_BETWEEN_CRYSTALS -
              heros[currentHeroId].position -
              potentialTargetHeroState.position
          );

          if (distanceFromCurrentHeroToTargetHero <= aoe) {
            return true;
          }
        }

        return false;
      })
    : []
  ).filter((t) => t !== initialTargetId);

  return [initialTargetId, ...additionalTargets];
}
