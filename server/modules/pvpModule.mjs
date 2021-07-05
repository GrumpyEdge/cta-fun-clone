/* @flow */
/* :: import type { Bucket, BuffMap, OwnedHeroRecord, UserState, Team, DiscordPlayerMessageHandlerPropsType,  ReducerProps, HeroProgress, RunesStats, HeroProgressI, HeroName, OwnedHeros } from '../types' */

import { computeTeamStats } from "../../web-app/src/shared/utils/battle/computeBattleInitialState.mjs";
import { computerunesStats } from "../../web-app/src/shared/utils/runes.mjs";
import Discord from "discord.js";
import { splitArrIntoChunks } from "../../web-app/src/shared/utils/utils.mjs";
import {
  printNumber,
  printDecimal,
} from "../../web-app/src/shared/utils/utils.mjs";
import { battle } from "../../web-app/src/shared/utils/battle/battle.mjs";
import { ALL_HEROS } from "../../web-app/src/shared/constants/heros.mjs";
import {
  evAwWepEmojiesMap,
  evAwWepLegendEmoji,
  powerEmoji,
  statusHealEmoji,
  atkEmoji,
  defEmoji,
  hpEmoji,
  apsEmoji,
  spdEmoji,
  rngEmoji,
  runeEmojiesMap,
  portalEmoji,
  emptyWeaponSlotEmoji,
  statusPoisonedEmoji,
  statusStunnedEmoji,
  statusBurnedEmoji,
  statusFrozenEmoji,
} from "../../web-app/src/shared/constants/emoji.mjs";
import { ONE_TICK_MS } from "../../web-app/src/shared/constants/constants.mjs";
import {
  getTeamPower,
  getHeroPower,
  getHeroPowerDetailed,
} from "../../web-app/src/shared/utils/team.mjs";
import { parseHeros } from "../parseUtils.mjs";

const allTeamsMap /* : { [string]: {| heros: Team, ownerUserId: string |} } */ = {};
/* ::
  type SetTeamAction = {|
    type: 'SET_TEAM',
    teamName: string,
    heros: Team
  |}
  type RemoveTeamAction = {| type: 'REMOVE_TEAM', teamName: string |}
  type SetOwnedHerosNames = {| type: "SET_OWNED_HEROS_NAMES", herosNames: Array<HeroName> |}
  type ClientConnected = {| type: "WEB_APP_CLIENT_CONNECTED", userid: string |}
  type SetOwnedHeroStats = {|
                type: "SET_OWNED_HERO_STATS",
                hero: OwnedHeroRecord,
                heroName: HeroName
              |}
  type SendBattleStatsToDM = {|
    type: "SEND_BATTLE_STATS_TO_DISCORD_DM",
    rndSeed: number,
    attackerTeam: Array<OwnedHeroRecord>,
    enemyTeamName: string,
    enemyTeam: Team,
    enemyTeamBuffMap: BuffMap,
    ownTeamBuffMap: BuffMap,
    isX2: bool,
  |}

  type DeleteBucket = {|
    type: "DELETE_BUCKET",
    bucketName: string,
  |}

  type CreateOrEditEditBucket = {|
    type: "CREATE_OR_EDIT_BUCKET",
    bucket: Bucket,
  |}

  export type PvpModuleAction = 
  | SetTeamAction
  | RemoveTeamAction
  | SetOwnedHerosNames
  | ClientConnected
  | SetOwnedHeroStats
  | SendBattleStatsToDM
  | DeleteBucket
  | CreateOrEditEditBucket
*/

const SET_TEAM = "SET_TEAM";
const printTeamShort = (teamName, team, reverse) => {
  const teamProgressEmojiesArr = [];
  const teamHeroEmojiesArr = [];

  team.forEach((h) => {
    const hero = ALL_HEROS.find((hh) => hh.name === h.name);
    if (!hero) return null;
    teamProgressEmojiesArr.push(
      evAwWepEmojiesMap[`${h.ev}${h.aw}${h.weapon || ""}`]
    );
    teamHeroEmojiesArr.push(hero.emoji);
  });

  const parts = [
    `${teamProgressEmojiesArr.join("")}${evAwWepLegendEmoji}`,
    `${teamHeroEmojiesArr.join("")}${powerEmoji} ${getTeamPower(team)}`,
  ];

  if (reverse) {
    parts.reverse();
  }
  return {
    name: teamName,
    value: parts.join("\n"),
  };
};
const makePrintTeamShort = (teams, reverse) => (teamName) => {
  const team = teams[teamName];

  return printTeamShort(teamName, team, reverse);
};
const printTeams = async (reply, getActiveCharacterState) => {
  const { teams } = getActiveCharacterState();
  const printTeamShort = makePrintTeamShort(teams);
  const teamNames = Object.keys(teams);
  const groups = splitArrIntoChunks(7, teamNames.map(printTeamShort));

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    const message = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`Teams`)
      .addFields(...group);

    await reply(message);
  }
};

