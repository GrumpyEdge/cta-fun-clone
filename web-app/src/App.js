/* globals window, localStorage */
/* @flow */

import React, { useReducer, useEffect, useRef } from "react";
import io from "socket.io-client";
import { wsProxyHost } from "./config";
import { AllHerosSelector } from "./AllHerosSelector/AllHerosSelector";
import { type ActionToServer, type MsgFromServer } from "./types";
import {
  type Guild,
  type OwnedHeros,
  type GwTeamPosition,
  type BattlePosition,
  type OwnedHeroRecord,
} from "../../server/types";
import { MyHeros } from "./MyHeros/MyHeros";
import { type HeroName, type Teams, type Buckets } from "../../server/types";
import { EditHero } from "./EditHero/EditHero";
import "./App.css";
import { TeamsView } from "./Teams/Teams";
import { BattleSetup } from "./BattleSetup/BattleSetup";
import { GwTeamsView } from "./GwTeams/GwTeams";
import { BucketsView } from "./Buckets/Buckets";
import { EditBucketView } from "./EditBucketView/EditBucketView";
import "./FindBestMatch/FindBestMatch.css";
import { FindBestMatch } from "./FindBestMatch/FindBestMatch";

type ActiveView =
  | { type: "my-heros" }
  | { type: "all-heros-selector" }
  | { type: "my-teams" }
  | { type: "gw-teams" }
  | { type: "find-best-match" }
  | {
      type: "battle-setup",
      position: BattlePosition,
    }
  | { type: "edit-buckets" }
  | { type: "edit-bucket", name: string | null }
  | { type: "edit-hero", heroName: HeroName };

type State = {|
  savingToServer: boolean,
  activeView: ActiveView,
  ownedHeros: OwnedHeros,
  teams: Teams,
  buckets: Buckets,
  guild: Guild | null,
|};

let initialState: State = {
  savingToServer: false,
  activeView: { type: "my-heros" },
  ownedHeros: {},
  teams: {},
  buckets: {},
  guild: null,
};

type Action =
  | MsgFromServer
  | {| type: "SAVING_TO_SERVER" |}
  | {| type: "EDIT_MY_HEROS_CLICKED" |}
  | {| type: "EDIT_HERO_CLICKED", heroName: HeroName |}
  | {| type: "EDIT_HERO_SAVE_CLICKED" |}
  | {| type: "MY_HERO_MENU_BTN_CLICKED" |}
  | {| type: "MY_TEAMS_MENU_BTN_CLICKED" |}
  | {| type: "GW_TEAMS_MENU_BTN_CLICKED" |}
  | {| type: "FIGHT_CLICKED", teamName: string |}
  | {| type: "GW_FIGHT_CLICKED", position: GwTeamPosition |}
  | {| type: "ALL_HEROS_SELECTOR_SAVE_CLICKED" |}
  | {| type: "CREATE_BUCKET_CLICKED" |}
  | {| type: "EDIT_BUCKETS_CLICKED" |}
  | {| type: "SAVE_BUCKET_CLICKED" |}
  | {| type: "FIND_BEST_MATCH_CLICKED" |}
  | {| type: "EDIT_BUCKET_CLICKED", bucketName: string |};

const savelessActionsMap = {
  SEND_BATTLE_STATS_TO_DISCORD_DM: true,
};

const saveVersion = new URLSearchParams(window.location.search).get("version"); // for state quick reloading

