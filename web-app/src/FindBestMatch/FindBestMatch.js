/* @flow */

import React, { useState, useEffect, useRef } from "react";
import "./FindBestMatch.css";
import {
  type OwnedHeros,
  type Buckets,
  type Guild,
  type Team,
  type GwTeamPosition,
} from "../../../server/types";
import { battleWorkers } from "../shared/utils/battle/battleWorkers";

function getPermutations(xs) {
  let ret = [];

  for (let i = 0; i < xs.length; i = i + 1) {
    let rest = getPermutations(xs.slice(0, i).concat(xs.slice(i + 1)));

    if (!rest.length) {
      ret.push([xs[i]]);
    } else {
      for (let j = 0; j < rest.length; j = j + 1) {
        ret.push([xs[i]].concat(rest[j]));
      }
    }
  }
  return ret;
}

const ResultRow = ({ battleVariation }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div key={battleVariation.key} className="result-row">
      <button onClick={() => setExpanded(!expanded)}>
        {battleVariation.key.replace(/x1/g, "")} ({battleVariation.maxPoints})
      </button>
      {expanded && (
        <div>
          {battleVariation.battleResultGroupedByAttacker.map(
            (result, index) => {
              const battleResult = result.battleResults[0];
              if (!battleResult) return <div />;
              const { attackerPosition, defenderPosition, isX2 } = battleResult;
              const points = result.maxPoints;
              return (
                <div key={index}>
                  {isX2 ? "(x2)" : ""}
                  {attackerPosition.bucketName}.{attackerPosition.index}&gt;
                  {`${
                    defenderPosition.buffType
                      ? `${defenderPosition.buffType}.`
                      : ""
                  }`}
                  P{defenderPosition.index + 1}={points}pts.
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};

export function FindBestMatch({
  ownedHeros,
  buckets,
  guild,
}: {
  ownedHeros: OwnedHeros,
  buckets: Buckets,
  guild: Guild,
}) {
  const battleResultsRef = useRef();
  const [battleResults, setBattleResults] = useState([]);
  const [phase, setPhase] = useState("fort");
  const [numberOfAttacks, setNumberOfAttacks] = useState(3);
  const [useX2, setUseX2] = useState(false);
  const [battlesToComplete, setBattlesToComplete] = useState(0);

  const runIndexRef = useRef();

  useEffect(() => {
    let lastBattleResult = null;
    const intervalId = setInterval(() => {
      if (battleResultsRef.current === lastBattleResult) {
        return;
      }
      lastBattleResult = battleResultsRef.current;
      if (battleResultsRef.current) {
        setBattleResults(battleResultsRef.current);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const workPool = [];
    battleResultsRef.current = [];
    setBattleResults(battleResultsRef.current);
    const runIndex = (runIndexRef.current || 0) + 1;
    runIndexRef.current = runIndex;

    const teamsToFight: Array<{|
      position: GwTeamPosition,
      team: Team,
      pointsRemaining: number,
    |}> = [];

    if (phase === "fort") {
      guild.forts.forEach((fort) => {
        if (fort) {
          fort.teams.forEach((teamSlot, index) => {
            if (teamSlot) {
              teamsToFight.push({
                position: {
                  type: "fort",
                  index: (index: any),
                  buffType: fort.buffType,
                },
                team: teamSlot.team,
                pointsRemaining: teamSlot.pointsRemaining,
              });
            }
          });
        }
      });
    } else {
      guild.castle.forEach((teamSlot, index) => {
        if (teamSlot) {
          teamsToFight.push({
            position: {
              type: "castle",
              index: (index: any),
            },
            team: teamSlot.team,
            pointsRemaining: teamSlot.pointsRemaining,
          });
        }
      });
    }

    teamsToFight
      .filter(({ pointsRemaining }) => pointsRemaining > 0)
      .forEach(({ position: defenderPosition, team: enemyTeam }) => {
        const ownTeamBuffMap =
          defenderPosition.type === "castle" ? guild.ownCastleBuffs : {};
        const enemyTeamBuffMap =
          defenderPosition.type === "castle"
            ? guild.enemyCastleBuffs
            : { [(defenderPosition.buffType: any)]: 1 };

        Object.keys(buckets).forEach((bucketName) => {
          const bucket = buckets[bucketName];
          bucket.teams.forEach(({ team: attackerTeam }, index) => {
            const process = (isX2) => {
              const work = (battle) =>
                battle(
                  attackerTeam.map((heroName) => ownedHeros[heroName]),
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

                    const attackerPosition = { bucketName, index };

                    battleResultsRef.current = [
                      ...battleResults,
                      {
                        isX2,
                        attackerPosition,
                        defenderPosition,
                        result,
                      },
                    ];
                  }
                });
              workPool.push(work);
            };
            process(false);
            if (useX2) {
              process(true);
            }
          });
        });
      });

    setBattlesToComplete(workPool.length);

    battleWorkers.forEach((battle) => {
      const loop = () => {
        if (runIndex !== runIndexRef.current) {
          // team changed while worker was processing previous team
          return;
        }
        const work = workPool.pop();
        if (work) {
          work(battle).then(loop);
        }
      };
      loop();
    });

    return () => {
      runIndexRef.current = -1;
    };
  }, [phase, numberOfAttacks, useX2]); // eslint-disable-line

  const getPoints = ({ defenderPosition, result }) => {
    let points = 0;

    if (defenderPosition.type === "fort") {
      const fort = guild.forts.find(
        (fortSlot) =>
          fortSlot && fortSlot.buffType === defenderPosition.buffType
      );
      if (fort && fort.teams[defenderPosition.index]) {
        points = Math.min(
          fort.teams[defenderPosition.index].pointsRemaining,
          80 - defenderPosition.index * 10
        );
      }
    } else if (guild.castle[defenderPosition.index]) {
      points = Math.min(
        guild.castle[defenderPosition.index].pointsRemaining,
        140 - defenderPosition.index * 2
      );
    }

    return Math.floor(
      (result.battleResultStats.numberOfHerosKilled / 10) * points
    );
  };

  const groupedResultsByBucket = battleResults.reduce((acc, br) => {
    const bucketKey = br.attackerPosition.bucketName;
    if (!acc[bucketKey]) {
      acc[bucketKey] = [];
    }
    acc[bucketKey].push(br);
    return acc;
  }, {});

  const bucketVariations = Object.keys(groupedResultsByBucket).reduce(
    (acc, bucketKey) => {
      const bucketResults = groupedResultsByBucket[bucketKey];

      const { teams } = buckets[bucketKey];

      const bucketAttacks = [];

      for (let i = 0; i < teams.length; i++) {
        bucketAttacks.push({ isX2: false, index: i });
        if (useX2) {
          bucketAttacks.push({ isX2: true, index: i });
        }
      }

      const possibleAttacksPermutationsMap = getPermutations(bucketAttacks)
        .map((permutation) => {
          const attacksThatFitAwailableNumberOfAttacks = [];
          let availabeNumberOfAttacks = numberOfAttacks;
          permutation.some((attack) => {
            if (availabeNumberOfAttacks === 0) {
              return true;
            }

            if (attack.isX2) {
              if (availabeNumberOfAttacks < 2) {
                return true;
              } else {
                availabeNumberOfAttacks -= 2;
              }
            } else {
              availabeNumberOfAttacks--;
            }
            attacksThatFitAwailableNumberOfAttacks.push(attack);
            return false;
          });
          return attacksThatFitAwailableNumberOfAttacks;
        })
        .filter((attacksThatFitAwailableNumberOfAttacks) => {
          // filter out the attacks by same source that appears on different positions
          if (
            attacksThatFitAwailableNumberOfAttacks.some(
              (attack, attackIndex, arr) =>
                arr.some(
                  (nAttack, nAttackIndex) =>
                    nAttack.index === attack.index &&
                    nAttackIndex !== attackIndex
                )
            )
          ) {
            return false;
          }
          return true;
        })
        .reduce((acc, attacks) => {
          const key =
            `${bucketKey}-` +
            [...attacks]
              .sort((a1, a2) => a1.index - a2.index)
              .map((a) => `${a.index}${a.isX2 ? "x2" : "x1"}`)
              .join("-");

          if (!acc[key]) {
            acc[key] = attacks;
          }

          return acc;
        }, {});

      const battleResultsGroupedByPermutation = Object.keys(
        possibleAttacksPermutationsMap
      )
        .map((key) => {
          const permutation = possibleAttacksPermutationsMap[key];

          const battleResultGroupedByAttacker = permutation
            .map(({ isX2, index }) => {
              const battleResults = bucketResults
                .filter(
                  (br) =>
                    br.attackerPosition.index === index && br.isX2 === isX2
                )
                .sort((br1, br2) => getPoints(br2) - getPoints(br1));
              // TODO group here, as battleResults can have multiple attacks to same target
              return {
                isX2,
                index,
                battleResults,
              };
            })
            .reduce((acc, r) => {
              const battleResults = r.battleResults.filter((br) => {
                // if previous guys in bucket scored max is my max, then i will fallback to next max
                const alreadyAttackingThisTarget = acc.some(
                  ({ battleResults }) => {
                    return battleResults[0] && (
                      battleResults[0].defenderPosition.index ===
                      br.defenderPosition.index
                    );
                  }
                );
                if (alreadyAttackingThisTarget) {
                  return false;
                }
                return true;
              });
              return [
                ...acc,
                {
                  ...r,
                  battleResults,
                  maxPoints: battleResults[0] ? getPoints(battleResults[0]) : 0,
                },
              ];
            }, []);

          const maxPoints = battleResultGroupedByAttacker.reduce(
            (a, { battleResults }) =>
              a + (battleResults[0] ? getPoints(battleResults[0]) : 0),
            0
          );

          return {
            key,
            permutation,
            battleResultGroupedByAttacker,
            maxPoints,
          };
        })
        .sort(({ maxPoints: mp1 }, { maxPoints: mp2 }) => mp2 - mp1);

      return [...acc, ...battleResultsGroupedByPermutation].sort(
        (a1, a2) => a2.maxPoints - a1.maxPoints
      );
    },
    []
  );

  return (
    <div className="find-best-match">
      <div>Find best match</div>
      <div className="note">
        Select the current Phase, either Fort of Castle
        <br />
        Select number of attacks, either 3 or 4<br />
        Select either you want to use x2 or not
        <br />
        I will take all your buckets, and test them against all the enemy teams.
        <br />
      </div>
      <div>
        <label htmlFor="nAttacks">Number of attacks:</label>
        <select
          id="nAttacks"
          name="nAttacks"
          onChange={(event) => {
            setNumberOfAttacks(parseInt(event.target.value));
          }}
        >
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>
      <div>
        <label htmlFor="phase">Phase:</label>
        <select
          id="phase"
          name="phase"
          onChange={(event) => {
            setPhase(event.target.value);
          }}
        >
          <option value="fort">Fort</option>
          <option value="castle">Castle</option>
        </select>
      </div>
      <div>
        <input
          id="x2"
          type="checkbox"
          value={useX2}
          onChange={() => setUseX2(!useX2)}
        />
        <label htmlFor="x2">x2 attack</label>
      </div>
      <div>
        Progress {battleResults.length} / {battlesToComplete}
      </div>
      <div>Results:</div>
      <div>
        {bucketVariations
          .filter((e, i) => i < 15)
          .map((bv) => {
            return <ResultRow key={bv.key} battleVariation={bv} />;
          })}
      </div>
    </div>
  );
}
