/* globals window */
/* @flow */

import React, { useState, useEffect, createRef } from "react";
import "./BattleSetup.css";
import {
  type Team,
  type OwnedHeros,
  type BuffMap,
  type OwnedHeroRecord,
  type Buckets,
} from "../../../server/types";
import { TeamView } from "../Team/Team";
import { MyHeros } from "../MyHeros/MyHeros";
import { makeReplayHtml } from "../shared/utils/battle/replay.mjs";
import { battleWorkers } from "../shared/utils/battle/battleWorkers";

const saveVersion = new URLSearchParams(window.location.search).get("version"); // for state quick reloading

const battleTeamFromLocalStorageStr = window.localStorage.getItem(
  "currentBattleTeam"
);
let battleTeamFromLocalStorage = battleTeamFromLocalStorageStr
  ? JSON.parse(battleTeamFromLocalStorageStr)
  : { saveVersion: 0, value: [] };

if (
  battleTeamFromLocalStorage &&
  battleTeamFromLocalStorage.saveVersion !== saveVersion
) {
  battleTeamFromLocalStorage = { saveVersion: 0, value: [] };
}
const isX2FromLocalStorageStr = window.localStorage.getItem("isX2");
let isX2FromLocalStorage = isX2FromLocalStorageStr
  ? JSON.parse(isX2FromLocalStorageStr)
  : { saveVersion: 0, value: false };

if (isX2FromLocalStorage && isX2FromLocalStorage.saveVersion !== saveVersion) {
  isX2FromLocalStorage = { saveVersion: 0, value: false };
}

