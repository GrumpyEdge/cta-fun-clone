/* @flow */

/* :: import type { BattleResultStats, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleState, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */

import { updateHeroHp } from "./updateHero.mjs";
import { updateHero } from "./updateHero.mjs";
import { processHeroAttackOrMove } from "./processHeroAttackOrMove.mjs";
import {
  TICKS_IN_ONE_SECOND,
  PUSH_BACK_DISTANCE_PER_TICK,
} from "../../constants/constants.mjs";

function processNotSpawnedHero(
  currentHeroId /* :string */,
  log /* : BattleLogRecord => void */,
  herosStateMap /* :HerosBattleStateMap */,
  herosStatsMap /* :HerosBattleStatsMap */,
) {
  const spawnsNow = herosStateMap[currentHeroId].spawnInTicks === 1;
  if (spawnsNow) {
    log({
      type: "spawned",
      heroId: currentHeroId,
      spawnIndex: herosStateMap[currentHeroId].spawnIndex,
      depth: herosStateMap[currentHeroId].depth,
      isFlying: herosStatsMap[currentHeroId].flying
    });
  }
  return {
    ...herosStateMap,
    [currentHeroId]: {
      ...herosStateMap[currentHeroId],
      spawnInTicks: herosStateMap[currentHeroId].spawnInTicks - 1,
    },
  };
}