const ownedHeroRecordInitialState: OwnedHeroRecord = {
  name: "Blue Fish",
  ev: 1,
  aw: 0,
  runesStats: {
    atk: 0,
    def: 0,
    aoe: 0,
    aps: 0,
    ctkrate: 0,
    ctkdmg: 0,
    hp: 0,
    freezeTime: 0,
    freezeChance: 0,
    stunTime: 0,
    stunChance: 0,
    poisonTime: 0,
    poisonChance: 0,
    atkrange: 0,
    mvspd: 0,
    burnChance: 0,
    burnTime: 0,
    dodgerate: 0,
    knightShield: 0,
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SAVING_TO_SERVER":
      return {
        ...state,
        savingToServer: true,
      };
    case "STATE_FOR_WEB_APP_CHANGED":
      return {
        ...state,
        savingToServer: false,
        ownedHeros: action.ownedHerosNames.reduce((a, heroName) => {
          a[heroName] = {
            ...(action.ownedHeros[heroName] || ownedHeroRecordInitialState),
            name: heroName,
          };
          return a;
        }, {}),
        teams: action.teams,
        buckets: action.buckets,
      };
    case "EDIT_MY_HEROS_CLICKED":
      return { ...state, activeView: { type: "all-heros-selector" } };
    case "ALL_HEROS_SELECTOR_SAVE_CLICKED":
      return { ...state, activeView: { type: "my-heros" } };
    case "EDIT_HERO_SAVE_CLICKED":
      return { ...state, activeView: { type: "my-heros" } };
    case "MY_HERO_MENU_BTN_CLICKED":
      return { ...state, activeView: { type: "my-heros" } };
    case "MY_TEAMS_MENU_BTN_CLICKED":
      return { ...state, activeView: { type: "my-teams" } };
    case "GW_TEAMS_MENU_BTN_CLICKED":
      return { ...state, activeView: { type: "gw-teams" } };
    case "EDIT_HERO_CLICKED":
      return {
        ...state,
        activeView: { type: "edit-hero", heroName: action.heroName },
      };
    case "FIGHT_CLICKED":
      return {
        ...state,
        activeView: {
          type: "battle-setup",
          position: { type: "own", enemyTeamName: action.teamName },
        },
      };
    case "GW_FIGHT_CLICKED":
      return {
        ...state,
        activeView: {
          type: "battle-setup",
          position: action.position,
        },
      };
    case "GUILD_STATE_CHANGED":
      return {
        ...state,
        savingToServer: false,
        guild: action.guild,
      };
    case "SAVE_BUCKET_CLICKED":
      return {
        ...state,
        savingToServer: true,
        activeView: {
          type: "edit-buckets",
          name: null,
        },
      };
    case "CREATE_BUCKET_CLICKED":
      return {
        ...state,
        activeView: {
          type: "edit-bucket",
          name: null,
        },
      };
    case "EDIT_BUCKET_CLICKED":
      return {
        ...state,
        activeView: {
          type: "edit-bucket",
          name: action.bucketName,
        },
      };
    case "EDIT_BUCKETS_CLICKED":
      return {
        ...state,
        activeView: {
          type: "edit-buckets",
        },
      };
    case "FIND_BEST_MATCH_CLICKED":
      return {
        ...state,
        activeView: {
          type: "find-best-match",
        },
      };
    default:
      (action.type: empty); // eslint-disable-line
  }
  return state;
}

const str = localStorage.getItem("state");
if (str) {
  const { saveVersion: _sv, state } = JSON.parse(str);
  if (saveVersion === _sv) {
    initialState = state;
  }
}

