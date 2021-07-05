/* @flow */

import React, { useState } from "react";
import "./EditBucketView.css";
import { type OwnedHeros, type Bucket } from "../../../server/types";
import { TeamView } from "../Team/Team";
import { MyHeros } from "../MyHeros/MyHeros";

export function EditBucketView({
  bucket,
  ownedHeros,
  onSaveClicked,
}: {
  bucket: Bucket,
  ownedHeros: OwnedHeros,
  onSaveClicked: (Bucket) => void,
}) {
  const [bucketName, setBucketName] = useState(bucket.name);
  const [teams, setTeams] = useState(bucket.teams);

  const ownedHerosLeft = { ...ownedHeros };
  teams.forEach(({ team }) => {
    team.forEach((heroName) => {
      delete ownedHerosLeft[heroName];
    });
  });

  const saveBtn = () => (
    <div>
      {bucketName && teams[0].team.length ? (
        <button
          style={{ fontSize: 20 }}
          onClick={() => {
            onSaveClicked({ name: bucketName, teams });
          }}
        >
          Save
        </button>
      ) : <div className="note">Add some heros and fill the name to enable save button.</div>}
    </div>
  );

  return (
    <div className="edit-bucket">
      <div className="name-input-container">
        Name:{" "}
        <input
          type="text"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
        />
      </div>
      {saveBtn()}

      {teams.map(({ team }, index) => {
        return (
          <div key={index}>
            <TeamView
              team={team.map((heroName) => ownedHeros[heroName])}
              buffs={{}}
              onHeroTileClicked={(heroName) => {
                let newTeams = teams.reduce((acc, { team }, index) => {
                  return [...acc, { team: team.filter((hn) => hn !== heroName) }];
                }, []);
                newTeams = newTeams.filter(({ team }) => team.length);
                if (!newTeams.length) {
                  newTeams= [{ team: [] }];
                }
                setTeams(newTeams);
              }}
            />
            {index < teams.length - 1 && <div className="horizontal-divider" />}
          </div>
        );
      })}

      <div>Heros collection</div>
      <div className="info">Press on hero icon to add him to the team.</div>
      <MyHeros
        buffs={{}}
        ownedHeros={ownedHerosLeft}
        onHeroTileClicked={(heroName) => {
          let added = false;
          const newTeams = teams.reduce((acc, { team }, index) => {
            if (added) return [...acc, { team }];
            if (team.length < 10) {
              added = true;
              return [...acc, { team: [...team, heroName] }];
            } else if (!teams[index + 1]) {
              return [...acc, { team }, { team: [heroName] }];
            }
            return [...acc, { team }];
          }, []);
          setTeams(newTeams);
        }}
      />
      {saveBtn()}
    </div>
  );
}
