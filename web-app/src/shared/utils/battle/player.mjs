/* globals window, document */
/* @flow */

/* ::import type { BattleLogRecord } from '../../../../../server/types' */
function code(battleLog /* :Array<Array<BattleLogRecord>> */) {
  if (!window.speed) {
    window.speed = 1;
  }
  const MARGIN_PX = 118;
  const HERO_ICON_SCALE = 0.25;
  const DOT_ICON_SCALE = 0.1;
  const ICON_HEIGHT = 13;
  const SCENE_SCALE = 0.4;

  const GAME_HEIGHT = 398;
  const GAME_WIDTH = 981;

  const discordEmojiAssetUrl = (emojiid) =>
    `https://cdn.discordapp.com/emojis/${emojiid}.png`;

  if (window.app) {
    window.app.destroy();
    const displayDiv = document.querySelector(".display");
    if (displayDiv) {
      displayDiv.innerHTML = "";
    }
  }

  const app = new window.PIXI.Application({
    backgroundColor: 0x1099bb,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  });

  window.app = app;
  window.replay = () => code(battleLog);

  // resize on load as well as when the page resizes
  const resize = () => {
    const width = app.view.parentNode.clientWidth;
    const ratio = width / GAME_WIDTH;

    const height = GAME_HEIGHT * ratio;
    app.view.width = width;
    app.view.height = height;

    app.stage.scale.x = ratio;
    app.stage.scale.y = ratio;
  };
  window.addEventListener("resize", resize);

  const background = window.PIXI.Sprite.from(
    "https://media.discordapp.net/attachments/698485515283988510/698486422658875462/Arena_Range.png"
  );
  background.x = 0;
  background.y = 0;
  app.stage.addChild(background);

  /* $FlowFixMe */
  document.querySelector(".display").appendChild(app.view);
  resize();

  let i = 0;
  let herosSpritesMap = {};
  let atkLineAssets = [];

  function drawAtkLine(fromHeroId, toHeroId, thikness = 1, color = 0xffaa00) {
    const fromSprite = herosSpritesMap[fromHeroId];
    const toSprite = herosSpritesMap[toHeroId];
    if (!fromSprite || !toSprite) return;

    try {
      let atkLineGraph = new window.PIXI.Graphics();

      // Move it to the beginning of the line
      //atkLineGraph.position.set(fromSprite.x, fromSprite.y + (Math.random() - 0.5) * 20);

      // Draw the line (endPoint should be relative to atkLineGraph's position)
      atkLineGraph
        .lineStyle(thikness, color)
        .lineTo(toSprite.x - fromSprite.x, toSprite.y - fromSprite.y);

      atkLineGraph.alpha = 0.4;
      atkLineGraph.transform.scale.x = 0;
      atkLineGraph.transform.scale.y = 0;
      atkLineAssets.push(atkLineGraph);
      fromSprite.addChild(atkLineGraph);

      setTimeout(() => {
        atkLineAssets.splice(atkLineAssets.indexOf(atkLineGraph), 1);
        atkLineGraph.destroy();
      }, 2000);
    } catch (e) {
      console.log(`failed to draw a line from ${fromHeroId} to ${toHeroId}`);
    }
  }

  const repositionDotsIcons = (heroAsset) => {
    // which side the icons should go
    const side = heroAsset.isAttacker ? -1 : 1;
    // an offset to account for the icon width
    const offset = heroAsset.isAttacker ? -ICON_HEIGHT : 0;
    heroAsset.dots.sort((a, b) => {
      return a.category.localeCompare(b.category);
    });
    heroAsset.dots.forEach((dot, index) => {
      dot.sprite.x = offset + (16 + ICON_HEIGHT * Math.floor(index / 3)) * side;
      dot.sprite.y = 3 - (ICON_HEIGHT - 4) * (index % 3);
      dot.sprite.zIndex = index + 1;
    });
  };

  let framesSkipped = 0;
  app.ticker.add(() => {
    const processTick = () => {
      atkLineAssets.forEach((a) => {
        if (a.scale.x > 0.9) {
          a.alpha -= 0.03;
        } else if (a.alpha < 0.7) {
          a.alpha += 0.08;
        }
        const growsSpd = 0.06;
        a.transform.scale.x = Math.min(1, a.transform.scale.x + growsSpd);
        a.transform.scale.y = Math.min(1, a.transform.scale.y + growsSpd);
      });
      const recordsForFrame = battleLog[i++];

      if (!recordsForFrame) return;

      recordsForFrame.forEach((record) => {
        switch (record.type) {
          case "init": {
            const { heros } = record;

            const attackers = [];
            const defenders = [];
            herosSpritesMap = heros.reduce((a, h) => {
              const isPortal = h.heroId.includes("portal");
              const heroSprite = new window.PIXI.Container();
              const iconSprite = window.PIXI.Sprite.from(
                discordEmojiAssetUrl(h.emojiId)
              );
              if (!isPortal) {
                iconSprite.scale.x = HERO_ICON_SCALE;
                iconSprite.scale.y = HERO_ICON_SCALE;
              }
              heroSprite.addChild(iconSprite);
              const isAttacker = h.heroId.startsWith("a");
              const initialPosition = isAttacker
                ? MARGIN_PX
                : app.screen.width - MARGIN_PX;
              iconSprite.anchor.set(0.5);
              heroSprite.x = initialPosition;
              heroSprite.initialPosition = initialPosition;
              heroSprite.isAttacker = isAttacker;
              heroSprite.sortableChildren = true;

              const drawBar = (name, drawArgs, color) => {
                let bar = new window.PIXI.Graphics();
                bar.beginFill(color);
                bar.drawRect(...drawArgs);
                bar.endFill();

                heroSprite.addChild(bar);
                heroSprite[name] = bar;
              };
              drawBar(
                "healthBar",
                isPortal ? [-64, -64, 128, 10] : [-16, -16, 32, 4],
                0xaaff00
              );
              drawBar("shieldBar", [-16, -20, 32, 4], 0x33aa55);
              heroSprite.shieldBar.width = 0;
              heroSprite.dots = [];

              if (isAttacker) {
                attackers.push(h);
              } else {
                defenders.push(h);
              }

              a[h.heroId] = heroSprite;
              return a;
            }, {});
            break;
          }
          case "spawned": {
            const sprite = herosSpritesMap[record.heroId];
            sprite.y =
              app.screen.height -
              44 -
              record.depth * 18 -
              (record.heroId.includes("portal") ? 120 : 0) -
              (record.isFlying ? 170 : 0);
            app.stage.addChild(sprite);
            break;
          }
          case "move": {
            const { heroId, newPosition } = record;
            const heroSprite = herosSpritesMap[heroId];
            heroSprite.x =
              heroSprite.initialPosition +
              (heroSprite.isAttacker ? 1 : -1) * newPosition * SCENE_SCALE;
            break;
          }
          case "pushed_to": {
            const { heroId, position } = record;
            const heroSprite = herosSpritesMap[heroId];
            heroSprite.x =
              heroSprite.initialPosition +
              (heroSprite.isAttacker ? 1 : -1) * position * SCENE_SCALE;
            break;
          }
          case "hp-changed": {
            const { isCrit, targetHpUpdate, heroId, isSp2, isHeal } = record;
            const {
              heroId: tagetHeroId,
              hpPrc,
              knightShieldPrc,
            } = targetHpUpdate;
            const heroSprite = herosSpritesMap[tagetHeroId];
            const isPortal = tagetHeroId.includes("portal");
            heroSprite.healthBar.width = (isPortal ? 128 : 32) * hpPrc;
            heroSprite.shieldBar.width = 32 * knightShieldPrc;

            let color = 0xabcdef;
            if (isHeal) {
              color = 0xffff10;
            } else if (isCrit) {
              color = 0xff2211;
            }

            if (heroId !== tagetHeroId) {
              drawAtkLine(
                heroId,
                tagetHeroId,
                (isCrit || isHeal ? 3 : 1) * (isSp2 ? 3 : 1),
                color
              );
            }
            break;
          }
          case "miss":
            // TODO
            break;
          case "death": {
            const { heroId } = record;
            herosSpritesMap[heroId].destroy();
            break;
          }
          case "end": {
            const { won } = record;
            setTimeout(() => {
              window.alert(won ? "Victory!" : "Defeat!");
            }, 500);
            break;
          }
          case "effect-start": {
            const { category, heroId } = record;
            const heroSprite = herosSpritesMap[heroId];
            let emojiCode = "718695795347685406";
            switch (category) {
              case "burn":
                emojiCode = "722090417960517683";
                break;
              case "heal":
                emojiCode = "722090417860116491";
                break;
              case "poison":
                emojiCode = "722090418287804457";
                break;
              case "freeze":
                emojiCode = "722090417914511380";
                break;
              case "stun":
                emojiCode = "722090418585731182";
                break;
              case "atkDown":
                emojiCode = "722340864524943431";
                break;
              case "defDown":
                emojiCode = "722340864512360469";
                break;
              case "slowDown":
                emojiCode = "722090418707234846";
                break;
              case "possess":
                emojiCode = "723102508066799676";
                break;
              default:
                (category /*:empty */); // eslint-disable-line
            }
            const dotAssetUrl = discordEmojiAssetUrl(emojiCode);
            const dotSprite = window.PIXI.Sprite.from(dotAssetUrl);
            dotSprite.scale.x = DOT_ICON_SCALE;
            dotSprite.scale.y = DOT_ICON_SCALE;
            heroSprite.addChild(dotSprite);
            heroSprite.dots.push({ category, sprite: dotSprite });
            repositionDotsIcons(heroSprite);

            break;
          }
          case "effect-stop": {
            const { category, heroId } = record;
            const heroSprite = herosSpritesMap[heroId];
            const dot = heroSprite.dots.find((d) => d.category === category);
            if (!dot) {
              break;
            }
            dot.sprite.destroy();
            heroSprite.dots.splice(heroSprite.dots.indexOf(dot), 1);
            repositionDotsIcons(heroSprite);
            break;
          }
          default:
            (record.type /*:empty */); // eslint-disable-line
        }
      });
    };
    
    if (window.speed < 1) {
      if (framesSkipped * window.speed < 1) {
        framesSkipped += window.speed;
      } else {
        framesSkipped -= 1;
        processTick();
      }
    } else {
      for (let i = 0; i < window.speed; i++) {
        processTick();
      }
    }
  });
}
