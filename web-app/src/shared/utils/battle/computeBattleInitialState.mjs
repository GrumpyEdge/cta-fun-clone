/* @flow */
/* :: import type { BuffMap, HeroInfoWithOwnedHeroRecord, BattleTeamDefinition, OwnedHeroRecord, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */

import {
  SP4_TYPES,
  aPortalId,
  dPortalId,
  TICKS_IN_ONE_SECOND,
  TIME_BETWEEN_HEROS_SPAWN_SECS,
} from "../../constants/constants.mjs";
import { portalEmoji, portalEmojiId } from "../../constants/emoji.mjs";
import { ALL_HEROS, FALL_BACK_HERO } from "../../constants/heros.mjs";
import { computerunesStats } from "../runes.mjs";

const hpBuff = (sp4mult, heroProgress, myTeam) => {
  let value = 0;

  myTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    let heroValue = 0;
    if (
      h.sp4 === SP4_TYPES.ALL_HP_400 ||
      (h.sp4 === SP4_TYPES.ELEMENT_HP_400 && sameElement)
    ) {
      heroValue += 4 * sp4mult;
    } else if (h.sp4 === SP4_TYPES.ELEMENT_HP_500 && sameElement) {
      heroValue += 5 * sp4mult;
    } else if (h.sp4 === SP4_TYPES.SELF_HP_800 && h === heroProgress) {
      heroValue += 8 * sp4mult;
    }

    value = value + heroValue * heroStarMult;
  });

  return value;
};

const hpDebuff = (sp4mult, opponentTeam) => {
  let value = 0;

  opponentTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);

    if (h.sp4 === SP4_TYPES.DEBUFF_HP_25_PRC) {
      value += 0.25 * sp4mult * heroStarMult;
    }
  });

  return Math.max(0.05, 1 / (1 + value));
};

const defBuff = (sp4mult, heroProgress, myTeam) => {
  let value = 0;

  myTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    let heroValue = 0;
    if (
      h.sp4 === SP4_TYPES.ALL_DEF_400 ||
      (h.sp4 === SP4_TYPES.ELEMENT_DEF_400 && sameElement)
    ) {
      heroValue += 4 * sp4mult;
    }
    if (h.sp4 === SP4_TYPES.ALL_DEF_500) {
      heroValue += 5 * sp4mult;
    }

    value = value + heroValue * heroStarMult;
  });

  return value;
};

const defDebuff = (sp4mult, opponentTeam) => {
  let value = 0;

  opponentTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    if (h.sp4 === SP4_TYPES.DEBUFF_DEF_50_PRC) {
      value += 50 * sp4mult * heroStarMult;
    }
  });

  return value;
};

const heroStarsBuff = (heroProgress) => {
  let mult = 1;

  for (let i = 1; i < heroProgress.ev; i++) {
    mult *= 2;
  }
  for (let i = 0; i < heroProgress.aw; i++) {
    mult *= 1.5;
  }
  return mult;
};

const getHeroInitialHp = (
  sp4mult,
  heroProgress,
  runesStats,
  myTeam,
  opponentTeam,
  gwArenaBuff
) => {
  // from StGabe
  // finalHP =  (1/(1+enemyHPDebuff)) * ((10 * (1+runeHPBuff) * (1+gwArenaBuff)) + teamHPBuff) *  (baseHP * evolveAwaken)
  return Math.round(
    heroProgress.hp *
      heroStarsBuff(heroProgress) *
      hpDebuff(sp4mult, opponentTeam) *
      ((10 * (1 + runesStats.hp / 100) * (1 + gwArenaBuff)) + hpBuff(sp4mult, heroProgress, myTeam))
  );
};

const getHeroDef = (
  sp4mult,
  heroProgress,
  runesStats,
  myTeam,
  opponentTeam,
  gwArenaBuff
) => {
  return Math.round(
    heroProgress.def *
      heroStarsBuff(heroProgress) *
      (100 / (100 + defDebuff(sp4mult, opponentTeam))) *
      ((1 + runesStats.def / 100) * (1 + gwArenaBuff) + defBuff(sp4mult, heroProgress, myTeam))
  );
};