const printRunes = (heroProgress) => {
  let result = "";
  for (let i = 0; i < heroProgress.weapon; i++) {
    const rune = heroProgress.runes[Math.floor(i / 3)];

    result += runeEmojiesMap[rune] || emptyWeaponSlotEmoji;
  }
  return result;
};

const printrunesStats = /* ::<T: HeroProgressI> */ (heroProgress /* :T */) => {
  const {
    hp,
    def,
    atk,
    aps,
    ctkdmg,
    ctkrate,
    aoe,
    atkrange,
    mvspd,
    freezeTime,
    freezeChance,
    stunTime,
    stunChance,
    poisonTime,
    poisonChance,
    burnChance,
    burnTime,
    knightShield,
  } = computerunesStats(heroProgress);
  const hpS = hp ? `${runeEmojiesMap.V} ${Math.round(hp)}%` : "";
  const defS = def ? `${runeEmojiesMap.G} ${Math.round(def)}%` : "";
  const atkS = atk ? `${runeEmojiesMap.D} ${Math.round(atk)}%` : "";
  const apsS = aps ? `${runeEmojiesMap.A} ${Math.round(aps)}%` : "";
  const critDmgS = ctkdmg ? `${runeEmojiesMap.R} ${Math.round(ctkdmg)}%` : "";
  const critChanceS = ctkrate
    ? `${runeEmojiesMap.P} ${Math.round(ctkrate)}%`
    : "";
  const aoeS = aoe ? `${runeEmojiesMap.E} ${Math.round(aoe)}%` : "";
  const atkRangeS = atkrange ? `${rngEmoji} ${Math.round(atkrange)}%` : "";
  const mvSpdS = mvspd ? `${spdEmoji} ${Math.round(mvspd)}%` : "";
  const freezeTimeS = freezeTime
    ? `${runeEmojiesMap.F} ${Math.round(freezeTime)}%`
    : "";
  const freezeChanceS = freezeChance
    ? `${runeEmojiesMap.C} ${Math.round(freezeChance)}%`
    : "";
  const stunTimeS = stunTime
    ? `${runeEmojiesMap.S} ${Math.round(stunTime)}%`
    : "";
  const stunChanceS = stunChance
    ? `${runeEmojiesMap.X} ${Math.round(stunChance)}%`
    : "";
  const poisonTimeS = poisonTime
    ? `${runeEmojiesMap.W} ${Math.round(poisonTime)}%`
    : "";
  const poisonChanceS = poisonChance
    ? `${runeEmojiesMap.Y} ${Math.round(poisonChance)}%`
    : "";
  const burnChanceS = burnChance
    ? `${runeEmojiesMap.I} ${Math.round(burnChance)}%`
    : "";
  const burnTimeS = burnTime
    ? `${runeEmojiesMap.B} ${Math.round(burnTime)}%`
    : "";
  const knightShieldS = knightShield
    ? `${runeEmojiesMap.K} ${Math.round(knightShield)}%`
    : "";

  const pairs = [
    [hp, hpS],
    [def, defS],
    [atk, atkS],
    [aps, apsS],
    [ctkdmg, critDmgS],
    [ctkrate, critChanceS],
    [aoe, aoeS],
    [atkrange, atkRangeS],
    [mvspd, mvSpdS],
    [freezeTime, freezeTimeS],
    [freezeChance, freezeChanceS],
    [stunTime, stunTimeS],
    [stunChance, stunChanceS],
    [poisonTime, poisonTimeS],
    [poisonChance, poisonChanceS],
    [burnChance, burnChanceS],
    [burnTime, burnTimeS],
    [knightShield, knightShieldS],
  ].sort(([v1], [v2]) => v2 - v1);

  return pairs
    .map((p) => p[1])
    .filter((x) => x)
    .join(" ");
};

