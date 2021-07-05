/* @flow */

/* :: import type { BattleTeamDefinition, OwnedHeroRecord, BattleResultStats, BattleResult, HerosBattleStatsMap, BattleState, EffectOverTime, HeroBattleStateRO, HerosBattleStateMap, CLS, BattleLogRecord, DiscordPlayerMessageHandlerPropsType, ReducerProps, Hero, HeroProgress, RunesStats, HeroBattleStats, HeroInfoWithBattleProgress, HeroProgressI } from '../../../../../server/types' */
import { nextRandom } from "../random.mjs";
import {
  MAX_BATTLE_DURATION_TICKS,
  aPortalId,
  dPortalId,
} from "../../constants/constants.mjs";
import { computeBattleInitialState } from "./computeBattleInitialState.mjs";
import { processBattleTickForHero } from "./processBattleTickForHero.mjs";

const getBattleResultStatsInitialState = (
  heroIds
) /* :BattleResultStats */ => ({
  fromToMap: heroIds.reduce((a, id) => ({ ...a, [id]: {} }), {}),
  totalTicks: 0,
  won: false,
  numberOfHerosLost: 0,
  numberOfHerosKilled: 0,
  deathMap: {},
});

export function battle(
  sp4Mult /* : number */,
  attackerTeam /* :BattleTeamDefinition */,
  defenderTeam /* :BattleTeamDefinition */,
  rndSeed /* :number */,
)/* : BattleResult */ {
  let nextRndSeed = rndSeed;
  const rndGenerator = () => {
    const { rnd0to1, nextSeed } = nextRandom(nextRndSeed);
    nextRndSeed = nextSeed;

    return rnd0to1;
  };

  const { state, herosStatsMap } = computeBattleInitialState(
    sp4Mult,
    attackerTeam,
    defenderTeam,
    rndGenerator,
  );

  const battleResultStats = getBattleResultStatsInitialState(
    Object.keys(herosStatsMap)
  );
  const battleLog = [[]];
  const log = (s /* :BattleLogRecord */) => {
    battleLog[battleLog.length - 1].push(s);
  };

  log({
    type: "init",
    heros: Object.keys(herosStatsMap).map((heroId) => ({
      heroId,
      emojiId: herosStatsMap[heroId].emojiId,
    })),
  });

  let nextState /* :BattleState */ = state;
  while (true) { // eslint-disable-line
    if (nextState.ticks > MAX_BATTLE_DURATION_TICKS) {
      break;
    }

    let nextHerosState = nextState.heros;
    for (let heroId of Object.keys(nextState.heros)) {
      nextHerosState = processBattleTickForHero(
        heroId,
        herosStatsMap,
        rndGenerator,
        battleResultStats,
        log,
        nextHerosState
      );
    }

    nextState = {
      ...nextState,
      heros: nextHerosState,
      ticks: nextState.ticks + 1,
    };

    if (nextHerosState[aPortalId].hp <= 0) {
      log({ type: "end", won: false });
      battleResultStats.won = false;
      break;
    } else if (nextHerosState[dPortalId].hp <= 0) {
      log({ type: "end", won: true });
      battleResultStats.won = true;
      break;
    }
    battleLog.push([]);
  }

  battleResultStats.totalTicks = nextState.ticks;
  return {
    battleResultStats,
    battleLog,
    rndSeed
  };
}
