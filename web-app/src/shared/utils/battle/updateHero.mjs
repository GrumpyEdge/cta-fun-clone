/* @flow */

/* :: import type { BattleResultStats, HeroBattleState, HerosBattleStateMap, HerosBattleStatsMap, BattleLogRecord } from '../../../../../server/types' */

import { boundaryInt } from "../utils.mjs"
import {
  makeBattleStatsInitialState,
} from "./makeBattleStatsInitialState.mjs"

export const updateHero = (
  updater /* :HeroBattleState => void */,
  heroId /* :string */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  const updatedHero = {
    ...herosStateMap[heroId],
  };

  updater(updatedHero);

  return {
    ...herosStateMap,
    [heroId]: updatedHero,
  };
};

export const updateHeroHp = (
  {
    isCrit = false,
    isSp2 = false,
    isBurn = false,
    isPoison = false,
  } /* : {| isCrit?: bool, isSp2?: bool, isBurn?: bool, isPoison?: bool |} */,
  dmgOrHeal /* :number */, // positive heal, negative dmg
  casterHeroId /* :string */,
  targetHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  log /* : BattleLogRecord => void */,
  processDeath /* :(heroId  :string,herosStateMap :HerosBattleStateMap) => HerosBattleStateMap */,
  battleResultStats /* : BattleResultStats */,
  herosStateMap /* :HerosBattleStateMap */
) => {
  let newHp = herosStateMap[targetHeroId].hp;
  let newShield = herosStateMap[targetHeroId].knightShield;

  const applyDmgOrHealToHp = () => {
    newHp = boundaryInt(
      0,
      herosStatsMap[targetHeroId].initialHp,
      herosStateMap[targetHeroId].hp + dmgOrHeal
    );
  };
  if (newShield > 0) {
    const isDmg = dmgOrHeal < 0;
    if (isDmg) {
      newShield = Math.max(0, newShield + dmgOrHeal);
    } else {
      // heal
      applyDmgOrHealToHp();
    }
  } else {
    applyDmgOrHealToHp();
  }

  const hpDiff = newHp - herosStateMap[targetHeroId].hp;
  const shieldDiff = newShield - herosStateMap[targetHeroId].knightShield;

  if (hpDiff === 0 && shieldDiff === 0) return herosStateMap;

  const isHeal = hpDiff > 0;
  log({
    type: "hp-changed",
    isSp2,
    isCrit,
    isHeal,
    heroId: casterHeroId,
    targetHpUpdate: {
      heroId: targetHeroId,
      value: dmgOrHeal,
      hp: newHp,
      hpPrc: newHp / herosStatsMap[targetHeroId].initialHp,
      knightShield: newShield,
      knightShieldPrc: herosStatsMap[targetHeroId].initialKnightShield ?
        (newShield / herosStatsMap[targetHeroId].initialKnightShield) : 0,
    },
  });
  if (battleResultStats.fromToMap[casterHeroId][targetHeroId] === undefined) {
    battleResultStats.fromToMap[casterHeroId][
      targetHeroId
    ] = makeBattleStatsInitialState();
  }
  const stats = battleResultStats.fromToMap[casterHeroId][targetHeroId];
  const absDmgOrHeal = Math.abs(dmgOrHeal)
  if (isHeal) {
    stats.heal += absDmgOrHeal;
  } else if (isCrit) {
    stats.crit += absDmgOrHeal;
  } else if (isBurn) {
    stats.burn += absDmgOrHeal;
  } else if (isPoison) {
    stats.poison += absDmgOrHeal;
  } else {
    stats.plain += absDmgOrHeal;
  }

  let nextHerosState = updateHero(hero => {
    hero.hp = newHp
    hero.knightShield = newShield
  }, targetHeroId, herosStateMap)

  if (newHp === 0) {
    nextHerosState = processDeath(targetHeroId, nextHerosState)
  }
  return nextHerosState
};
