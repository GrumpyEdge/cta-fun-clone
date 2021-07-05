/* @flow */

/* :: import type { HerosBattleStateMap } from '../../../../../server/types' */

export function getTeamsHerosIds(
    currentHeroId /* :string */,
    herosStateMap /* :HerosBattleStateMap */
  ) {
    const teamLetter = currentHeroId[0];
  
    const enemiesIds = [];
    const aliesIds = [];
  
    Object.keys(herosStateMap).forEach((heroId) => {
      if (heroId === currentHeroId) return;
      if (herosStateMap[heroId].spawnInTicks > 0) return;
  
      if (herosStateMap[heroId].hp > 0) {
        if (heroId.startsWith(teamLetter)) {
          aliesIds.push(heroId);
        } else {
          enemiesIds.push(heroId);
        }
      }
    });
    
    return {
      enemiesIds,
      aliesIds
    }
  }