export const printTeam = async (
  reply /* : string => Promise<any> */,
  teamName /* :string */,
  shouldPrintRunes /* :bool */,
  heros /* :Team | Array<OwnedHeroRecord> */,
  defenderHeros /* :Team | Array<OwnedHeroRecord> */,
  attackerBuff /* : BuffMap */,
  defenderBuff /* : BuffMap */,
  isX2 /* :bool */
) => {
  const teamsStats = computeTeamStats(
    0.2,
    heros[0].runesStats
      ? { type: "detailed", team: (heros /*: any */), buff: attackerBuff, isX2 }
      : { type: "basic", team: (heros /*: any */), buff: attackerBuff },
    defenderHeros[0] && defenderHeros[0].runesStats
      ? {
          type: "detailed",
          team: (defenderHeros /*: any */),
          buff: defenderBuff,
          isX2,
        }
      : { type: "basic", team: (defenderHeros /*: any */), buff: defenderBuff }
  );
  const message = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`Team "${teamName}" ${getTeamPower(heros)}${powerEmoji}`)
    .addFields(
      ...heros
        .map((h) => {
          const hero = teamsStats.find((hh) => hh.name === h.name);
          if (!hero) return null;
          return {
            name: `${hero.emoji} ${
              evAwWepEmojiesMap[`${h.ev}${h.aw}${h.weapon || ""}`]
            } - ${
              h.runesStats ? getHeroPowerDetailed(h) : getHeroPower(h)
            }${powerEmoji} - ${hero.name}`,
            value: `${atkEmoji} ${printNumber(
              hero.atk
            )} ${defEmoji} ${printNumber(hero.def)} ${hpEmoji} ${printNumber(
              hero.initialHp
            )} ${apsEmoji} ${printDecimal(hero.aps)} ${
              runeEmojiesMap.P
            } ${printNumber(hero.ctkrate)}% ${runeEmojiesMap.R} x${printDecimal(
              hero.ctkdmg / 100
            )} ${rngEmoji} ${printNumber(
              hero.atkrange
            )} ${spdEmoji} ${printNumber(hero.mvspd)}${
              shouldPrintRunes ? "\n" + printRunes(hero) : ""
            }
${hero.runesStats ? "" : printrunesStats((hero /*: any */))}`, // Hack search: 234234233
          };
        })
        .filter((x) => x)
    );

  await reply(message);
};