export function BattleSetup({
  enemyTeamBuffMap,
  ownTeamBuffMap,
  enemyTeamName,
  enemyTeam,
  ownedHeros,
  sendStatsToDiscord,
  buckets,
}: {
  enemyTeamName: string,
  enemyTeam: Team,
  ownedHeros: OwnedHeros,
  enemyTeamBuffMap: BuffMap,
  ownTeamBuffMap: BuffMap,
  sendStatsToDiscord: ({
    rndSeed: number,
    attackerTeam: Array<OwnedHeroRecord>,
    isX2: boolean,
  }) => void,
  buckets: Buckets,
}) {
  const [selectedHerosNames, _setSelectedHerosNames] = useState(
    battleTeamFromLocalStorage.value
  );
  const setSelectedHerosNames = (names) => {
    window.localStorage.setItem(
      "currentBattleTeam",
      JSON.stringify({ saveVersion, value: names })
    );
    _setSelectedHerosNames(names);
  };

  const myTeam = selectedHerosNames.map((name) => ({
    name,
    ev: ownedHeros[name].ev,
    aw: ownedHeros[name].aw,
  }));

  const ownedHerosLeft = { ...ownedHeros };
  selectedHerosNames.forEach((heroName) => {
    delete ownedHerosLeft[heroName];
  });

  const attackerTeam = selectedHerosNames.map((heroName) => {
    return ownedHeros[heroName];
  });

  const [isX2, _setIsX2] = useState(isX2FromLocalStorage.value);
  const setIsX2 = (x2) => {
    window.localStorage.setItem(
      "isX2",
      JSON.stringify({ saveVersion, value: x2 })
    );
    _setIsX2(x2);
  };

  const [currentBucketName, setCurrentBucketName] = useState("");
  const [currentBucketIndex, setCurrentBucketIndex] = useState(0);

  useEffect(() => {
    const bucket = buckets[currentBucketName];
    if (!bucket) return;
    const teamSlot = bucket.teams[currentBucketIndex];
    if (!teamSlot) return;
    setSelectedHerosNames(teamSlot.team);

    setIsX2(true);
    setTimeout(() => {
      setIsX2(false);
    }, 1);
  }, [currentBucketName, currentBucketIndex]);

  const [win, setWin] = useState(0);
  const [total, setTotal] = useState(0);
  const battleResultsRef = createRef();
  const [battleResults, setBattleResults] = useState([]);
  const [battleResultsExpanded, setBattleResultsExpanded] = useState(false);
  const runIndexRef = createRef();

  useEffect(() => {
    battleResultsRef.current = [];
    setBattleResults(battleResultsRef.current);
    const runIndex = (runIndexRef.current || 0) + 1;
    runIndexRef.current = runIndex;
    let winCounter = 0;
    let totalCounter = 0;
    setWin(winCounter);
    setTotal(totalCounter);

    battleWorkers.forEach((battle) => {
      function loop() {
        if (runIndex !== runIndexRef.current) {
          // team changed while worker was processing previous team
          return;
        }
        battle(
          attackerTeam,
          enemyTeam,
          ownTeamBuffMap,
          enemyTeamBuffMap,
          isX2
        ).then((result) => {
          if (runIndex !== runIndexRef.current) {
            // team changed while worker was processing previous team
            return;
          }
          if (battleResultsRef.current) {
            const { current: battleResults } = battleResultsRef;

            battleResultsRef.current = [...battleResults, result];
            setBattleResults(battleResultsRef.current);
          }
          totalCounter++;
          setTotal(totalCounter);
          if (result.battleResultStats.won) {
            winCounter++;

            setWin(winCounter);
          } else {
            // nothing
          }

          if (runIndex === runIndexRef.current && totalCounter < 99) {
            loop();
          }
        });
      }
      setTimeout(loop, 1000);
    });

    return () => {
      runIndexRef.current = -1;
    };
  }, [myTeam.length, isX2, currentBucketName, currentBucketIndex]); // eslint-disable-line

  const currentBucket = buckets[currentBucketName];
  return (
    <div className="battle-setup">
      <div>{enemyTeamName}</div>
      <div
        className="results-heading"
        onClick={() => setBattleResultsExpanded(!battleResultsExpanded)}
      >
        {Math.round((win / (total || 1)) * 100)}% wins of {total} tries (Press
        Me)
      </div>
      {battleResultsExpanded && (
        <div className="battle-results">
          {[...battleResults]
            .sort(
              (br1, br2) =>
                br2.battleResultStats.numberOfHerosKilled -
                br1.battleResultStats.numberOfHerosKilled
            )
            .reduce((acc, result) => {
              const {
                numberOfHerosKilled: killed,
                numberOfHerosLost: lost,
                won,
              } = result.battleResultStats;
              const existingResult = acc.find((result) => {
                const {
                  numberOfHerosKilled: currentKilled,
                  numberOfHerosLost: currentLost,
                  won: currentWon,
                } = result.battleResultStats;

                const same =
                  killed === currentKilled &&
                  lost === currentLost &&
                  won === currentWon;

                return same;
              });

              if (existingResult) {
                existingResult.counter++;
                return acc;
              }

              return [...acc, { ...result, counter: 1 }];
            }, [])
            .map((result) => {
              const {
                numberOfHerosKilled: killed,
                numberOfHerosLost: lost,
                won,
              } = result.battleResultStats;
              const winOrLoss = won ? "Victory" : "Defeat";
              const amountPrc = Math.round(
                (result.counter / battleResults.length) * 100
              );

              const replay = () => {
                const html = makeReplayHtml(result.battleLog);
                var win = window.open("", "Battle - CTA");
                win.document.write(html);
              };

              const { rndSeed } = result;

              const _sendStatsToDiscord = () => {
                sendStatsToDiscord({
                  rndSeed: result.rndSeed,
                  attackerTeam,
                  isX2,
                });
              };
              return (
                <div key={rndSeed} className="battle-result">
                  {amountPrc}% {winOrLoss}! K:{killed},L:{lost}{" "}
                  <button onClick={replay}>Replay</button>
                  <button onClick={_sendStatsToDiscord}>Stats</button>
                </div>
              );
            })}
        </div>
      )}
      <TeamView team={enemyTeam} buffs={enemyTeamBuffMap} />
      <div className="vs">VS</div>
      <TeamView
        buffs={ownTeamBuffMap}
        team={myTeam}
        onHeroTileClicked={(heroName) => {
          setSelectedHerosNames(
            selectedHerosNames.filter((hn) => heroName !== hn)
          );
        }}
      />
      <input
        type="checkbox"
        id="x2"
        name="x2"
        checked={isX2}
        onClick={() => setIsX2(!isX2)}
        onChange={() => null}
      />
      <label htmlFor="x2">x2 attack</label>

      {Object.keys(buckets).length && (
        <div>
          Load:
          <select
            id="bucketName"
            name="bucketName"
            onChange={(event) => {
              setCurrentBucketName(event.target.value);
              setCurrentBucketIndex(0);
            }}
          >
            <option key="notset" value="">
              -
            </option>
            {Object.keys(buckets).map((bn) => {
              return (
                <option key={bn} value={bn}>
                  {bn}
                </option>
              );
            })}
          </select>
          {currentBucket && (
            <select
              id="bucketIndex"
              name="bucketIndex"
              onChange={(event) => {
                setCurrentBucketIndex(parseInt(event.target.value));
              }}
            >
              {currentBucket.teams.map((team, index) => {
                return (
                  <option key={index} value={index}>
                    {index}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      )}
      <div>Heros collection</div>
      <div className="info">Press on hero icon to add him to the team.</div>
      <MyHeros
        buffs={ownTeamBuffMap}
        ownedHeros={ownedHerosLeft}
        onHeroTileClicked={(heroName) => {
          if (selectedHerosNames.includes(heroName)) return;
          setSelectedHerosNames([...selectedHerosNames, heroName]);
        }}
      />
    </div>
  );
}
