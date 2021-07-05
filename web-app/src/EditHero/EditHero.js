/* @flow */

import React, { useState } from "react";
import "./EditHero.css";
import { type OwnedHeroRecord } from "../../../server/types";
import { discordEmojiAssetUrl } from "../shared/utils/utils.mjs";

const Input = ({
  min,
  max,
  label,
  emoji,
  value,
  onChange,
  prc,
}: {|
  min: number,
  max: number,
  label?: string,
  emoji?: string,
  value: number,
  onChange: (number) => void,
  prc?: true,
|}) => (
  <div className="input">
    {label && <span>{label}: </span>}
    {emoji && <img src={discordEmojiAssetUrl(emoji)} alt={emoji} />}
    <div>
      <input
        type="number"
        min={min}
        max={max}
        label={label}
        value={value}
        onChange={(e) => {
          onChange(parseInt(e.target.value));
        }}
      ></input>
      {prc && <span>%</span>}
    </div>
  </div>
);

export function EditHero({
  hero,
  saveClicked,
}: {
  hero: OwnedHeroRecord,
  saveClicked: (OwnedHeroRecord) => void,
}) {
  const [ev, evSetter] = useState(hero.ev);
  const [aw, awSetter] = useState(hero.aw);
  const [atk, atkSetter] = useState(hero.runesStats.atk);
  const [def, defSetter] = useState(hero.runesStats.def);
  const [aoe, aoeSetter] = useState(hero.runesStats.aoe);
  const [aps, apsSetter] = useState(hero.runesStats.aps);
  const [ctkrate, ctkrateSetter] = useState(hero.runesStats.ctkrate);
  const [ctkdmg, ctkdmgSetter] = useState(hero.runesStats.ctkdmg);
  const [hp, hpSetter] = useState(hero.runesStats.hp);
  const [freezeTime, freezeTimeSetter] = useState(hero.runesStats.freezeTime);
  const [freezeChance, freezeChanceSetter] = useState(
    hero.runesStats.freezeChance
  );
  const [stunTime, stunTimeSetter] = useState(hero.runesStats.stunTime);
  const [stunChance, stunChanceSetter] = useState(hero.runesStats.stunChance);
  const [poisonTime, poisonTimeSetter] = useState(hero.runesStats.poisonTime);
  const [poisonChance, poisonChanceSetter] = useState(
    hero.runesStats.poisonChance
  );
  const [atkrange, atkrangeSetter] = useState(hero.runesStats.atkrange);
  const [mvspd, mvspdSetter] = useState(hero.runesStats.mvspd);
  const [burnChance, burnChanceSetter] = useState(hero.runesStats.burnChance);
  const [burnTime, burnTimeSetter] = useState(hero.runesStats.burnTime);
  const [dodgerate, dodgerateSetter] = useState(hero.runesStats.dodgerate);
  const [knightShield, knightShieldSetter] = useState(
    hero.runesStats.knightShield
  );

  return (
    <div className="edit-hero">
      <Input
        min={1}
        max={7}
        emoji="725690701626736650"
        value={ev}
        onChange={(value) => evSetter(value)}
      />
      <Input
        min={0}
        max={7}
        emoji="725690701618217000"
        value={aw}
        onChange={(value) => awSetter(value)}
      />
      Input the runes % values from this view, without decimal part.
      <img
        src="https://cdn.discordapp.com/attachments/719882686742659083/739390921191194714/image0.png"
        alt="runes"
      />
      <Input
        min={0}
        max={999}
        label="hp"
        value={hp}
        onChange={(value) => hpSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="def"
        value={def}
        onChange={(value) => defSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="atk"
        value={atk}
        onChange={(value) => atkSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="aps"
        value={aps}
        onChange={(value) => apsSetter(value)}
        prc
      />
      <Input
        min={0}
        max={200}
        label="atkrange"
        value={atkrange}
        onChange={(value) => atkrangeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={30}
        label="ctkrate"
        value={ctkrate}
        onChange={(value) => ctkrateSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="ctkdmg"
        value={ctkdmg}
        onChange={(value) => ctkdmgSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="aoe"
        value={aoe}
        onChange={(value) => aoeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="freezeTime"
        value={freezeTime}
        onChange={(value) => freezeTimeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={30}
        label="freezeChance"
        value={freezeChance}
        onChange={(value) => freezeChanceSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="stunTime"
        value={stunTime}
        onChange={(value) => stunTimeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={30}
        label="stunChance"
        value={stunChance}
        onChange={(value) => stunChanceSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="poisonTime"
        value={poisonTime}
        onChange={(value) => poisonTimeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={30}
        label="poisonChance"
        value={poisonChance}
        onChange={(value) => poisonChanceSetter(value)}
        prc
      />
      <Input
        min={0}
        max={200}
        label="mvspd"
        value={mvspd}
        onChange={(value) => mvspdSetter(value)}
        prc
      />
      <Input
        min={0}
        max={30}
        label="burnChance"
        value={burnChance}
        onChange={(value) => burnChanceSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="burnTime"
        value={burnTime}
        onChange={(value) => burnTimeSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="dodgerate"
        value={dodgerate}
        onChange={(value) => dodgerateSetter(value)}
        prc
      />
      <Input
        min={0}
        max={999}
        label="knightShield"
        value={knightShield}
        onChange={(value) => knightShieldSetter(value)}
        prc
      />
      <button
        onClick={() => {
          saveClicked({
            name: hero.name,
            ev,
            aw,
            runesStats: {
              atk,
              def,
              aoe,
              aps,
              ctkrate,
              ctkdmg,
              hp,
              freezeTime,
              freezeChance,
              stunTime,
              stunChance,
              poisonTime,
              poisonChance,
              atkrange,
              mvspd,
              burnChance,
              burnTime,
              dodgerate,
              knightShield,
            },
          });
        }}
      >
        Save
      </button>
    </div>
  );
}