const atkBuff = (sp4mult, heroProgress, myTeam) => {
  let value = 0;

  myTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    let heroValue = 0;
    if (
      h.sp4 === SP4_TYPES.ALL_ATK_400 ||
      (h.sp4 === SP4_TYPES.ELEMENT_ATK_400 && sameElement)
    ) {
      heroValue += 4 * sp4mult;
    } else if (h.sp4 === SP4_TYPES.SELF_ATK_800 && h === heroProgress) {
      heroValue += 8 * sp4mult;
    }

    value = value + heroValue * heroStarMult;
  });

  return value;
};

const atkDebuff = (sp4mult, heroProgress, opponentTeam) => {
  let value = 0;

  opponentTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    if (h.sp4 === SP4_TYPES.DEBUFF_ATK_50_PRC) {
      value += 50 * sp4mult * heroStarMult;
    } else if (h.sp4 === SP4_TYPES.DEBUF_ELEMENT_DMG_200 && sameElement) {
      value += 200 * sp4mult * heroStarMult;
    }
  });

  return value;
};

const getHeroAtk = (
  sp4mult,
  heroProgress,
  runesStats,
  myTeam,
  opponentTeam,
  gwArenaBuff
) => {
  return Math.round(
    heroProgress.atk *
      heroStarsBuff(heroProgress) *
      (100 / (100 + atkDebuff(sp4mult, heroProgress, opponentTeam))) *
      ((1 + runesStats.atk / 100) * (1 + gwArenaBuff) + atkBuff(sp4mult, heroProgress, myTeam))
  );
};

const apsBuff = (heroProgress, myTeam) => {
  let value = 0;

  myTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    let heroValue = 0;
    if (h.sp4 === SP4_TYPES.ELEMENT_ATK_SPD_10 && sameElement) {
      heroValue += 0.1;
    }

    value = value + heroValue * heroStarMult;
  });

  return 1 + value;
};

const apsDebuff = (heroProgress, opponentTeam) => {
  let value = 0;

  opponentTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    if (h.sp4 === SP4_TYPES.DEBUFF_ATK_SPD_10_PRC) {
      value += 10 * heroStarMult;
    }
  });

  return value;
};

const getHeroAps = (heroProgress, runesStats, myTeam, opponentTeam) => {
  return (
    heroProgress.aps *
    (100 / (100 + apsDebuff(heroProgress, opponentTeam))) *
    (runesStats.aps / 100 + apsBuff(heroProgress, myTeam))
  );
};

const mvspdBuff = (heroProgress, myTeam) => {
  let value = 0;

  myTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    const sameElement = h.elementKind === heroProgress.elementKind;

    let heroValue = 0;
    if (h.sp4 === SP4_TYPES.ELEMENT_MOVE_SPEED_25 && sameElement) {
      heroValue += 0.25;
    } else if (h.sp4 === SP4_TYPES.ALL_MOVE_SPEED_25) {
      heroValue += 0.25;
    }

    value = value + heroValue * heroStarMult;
  });

  return 1 + value;
};

const mvspdDebuff = (heroProgress, opponentTeam) => {
  let value = 0;

  opponentTeam.forEach((h) => {
    const heroStarMult = Math.max(0, h.ev - 3);
    if (h.sp4 === SP4_TYPES.DEBUFF_MOVE_SPD_25_PRC) {
      value += 25 * heroStarMult;
    }
  });

  return value;
};

const getHeroMvspd = (heroProgress, runesStats, myTeam, opponentTeam) => {
  return (
    heroProgress.mvspd *
    (100 / (100 + mvspdDebuff(heroProgress, opponentTeam))) *
    (runesStats.mvspd / 100 + mvspdBuff(heroProgress, myTeam))
  );
};

