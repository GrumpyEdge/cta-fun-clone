/* @flow */

/* ::import type { BattleLogRecord } from '../../../../../server/types' */

// $FlowFixMe
import player from '!!raw-loader!./player.mjs'; // eslint-disable-line

export const makeReplayHtml = (
  battleLog /* :Array<Array<BattleLogRecord>> */
) => `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>PixiJs</title>
    <style type="text/css">
      body: {
        margin: 0;
      }
      .display {
        display: flex;
        justify-content: center;
      }
      .display canvas {
        flex: 1;
      }
      #close-btn {
        font-size: 40px;
      }
    </style>
  </head>
  <body>
    <div class="display">
    </div>
    <button id="close-btn" onclick="window.close()">CLOSE</button>
    <button id="close-btn" onclick="window.replay()">REPLAY</button>
    <button id="close-btn" onclick="window.speed = 0.5">x0.5</button>
    <button id="close-btn" onclick="window.speed = 0.75">x0.75</button>
    <button id="close-btn" onclick="window.speed = 1">x1</button>
    <button id="close-btn" onclick="window.speed = 2">x2</button>
    <button id="close-btn" onclick="window.speed = 3">x3</button>
    <button id="close-btn" onclick="window.speed = 4">x4</button>
    <button id="close-btn" onclick="window.speed = 5">x5</button>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.3/pixi.min.js"></script>
    <script type="text/javascript">
        window.battleData = ${JSON.stringify(battleLog)}
    </script>
    <script type="text/javascript">
        window.code = ${player}
        window.c = function() { window.code(window.battleData) };
        window.c()
    </script>
  </body>
</html>
`;
