/* @flow */

/* :: import type { HeroBattleStats, AttackProps } from '../../../../../server/types' */
import { SP1_TYPES, SP2_TYPES } from "../../constants/constants.mjs";

export const computeAttackProps = (
  isSp2Time /* :bool */,
  heroStats /* :HeroBattleStats */,
  rndGenerator /* :() => number */
) /* :AttackProps */ => {
  const ability = isSp2Time ? heroStats.sp2 : heroStats.sp1;

  // TODO SP5 handling

  let atkDmgMult = isSp2Time ? 5 : 1;
  let numberOfAttacks = 1;
  let stunChance = 0;
  let freezeChance = 0;
  let burnChance = 0;
  let poisonChance = 0;
  let stunTime = 0;
  let freezeTime = 0;
  let burnTime = 0;
  let poisonTime = 0;
  let targetSelectionMethod = "closest-enemy";
  let aoe = 0;
  let healPrcOfOwnHealth = 0;
  let healOverSecTime = 0;
  let possessTime = 0;
  let vampiric = 0;
  let healRndAllyFromDmgDone = 0;
  let burnMult = 0.6;
  let poisonMult = 1.2;
  let forceNoFlyer = false;
  let pushDistance = 0;

  let slowDown = 0;
  let slowDownTime = 0;
  let defDown = 0;
  let defDownTime = 0;
  let atkDown = 0;
  let atkDownTime = 0;

  // TODO
  /*  let atkDown = 0;
        let atkDownTime = 0;
        
        let shieldPrcOfOwnHealth = 0; // Green Fairy
        let rushRange = 0; //Thor
        let summon = ""; // 'skel-archer' | 'skel-infantry' | 'skel-giant' | 'chaos'
        let teleportRange = 0; //kasumi
       */
  switch (ability) {
    case SP1_TYPES.NORMAL:
      break;
    case SP1_TYPES.FREEZE_2SEC_30PRC: //FrostQueen
      freezeChance = 30;
      freezeTime = 2;
      break;
    case SP1_TYPES.FREEZE_2SEC_10PRC: //IceKnight | IceCube
      freezeChance = 10;
      freezeTime = 2;
      break;
    case SP1_TYPES.FREEZE_2SEC_5PRC: //Valkyrie
      freezeChance = 5;
      freezeTime = 2;
      break;
    case SP1_TYPES.AOE_100: //Pirato | Namida | Scud | Bun-Gun | MonkiMortar
      aoe = 100;
      break;
    case SP1_TYPES.BURN_30_PRC_5SEC: //VulkanArcher | Spark | Alda
      burnChance = 30;
      burnTime = 5;
      break;
    case SP1_TYPES.BURN_10_PRC_5SEC: //TinyDragon
      burnChance = 10;
      burnTime = 5;
      break;
    case SP1_TYPES.POISON_20_PRC_5SEC: //VoodooSpear | VoodooArcher | VoodooDagger
      poisonChance = 20;
      poisonTime = 5;
      break;
    case SP1_TYPES.POISON_10_PRC_5SEC: //PumpKing | Clawdette | Thorn
      poisonChance = 10;
      poisonTime = 5;
      break;
    case SP1_TYPES.POISON_30_PRC_5SEC_100_AOE: //Misty
      aoe = 100;
      poisonChance = 30;
      poisonTime = 5;
      break;
    case SP1_TYPES.STUN_10_PRC_2_SEC: //Spike
      stunChance = 10;
      stunTime = 2;
      break;
    case SP1_TYPES.STUN_20_PRC_CHANCE_3_SEC: //Tesla
      stunChance = 20;
      stunTime = 3;
      aoe = 100;
      break;
    case SP1_TYPES.VAMPIRIC: //Vlad | Pinky
      vampiric = 0.5; //heal 0.5x damage to self
      break;
    case SP1_TYPES.TRIKSTER_MAGIC_CARD: {
      //Trickster
      const rnd = rndGenerator() * 100;
      if (rnd < 25) {
        atkDown = 50;
        atkDownTime = 2;
      } else if (rnd < 50) {
        slowDown = 50;
        slowDownTime = 2;
      } else if (rnd < 75) {
        defDown = 50;
        defDownTime = 2;
      } else {
        stunChance = 100;
        stunTime = 2;
      }
      break;
    }
    case SP2_TYPES.NORMAL_X3: //40 Heroes
      atkDmgMult = 1.66;
      numberOfAttacks = 3;
      break;
    case SP2_TYPES.FREEZE_2SEC_10PRC: //IceKnight | FrostQueen | Valkyrie
      freezeChance = 10;
      freezeTime = 2;
      atkDmgMult = 1.66;
      numberOfAttacks = 3;
      break;
    case SP2_TYPES.AOE_150: //Pirato | Scud | Hooky | MonkiMortar
      aoe = 150;
      break;
    case SP2_TYPES.AOE_150_X3: //BugonautGiant | VulcanHammer | Magmus | Wolfie | Chaos |
      aoe = 150;
      atkDmgMult = 1.66;
      numberOfAttacks = 3;
      break;
    case SP2_TYPES.AOE_350: //Atlantus | Gladiator | Siegfried | SkeletonGiant | Onyx
      aoe = 350;
      break;
    case SP2_TYPES.AOE_300: //MechaValken | Natura | MonkiRoboti |
      aoe = 300;
      break;
    case SP2_TYPES.AOE_300_X7: //MonkiKing
      aoe = 300;
      numberOfAttacks = 7;
      atkDmgMult = 0.7;
      break;
    case SP2_TYPES.PUSH4: // Akwa 
      pushDistance = 200;
      targetSelectionMethod = "wave4";
      break;
    case SP2_TYPES.PUSH10: //Goddess | Ra
      pushDistance = 200;
      targetSelectionMethod = "wave10";
      forceNoFlyer = true;
      break;
    case SP2_TYPES.DEF_DOWN_50_PRC_6_SEC: //Snowman
      atkDmgMult = 0.1;
      defDown = 50;
      defDownTime = 6;
      aoe = 5000;
      forceNoFlyer = true;
      break;
    case SP2_TYPES.NAMIDA_MISSLES: //Namida
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      slowDown = 45;
      slowDownTime = 5;
      targetSelectionMethod = "enemy-backline";
      break;
    case SP2_TYPES.FREEZE_2SEC_10PRC_AOE_150: //IceCube
      freezeChance = 10;
      freezeTime = 2;
      aoe = 150;
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      break;
    case SP2_TYPES.BURN_10_PRC_5SEC: //ValkanArcher | Alda
      burnChance = 10;
      burnTime = 5;
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      break;
    case SP2_TYPES.BURN_30_PRC_5SEC: //Spyro
      burnChance = 30;
      burnTime = 5;
      break;
    case SP2_TYPES.BURN_5_PRC_5SEC: //TinyDragon
      burnChance = 5;
      burnTime = 5;
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      break;
    case SP2_TYPES.STUN_2_SEC_600_AOE: //Xak
      stunTime = 2;
      stunChance = 100;
      aoe = 600;
      break;
    case SP2_TYPES.BURN_5SEC_100_PRC_CHANCE_400_AOE: //Torch
      burnChance = 100;
      burnTime = 5;
      aoe = 400;
      break;
    case SP2_TYPES.POISON_10_PRC_5SEC: //VoodooArcher
      poisonChance = 10;
      poisonTime = 5;
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      break;
    case SP2_TYPES.POISON_20_PRC_5SEC: //Clawdette
      poisonChance = 20;
      poisonTime = 5;
      numberOfAttacks = 6;
      atkDmgMult = 0.83;
      break;
    case SP2_TYPES.POISON_30_PRC_5_SEC_440_AOE: //PumpKing
      poisonChance = 30;
      poisonTime = 5;
      aoe = 440;
      break;
    case SP2_TYPES.SLOWDOWN_70_PRC_GROOVE: //Groovine
      slowDown = 30;
      slowDownTime = 6;
      atkDmgMult = 0;
      targetSelectionMethod = "wave10";
      forceNoFlyer = true;
      break;
    case SP2_TYPES.POISON_30_PRC_5SEC_150_AOE: //Misty
      poisonChance = 30;
      poisonTime = 5;
      aoe = 150;
      break;
    case SP2_TYPES.PIERCING_BURN_100_PRC_3SEC: //Spark
      burnChance = 100;
      burnTime = 3;
      targetSelectionMethod = "wave4";
      forceNoFlyer = true;
      atkDmgMult = 1;
      burnMult = 1;
      break;
    case SP2_TYPES.POISON_100_PRC_600_AOE: //Thorn
      poisonChance = 100;
      poisonTime = 5;
      aoe = 600;
      break;
    case SP2_TYPES.SHIELD_5_PRC_OF_HEALTH: //GreenFaery
      atkDmgMult = 0;
      // TODO
      // shieldPrcOfOwnHealth = 5;
      targetSelectionMethod = "random-ally";
      break;
    case SP2_TYPES.FROGIFY: //Petunia
      // timed SP2 can not be process here, so they have to be removed from this list,
      // but for now let's assume they are normal SP2 that trigger every 6 atks
      stunChance = 100;
      stunTime = 6;
      defDown = 1000;
      defDownTime = 6;
      targetSelectionMethod = "random-within-2x-range";
      break;
    case SP2_TYPES.HEALING_6_PRC_OF_CASTERS_LIFE_FOR_5_SEC: //Healbot
      targetSelectionMethod = "ally-with-least-hp-prc";
      healPrcOfOwnHealth = 6;
      healOverSecTime = 5;
      atkDmgMult = 0;
      break;
    case SP2_TYPES.STUN_30_PRC_350_AOE: //Spike
      stunChance = 30;
      stunTime = 2;
      aoe = 350;
      break;
    case SP2_TYPES.BLIND_70_PRC_150_AOE_3_SEC: //Bun-Gun
      // TODO
      // slowDown = 70; It should be blind right?
      // slowDownTime = 3;
      aoe = 150;
      break;
    case SP2_TYPES.HEAL_100_PRC_CASTER_LIFE: //Merlinus
      targetSelectionMethod = "ally-with-least-hp-prc";
      healPrcOfOwnHealth = 100;
      atkDmgMult = 0;
      break;
    case SP2_TYPES.STUN_2_SEC_ATK_DOWN_10_PRC_400_AOE: //SerShu
      stunChance = 100;
      stunTime = 2;
      aoe = 400;
      atkDown = 10;
      atkDownTime = 2;
      break;
    case SP2_TYPES.THOR_RUSH: //Thor
      stunChance = 100;
      stunTime = 1;
      aoe = 250;
      // TODO
      // rushRange = 250;
      break;
    case SP2_TYPES.STUN_3_SEC_150_AOE: //Tesla
      stunChance = 100;
      stunTime = 3;
      aoe = 150;
      break;
    case SP2_TYPES.ANGEL_BARRIER: //Paladin
      aoe = 250;
      atkDmgMult = 0;
      healPrcOfOwnHealth = 1;
      healOverSecTime = 8;
      targetSelectionMethod = "self";
      break;
    case SP2_TYPES.ATK_DOWN_20_PRC_5_SEC: //DragonBot
      atkDown = 20;
      atkDownTime = 5;
      numberOfAttacks = 3;
      atkDmgMult = 1.66;
      break;
    case SP2_TYPES.SORROW_FATAL_WEAKNESS: //Sorrow
      atkDmgMult = 5;
      targetSelectionMethod = "weakest-enemy";
      break;
    case SP2_TYPES.CIRCE_POSSESS: //Circe
      possessTime = 2.6 + heroStats.ev * 0.7;
      targetSelectionMethod = "random-within-2x-range";
      atkDmgMult = 0;
      break;
    case SP2_TYPES.VLAD_BLOOD_LUST: //Vlad
      atkDmgMult = 1.66;
      numberOfAttacks = 3;
      vampiric = 0.5;
      healRndAllyFromDmgDone = 4;
      break;
    case SP2_TYPES.NECROMANCER_SPAWN_SKELETON:
      atkDmgMult = 0;
      //Summon inherits 50% of casters hp and all rune bonuses
      // TODO
      /* 
              targetSelectionMethod = "self";
              const rnd = rndGenerator() * 100;
              if (rnd < 55) {
                summon = "skel-archer";
              } else if (rnd < 83) {
                summon = "skel-infantry";
              } else if (rnd < 95) {
                summon = "skel-giant";
              } else {
                summon = "chaos";
              } */
      break;
    case SP2_TYPES.KASUMI_ASSASINATION:
      // TODO
      // teleportRange = 400;
      break;
    case SP2_TYPES.TRIKSTER_CARDS_CASCADE:
      {
        numberOfAttacks = 3;
        atkDmgMult = 1.66;
        targetSelectionMethod = "random-within-2x-range";
        const rnd = rndGenerator() * 100;
        if (rnd < 25) {
          atkDown = 50;
          atkDownTime = 2;
        } else if (rnd < 50) {
          slowDown = 50;
          slowDownTime = 2;
        } else if (rnd < 75) {
          defDown = 50;
          defDownTime = 2;
        } else {
          stunChance = 100;
          stunTime = 2;
        }
      }
      break;
    default:
    // do nothing
  }

  stunChance += heroStats.additionalStunChancePrc;
  if (heroStats.class === "lancer") {
    stunChance += 30;
  }
  if (stunTime === 0 && stunChance > 0) {
    stunTime = 2;
  }
  stunTime = stunTime * heroStats.stunTimeMutl;

  freezeChance += heroStats.additionalFreezeChancePrc;
  if (freezeTime === 0 && freezeChance > 0) {
    freezeTime = 2;
  }
  freezeTime = freezeTime * heroStats.freezeTimeMult;

  burnChance += heroStats.additionalBurnChancePrc;
  if (burnTime === 0 && burnChance > 0) {
    burnTime = 2;
  }
  burnTime = burnTime * heroStats.burnTimeMult;

  poisonChance += heroStats.additionalPoisonChancePrc;
  if (poisonTime === 0 && poisonChance > 0) {
    poisonTime = 2;
  }
  poisonTime = poisonTime * heroStats.poisonTimeMult;

  return {
    atkDmgMult,
    numberOfAttacks,
    stunChance,
    freezeChance,
    burnChance,
    poisonChance,
    stunTime,
    freezeTime,
    burnTime,
    poisonTime,
    healPrcOfOwnHealth,
    healOverSecTime,
    possessTime,
    vampiric,
    healRndAllyFromDmgDone,
    burnMult,
    poisonMult,
    pushDistance,
    targetSelectionMethod,
    forceNoFlyer,
    aoe,
    slowDown,
    slowDownTime,
    defDown,
    defDownTime,
    atkDown,
    atkDownTime,
  };
};