function App() {
  const [state, dispatch] = useReducer((s, a) => {
    const state = reducer(s, a);
    window.state = state;

    if (saveVersion) {
      localStorage.setItem("state", JSON.stringify({ saveVersion, state }));
    }

    return state;
  }, initialState);
  const wsRef = useRef(null);
  useEffect(() => {
    var urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get("serverId");
    const userid = urlParams.get("userid");
    const secret = urlParams.get("secret");
    if (serverId && userid && secret) {
      const ws = io(
        `${wsProxyHost}?mode=client&serverId=${serverId}&userid=${userid}&secret=${secret}`,
        { transports: ["websocket", "polling", "flashsocket"] }
      );
      wsRef.current = ws;
      ws.on("msg", (msg) => {
        console.log("on msg", msg);

        return dispatch(msg);
      });
    }
  }, []);

  const sendAction = (msg: ActionToServer) => {
    if (!savelessActionsMap[(msg.type: any)]) {
      dispatch({ type: "SAVING_TO_SERVER" });
    }
    console.log("sending to server", msg);
    if (wsRef.current) {
      wsRef.current.emit("msg", msg);
    }
  };

  let view = null;

  const joinGuildMessage = (
    <div>
      Looks like you are not in guild. type <b>.guild</b> in discord for help how to
      join the guild.
    </div>
  );

  switch (state.activeView.type) {
    case "my-heros":
      view = (
        <MyHeros
          onEditBucketsBtnClicked={() => {
            dispatch({ type: "EDIT_BUCKETS_CLICKED" });
          }}
          buffs={{}}
          sendAction={sendAction}
          ownedHeros={state.ownedHeros}
          editMyHerosClicked={() => {
            dispatch({ type: "EDIT_MY_HEROS_CLICKED" });
          }}
          onHeroTileClicked={(heroName) => {
            dispatch({ type: "EDIT_HERO_CLICKED", heroName });
          }}
        />
      );
      break;
    case "my-teams":
      view = (
        <TeamsView
          onDeleteClicked={(teamName) => {
            sendAction({
              type: "REMOVE_TEAM",
              teamName,
            });
          }}
          onFightClicked={(teamName) => {
            dispatch({ type: "FIGHT_CLICKED", teamName });
          }}
          teams={state.teams}
          editMyHerosClicked={() => {
            dispatch({ type: "EDIT_MY_HEROS_CLICKED" });
          }}
          onHeroTileClicked={(heroName) => {
            dispatch({ type: "EDIT_HERO_CLICKED", heroName });
          }}
        />
      );
      break;
    case "gw-teams":
      if (!state.guild) {
        view = joinGuildMessage;
      } else {
        view = (
          <GwTeamsView
            guild={state.guild}
            onFightClicked={(position) => {
              dispatch({ type: "GW_FIGHT_CLICKED", position });
            }}
            teams={state.teams}
            onFindBestMatchClicked={() => {
              dispatch({ type: "FIND_BEST_MATCH_CLICKED" });
            }}
          />
        );
      }
      break;
    case "all-heros-selector":
      view = (
        <AllHerosSelector
          ownedHerosNames={(Object.keys(state.ownedHeros): any)}
          saveClicked={(selectedHerosNames) => {
            sendAction({
              type: "SET_OWNED_HEROS_NAMES",
              herosNames: selectedHerosNames,
            });
            dispatch({ type: "ALL_HEROS_SELECTOR_SAVE_CLICKED" });
          }}
        />
      );
      break;
    case "edit-hero": {
      const { heroName } = state.activeView;
      view = (
        <EditHero
          hero={state.ownedHeros[heroName]}
          saveClicked={(hero) => {
            sendAction({
              type: "SET_OWNED_HERO_STATS",
              hero,
              heroName,
            });
            dispatch({ type: "EDIT_HERO_SAVE_CLICKED" });
          }}
        />
      );
      break;
    }
    case "edit-buckets": {
      view = (
        <BucketsView
          ownedHeros={state.ownedHeros}
          buckets={state.buckets}
          onCreateClicked={() => {
            dispatch({ type: "CREATE_BUCKET_CLICKED" });
          }}
          onEditClicked={(bucketName) => {
            dispatch({ type: "EDIT_BUCKET_CLICKED", bucketName });
          }}
          onDeleteClicked={(bucketName) => {
            sendAction({
              type: "DELETE_BUCKET",
              bucketName,
            });
          }}
        />
      );
      break;
    }
    case "edit-bucket": {
      view = (
        <EditBucketView
          ownedHeros={state.ownedHeros}
          bucket={
            state.activeView.name
              ? state.buckets[state.activeView.name]
              : { name: "", teams: [{ team: [] }] }
          }
          onSaveClicked={(bucket) => {
            sendAction({
              type: "CREATE_OR_EDIT_BUCKET",
              bucket,
            });
            dispatch({ type: "SAVE_BUCKET_CLICKED" });
          }}
        />
      );
      break;
    }
    case "find-best-match": {
      if (!state.guild) {
        view = joinGuildMessage;
      } else {
        view = (
          <FindBestMatch
            ownedHeros={state.ownedHeros}
            buckets={state.buckets}
            guild={state.guild}
          />
        );
      }
      break;
    }
    case "battle-setup": {
      const { position } = state.activeView;
      let team;
      let teamName;
      let enemyTeamBuffMap = {};
      let ownTeamBuffMap = {};

      switch (position.type) {
        case "fort": {
          if (!state.guild) {
            view = joinGuildMessage;
          } else {
            const fort = state.guild.forts.find(
              (fort) => fort && fort.buffType === position.buffType
            );
            if (!fort) return <div />;
            const teamSlot = fort.teams[position.index];
            if (!teamSlot) return <div />;
            team = teamSlot.team;
            teamName = teamSlot.teamName;
            enemyTeamBuffMap = { [(fort.buffType: string)]: 1 };
          }
          break;
        }
        case "castle":
          {
            if (!state.guild) {
              view = joinGuildMessage;
            } else {
              const teamSlot = state.guild.castle[position.index];
              if (!teamSlot) return <div />;
              team = teamSlot.team;
              teamName = teamSlot.teamName;
              enemyTeamBuffMap = state.guild.enemyCastleBuffs;
              ownTeamBuffMap = state.guild.ownCastleBuffs;
            }
          }
          break;
        case "own":
          team = state.teams[position.enemyTeamName];
          teamName = position.enemyTeamName;
          break;
        default:
          (position.type: empty); // eslint-disable-line
      }

      if (!team || !teamName) {
        view = <div />;
      } else {
        view = (
          <BattleSetup
            buckets={state.buckets}
            enemyTeamBuffMap={enemyTeamBuffMap}
            ownTeamBuffMap={ownTeamBuffMap}
            enemyTeamName={teamName}
            enemyTeam={team}
            ownedHeros={state.ownedHeros}
            sendStatsToDiscord={({ rndSeed, attackerTeam, isX2 }) => {
              sendAction({
                type: "SEND_BATTLE_STATS_TO_DISCORD_DM",
                rndSeed,
                attackerTeam,
                enemyTeamName: teamName,
                enemyTeam: team,
                enemyTeamBuffMap,
                ownTeamBuffMap,
                isX2,
              });
            }}
          />
        );
      }

      break;
    }
    default:
      (state.activeView.type: empty); //eslint-disable-line
  }

  return (
    <div className="App">
      <div className="Menu">
        <button onClick={() => dispatch({ type: "MY_HERO_MENU_BTN_CLICKED" })}>
          My heroes
        </button>
        <button onClick={() => dispatch({ type: "MY_TEAMS_MENU_BTN_CLICKED" })}>
          Opponents
        </button>
        <button onClick={() => dispatch({ type: "GW_TEAMS_MENU_BTN_CLICKED" })}>
          GW
        </button>
      </div>
      {view}
      {state.savingToServer && (
        <div className="saving-to-server">Saving to server!</div>
      )}
    </div>
  );
}

export default App;
