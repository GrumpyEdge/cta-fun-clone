/* @flow */

import React from "react";
import "./Teams.css";
import { type Teams } from "../../../server/types";
import { getTeamPower } from "../shared/utils/team.mjs";
import { printNumber } from "../shared/utils/utils.mjs";
import { TeamView } from "../Team/Team";

export function TeamsView({
  teams,
  onFightClicked,
  onDeleteClicked,
}: {
  teams: Teams,
  onFightClicked: (teamName: string) => void,
  onDeleteClicked: (teamName: string) => void,
}) {
  return (
    <div className="teams">
      <div>My opponents</div>
      <div className="note">
        Note: This tab is for your personal opponents list.<br/>
        To check on how to add your personal opponents type <b>.pvp</b> in #rawr-dino-simulator channel.
      </div>
      {Object.keys(teams).map((teamName) => {
        const team = teams[teamName];
        return (
          <div className="team-row" key={teamName}>
            <div className="team-name">
              {teamName} ({printNumber(getTeamPower(team))})
            </div>
            <button onClick={() => onFightClicked(teamName)}>Fight</button>- - -
            <button onClick={() => onDeleteClicked(teamName)}>Delete</button>
            <div className="heros-tiles">
              <TeamView team={team} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
