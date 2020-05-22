const readline = require('readline');

// ANSI escape code
const prefix = '\x1b[';
const suffix = 'm';
const reset = prefix + suffix;
const red = '31';
const blue = '34';
const yellow = '33';
const deco = (ds, str) => prefix + ds.join(';') + suffix + str + reset;
const cursorTo = (row, col) => process.stdout.write(`${prefix}${row};${col}H`)
const clear = () => process.stdout.write(`${prefix}2J`);
const clearDown = () => process.stdout.write(`${prefix}0J`);
const saveCursor = () => process.stdout.write(`${prefix}s`);
const restoreCursor = () => process.stdout.write(`${prefix}u`);
const showCursor = () => process.stdout.write(`${prefix}?25h`);
const hideCursor = () => process.stdout.write(`${prefix}?25l`);

// Utilities
const between = (low, hi, x) =>
  low <= x && x <= hi;

const range = (start, end) => {
  const step = start <= end ? 1 : -1;
  return Array(Math.abs(end - start) + 1)
    .fill(start)
    .map((n, i) => n + i * step);
}

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = xs => xs[randomInt(0, xs.length - 1)];

const randomTake = (xs, n) => {
  const result = [];
  range(0, Math.min(xs.length, n) - 1).forEach(() => {
    const i = randomInt(0, xs.length - 1);
    result.push(xs[i]);
    xs = [...xs.slice(0, i), ...xs.slice(i + 1)];
  });
  return result;
};

// Constants
const LEFT = Symbol();
const RIGHT = Symbol();
const TOP = Symbol();
const BOTTOM = Symbol();

const PREPARING = Symbol();
const PLAYING = Symbol();
const LANDING = Symbol();
const VANISHING = Symbol();
const FALLING = Symbol();

// Models
const randomVirus = () => randomChoice([ redVirus, blueVirus, yellowVirus ]);
const randomMedicine = () => randomChoice([ redMedicine, blueMedicine, yellowMedicine ]);

const capsuleToBlocks = (capsule, pos, dir) => {
  switch (dir) {
    case LEFT:
      return [
        { block: capsule[0], pos },
        { block: capsule[1], pos: { row: pos.row, col: pos.col - 1 } }
      ];
    case RIGHT:
      return [
        { block: capsule[0], pos },
        { block: capsule[1], pos: { row: pos.row, col: pos.col + 1 } }
      ];
    case TOP:
      return [
        { block: capsule[0], pos },
        { block: capsule[1], pos: { row: pos.row - 1, col: pos.col } }
      ];
    case BOTTOM:
      return [
        { block: capsule[0], pos },
        { block: capsule[1], pos: { row: pos.row + 1, col: pos.col } }
      ];
  }
}

const posEq = (pos1, pos2) =>
  pos1.row === pos2.row && pos1.col === pos2.col;

const posInRange = ({ row, col }) =>
  between(0, 15, row) && between(0, 7, col);

const notOverlapping = ({ capsule, pos, dir }, blocks) => {
  const [ fst, snd ] = capsuleToBlocks(capsule, pos, dir);
  return posInRange(fst.pos) && posInRange(snd.pos) && blocks.find(({ pos }) => posEq(pos, fst.pos) || posEq(pos, snd.pos)) === void 0;
}

// Views
const virus = '＊';
const redVirus = deco([red], virus);
const blueVirus = deco([blue], virus);
const yellowVirus = deco([yellow], virus);
const medicine = '＠';
const redMedicine = deco([red], medicine);
const blueMedicine = deco([blue], medicine);
const yellowMedicine = deco([yellow], medicine);
const bottle = `
      |    |
+-----+----+-----+
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
|                |
+----------------+
`;

const displayBlock = (block, pos) => {
  cursorTo(pos.row + 4, pos.col * 2 + 2);
  process.stdout.write(block);
}

const display = (nextCapsule, currentCapsule, blocks) => {
  process.stdout.cork();

  cursorTo(1, 1);
  process.stdout.write(bottle);

  cursorTo(2, 8);
  process.stdout.write(nextCapsule[0]);
  cursorTo(2, 10);
  process.stdout.write(nextCapsule[1]);

  [
   ...blocks,
    ...(currentCapsule === null
      ? []
      : capsuleToBlocks(currentCapsule.capsule, currentCapsule.pos, currentCapsule.dir))
  ].forEach(({ pos, block }) => {
    displayBlock(block, pos);
  });

  process.stdout.uncork();
};