const makeProcessDeath = (
  herosStatsMap /* :HerosBattleStatsMap */,
  rndGenerator /* :() => number */,
  battleResultStats /* :BattleResultStats */,
  log /* : BattleLogRecord => void */
) => (
  heroId /* :string */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ => {
  if (battleResultStats.deathMap[heroId]) return herosStateMap;

  let nextHerosStateMap = herosStateMap;

  battleResultStats.deathMap[heroId] = true;
  const portalId = `${heroId[0]}-portal`;
  const newHp = Math.max(
    herosStatsMap[portalId].initialHp * 0.2,
    nextHerosStateMap[portalId].hp - herosStatsMap[heroId].initialHp
  );
  nextHerosStateMap = {
    ...nextHerosStateMap,
    [portalId]: {
      ...nextHerosStateMap[portalId],
      hp: newHp,
    },
  };
  log({
    type: "hp-changed",
    isSp2: false,
    isCrit: false,
    isHeal: false,
    heroId: heroId,
    targetHpUpdate: {
      heroId: portalId,
      value: herosStatsMap[heroId].initialHp,
      hp: newHp,
      hpPrc: newHp / herosStatsMap[portalId].initialHp,
      knightShield: 0,
      knightShieldPrc: 0,
    },
  });
  log({ type: "death", heroId });

  if (!heroId.includes("portal")) {
    if (heroId.startsWith("a")) {
      battleResultStats.numberOfHerosLost++;
    } else {
      battleResultStats.numberOfHerosKilled++;
    }
  }

  return nextHerosStateMap;
};

const reduceTicks = /* ::<T: EffectOverTime> */ (effect /* :T */) /* :T */ => ({
  ...effect,
  ticksLeft: effect.ticksLeft - 1,
});

function processHeroEffects(
  currentHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  battleResultStats /* :BattleResultStats */,
  log /* : BattleLogRecord => void */,
  herosStateMap /* :HerosBattleStateMap */,
  processDeath /* : (deathHeroId: string, HerosBattleStateMap) => HerosBattleStateMap */
) /* :HerosBattleStateMap */ {
  let nextHerosStateMap = herosStateMap;
  let nextHeroState /* :HeroBattleStateRO */ = herosStateMap[currentHeroId];

  let nextEffectsOverTime /* :Array<EffectOverTime> */ = nextHeroState.effectsOverTime
    .map((effectOverTime) => {
      switch (effectOverTime.type) {
        case "dot": {
          updateHeroHp(
            {
              isBurn: effectOverTime.category === "burn",
              isPoison: effectOverTime.category === "poison",
            },
            -effectOverTime.amount,
            currentHeroId,
            currentHeroId,
            herosStatsMap,
            log,
            processDeath,
            battleResultStats,
            herosStateMap
          );
          break;
        }
        case "healing": {
          updateHeroHp(
            { isSp2: true },
            effectOverTime.amount,
            effectOverTime.casterHeroId,
            currentHeroId,
            herosStatsMap,
            log,
            processDeath,
            battleResultStats,
            herosStateMap
          );
          break;
        }
        case "atkDown":
          break;
        case "slowDown":
          break;
        case "defDown":
          break;
        default:
          // eslint-disable-next-line
          (effectOverTime.type /*:empty */);
          break;
      }

      return reduceTicks(effectOverTime);
    })
    .filter((e) => {
      const inprogress = e.ticksLeft > 0;

      if (!inprogress) {
        log({
          type: "effect-stop",
          category: e.category || (e.type/* :any */),
          heroId: currentHeroId,
        });
      }

      return inprogress;
    });

  nextHeroState = {
    ...nextHeroState,
    effectsOverTime: nextEffectsOverTime,
  };
  return {
    ...nextHerosStateMap,
    [currentHeroId]: nextHeroState,
  };
}

const decreaseWithMin0 = (n) => Math.max(0, n - 1);

function processPossessedTicksCounter(
  currentHeroId /* :string */,
  log /* : BattleLogRecord => void */,
  herosStateMap /* :HerosBattleStateMap */
) {
  if (herosStateMap[currentHeroId].possessedTicks === 0) return herosStateMap;

  if (herosStateMap[currentHeroId].possessedTicks === 1) {
    log({
      type: "effect-stop",
      category: "possess",
      heroId: currentHeroId,
    });
  }

  return updateHero(
    (hero) => {
      hero.possessedTicks = decreaseWithMin0(hero.possessedTicks);
    },
    currentHeroId,
    herosStateMap
  );
}

function processTimedSp2TicksCounter(
  currentHeroId /* :string */,
  heroStats /* :HeroBattleStats */,
  herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ {
  if (!heroStats.timedSp2Sec) return herosStateMap;

  if (herosStateMap[currentHeroId].ticksTillSp2 === 0) {
    const { timedSp2Sec } = heroStats;
    return updateHero(
      (hero) => {
        hero.ticksTillSp2 = timedSp2Sec * TICKS_IN_ONE_SECOND;
      },
      currentHeroId,
      herosStateMap
    );
  }

  return updateHero(
    (hero) => {
      hero.ticksTillSp2 = decreaseWithMin0(hero.ticksTillSp2);
    },
    currentHeroId,
    herosStateMap
  );
}

export function processBattleTickForHero(
  currentHeroId /* :string */,
  herosStatsMap /* :HerosBattleStatsMap */,
  rndGenerator /* :() => number */,
  battleResultStats /* :BattleResultStats */,
  log /* : BattleLogRecord => void */,
  _herosStateMap /* :HerosBattleStateMap */
) /* :HerosBattleStateMap */ {
  ///////////////////////////////////
  // Should we process this hero? //
  /////////////////////////////////

  // Dead?
  if (_herosStateMap[currentHeroId].hp <= 0) return _herosStateMap;

  // Not spawned yet?
  if (_herosStateMap[currentHeroId].spawnInTicks > 0)
    return processNotSpawnedHero(currentHeroId, log, _herosStateMap, herosStatsMap);

  // Portal?
  if (currentHeroId.includes("portal")) return _herosStateMap;

  //////////////
  // Prepare //
  ////////////

  // from now on we should read from nextHerosStateMap
  // and update nextHerosStateMap if any changes required, in immuatable manner
  let nextHerosStateMap /* :$ReadOnly<HerosBattleStateMap> */ = _herosStateMap;

  const processDeath = makeProcessDeath(
    herosStatsMap,
    rndGenerator,
    battleResultStats,
    log
  );

  //////////////////////
  // Process effects //
  ////////////////////

  // We processing effects that was applied for current hero 'casterHero'
  nextHerosStateMap = processHeroEffects(
    currentHeroId,
    herosStatsMap,
    battleResultStats,
    log,
    nextHerosStateMap,
    processDeath
  );
  // Hero could die from burn or poison, so checking that and returning if dead
  if (nextHerosStateMap[currentHeroId].hp <= 0) {
    return processDeath(currentHeroId, nextHerosStateMap);
  }

  //////////////////////////////
  // Process attack counters //
  ////////////////////////////

  nextHerosStateMap = processPossessedTicksCounter(
    currentHeroId,
    log,
    nextHerosStateMap
  );

  nextHerosStateMap = processTimedSp2TicksCounter(
    currentHeroId,
    herosStatsMap[currentHeroId],
    nextHerosStateMap
  );

  nextHerosStateMap = updateHero(
    (hero) => {
      hero.ticksUntilNextSp1 = decreaseWithMin0(hero.ticksUntilNextSp1);
    },
    currentHeroId,
    nextHerosStateMap
  );

  ///////////////////////////////////
  // Process disable counters and //
  // return if still disabled    //
  ////////////////////////////////

  let disabled = false;
  if (nextHerosStateMap[currentHeroId].pushingBackTicks > 0) {
    disabled = true;
    const position = Math.round(
      nextHerosStateMap[currentHeroId].position - PUSH_BACK_DISTANCE_PER_TICK
    );
    log({ type: "pushed_to", heroId: currentHeroId, position });
    nextHerosStateMap = {
      ...nextHerosStateMap,
      [currentHeroId]: {
        ...nextHerosStateMap[currentHeroId],
        pushingBackTicks: nextHerosStateMap[currentHeroId].pushingBackTicks - 1,
        position,
      },
    };
  }

  // Stunned or freezed?
  // we can not check for this at the beginning, because we have to process effects and other counters first
  if (
    nextHerosStateMap[currentHeroId].stunTicks > 0 ||
    nextHerosStateMap[currentHeroId].freezeTicks > 0
  ) {
    disabled = true;

    const nextStunTicks = Math.max(
      0,
      nextHerosStateMap[currentHeroId].stunTicks - 1
    );
    const nextFreezeTicks = Math.max(
      0,
      nextHerosStateMap[currentHeroId].freezeTicks - 1
    );

    if (nextStunTicks <= 0) {
      log({
        type: "effect-stop",
        category: "stun",
        heroId: currentHeroId,
      });
    }
    if (nextFreezeTicks <= 0) {
      log({
        type: "effect-stop",
        category: "freeze",
        heroId: currentHeroId,
      });
    }
    nextHerosStateMap = {
      ...nextHerosStateMap,
      [currentHeroId]: {
        ...nextHerosStateMap[currentHeroId],
        stunTicks: nextStunTicks,
        freezeTicks: nextFreezeTicks,
      },
    };
  }

  if (disabled) return nextHerosStateMap;

  /////////////////////////////////////////////////////////////////////////////////////
  //The rest below is for processing SP1 / SP2 or move if no target in attack range //
  ///////////////////////////////////////////////////////////////////////////////////

  return processHeroAttackOrMove(
    currentHeroId,
    herosStatsMap,
    rndGenerator,
    battleResultStats,
    log,
    processDeath,
    nextHerosStateMap
  );
}
