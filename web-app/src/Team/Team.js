/* @flow */

import React from "react";
import "./Team.css";
import { type HeroName, type BuffMap } from "../../../server/types";
import { HeroTile } from "../HeroTile/HeroTile";

export function TeamView<T: { +ev: number, +aw: number, +name: HeroName }>({
  team,
  onHeroTileClicked,
  buffs,
  small
}: {|
  team: $ReadOnlyArray<T>,
  onHeroTileClicked?: (string) => void,
  buffs?: BuffMap,
  small?: bool,
|}) {
  const teamOf10 = [...team];

  while (teamOf10.length < 10) {
    teamOf10.push({ type: "placeholder" });
  }
  return (
    <div className="team clearfix">
      {teamOf10.map((hero, index) => {
        if (hero.type === "placeholder") {
          return <div key={index} className="hero-tile" />;
        }
        return (
          <HeroTile
            onClick={onHeroTileClicked && (() => onHeroTileClicked(hero.name))}
            key={index}
            heroName={hero.name}
            ev={hero.ev}
            aw={hero.aw}
            buffs={buffs}
            small={small}
          />
        );
      })}
    </div>
  );
}
