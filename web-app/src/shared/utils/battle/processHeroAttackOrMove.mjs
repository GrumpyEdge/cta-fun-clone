/* @flow */

/* :: import type { BattleResultStats, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleState, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */

import { getTargetHerosIds } from "./getTargetHeroIds.mjs"
import { TICKS_IN_ONE_SECOND } from "../../constants/constants.mjs"
import { getTeamsHerosIds } from "./getTeamsHerosIds.mjs"
import { computeAttackProps } from "./computeAttackProps.mjs"
import { processHeroAttack } from "./processHeroAttack.mjs"

const move = (
  currentHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  log /* : BattleLogRecord => void */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  const direction = herosStateMap[currentHeroId].possessedTicks ? -1 : 1;
  const movedDistance =
    (direction * herosStatsMap[currentHeroId].mvspd) / TICKS_IN_ONE_SECOND;

  const newPosition = Math.round(
    herosStateMap[currentHeroId].position + movedDistance
  );
  log({ type: "move", heroId: currentHeroId, newPosition });

  return {
    ...herosStateMap,
    [currentHeroId]: {
      ...herosStateMap[currentHeroId],
      position: newPosition,
    },
  };
};

export const processHeroAttackOrMove = (
  currentHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  rndGenerator /* :() => number */,
  battleResultStats /* :BattleResultStats */,
  log /* : BattleLogRecord => void */,
  processDeath /* :(heroId  :string,herosStateMap :HerosBattleStateMap) => HerosBattleStateMap */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  const { enemiesIds, aliesIds } = getTeamsHerosIds(
    currentHeroId,
    herosStateMap
  );

  const heroStats = herosStatsMap[currentHeroId];

  const isSp2Time = heroStats.timedSp2Sec
    ? herosStateMap[currentHeroId].ticksTillSp2 === 0
    : herosStateMap[currentHeroId].attacksTillNextSp2 === 0;

  // Getting attack properties for this hero. either for sp1 or sp2
  const attackProps = computeAttackProps(isSp2Time, heroStats, rndGenerator);

  const targetsIds = getTargetHerosIds(
    currentHeroId,
    attackProps.targetSelectionMethod,
    rndGenerator,
    attackProps.aoe * herosStatsMap[currentHeroId].aoeMult,
    aliesIds,
    enemiesIds,
    herosStateMap,
    herosStatsMap,
    attackProps.forceNoFlyer
  );

  // If there is not valid targets for this attack - move
  if (!targetsIds.length) {
    return move(currentHeroId, herosStatsMap, log, herosStateMap);
  }
  
  // otherwise try to attack

  const sp1IsNotReadyYet = herosStateMap[currentHeroId].ticksUntilNextSp1 > 0;
  const sp2IsNotReadyYet = !isSp2Time;

  // but if sp1 is on cooldown, and it its not time for sp2, just return
  if (sp1IsNotReadyYet && sp2IsNotReadyYet) return herosStateMap;

  return processHeroAttack(
    currentHeroId,
    herosStatsMap,
    rndGenerator,
    battleResultStats,
    log,
    processDeath,
    isSp2Time,
    targetsIds,
    attackProps,
    aliesIds,
    herosStateMap
  );
};
