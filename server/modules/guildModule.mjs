/* @flow */

/* :: import type { BuffMap ,GwTeamPosition, Guild, DiscordPlayerMessageHandlerPropsType,  ReducerProps, Teams, Team, WarBuffType } from '../types' */

import { parseHeros } from "../parseUtils.mjs";
import { printTeam } from "./pvpModule.mjs";
import { boundaryInt } from "../../web-app/src/shared/utils/utils.mjs";

/* ::
type WarBuffs = [WarBuffType, WarBuffType, WarBuffType, WarBuffType, WarBuffType, WarBuffType];
type GuildAction = 
  | {| type: "CREATE_GUILD", guildName: string, password: string |}
  | {| type: "SET_GUILD_PASSWORD", password: string |}
  | {| type: "JOIN_GUILD", guildName: string, characterName: string |}
  | {| type: "LEAVE_GUILD" |}
  | {| type: "BEGIN_WAR", buffTypes: WarBuffs |}
  | {| type: "SET_GUILDWAR_TEAM", teamName: string, team: Team, position: GwTeamPosition |}
  | {| type: "SET_CASTLE_BUFFS", buffMap: BuffMap, target: 'own' | 'enemy' |}
  | {| type: "SET_REMAINING_POINTS", points: number, position: GwTeamPosition |}
  | {| type: "END_WAR" |}
  | {| type: "WEB_APP_CLIENT_CONNECTED", userid: string |}
*/

const strToBuffType = (str /* : string */) /* : WarBuffType | null */ => {
  switch (str) {
    case "water":
    case "fire":
    case "earth":
    case "light":
    case "dark":
    case "lancer":
    case "ranger":
    case "magician":
    case "gunner":
    case "support":
    case "barbarian":
    case "samurai":
    case "rogue":
    case "brawler":
    case "knight":
      return str;
    default:
      return null;
  }
};

const isValidWarBuffType = (buff /* :string */) => {
  const buffType = strToBuffType(buff);
  return !!buffType;
};

const guilds /* : { [guildName: string]: Guild } */ = {};