const makeHeroPreMapper = (
  sp4Mult,
  teamLabel,
  myTeam /* :Array<HeroInfoWithBattleProgress | HeroInfoWithOwnedHeroRecord> */,
  opponentTeam /* :Array<HeroInfoWithBattleProgress | HeroInfoWithOwnedHeroRecord> */,
  buffMap,
  isX2
) => (
  h /* :HeroInfoWithBattleProgress | HeroInfoWithOwnedHeroRecord */
) /* :HeroBattleStats */ => {
  let runesStats;
  if (h.type === "basic") {
    runesStats = computerunesStats((h /*:any */));
  } else {
    runesStats = h.runesStats;
  }

  let gwBuff = 0;
  if (buffMap[h.class]) {
    gwBuff += 0.5 * buffMap[h.class];
  }
  if (buffMap[h.elementKind]) {
    gwBuff += 0.5 * buffMap[h.elementKind];
  }

  let x2Mult = 1
  if (isX2) {
    x2Mult = 2;
  }

  const initialHp =
    getHeroInitialHp(sp4Mult, h, runesStats, myTeam, opponentTeam, gwBuff) * x2Mult;

  const result /* : HeroBattleStats */ = {
    name: h.name,
    class: h.class,
    flying: h.flying,
    ev: h.ev,
    elementKind: h.elementKind,
    dodgerate: h.dodgerate,
    emoji: h.emoji,
    emojiId: h.emojiId,
    sp1: h.sp1,
    sp2: h.sp2,
    sp5: h.sp5,
    timedSp2Sec: h.timedSp2Sec,
    runes: h.runes || ["D", "D", "D"],

    weapon: h.weapon || 1,
    id: `${teamLabel}-${h.nameNoSpace}`,
    initialHp,
    initialKnightShield:
      (h.class === "knight"
        ? initialHp * (0.2 * (1 + runesStats.knightShield / 100))
        : 0),
    def: getHeroDef(sp4Mult, h, runesStats, myTeam, opponentTeam, gwBuff) * x2Mult,
    atk: getHeroAtk(sp4Mult, h, runesStats, myTeam, opponentTeam, gwBuff) * x2Mult,
    aps: getHeroAps(h, runesStats, myTeam, opponentTeam),
    ctkrate: h.ctkrate + runesStats.ctkrate,
    ctkdmg: h.ctkdmg * (1 + runesStats.ctkdmg / 100),
    atkrange: h.atkrange * (1 + runesStats.atkrange / 100),
    mvspd: getHeroMvspd(h, runesStats, myTeam, opponentTeam),
    aoeMult: 1 + runesStats.aoe / 100,
    additionalStunChancePrc: runesStats.stunChance,
    stunTimeMutl: 1 + runesStats.stunTime / 100,
    additionalFreezeChancePrc: runesStats.freezeChance,
    freezeTimeMult: 1 + runesStats.freezeTime / 100,
    additionalBurnChancePrc: runesStats.burnChance,
    burnTimeMult: 1 + runesStats.burnTime / 100,
    additionalPoisonChancePrc: runesStats.poisonChance,
    poisonTimeMult: 1 + runesStats.poisonTime / 100,
  };
  return { ...(h /*: any */), ...result }; // any is a hack for code that accesing runes search: 234234233
};

const addHeroInfoToHeroProgress = (type /* : 'basic' | 'detailed' */) => (
  heroProgress
) /* :HeroInfoWithBattleProgress | HeroInfoWithOwnedHeroRecord */ => {
  const hero =
    ALL_HEROS.find((hh) => hh.name === heroProgress.name) || FALL_BACK_HERO;

  return { type, ...(hero /*:any */), ...(heroProgress /*: any */) };
};

const portalStats = {
  mvspd: 0,
  atkrange: 0,
  atk: 0,
  def: 0,
  elementKind: "none",
  spawnInTicks: 1,
  emoji: portalEmoji,
  emojiId: portalEmojiId,
  flying: false,
};
function byHp(h1, h2) {
  return h1.initialHp - h2.initialHp;
}

const spawnPriority = (h) => {
  if (h.id.includes("portal")) {
    return 0;
  }
  switch (h.class) {
    case "knight":
    case "barbarian":
      return 1;
    case "lancer":
    case "brawler":
    case "samurai":
      return 2;
    case "rogue":
      return 3;
    default:
      return 4;
  }
};

