/* @flow */

/* :: import type { AttackProps, BattleResultStats, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleState, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */

import { updateHeroHp } from "./updateHero.mjs";
import { TICKS_IN_ONE_SECOND } from "../../constants/constants.mjs";
import { PUSH_BACK_DISTANCE_PER_TICK } from "../../constants/constants.mjs";
import { updateHero } from "./updateHero.mjs";
const makeBattleStatsInitialState = () => ({
  heal: 0,
  plain: 0,
  crit: 0,
  absorbedByDef: 0,
  burn: 0,
  poison: 0,
  stunSec: 0,
  freezeSec: 0,
});

const initBattleResultStats = (
  battleResultStats,
  currentHeroId,
  targetHeroId
) => {
  if (battleResultStats.fromToMap[currentHeroId][targetHeroId] === undefined) {
    battleResultStats.fromToMap[currentHeroId][
      targetHeroId
    ] = makeBattleStatsInitialState();
  }
};

const getEvDiff = (currentHeroId, targetHeroId, herosStatsMap) =>
  Math.abs(herosStatsMap[currentHeroId].ev - herosStatsMap[targetHeroId].ev);

const processPossess = (
  currentHeroId /* :string */,
  possessTime /* :number */,
  herosStatsMap /* :HerosBattleStatsMap */,
  targetHeroId /* :string */,
  log /* : BattleLogRecord => void */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  if (possessTime === 0) return herosStateMap;

  const differenceInStars = getEvDiff(
    currentHeroId,
    targetHeroId,
    herosStatsMap
  );
  const adjustedPossessTime = possessTime - 0.7 * differenceInStars;
  const nextHerosStateMap = updateHero(
    (hero) => {
      hero.possessedTicks = Math.round(
        adjustedPossessTime * TICKS_IN_ONE_SECOND
      );
    },
    targetHeroId,
    herosStateMap
  );

  if (nextHerosStateMap[targetHeroId].possessedTicks) {
    log({
      type: "effect-stop",
      category: "possess",
      heroId: targetHeroId,
    });
  }
  log({
    type: "effect-start",
    category: "possess",
    heroId: targetHeroId,
  });

  return nextHerosStateMap;
};

const processHealing = (
  currentHeroId /* :string */,
  targetHeroId /* :string */,
  log /* : BattleLogRecord => void */,
  battleResultStats /* :BattleResultStats */,
  herosStatsMap /* :HerosBattleStatsMap */,
  healPrcOfOwnHealth /* :number */,
  healOverSecTime /* :number */,
  isSp2Time /* :bool */,
  processDeath /* :(heroId  :string,herosStateMap :HerosBattleStateMap) => HerosBattleStateMap */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  if (healPrcOfOwnHealth) {
    if (healOverSecTime) {
      log({
        type: "effect-start",
        category: "heal",
        heroId: targetHeroId,
      });

      return updateHero(
        (hero) => {
          hero.effectsOverTime = [
            ...hero.effectsOverTime,
            {
              type: "healing",
              casterHeroId: currentHeroId,
              amount:
                ((healPrcOfOwnHealth / 100) *
                  herosStatsMap[currentHeroId].initialHp) /
                TICKS_IN_ONE_SECOND,
              ticksLeft: healOverSecTime * TICKS_IN_ONE_SECOND,
            },
          ];
        },
        targetHeroId,
        herosStateMap
      );
    } else {
      return updateHeroHp(
        {},
        (herosStatsMap[currentHeroId].initialHp * healPrcOfOwnHealth) / 100,
        currentHeroId,
        targetHeroId,
        herosStatsMap,
        log,
        processDeath,
        battleResultStats,
        herosStateMap
      );
    }
  }
  return herosStateMap;
};

const calcElementalMult = (currentHeroId, targetHeroId, herosStatsMap) => {
  const { elementKind: casterElement } = herosStatsMap[currentHeroId];
  const { elementKind: targetElement } = herosStatsMap[targetHeroId];
  if (casterElement === "light" && targetElement === "dark") {
    return 2;
  }
  if (casterElement === "water" && targetElement === "fire") {
    return 4;
  }
  if (casterElement === "earth" && targetElement === "water") {
    return 4;
  }
  if (casterElement === "fire" && targetElement === "earth") {
    return 4;
  }
  return 1;
};

const getDebuff = (type/* : 'atkDown' | 'defDown' | 'slowDown' */, heroId, herosStateMap) => herosStateMap[heroId].effectsOverTime.reduce((a, effect) => {
  if (effect.type === type) {
    return a + effect.amount;
  }
  return a;
}, 0);