const makeEmptyCastle = () => [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

const parsePosition = async (
  reply,
  guild,
  input
) /* :Promise<{| success: true, position: GwTeamPosition, |} | {| success: false |}>  */ => {
  const [
    _, // eslint-disable-line no-unused-vars
    positionStr,
  ] = input.split(" ");

  const [positionTypeStr, positionIndexStr] = positionStr.split(".");

  const targetIsCastle = positionTypeStr === "castle";
  const targetFort = guild.forts.find(
    (f) => f && f.buffType === positionTypeStr
  );
  if (!targetIsCastle && !targetFort) {
    await reply(`${positionTypeStr} is not valid position type. use one of:
- castle
- ${guild.forts.map((fort) => fort && fort.buffType).join("\n- ")}`);
    return { success: false };
  }

  const position = parseInt(positionIndexStr, 10) - 1;

  if (targetIsCastle) {
    if (position >= 0 && position < 30) {
      return {
        success: true,
        position: {
          type: "castle",
          index: (position /*:any */),
        },
      };
    } else {
      reply(`position index "${position}" should be between 1 and 30`);
    }
  }

  if (targetFort && position >= 0 && position < 5) {
    return {
      success: true,
      position: {
        type: "fort",
        buffType: targetFort.buffType,
        index: (position /*:any */),
      },
    };
  } else {
    reply(`position index "${position}" should be between 1 and 5`);
  }

  return { success: false };
};

export const guildModule = {
  handler: async (
    {
      input,
      reply,
      addAction,
      userid,
      getUserState,
    } /* :DiscordPlayerMessageHandlerPropsType<GuildAction> */
  ) => {
    if (input.startsWith(".guild")) {
      await reply(`
**.createguild guild-name password** to create guild
**.setguildpassword password** to create guild
**.joinguild guild-name character-name password** to join guild
**.leaveguild** to leave guild
**.beginwar fire earth rogue light brawler** to start war
**.gwst fire.5 team-name.team-power vlad.7.7.9 glad.7.7.9** to set fire fort team
**.gwst castle.30 team-name.team-power vlad.7.7.9 glad.7.7.9** to set castle team
**.gwsb own fire earth.2 gunner lancer rogue** to set buffs for the castle phase
**.gwsb enemy fire earth.2 gunner lancer rogue** to set buffs for the castle phase
**.gwsp fire.5 208** set remaining points for fire p5
**.endwar** to cleanup 
`);
      return true;
    } else if (input.startsWith(".createguild")) {
      const [_, guildName, password] = input.split(" "); // eslint-disable-line no-unused-vars
      if (guilds[guildName]) {
        await reply(`Guild with ${guildName} already exist.`);
      } else {
        await addAction({ type: "CREATE_GUILD", guildName, password });
        await reply(
          `Guild \`${guildName}\` has been created. \`.joinguild ${guildName}\` to join it.`
        );
      }
      return true;
    }
    if (input.startsWith(".setguildpassword")) {
      const { guildName } = getUserState();

      if (
        !guildName ||
        !guilds[guildName] ||
        guilds[guildName].creatorUserId !== userid
      ) {
        await reply(`You should be a creator of guild to set it's password`);
      } else {
        const [_, password] = input.split(" "); // eslint-disable-line no-unused-vars
        await addAction({ type: "SET_GUILD_PASSWORD", password });
        await reply(`Password was set.`);
      }
      return true;
    } else if (input.startsWith(".joinguild")) {
      if (getUserState().guildName) {
        await reply(
          `You already part of the guild ${getUserState().guildName}.`
        );
      } else {
        const [_, guildName, characterName, password] = input.split(" "); // eslint-disable-line no-unused-vars
        if (!characterName) {
          await reply(`Enter you character name.`);
          return true;
        }
        if (!guilds[guildName]) {
          await reply(`Guild with ${guildName} does not exist.`);
        } else {
          if (guilds[guildName].members.find((m) => m.userid === userid)) {
            await reply(`You already a member of guild ${guildName}.`);
          } else {
            if (password === guilds[guildName].password) {
              await addAction({ type: "JOIN_GUILD", guildName, characterName });
              await reply(`You have joined ${guildName}.`);
            } else {
              await reply(`Incorrect guild password.`);
            }
          }
        }
      }
      return true;
    } else if (input.startsWith(".leaveguild")) {
      if (getUserState().guildName) {
        await addAction({ type: "LEAVE_GUILD" });
        await reply(`You left the guild.`);
      } else {
        await reply(`You are not member of any guild.`);
      }
      return true;
    } else if (input.startsWith(".gwsp")) {
      const guild = guilds[getUserState().guildName];
      if (!guild) {
        await reply(`Guild not found or you are not in guild.`);
        return true;
      }

      if (!guild.warInProgress) {
        await reply(`There is no war in progress.`);
        return true;
      }

      const result = await parsePosition(reply, guild, input);
      if (!result.success) return true;

      const { position } = result;

      const [_, _positionStr, pointsStr] = input.split(" "); // eslint-disable-line no-unused-vars
      const points = parseInt(pointsStr);

      await addAction({ type: "SET_REMAINING_POINTS", points, position });

      const printTeamsPoints = (teams) =>
        teams
          .map((teamSlot, index) => {
            if (teamSlot === null) {
              return `P${index + 1} - not set`;
            }

            return `P${index + 1} - ${teamSlot.pointsRemaining}`;
          })
          .join("\n");
      if (position.type === "castle") {
        const pointsStr = printTeamsPoints(guild.castle);

        await reply(`**Castle:**
${pointsStr}`);
      } else {
        const fort = guild.forts.find(
          (fort) => fort && fort.buffType === position.buffType
        );
        if (!fort) {
          return true;
        }

        const teamsPointsStr = printTeamsPoints(fort.teams);

         await reply(`**${fort.buffType}:**
${teamsPointsStr}
`);
      }

      return true;
    } else if (input.startsWith(".gwst")) {
      const guild = guilds[getUserState().guildName];
      if (!guild) {
        await reply(`Guild not found or you are not in guild.`);
        return true;
      }

      if (!guild.warInProgress) {
        await reply(`There is no war in progress.`);
        return true;
      }

      const [
        _, // eslint-disable-line no-unused-vars
        positionStr, // eslint-disable-line no-unused-vars
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

      const result = await parsePosition(reply, guild, input);

      if (!result.success) return true;

      const { position } = result;

      const { heros } = parseHeros(teamName, [
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

      if (position.type === "castle") {
        addAction({
          type: "SET_GUILDWAR_TEAM",
          teamName,
          position,
          team: heros,
        });
        await printTeam(
          reply,
          teamName,
          input.includes("-runes"),
          heros,
          ([] /*:any */),
          guild.enemyCastleBuffs,
          {},
          false
        );
      } else {
        await addAction({
          type: "SET_GUILDWAR_TEAM",
          teamName,
          position,
          team: heros,
        });

        await printTeam(
          reply,
          teamName,
          input.includes("-runes"),
          heros,
          ([] /*:any */),
          { [(position.buffType /*:any */)]: 1 },
          {},
          false
        );
      }
      return true;
    } else if (input.startsWith(".beginwar")) {
      const guild = guilds[getUserState().guildName];
      if (!guild) {
        await reply(`Guild not found or you are not in guild.`);
      } else {
        if (guild.creatorUserId !== userid) {
          await reply(`Sorry, for now only guild creator can start the war.`);
        } else {
          if (guild.warInProgress) {
            await reply(`Guild war is already in progress. use \`.endwar\`.`);
          } else {
            const [
              _, // eslint-disable-line no-unused-vars
              buffType1str,
              buffType2str,
              buffType3str,
              buffType4str,
              buffType5str,
              buffType6str,
            ] = input.split(" ");
            const buffTypesStrs = [
              buffType1str,
              buffType2str,
              buffType3str,
              buffType4str,
              buffType5str,
              buffType6str,
            ];

            const invalidBuffs = buffTypesStrs.filter(
              (buffType) => !isValidWarBuffType(buffType)
            );

            if (invalidBuffs.length) {
              await reply(`"${invalidBuffs.join(
                ", "
              )}" are invalid buffTypes. Use one of this:
      - water
      - fire
      - earth
      - light
      - dark
      - lancer
      - ranger
      - magician
      - gunner
      - support
      - barbarian
      - samurai
      - rogue
      - brawler
      - knight
              `);
            } else {
              const b1Type = strToBuffType(buffType1str);
              const b2Type = strToBuffType(buffType2str);
              const b3Type = strToBuffType(buffType3str);
              const b4Type = strToBuffType(buffType4str);
              const b5Type = strToBuffType(buffType5str);
              const b6Type = strToBuffType(buffType6str);
              if (b1Type && b2Type && b3Type && b4Type && b5Type && b6Type) {
                await addAction({
                  type: "BEGIN_WAR",
                  buffTypes: [b1Type, b2Type, b3Type, b4Type, b5Type, b6Type],
                });
                await reply(
                  `Let the war begin! ${[
                    b1Type,
                    b2Type,
                    b3Type,
                    b4Type,
                    b5Type,
                    b6Type,
                  ].join(", ")}`
                );
              }
            }
          }
        }
      }

      return true;
    } else if (input.startsWith(".endwar")) {
      const guild = guilds[getUserState().guildName];

      if (!guild) {
        await reply(`Guild not found or you are not in guild.`);
      } else {
        if (guild.creatorUserId !== userid) {
          await reply(`Sorry, for now only guild creator can stop the war.`);
        } else {
          if (!guild.warInProgress) {
            await reply(`There is no guild war in progress.`);
          } else {
            await addAction({ type: "END_WAR" });
            await reply(`War has been terminated.`);
          }
        }
      }
      return true;
    } else if (input.startsWith(".gwsb")) {
      const guild = guilds[getUserState().guildName];

      if (!guild) {
        await reply(`Guild not found or you are not in guild.`);
      } else {
        const [
          _, // eslint-disable-line no-unused-vars
          _target,
          b1str,
          b2str,
          b3str,
          b4str,
          b5str,
          b6str,
        ] = input.split(" ");

        if (_target !== "own" && _target !== "enemy") {
          await reply(`specify target \`own\` or \`enemy\``);
          return true;
        }

        const target = _target === "own" ? "own" : "enemy";
        const buffs = [b1str, b2str, b3str, b4str, b5str, b6str]
          .filter((x) => x)
          .map((b) => {
            const [buffTypeStr, buffAmount] = b.split(".");
            return {
              buff: strToBuffType(buffTypeStr),
              amount: boundaryInt(
                1,
                2,
                isNaN(parseInt(buffAmount, 10)) ? 1 : parseInt(buffAmount, 10)
              ),
            };
          })
          .filter(({ buff }) => buff);

        if (buffs.length) {
          await addAction({
            type: "SET_CASTLE_BUFFS",
            target,
            buffMap: buffs.reduce(
              (a, b) => ({ ...a, [(b.buff /*: any */)]: b.amount }),
              {}
            ),
          });
          await reply(
            target === "own"
              ? `Own castle buffs has been set`
              : "Enemy castle buffs have been set"
          );
        } else {
          await reply(`Buffs was not recognized`);
        }
      }
      return true;
    }
  },
  reducer: (
    { state, action, userid, sendMsgToWeb } /* : ReducerProps<GuildAction> */
  ) => {
    if (action.type === "CREATE_GUILD") {
      guilds[action.guildName] = {
        password: action.password,
        creatorUserId: userid,
        name: action.guildName,
        members: [],
        forts: [null, null, null, null, null, null],
        warInProgress: false,
        ownCastleBuffs: {},
        enemyCastleBuffs: {},
        castle: makeEmptyCastle(),
      };
    } else if (action.type === "JOIN_GUILD") {
      if (guilds[action.guildName]) {
        if (
          !guilds[action.guildName].members.find((m) => m.userid === userid)
        ) {
          guilds[action.guildName].members.push({
            userid,
            name: action.characterName,
          });
        }

        return {
          ...state,
          guildName: action.guildName,
        };
      }
    } else if (action.type === "SET_GUILD_PASSWORD") {
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        guild.password = action.password;
      }
    } else if (action.type === "LEAVE_GUILD") {
      if (guilds[state.guildName]) {
        const member = guilds[state.guildName].members.find(
          (m) => m.userid === userid
        );
        const { members } = guilds[state.guildName];
        members.splice(members.indexOf(member), 1);

        return {
          ...state,
          guildName: "",
        };
      }
    } else if (action.type === "SET_GUILDWAR_TEAM") {
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        if (action.position.type === "fort") {
          const { buffType, index } = action.position;
          const fort = guild.forts.find((fort) => {
            return fort && fort.buffType === buffType;
          });

          if (fort) {
            fort.teams[index] = {
              teamName: action.teamName,
              team: action.team,
              pointsRemaining: 3 * (80 - 10 * index),
            };
          }
        } else {
          const { index } = action.position;
          guild.castle[index] = {
            teamName: action.teamName,
            team: action.team,
            pointsRemaining: 3 * (140 - index * 2),
          };
        }
      }
    } else if (action.type === "BEGIN_WAR") {
      const {
        buffTypes: [b1, b2, b3, b4, b5, b6],
      } = action;
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        guild.warInProgress = true;
        const makeEmptyFortTeams = () => [null, null, null, null, null, null];
        guild.forts[0] = { buffType: b1, teams: makeEmptyFortTeams() };
        guild.forts[1] = { buffType: b2, teams: makeEmptyFortTeams() };
        guild.forts[2] = { buffType: b3, teams: makeEmptyFortTeams() };
        guild.forts[3] = { buffType: b4, teams: makeEmptyFortTeams() };
        guild.forts[4] = { buffType: b5, teams: makeEmptyFortTeams() };
        guild.forts[5] = { buffType: b6, teams: makeEmptyFortTeams() };
        guild.castle = makeEmptyCastle();
      }
    } else if (action.type === "END_WAR") {
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        guild.warInProgress = false;
      }
    } else if (action.type === "SET_CASTLE_BUFFS") {
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        if (action.target === "own") {
          guild.ownCastleBuffs = action.buffMap;
        } else {
          guild.enemyCastleBuffs = action.buffMap;
        }
      }
    } else if (action.type === "SET_REMAINING_POINTS") {
      if (!action.position) { return state }; // old invalid data
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild) {
        const { index } = action.position;
        if (action.position.type === "fort") {
          const { buffType, index } = action.position;
          const fort = guild.forts.find((fort) => {
            return fort && fort.buffType === buffType;
          });
          console.log('fort', fort)
          if (fort && fort.teams[index]) {
            fort.teams[index] = {
              ...fort.teams[index],
              pointsRemaining: action.points,
            };
          }
        } else if (guild.castle[index]) {
          const { index } = action.position;
          guild.castle[index] = {
            ...guild.castle[index],
            pointsRemaining: action.points,
          };
        }
      }
    } else if (action.type === "WEB_APP_CLIENT_CONNECTED") {
      const { guildName } = state;
      const guild = guilds[guildName];
      if (guild && sendMsgToWeb) {
        sendMsgToWeb({ type: "GUILD_STATE_CHANGED", guild });
      }
    }
    return state;
  },
};
