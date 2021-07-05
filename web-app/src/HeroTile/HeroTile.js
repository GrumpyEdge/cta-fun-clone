/* @flow */

import React, { useState } from "react";
import { findHeroDefenitionByName } from "../shared/constants/heros";
import { discordEmojiAssetUrl } from "../shared/utils/utils";
import check from "../assets/check.png";
import pencil from "../assets/pencil.png";
import "./HeroTile.css";
import { type HeroName, type BuffMap } from "../../../server/types";
const awEmojiId = "725690701618217000";
const evEmojiId = "725690701626736650";

const printStars = (ev /* :number */, aw /* :number */) => {
  const titleStarsArr = [];
  for (let i = 0; i < ev; i++) {
    if (aw > i) {
      titleStarsArr.push(awEmojiId);
    } else {
      titleStarsArr.push(evEmojiId);
    }
  }
  return titleStarsArr.map((emojiId, index) => (
    <img key={index} alt="star" src={discordEmojiAssetUrl(emojiId)} />
  ));
};

export function HeroTile({
  heroName,
  isSelected,
  onClick,
  showEditOnHover,
  ev,
  aw,
  buffs,
  small,
}: {|
  heroName: HeroName,
  isSelected?: boolean,
  onClick?: () => void,
  showEditOnHover?: boolean,
  ev?: number,
  aw?: number,
  buffs?: BuffMap,
  small?: bool
|}) {
  const hero = findHeroDefenitionByName(heroName);
  const [isMouseOver, setIsMouseOver] = useState(false);
  let buffedTimes = 0;
  if (buffs && buffs[hero.class]) {
    buffedTimes += buffs[hero.class];
  }
  if (buffs && buffs[hero.elementKind]) {
    buffedTimes += buffs[hero.elementKind];
  }

  let buffColorClass = "buff-color-none";
  if (buffedTimes === 1) {
    buffColorClass = "buff-color-yellow";
  } else if (buffedTimes > 1) {
    buffColorClass = "buff-color-purple";
  }

  return (
    <div
      className={`hero-tile${small ? ' small' : ''}`}
      onClick={onClick}
      onMouseEnter={() => {
        if (!showEditOnHover) return;
        setIsMouseOver(true);
      }}
      onMouseLeave={() => {
        if (!showEditOnHover) return;
        setIsMouseOver(false);
      }}
    >
      <img
        src={discordEmojiAssetUrl(hero.emojiId)}
        alt={hero.name}
        title={hero.name}
      />
      {isSelected && (
        <div className="selected">
          <img src={check} alt="check" />
        </div>
      )}
      {isMouseOver && (
        <div className="edit">
          <img src={pencil} alt="edit" />
        </div>
      )}
      {ev && aw !== undefined && (
        <div className="stars-container">{printStars(ev, aw)}</div>
      )}
      {buffedTimes ? <div className={['buffed-times', buffColorClass].join(' ')}>{buffedTimes}</div> : null}
      <div className={['border', buffColorClass].join(' ')} />
    </div>
  );
}