async function printBattleResults(reply, battleResult) {
  const { battleResultStats } = battleResult;
  const herosStatsMap = {};

  Object.keys(battleResultStats.fromToMap).forEach((casterId) => {
    Object.keys(battleResultStats.fromToMap[casterId]).forEach((targetId) => {
      const {
        heal,
        plain,
        crit,
        absorbedByDef,
        burn,
        poison,
        stunSec,
        freezeSec,
      } = battleResultStats.fromToMap[casterId][targetId];

      const makeDefaultStats = () => ({
        given: {
          plain: 0,
          crit: 0,
          absorbedByDef: 0,
          burn: 0,
          poison: 0,
          heal: 0,
          stunSec: 0,
          freezeSec: 0,
        },
        received: {
          plain: 0,
          crit: 0,
          absorbedByDef: 0,
          burn: 0,
          poison: 0,
          heal: 0,
          stunSec: 0,
          freezeSec: 0,
        },
      });
      if (!herosStatsMap[targetId]) {
        herosStatsMap[targetId] = makeDefaultStats();
      }
      if (!herosStatsMap[casterId]) {
        herosStatsMap[casterId] = makeDefaultStats();
      }
      herosStatsMap[casterId].given.heal += heal;
      herosStatsMap[casterId].given.plain += plain;
      herosStatsMap[casterId].given.crit += crit;
      herosStatsMap[casterId].given.absorbedByDef += absorbedByDef;
      herosStatsMap[casterId].given.burn += burn;
      herosStatsMap[casterId].given.poison += poison;
      herosStatsMap[casterId].given.stunSec += stunSec;
      herosStatsMap[casterId].given.freezeSec += freezeSec;

      herosStatsMap[targetId].received.heal += heal;
      herosStatsMap[targetId].received.plain += plain;
      herosStatsMap[targetId].received.crit += crit;
      herosStatsMap[targetId].received.absorbedByDef += absorbedByDef;
      herosStatsMap[targetId].received.burn += burn;
      herosStatsMap[targetId].received.poison += poison;
      herosStatsMap[targetId].received.stunSec += stunSec;
      herosStatsMap[targetId].received.freezeSec += freezeSec;
    });
  });

  const calcHerosStatsFields = (key /* : 'given' | 'received' */) =>
    Object.keys(herosStatsMap)
      .map((heroId) => {
        const {
          heal,
          plain,
          crit,
          absorbedByDef,
          burn,
          poison,
          stunSec,
          freezeSec,
        } = herosStatsMap[heroId][key];

        const totalDmg = plain + crit + poison + burn;
        const critPrc = Math.round((crit / totalDmg) * 100);
        const poisonPrc = Math.round((poison / totalDmg) * 100);
        const burnPrc = Math.round((burn / totalDmg) * 100);
        const absorbedByDefPrc = Math.round((absorbedByDef / totalDmg) * 100);
        const heroName = heroId.split("-")[1];
        return {
          team: heroId[0].toUpperCase(),
          heroName,
          heroEmoji: (
            ALL_HEROS.find((h) => h.nameNoSpace === heroName) || {
              emoji: portalEmoji,
            }
          ).emoji,
          totalDmg,
          critPrc,
          absorbedByDefPrc,
          poisonPrc,
          burnPrc,
          stunSec,
          freezeSec,
          heal,
        };
      })
      .filter(({ totalDmg }) => totalDmg)
      .sort(({ totalDmg: d1 }, { totalDmg: d2 }) => d2 - d1);

  const makeStatsMsg = (key, title) =>
    calcHerosStatsFields(key)
      .map(
        (h) =>
          `${h.team} ${h.heroEmoji} ${atkEmoji} ${printNumber(h.totalDmg)} ${
            runeEmojiesMap.R
          } ${h.critPrc}% ${defEmoji} ${h.absorbedByDefPrc}%${
            h.burnPrc ? ` ${statusBurnedEmoji} ${h.burnPrc}%` : ""
          }${h.poisonPrc ? ` ${statusPoisonedEmoji} ${h.poisonPrc}%` : ""}${
            h.stunSec
              ? ` ${statusStunnedEmoji} ${Math.round(h.stunSec)}sec`
              : ""
          }${
            h.freezeSec
              ? ` ${statusFrozenEmoji} ${Math.round(h.freezeSec)}sec`
              : ""
          }${h.heal ? ` ${statusHealEmoji} ${printNumber(h.heal)}` : ""}`
      )
      .reduce((a, p) => {
        const next = a + "\n" + p;
        if (next.length > 2000) {
          return a;
        }
        return next;
      }, `**${title}**`);

  const message = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`${battleResultStats.won ? "Victory!" : "Defeat!"}`)
    .addFields(
      {
        name: "Stats",
        value: `Total time: ${Math.round(
          (battleResultStats.totalTicks * ONE_TICK_MS) / 1000
        )} seconds
heros lost: ${battleResultStats.numberOfHerosLost}
heros killed: ${battleResultStats.numberOfHerosKilled}`,
      },
      {
        name: "Legend",
        value: `${atkEmoji} total damage
${runeEmojiesMap.R} % of critical damage
${defEmoji} % of damaged absorbed by defence
${statusHealEmoji} amount of damage healed`,
      }
    );

  await reply(message);
  await reply(makeStatsMsg("given", `Damage / CC / Healing **given**`));
  await reply(makeStatsMsg("received", `Damage / CC / Healing **received**`));
}

const reducer = (state, action, userid) /* :UserState */ => {
  if (action.type === SET_TEAM) {
    allTeamsMap[action.teamName] = {
      heros: action.heros,
      ownerUserId: userid,
    };
    return {
      ...state,
      teams: {
        ...state.teams,
        [action.teamName]: action.heros,
      },
    };
  } else if (action.type === "REMOVE_TEAM") {
    delete allTeamsMap[action.teamName];
    const teamsCopy = {
      ...state.teams,
    };
    delete teamsCopy[action.teamName];
    return {
      ...state,
      teams: teamsCopy,
    };
  } else if (action.type === "SET_OWNED_HEROS_NAMES") {
    return {
      ...state,
      ownedHerosNames: action.herosNames,
    };
  } else if (action.type === "SET_OWNED_HERO_STATS") {
    if (!action.hero.runesStats) {
      // old format of this action type is not supported any more
      return state;
    }
    return {
      ...state,
      ownedHeros: {
        ...state.ownedHeros,
        [(action.heroName /*:any */)]: action.hero,
      },
    };
  } else if (action.type === "DELETE_BUCKET") {
    const bucketsCopy = { ...state.buckets };
    delete bucketsCopy[action.bucketName];
    return {
      ...state,
      buckets: bucketsCopy,
    };
  } else if (action.type === "CREATE_OR_EDIT_BUCKET") {
    return {
      ...state,
      buckets: {
        ...state.buckets,
        [action.bucket.name]: action.bucket
      },
    };
  } else if (
    action.type === "WEB_APP_CLIENT_CONNECTED" ||
    action.type === "SEND_BATTLE_STATS_TO_DISCORD_DM"
  ) {
    // do nothing
  } else {
    (action.type /*:empty */);
  }
  return state;
};