const processHit = (
  atkProps /* :AttackProps */,
  currentHeroId /* :string */,
  targetHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  targetsIds /* :$ReadOnlyArray<string> */,
  aliesIds /* :$ReadOnlyArray<string> */,
  isSp2 /* :bool */,
  processDeath /* :(heroId  :string,herosStateMap :HerosBattleStateMap) => HerosBattleStateMap */,
  log /* : BattleLogRecord => void */,
  battleResultStats /* :BattleResultStats */,
  rndGenerator /* :() => number */,
  herosStateMap /* :HerosBattleStateMap */
) => {
  const isMiss = rndGenerator() * 100 < herosStatsMap[targetHeroId].dodgerate;
  if (isMiss) {
    log({
      type: "miss",
      heroId: currentHeroId,
      targetHeroId,
    });
    return herosStateMap;
  }

  let dmgInflicted = 0;


  const atkDownMult = 100 / (100 + getDebuff('atkDown', currentHeroId, herosStateMap));

  const isCrit = rndGenerator() * 100 < herosStatsMap[currentHeroId].ctkrate;
  const pureDmgNoCrit =
    herosStatsMap[currentHeroId].atk *
    atkProps.atkDmgMult *
    calcElementalMult(currentHeroId, targetHeroId, herosStatsMap) *
    atkDownMult;
  const dmg = isCrit
    ? pureDmgNoCrit * (1 + herosStatsMap[currentHeroId].ctkdmg / 100)
    : pureDmgNoCrit;

  const defDownMult = 100 / (100 + getDebuff('defDown', targetHeroId, herosStateMap));

  const defFactor = herosStatsMap[currentHeroId].class === "gunner" ? 1.5 : 5;
  dmgInflicted =
    dmg / (1 + (defFactor * herosStatsMap[targetHeroId].def * defDownMult) / dmg);

  battleResultStats.fromToMap[currentHeroId][targetHeroId].absorbedByDef +=
    dmg - dmgInflicted;

  let nextHerosStateMap = herosStateMap;
  const _updateHeroHp = (
    props,
    healOrDmg, // heal positive, dmg negative
    _targetHeroId = targetHeroId
  ) => {
    nextHerosStateMap = updateHeroHp(
      props,
      healOrDmg,
      currentHeroId,
      _targetHeroId,
      herosStatsMap,
      log,
      processDeath,
      battleResultStats,
      nextHerosStateMap
    );
  };

  _updateHeroHp({ isCrit, isSp2 }, -dmgInflicted);

  if (atkProps.vampiric) {
    const healAmount = dmgInflicted * atkProps.vampiric;
    _updateHeroHp({ isCrit, isSp2 }, healAmount, currentHeroId);
  }

  if (atkProps.healRndAllyFromDmgDone) {
    // Vlad
    const calcLostHpPart = (hId) =>
      (herosStatsMap[hId].initialHp - nextHerosStateMap[hId].hp) /
      herosStatsMap[hId].initialHp;
    const damagedAliesIds = [...aliesIds]
      .filter((id) => !id.includes("portal"))
      .sort((a1, a2) => calcLostHpPart(a2) - calcLostHpPart(a1));

    const allyIdToHeal = damagedAliesIds[0];

    if (allyIdToHeal) {
      const healAmount = dmgInflicted * atkProps.healRndAllyFromDmgDone;
      _updateHeroHp({}, healAmount, allyIdToHeal);
    }
  }

  if (targetHeroId.includes("portal")) return nextHerosStateMap;

  ////////////////////
  // Apply effects //
  //////////////////

  const tryApplyEffect = (
    chanceProp,
    timeProp,
    ticksProp,
    statsProp,
    category
  ) => {
    if (atkProps[chanceProp] && atkProps[timeProp]) {
      if (rndGenerator() * 100 <= atkProps[chanceProp]) {
        if (nextHerosStateMap[targetHeroId][ticksProp] === 0) {
          log({
            type: "effect-start",
            category,
            heroId: targetHeroId,
          });
        }

        battleResultStats.fromToMap[currentHeroId][targetHeroId][statsProp] +=
          atkProps[timeProp];

        nextHerosStateMap = updateHero(
          (hero) => {
            hero[ticksProp] = atkProps[timeProp] * TICKS_IN_ONE_SECOND;
          },
          targetHeroId,
          nextHerosStateMap
        );
      }
    }
  };

  tryApplyEffect("stunChance", "stunTime", "stunTicks", "stunSec", "stun");
  tryApplyEffect(
    "freezeChance",
    "freezeTime",
    "freezeTicks",
    "freezeSec",
    "freeze"
  );

  const tryApplyDebuff = (
    amountProp/* :'slowDown' | 'defDown' | 'atkDown' */,
    timeProp
  ) => {
    if (atkProps[amountProp]) {
      log({
        type: "effect-start",
        category: amountProp,
        heroId: targetHeroId,
      });
  
      nextHerosStateMap = updateHero(
        (hero) => {
          hero.effectsOverTime = [
            ...nextHerosStateMap[targetHeroId].effectsOverTime,
            {
              type: amountProp,
              casterHeroId: currentHeroId,
              amount: atkProps[amountProp],
              ticksLeft: atkProps[timeProp] * TICKS_IN_ONE_SECOND,
            },
          ];
        },
        targetHeroId,
        nextHerosStateMap
      );
    }
  }
  tryApplyDebuff('slowDown', 'slowDownTime');
  tryApplyDebuff('atkDown', 'atkDownTime');
  tryApplyDebuff('defDown', 'defDownTime');

  const tryApplyDoT = (chanceProp, timeProp, category, multProp) => {
    if (atkProps[chanceProp] && atkProps[timeProp]) {
      if (rndGenerator() * 100 <= atkProps[chanceProp]) {
        log({
          type: "effect-start",
          category,
          heroId: targetHeroId,
        });

        nextHerosStateMap = updateHero(
          (hero) => {
            hero.effectsOverTime = [
              ...nextHerosStateMap[targetHeroId].effectsOverTime,
              {
                type: "dot",
                category,
                casterHeroId: currentHeroId,
                amount:
                  (pureDmgNoCrit * atkProps[multProp]) / TICKS_IN_ONE_SECOND,
                ticksLeft: atkProps[timeProp] * TICKS_IN_ONE_SECOND,
              },
            ];
          },
          targetHeroId,
          nextHerosStateMap
        );
      }
    }
  };

  tryApplyDoT("burnChance", "burnTime", "burn", "burnMult");
  tryApplyDoT("poisonChance", "poisonTime", "poison", "poisonMult");

  return nextHerosStateMap;
};

