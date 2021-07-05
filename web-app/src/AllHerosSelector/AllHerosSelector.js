/* @flow */

import React, { useState } from "react";
import { ALL_HEROS } from "../shared/constants/heros";
import "./AllHerosSelector.css";
import { type HeroName } from "../../../server/types";
import { HeroTile } from "../HeroTile/HeroTile";

export function AllHerosSelector({
  ownedHerosNames,
  saveClicked
}: {
  ownedHerosNames: Array<HeroName>,
  saveClicked: (HeroName[]) => void
}) {
  const [selectedHerosNames, setSelectedHerosNames] = useState(ownedHerosNames);
  return (
    <div className="all-heros-selector">
      {ALL_HEROS.map((hero) => {
        return (
          <HeroTile
            key={hero.name}
            heroName={hero.name}
            isSelected={selectedHerosNames.includes(hero.name)}
            onClick={() => {
              if (selectedHerosNames.includes(hero.name)) {
                setSelectedHerosNames(
                  selectedHerosNames.filter((hn) => hn !== hero.name)
                );
              } else {
                setSelectedHerosNames([...selectedHerosNames, hero.name]);
              }
            }}
          />
        );
      })}
      <button
        onClick={() => {
          saveClicked(selectedHerosNames)
        }}
      >
        Save
      </button>
    </div>
  );
}