export const pvpModule = {
  handler: async (
    {
      input,
      reply,
      getUserState,
      addAction,
      userid,
    } /* :DiscordPlayerMessageHandlerPropsType<PvpModuleAction> */
  ) => {
    if (input.startsWith(".pvp")) {
      await reply(`\`.setteam\` team_name_no_space hero1_name.ev.aw.weapon_lvl.average_rune_stars.average_rune_lvl_progress hero2_name.ev.aw.weapon_lvl.average_rune_stars.average_rune_lvl_progress ...
EXAMPLE: \`.setteam\` dark vlad.7.7.9.5.25.DPA.D.RLM kasu.7.7.9 mm.7.7.9
EXAMPLE1: \`.setteam\` artorawr1 glad.6.4.5.4.15.V.V.GM vlad.5.4.6.4.15.DP.D misty.5.4.4.3.15.D.D dh.5.4.4.3.15.D.D wolf.5.3.5.4.15.VG.G mm.5.3.4.3.10.D.D spark.5.3.3.3.15.D.D groo.4.3.3.2.10.D.D mk.4.2.3.2.1.S.S petu.4.2.3.2.1.D
EXAMPLE2: 
\`.removeteam\` team_name
\`.teams\` to see your teams
\`.fight\` attacker_team_name defender_team_name
`);
      return true;
    } else if (input.startsWith(".teams")) {
      const teamNames = Object.keys(getUserState().teams);

      if (teamNames.length === 0) {
        await reply("There is no teams created.");
        return true;
      }
      await printTeams(reply, getUserState);
      return true;
    } else if (input.startsWith(".removeteam")) {
      const teamName = input.split(" ")[1];
      if (!allTeamsMap[teamName]) {
        await reply(`Team ${teamName} not found.`);
        return;
      }
      if (allTeamsMap[teamName].ownerUserId !== userid) {
        await reply(`Team ${teamName} belongs to other user.`);
        return;
      }
      await addAction({ type: "REMOVE_TEAM", teamName });
      await reply(`Team ${teamName} has been removed.`);
    } else if (input.startsWith(".setteam")) {
      const [
        _, // eslint-disable-line
        teamName,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        h7,
        h8,
        h9,
        h10,
      ] = input.split(" ");

      const existingTeam = allTeamsMap[teamName];

      if (existingTeam && existingTeam.ownerUserId !== userid) {
        await reply(
          `Team ${teamName} is owned by other player. Please choose different name.`
        );
        return true;
      }

      const { heros, error } = parseHeros(teamName, [
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        h7,
        h8,
        h9,
        h10,
      ]);

      if (error) {
        await reply(error);
        return true;
      }

      if (!heros.length) {
        await reply("None of heros was recognized");
        return true;
      }

      const action /* :SetTeamAction */ = { type: SET_TEAM, teamName, heros };
      await addAction(action);
      await printTeam(
        reply,
        teamName,
        input.includes("-runes"),
        heros,
        ([] /*:any */),
        {},
        {},
        false
      );
      return true;
    }
    if (input.startsWith(".team ")) {
      const teamName = input.split(" ")[1];
      const team = getUserState().teams[teamName];

      if (team) {
        await printTeam(
          reply,
          teamName,
          input.includes("-runes"),
          team,
          ([] /*:any */),
          {},
          {},
          false
        );
      } else {
        reply(`Team "${teamName}" not found`);
      }
      return true;
    }

    if (input.startsWith(".fight ")) {
      const teams /* : { [string]: Team } */ = Object.keys(allTeamsMap).reduce(
        (a, k) => {
          a[k] = allTeamsMap[k].heros;
          return a;
        },
        {}
      );
      const printTeamShort = makePrintTeamShort(teams);
      const printTeamShortReverse = makePrintTeamShort(teams, true);
      const [
        _, // eslint-disable-line
        aTeamName,
        dTeamName,
      ] = input.split(" ");
      const ateam = teams[aTeamName];
      const dteam = teams[dTeamName];
      const full = input.includes("-full");
      const printRunes = input.includes("-runes");

      if (ateam && dteam) {
        if (full) {
          await printTeam(
            reply,
            aTeamName,
            printRunes,
            ateam,
            dteam,
            {},
            {},
            false
          );
        }
        reply(`${printTeamShort(aTeamName).value}
***⇧ ${aTeamName} ⇧***   VS   ***⇩ ${dTeamName} ⇩***
${printTeamShortReverse(dTeamName).value}`);
        if (full) {
          await printTeam(
            reply,
            dTeamName,
            printRunes,
            dteam,
            ateam,
            {},
            {},
            false
          );
        }
        const now = Date.now();

        let winCounter = 0;
        let loseCounter = 0;

        let winLostHeros = 10;
        let winBattleResult;
        let lostBattleResult;
        let iterations = input.includes("long") ? 10 : 1;
        while (winCounter + loseCounter < iterations) {
          const result = battle(
            0.2,
            { type: "basic", team: ateam, buff: {} },
            { type: "basic", team: dteam, buff: {} },
            now + winCounter + loseCounter
          );
          const { battleResultStats } = result;
          if (battleResultStats.won) {
            winCounter++;
            if (
              !winBattleResult ||
              winBattleResult.numberOfHerosLost < winLostHeros
            ) {
              winBattleResult = result;
              winLostHeros = battleResultStats.numberOfHerosLost;
            }
          } else {
            loseCounter++;
            lostBattleResult = result;
          }
        }

        if (iterations > 1) {
          await reply(`I have tried ${iterations} battles. It is ${Math.round(
            (loseCounter / (winCounter + loseCounter)) * 100
          )}% of loses.
  Out of ${iterations} battles, i am sharing worst case i have seen, with maximum number of heros lost.`);
        }

        await printBattleResults(
          reply,
          lostBattleResult ||
            winBattleResult ||
            battle(
              0.2,
              { type: "basic", team: ateam, buff: {} },
              { type: "basic", team: dteam, buff: {} },
              now + winCounter + loseCounter
            )
        );
      } else {
        if (!ateam) {
          reply(`Team "${aTeamName}" not found`);
        }
        if (!dteam) {
          reply(`Team "${dTeamName}" not found`);
        }
      }
      return true;
    }
  },
  reducer: (
    {
      state,
      action,
      userid,
      sendMsgToWeb,
      sendMsgToDM,
    } /* : ReducerProps<PvpModuleAction> */
  ) => {
    if (action.type === "SEND_BATTLE_STATS_TO_DISCORD_DM") {
      const result = battle(
        0.2,
        {
          type: "detailed",
          team: action.attackerTeam,
          buff: action.ownTeamBuffMap,
          isX2: action.isX2,
        },
        {
          type: "basic",
          team: action.enemyTeam,
          buff: action.enemyTeamBuffMap,
        },
        action.rndSeed
      );
      printTeam(
        sendMsgToDM,
        "my web team",
        false,
        action.attackerTeam,
        action.enemyTeam,
        action.ownTeamBuffMap,
        action.enemyTeamBuffMap,
        action.isX2
      );
      sendMsgToDM(`${printTeamShort("my web team", action.attackerTeam).value}
***⇧ ${"my web team"} ⇧***   VS   ***⇩ ${action.enemyTeamName} ⇩***
${printTeamShort(action.enemyTeamName, action.enemyTeam, true).value}`);
      printTeam(
        sendMsgToDM,
        action.enemyTeamName,
        false, // TODO, fix problem with too long message and enable it back > 6000
        action.enemyTeam,
        action.attackerTeam,
        action.enemyTeamBuffMap,
        action.ownTeamBuffMap,
        false
      );
      printBattleResults(sendMsgToDM, result);
    }

    const nextState = reducer(state, action, userid);

    if (
      nextState.ownedHeros !== state.ownedHeros ||
      nextState.buckets !== state.buckets ||
      nextState.ownedHerosNames !== state.ownedHerosNames ||
      nextState.teams !== state.teams ||
      action.type === "WEB_APP_CLIENT_CONNECTED"
    ) {
      if (sendMsgToWeb) {
        sendMsgToWeb({
          type: "STATE_FOR_WEB_APP_CHANGED",
          ownedHeros: nextState.ownedHeros,
          ownedHerosNames: nextState.ownedHerosNames,
          buckets: nextState.buckets,
          teams: nextState.teams,
        });
      }
    }

    return nextState;
  },
};