export const processHeroAttack = (
  currentHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  rndGenerator /* :() => number */,
  battleResultStats /* :BattleResultStats */,
  log /* : BattleLogRecord => void */,
  processDeath /* :(heroId  :string,herosStateMap :HerosBattleStateMap) => HerosBattleStateMap */,
  isSp2Time /* :bool */,
  targetsIds /* :$ReadOnlyArray<string> */,
  atkProps /* :AttackProps */,
  aliesIds /* :$ReadOnlyArray<string> */,
  _herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  const heroStats = herosStatsMap[currentHeroId];
  let nextHerosStateMap = _herosStateMap;

  const slowDownMult = 100 / (100 + getDebuff('slowDown', currentHeroId, nextHerosStateMap));

  // process sp1 and sp2 counters
  nextHerosStateMap = updateHero(
    (hero) => {
      hero.attacksTillNextSp2 = isSp2Time
        ? 6
        : nextHerosStateMap[currentHeroId].attacksTillNextSp2 - 1;
      hero.ticksUntilNextSp1 = Math.round(TICKS_IN_ONE_SECOND / (heroStats.aps * slowDownMult));
    },
    currentHeroId,
    nextHerosStateMap
  );

  const {
    atkDmgMult,
    numberOfAttacks,
    healPrcOfOwnHealth,
    healOverSecTime,
    possessTime,
    pushDistance,
  } = atkProps;

  targetsIds.forEach((targetHeroId) => {
    initBattleResultStats(battleResultStats, currentHeroId, targetHeroId);

    // apply possess if required
    nextHerosStateMap = processPossess(
      currentHeroId,
      possessTime,
      herosStatsMap,
      targetHeroId,
      log,
      nextHerosStateMap
    );

    // apply push effect if required
    if (pushDistance) {
      nextHerosStateMap = updateHero(
        (hero) => {
          hero.pushingBackTicks = pushDistance / PUSH_BACK_DISTANCE_PER_TICK;
        },
        targetHeroId,
        nextHerosStateMap
      );
    }

    nextHerosStateMap = processHealing(
      currentHeroId,
      targetHeroId,
      log,
      battleResultStats,
      herosStatsMap,
      healPrcOfOwnHealth,
      healOverSecTime,
      isSp2Time,
      processDeath,
      nextHerosStateMap
    );

    // inflict damage (plain/crit) / apply DoT (posion/burn)
    if (atkDmgMult) {
      for (let i = 0; i < numberOfAttacks; i++) {
        if (nextHerosStateMap[targetHeroId].hp <= 0) {
          continue;
        }
        nextHerosStateMap = processHit(
          atkProps,
          currentHeroId,
          targetHeroId,
          herosStatsMap,
          targetsIds,
          aliesIds,
          isSp2Time,
          processDeath,
          log,
          battleResultStats,
          rndGenerator,
          nextHerosStateMap
        );
      }
    }
  });

  return nextHerosStateMap;
};
