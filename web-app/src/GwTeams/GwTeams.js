/* @flow */

import React, { useState } from "react";
import "./GwTeams.css";
import {
  type TeamSlot,
  type Guild,
  type GwTeamPosition,
  type BuffMap,
} from "../../../server/types";
import { getTeamPower } from "../shared/utils/team.mjs";
import { printNumber } from "../shared/utils/utils.mjs";
import { TeamView } from "../Team/Team";

const TeamRow = ({
  onFightClicked,
  teamSlot,
  buffs,
}: {|
  onFightClicked: () => void,
  teamSlot: TeamSlot,
  buffs: BuffMap,
|}) => {
  return (
    <div className="team-row">
      <div className="team-name">
        {teamSlot.teamName} ({printNumber(getTeamPower(teamSlot.team))})
      </div>
      <button onClick={() => onFightClicked()}>Fight</button>
      <div className="heros-tiles">
        <TeamView team={teamSlot.team} buffs={buffs} />
      </div>
    </div>
  );
};

const Fort = ({ fort, onFightClicked }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fort">
      <div onClick={() => setExpanded(!expanded)}>
        Fort: {fort.buffType} (Press Me)
      </div>
      {expanded &&
        fort.teams.map((team, index) => {
          if (!team) return <div key={index} />;
          return (
            <TeamRow
              buffs={{ [(fort.buffType: string)]: 1 }}
              key={index}
              teamSlot={team}
              onFightClicked={() => {
                onFightClicked({
                  type: "fort",
                  buffType: fort.buffType,
                  index: (index: any),
                });
              }}
            />
          );
        })}
    </div>
  );
};

const Castle = ({ castle, buffs, onFightClicked }) => {
  return (
    <div className="castle">
      {castle.map((team, index) => {
        if (!team) return <div key={index} />;
        return (
          <TeamRow
            buffs={buffs}
            key={index}
            teamSlot={team}
            onFightClicked={() => {
              onFightClicked({
                type: "castle",
                index: (index: any),
              });
            }}
          />
        );
      })}
    </div>
  );
};

const Forts = ({ forts, onFightClicked }) => {
  return (
    <div>
      {forts.map((fort, index) => {
        if (!fort) return <div key={index} />;
        return (
          <Fort
            key={fort.buffType}
            fort={fort}
            onFightClicked={onFightClicked}
          />
        );
      })}
    </div>
  );
};

export function GwTeamsView({
  guild,
  onFightClicked,
  onFindBestMatchClicked,
}: {
  guild: Guild,
  onFightClicked: (position: GwTeamPosition) => void,
  onFindBestMatchClicked: () => void,
}) {
  const [fortsExpanded, setFortsExpanded] = useState(false);
  const [castleExpanded, setCastleExpanded] = useState(false);
  
  return (
    <div className="gw-teams">
      <div>Guild War</div>
      <div className="note">
        Note: Warlords will add our Opponent&apos;s Fort Teams shortly after the
        start of Fort phase.<br/> Once they are available, you can select an Opponent
        Fort Team to simulate your fight.
      </div>
      <button onClick={onFindBestMatchClicked}>Find best match</button>
      <div className="header" onClick={() => setFortsExpanded(!fortsExpanded)}>
        Forts (Press Me)
      </div>
      {fortsExpanded && (
        <Forts forts={guild.forts} onFightClicked={onFightClicked} />
      )}
      <div
        className="header"
        onClick={() => setCastleExpanded(!castleExpanded)}
      >
        Castle (Press Me)
      </div>
      {castleExpanded && (
        <Castle
          buffs={guild.enemyCastleBuffs}
          castle={guild.castle}
          onFightClicked={onFightClicked}
        />
      )}
    </div>
  );
}
