/* @flow */
import { ALL_HEROS } from "../web-app/src/shared/constants/heros.mjs";
import { boundaryInt } from "../web-app/src/shared/utils/utils.mjs";
import { getTeamPower } from "../web-app/src/shared/utils/team.mjs";

export const parseHeros = (
  teamName /* : string */,
  herosStrs /* : [string, string, string, string, string, string, string, string, string, string] */
) => {
  const process = (powerAdjusment) => {
    const errors /* : Array<string> */ = [];
    const heros = herosStrs
      .filter((x) => x)
      .reduce((a, hStr) => {
        let [
          name,
          evStr,
          awStr,
          weaponStr,
          avRuneStarsStr,
          avRuneLvlProgressStr,
          runeSetTypesStr,
          runePrimariesStr,
          runeSecondariesStr,
        ] = hStr.split(".");
        const hero = ALL_HEROS.find(
          (h) => h.shortName === name || h.nameNoSpace === name
        );
        if (!hero) {
          errors.push(`invalid hero name: ${hStr}`);
          return a;
        }

        const ev = boundaryInt(
          1,
          7,
          isNaN(parseInt(evStr, 10)) ? 1 : parseInt(evStr, 10)
        );
        const aw = boundaryInt(
          0,
          ev,
          isNaN(parseInt(awStr, 10)) ? 0 : parseInt(awStr, 10)
        );

        if (!weaponStr) {
          weaponStr = Math.floor(((aw + ev) / 7) * 5.5).toString();
        }

        const weapon = boundaryInt(
          1,
          9,
          isNaN(parseInt(weaponStr, 10)) ? 1 : parseInt(weaponStr, 10)
        );

        if (!avRuneStarsStr) {
          avRuneStarsStr = Math.floor(
            ((aw + ev) / 7) * 2 * (1 + powerAdjusment)
          ).toString();
        }
        const averageRuneStars = boundaryInt(
          1,
          6,
          isNaN(parseInt(avRuneStarsStr, 10)) ? 1 : parseInt(avRuneStarsStr, 10)
        );

        if (!avRuneLvlProgressStr) {
          avRuneLvlProgressStr = (
            ((5 * averageRuneStars * (aw + ev)) / 14) *
            (1 + powerAdjusment)
          ).toString();
        }

        const averageRuneLvlProgress = boundaryInt(
          1,
          averageRuneStars * 5,
          isNaN(parseInt(avRuneLvlProgressStr, 10))
            ? 1
            : parseInt(avRuneLvlProgressStr, 10)
        );

        let [r1t, r2t, r3t] = (runeSetTypesStr || "").toUpperCase();

        const isValidRuneType = (t) => "DGAVPRENCSXBIZYWK".includes(t);
        if (!isValidRuneType(r1t)) {
          r1t = hero.runeBuilds.default.runes[0];
        }
        if (!isValidRuneType(r2t)) {
          r2t = hero.runeBuilds.default.runes[1];
        }
        if (!isValidRuneType(r3t)) {
          r3t = hero.runeBuilds.default.runes[2];
        }

        let [r1p, r2p, r3p] = (runePrimariesStr || "").toUpperCase();
        const isValidRunePrimary = (t) => "DAREVGWBF".includes(t);
        if (!isValidRunePrimary(r1p)) {
          r1p = hero.runeBuilds.default.runePrimaries[0];
        }
        if (!isValidRunePrimary(r2p)) {
          r2p = hero.runeBuilds.default.runePrimaries[1];
        }
        if (!isValidRunePrimary(r3p)) {
          r3p = hero.runeBuilds.default.runePrimaries[2];
        }

        let [r1s, r2s, r3s, r4s] = (runeSecondariesStr || "").toUpperCase();
        const isValidRuneSecondary = (t) => "DMRLVG".includes(t);
        if (!isValidRuneSecondary(r1s)) {
          r1s = hero.runeBuilds.default.runeSecondaries[0];
        }
        if (!isValidRuneSecondary(r2s)) {
          r2s = hero.runeBuilds.default.runeSecondaries[1];
        }
        if (!isValidRuneSecondary(r3s)) {
          r3s = hero.runeBuilds.default.runeSecondaries[2];
        }
        if (!isValidRuneSecondary(r4s)) {
          r4s = hero.runeBuilds.default.runeSecondaries[3];
        }

        a.push({
          name: hero.name,
          ev,
          aw,
          weapon,
          averageRuneStars,
          averageRuneLvlProgress,
          runes: [(r1t /*:any */), (r2t /*:any */), (r3t /*:any */)],
          runePrimaries: [(r1p /*:any */), (r2p /*:any */), (r3p /*:any */)],
          runeSecondaries: [
            (r1s /*:any */),
            (r2s /*:any */),
            (r3s /*:any */),
            (r4s /*:any */),
          ],
        });

        return a;
      }, []);

    return {
      heros,
      errors,
    };
  };

  const teamPowerStr = teamName.split(".")[1];
  const teamPower = isNaN(parseInt(teamPowerStr, 10))
    ? 0
    : parseInt(teamPowerStr, 10);

  let { heros, errors } = process(0);

  if (teamPower && !errors.length) {
    let currentTeamPower = getTeamPower(heros);
    let teamPowerDiff = Math.abs(currentTeamPower - teamPower) / teamPower;
    let powerAdjusment = 0;
    let counter = 0;

    while (teamPowerDiff > 0.01 && counter < 500) {
      counter++;
      const notEnoughtPower = currentTeamPower - teamPower < 0;
      const adjustMult = notEnoughtPower ? 1 : -1;

      const accuracy = 10; // bigger number, will adjust in smaller steps
      powerAdjusment = powerAdjusment + (adjustMult * teamPowerDiff) / accuracy
      const result = process(powerAdjusment);
      heros = result.heros;
      currentTeamPower = getTeamPower(heros);
      teamPowerDiff = Math.abs(currentTeamPower - teamPower) / teamPower;
    }
  }

  return {
    heros,
    error: errors.length ? `Errors: \n${errors.join("\n")}` : "",
  };
};