const start = (level) => {
  // init
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY)
    process.stdin.setRawMode(true);
  hideCursor();
  clear();

  // init models
  let nextCapsule = [randomMedicine(), randomMedicine()];
  let currentCapsule = null;
  const numberOfViruses = (level + 1) * 4;
  let restOfViruses = 0;
  let blocks =
    randomTake(
      range(2, 15).flatMap(row => range(0, 7).map(col => ({row, col}))),
      numberOfViruses
    ).map(pos => ({ pos, block: randomVirus() }));
  let lastAddingVirusTime = Date.now();
  let lastFalledTime = Date.now();
  const landingIntervalTime = 1000;
  const landingMaxOffTime = 2000;
  let landedTime = 0;
  let landingOffTime = 0;

  // main loop
  let mode = PREPARING;
  let deltaTime = Date.now();

  // key input
  let keys = [];
  process.stdin.on('keypress', (c, k) => {
    keys.push(k.name);
  });

  const loop = setInterval(() => {
    const now = Date.now();
    const pressedKeys = keys;
    keys = [];

    switch (mode) {
      case PREPARING:
        if (restOfViruses === 0) {
          display(nextCapsule, null, []);

          const { pos, block } = blocks[restOfViruses];
          displayBlock(block, pos);

          restOfViruses++;
          lastAddingVirusTime = now;
        } else if (restOfViruses < numberOfViruses && lastAddingVirusTime >= 2000 / numberOfViruses) {
          const { pos, block } = blocks[restOfViruses];
          displayBlock(block, pos);

          restOfViruses++;
          lastAddingVirusTime = now;
        } else {
          mode = PLAYING;
        }
        break;
      case PLAYING:
        if (currentCapsule == null) {
          currentCapsule = { capsule: nextCapsule, pos: { row: 0, col: 3 }, dir: RIGHT };
          nextCapsule = [randomMedicine(), randomMedicine()];
        }

        // User controll
        {
          let newCurrentCapsule = { ...currentCapsule, pos: { ...currentCapsule.pos } };
          if (pressedKeys.includes('left')) {
            newCurrentCapsule.pos.col -= 1;
          } else if (pressedKeys.includes('right')) {
            newCurrentCapsule.pos.col += 1;
          } else if (pressedKeys.includes('down')) {
            newCurrentCapsule.pos.row += 1;
          }
          if (notOverlapping(newCurrentCapsule, blocks)) {
            currentCapsule = newCurrentCapsule;
          }
        }

        // Fall
        if (now - lastFalledTime >= 1000) {
          const newCurrentCapsule = { ...currentCapsule, pos: { row: currentCapsule.pos.row + 1, col: currentCapsule.pos.col } };
          if (notOverlapping(newCurrentCapsule, blocks)) {
            currentCapsule = newCurrentCapsule;
            lastFalledTime = now;
          } else {
            landedTime = now;
            landingOffTime = landingIntervalTime;
            mode = LANDING;
          }
        }

        display(nextCapsule, currentCapsule, blocks);
        break;
      case LANDING:
        // User controll
        {
          let newCurrentCapsule = { ...currentCapsule, pos: { ...currentCapsule.pos } };
          if (pressedKeys.includes('left')) {
            newCurrentCapsule.pos.col -= 1;
          } else if (pressedKeys.includes('right')) {
            newCurrentCapsule.pos.col += 1;
          }
          if (notOverlapping(newCurrentCapsule, blocks)) {
            currentCapsule = newCurrentCapsule;
            landingOffTime += 300;
          }
        }

        if (landingOffTime <= 0 || now - landedTime >= landingMaxOffTime || pressedKeys.includes('down')) {
          mode = VANISHING;
        }
        break;
      case VANISHING:
        break;
      case FALLING:
        break;
    }

    deltaTime = now;
  }, 1000/64);

  // quit
  process.stdin.on('keypress', (c, k) => {
    if (k.name === 'q' || k.name === 'escape' || (k.name === 'c' && k.ctrl)) {
      clearInterval(loop);
      cursorTo(22, 0);
      clearDown();
      showCursor();

      console.log('Bye!');
      process.exit();
    }
  });
}

start(10);