export function computeTeamStats(
  sp4Mult /* :number */,
  attackerTeam /* :BattleTeamDefinition */,
  defenderTeam /* :BattleTeamDefinition */
) {
  const attackerMapper = addHeroInfoToHeroProgress(attackerTeam.type);
  const ateam = attackerTeam.team.map(attackerMapper);
  const defenderMapper = addHeroInfoToHeroProgress(defenderTeam.type);
  const dteam = defenderTeam.team.map(defenderMapper);
  const attackerHeroMapper = makeHeroPreMapper(
    sp4Mult,
    "a",
    ateam,
    dteam,
    attackerTeam.buff,
    attackerTeam.type === 'detailed' && attackerTeam.isX2
  );
  const defenterHeroMapper = makeHeroPreMapper(
    sp4Mult,
    "d",
    dteam,
    ateam,
    defenderTeam.buff
  );
  const herosArr = [
    ...ateam.map(attackerHeroMapper),
    ...dteam.map(defenterHeroMapper),
  ];

  return herosArr;
}

function computePortalHp(team) {
  return team.reduce((a, h) => a + h.initialHp, 0) * 1.2;
}

export function computeBattleInitialState(
  sp4Mult /* :number */,
  attackerTeam /* :BattleTeamDefinition */,
  defenderTeam /* :BattleTeamDefinition */,
  rndGenerator /* :() => number */
) /* : {| state: BattleState, herosStatsMap: HerosBattleStatsMap |} */ {
  const herosArr = computeTeamStats(sp4Mult, attackerTeam, defenderTeam);
  const aHeros = herosArr.filter((h) => h.id.startsWith("a")).sort(byHp);
  const dHeros = herosArr.filter((h) => h.id.startsWith("d")).sort(byHp);

  herosArr.push({
    ...aHeros[0],
    ...portalStats,
    hp: computePortalHp(aHeros),
    initialHp: computePortalHp(aHeros),
    knightShield: 0,
    id: aPortalId,
  });
  herosArr.push({
    ...dHeros[0],
    ...portalStats,
    hp: computePortalHp(dHeros),
    initialHp: computePortalHp(dHeros),
    knightShield: 0,
    id: dPortalId,
  });

  const sortedHerosArr = herosArr
    // randomise spawn order within the spawn groups
    .map((h) => ({
      ...h,
      spawnIndex: spawnPriority(h) * 1000 + rndGenerator() * 999,
    }))
    .sort((h1, h2) => h1.spawnIndex - h2.spawnIndex);

  let attackerSpawnCounter = 0;
  let defenderSpawnCounter = 0;
  const state /* :BattleState */ = {
    ticks: 0,
    heros: sortedHerosArr.reduce((a, h) => {
      const isAttacker = h.id.startsWith("a");

      const spawnIndex = isAttacker
        ? attackerSpawnCounter
        : defenderSpawnCounter;
      if (isAttacker) {
        attackerSpawnCounter++;
      } else {
        defenderSpawnCounter++;
      }
      a[h.id] = ({
        hp: h.initialHp,
        knightShield: h.initialKnightShield,
        spawnIndex,
        spawnInTicks:
          1 + spawnIndex * TICKS_IN_ONE_SECOND * TIME_BETWEEN_HEROS_SPAWN_SECS,
        position: 0,
        ticksUntilNextSp1: 0,
        ticksTillSp2: h.timedSp2Sec ? h.timedSp2Sec * TICKS_IN_ONE_SECOND : 0,
        attacksTillNextSp2: 6, // TODO implement exceptions for sp2
        stunTicks: 0,
        freezeTicks: 0,
        pushingBackTicks: 0,
        possessedTicks: 0,
        effectsOverTime: [],
        depth: h.id.includes('portal') ? 0 : Math.floor(0.8 + rndGenerator() * 8.4)
      } /*:HeroBattleStateRO */);
      return a;
    }, {}),
  };

  return {
    state,
    herosStatsMap: sortedHerosArr.reduce(
      (a, h) => ({ ...a, [(h.id /*:any */)]: h } /*:any */),
      {}
    ),
  };
}
