/* @flow */

import React from "react";
import "./Buckets.css";
import { type Buckets, type OwnedHeros } from "../../../server/types";
import { TeamView } from "../Team/Team";

export function BucketsView({
  buckets,
  ownedHeros,
  onCreateClicked,
  onEditClicked,
  onDeleteClicked,
}: {
  buckets: Buckets,
  ownedHeros: OwnedHeros,
  onCreateClicked: () => void,
  onEditClicked: (bucketName: string) => void,
  onDeleteClicked: (bucketName: string) => void,
}) {
  return (
    <div className="buckets">
      <div>Buckets</div>
      <div className="note">
        Note: Bucket is your heros collection splitted into multiple teams.
        <br />
        When you looking for an attack in GW, you split your collection in a 2,
        3, 4 teams <br />
        Here you can create multiple buckets, and then test them to find out
        what suits best for your current war situation!
      </div>
      <button onClick={onCreateClicked}>Create Bucket</button>
      {Object.keys(buckets).map((bucketName) => {
        const bucket = buckets[bucketName];
        return (
          <div className="bucket-row" key={bucketName}>
            <div className="bucket-name">{bucketName}</div>
            <button onClick={() => onEditClicked(bucketName)}>Edit</button>
            <button onClick={() => onDeleteClicked(bucketName)}>Delete</button>
            <div className="heros-tiles">
              {bucket.teams.map(({ team }, index) => {
                return (
                  <div>
                    <TeamView
                      key={index}
                      team={team.map((heroName) => ownedHeros[heroName])}
                      small
                    />
                    {index < bucket.teams.length - 1 && (
                      <div className="horizontal-divider small" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
