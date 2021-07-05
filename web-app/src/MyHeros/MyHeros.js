/* globals window */
/* @flow */

import React, { useState } from "react";
import "./MyHeros.css";
import {
  type HeroName,
  type OwnedHeros,
  type BuffMap,
} from "../../../server/types";
import { HeroTile } from "../HeroTile/HeroTile";
import { getHeroPowerDetailed } from "../shared/utils/team.mjs";
import { ALL_HEROS } from "../shared/constants/heros.mjs";

export function MyHeros({
  buffs,
  ownedHeros,
  editMyHerosClicked,
  onHeroTileClicked,
  onEditBucketsBtnClicked
}: {
  buffs: BuffMap,
  ownedHeros: OwnedHeros,
  editMyHerosClicked?: () => void,
  onHeroTileClicked: (HeroName) => void,
  onEditBucketsBtnClicked?: () => void
}) {
  const orderFromLocalStorageKey = 'my-hero-order';
  const orderFromLocalStorage = window.localStorage.getItem(orderFromLocalStorageKey)

  const [order, setOrder] = useState(orderFromLocalStorage || "power");
  const _setOrder = (order) => {
    window.localStorage.setItem(orderFromLocalStorageKey, order)
    setOrder(order)
  }
  let namesInOrder = Object.keys(ownedHeros);
  if (order === "power") {
    namesInOrder = Object.keys(ownedHeros).sort(
      (n1, n2) =>
        getHeroPowerDetailed(ownedHeros[n2]) -
        getHeroPowerDetailed(ownedHeros[n1])
    );
  } else {
    namesInOrder = ALL_HEROS.map((h) => h.name).filter(
      (name) => ownedHeros[name]
    );
  }

  return (
    <div className="my-heros">
      {onEditBucketsBtnClicked && <button onClick={onEditBucketsBtnClicked}>Edit Buckets</button>}
      {editMyHerosClicked && (
        <div>
          <div>My heroes</div>
          <button onClick={editMyHerosClicked}>Add / Remove</button>
          <div className="hint">Press on hero icon to edit</div>
        </div>
      )}
      <div>
        Order:
        <button onClick={() => _setOrder("power")}>By power</button>
        <button onClick={() => _setOrder("element")}>By element</button>
      </div>
      {namesInOrder.map((heroName: HeroName) => {
        return (
          <HeroTile
            buffs={buffs}
            onClick={() => onHeroTileClicked(heroName)}
            showEditOnHover={!!editMyHerosClicked}
            key={heroName}
            heroName={heroName}
            ev={ownedHeros[heroName].ev}
            aw={ownedHeros[heroName].aw}
          />
        );
      })}
    </div>
  );
}
