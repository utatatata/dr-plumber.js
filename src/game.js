const B = require("blessed");
const P = B.program();
const U = require("./utils.js");

/********** Constans **********/

const TYPE_MEDICINE = Symbol();
const TYPE_VIRUS = Symbol();
const COLOR_RED = Symbol();
const COLOR_BLUE = Symbol();
const COLOR_YELLOW = Symbol();
const DIRECTION_LEFT = Symbol();
const DIRECTION_RIGHT = Symbol();
const DIRECTION_UP = Symbol();
const DIRECTION_DOWN = Symbol();
const MODE_INIT = Symbol();
const MODE_PREPARING = Symbol();
const MODE_READY = Symbol();
const MODE_PLAYING = Symbol();
const MODE_LANDING = Symbol();
const MODE_VANISHING = Symbol();
const MODE_FALLING = Symbol();
const SPEED_LOW = Symbol();
const SPEED_MIDDLE = Symbol();
const SPEED_HIGH = Symbol();

const typeToStr = (type) => {
  switch (type) {
    case TYPE_MEDICINE:
      return "＠";
    case TYPE_VIRUS:
      return "＊";
  }
  throw `invalid block type '${type}'`;
};
const colorToStr = (color) => {
  switch (color) {
    case COLOR_RED:
      return "red";
    case COLOR_BLUE:
      return "blue";
    case COLOR_YELLOW:
      return "yellow";
  }
  throw `invalid block color '${color}'`;
};

const movePos = (dir, { row, col }) => {
  switch (dir) {
    case DIRECTION_LEFT:
      return { row, col: col - 1 };
    case DIRECTION_RIGHT:
      return { row, col: col + 1 };
    case DIRECTION_UP:
      return { row: row - 1, col };
    case DIRECTION_DOWN:
      return { row: row + 1, col };
  }
  throw `invalid direction '${dir}'`;
};

const speedToFallTime = (speed) => {
  switch (speed) {
    case SPEED_LOW:
      return 1500;
    case SPEED_MIDDLE:
      return 1000;
    case SPEED_HIGH:
      return 500;
  }
  throw `invalid speed '${speed}'`;
};

/********** Models **********/

const makeBlock = (type, color) => ({
  type,
  color,
});
const makeMedicine = (color) => makeBlock(TYPE_MEDICINE, color);
const makeVirus = (color) => makeBlock(TYPE_VIRUS, color);
const makeEmptyBottle = () => [...Array(16)].map((row) => Array(8).fill(null));
const makeCapsule = (color1, color2, pos, dir) => ({
  medicines: [makeMedicine(color1), makeMedicine(color2)],
  pos,
  dir,
});

const inRange = ({ row, col }) => U.between(1, 16, row) && U.between(1, 8, col);

const randomColor = () => U.randomChoice([COLOR_RED, COLOR_BLUE, COLOR_YELLOW]);
const randomMedicine = () => makeMedicine(randomColor());
const randomVirus = () => makeVirus(randomColor());
const randomCapsule = (pos, dir) =>
  makeCapsule(randomColor(), randomColor(), pos, dir);
// const randomBottle = () =>
//   U.range(1, 16)
//     .flatMap((row) => U.range(1, 8).map((col) => ({ row, col })))
//     .reduce((bottle, { row, col }) => {
//       bottle[row - 1][col - 1] = randomVirus();
//       return bottle;
//     }, makeEmptyBottle());

const bottleToBlocks = (bottle) =>
  bottle
    .flatMap((bs, row) => bs.map((b, col) => ({ pos: { row, col }, block: b })))
    .filter(({ pos, block }) => block !== null);

const getAllNumberOfViruses = (level) => (level + 1) * 4;

const initModel = (options) => ({
  ...options,
  bottle: makeEmptyBottle(),
  current: null, // type Capsule
  next: [randomMedicine(), randomMedicine()],
  mode: MODE_INIT,
  speed: options.speed,
  preparingState: {
    addingVirusPosList: U.randomTake(
      U.range(3, 16).flatMap((row) =>
        U.range(1, 8).map((col) => ({ row, col }))
      ),
      getAllNumberOfViruses(options.level)
    ),
    lastAddVirusTime: Date.now(),
  },
  playingState: {
    lastFalledTime: Date.now(),
  },
});

const initPreparingState = (model) => {
  const now = Date.now();

  model.preparingState.lastAddVirusTime = now;
};

const initPlayingState = (model) => {
  const now = Date.now();

  model.playingState.lastFalledTime = now;
  model.current = randomCapsule({ row: 1, col: 4 }, DIRECTION_RIGHT);
  model.next = [randomMedicine(), randomMedicine()];
};

/********** Views **********/

const blockView = ({ row, col }, { type, color }) =>
  B.box({
    top: row,
    left: col * 2 + 1,
    width: 2,
    height: 1,
    style: {
      fg: colorToStr(color),
      bg: "black",
    },
    content: typeToStr(type),
  });

const bottleLipView = ([medicine1, medicine2]) =>
  B.box({
    top: 0,
    left: 2,
    width: 15,
    height: 3,
    style: {
      bg: "black",
    },
    border: {
      type: "line",
    },
    children: [
      blockView({ row: 0, col: 2 }, medicine1),
      blockView({ row: 0, col: 3 }, medicine2),
    ],
  });

const bottleNeckView = () =>
  B.box({
    top: 2,
    left: 7,
    width: 5,
    height: 2,
    style: {
      bg: "black",
    },
  });

const bottleBodyView = (bottle, current) =>
  B.box({
    top: 3,
    left: 0,
    width: 19,
    height: 18,
    style: {
      bg: "black",
    },
    border: {
      type: "line",
    },
    children: [
      ...bottleToBlocks(bottle).map(({ pos, block }) => blockView(pos, block)),
      ...(current === null
        ? []
        : [
            blockView(current.pos, current.medicines[0]),
            blockView(movePos(current.dir, current.pos), current.medicines[1]),
          ]),
    ],
  });

const bottleView = (bottle, current, next) =>
  B.box({
    top: 0,
    left: 0,
    width: 19,
    height: 20,
    style: {
      bg: "black",
    },
    children: [
      bottleLipView(next),
      bottleBodyView(bottle, current),
      bottleNeckView(),
    ],
  });

const view = (model) =>
  B.box({
    width: "100%",
    height: "100%",
    style: {
      bg: "black",
    },
    children: [bottleView(model.bottle, model.current, model.next)],
  });

/********** Loop **********/

const loop = (screen, model) => {
  const now = Date.now();

  switch (model.mode) {
    case MODE_INIT:
      screen.append(view(model));
      screen.render();

      model.preparingState.lastAddVirusTime = now;

      initPreparingState(model);
      model.mode = MODE_PREPARING;
    case MODE_PREPARING:
      const allNumberOfViruses = getAllNumberOfViruses(model.level);
      const elapsedTime = now - model.preparingState.lastAddVirusTime;
      const numberOfAddingViruses = U.clamp(
        0,
        model.preparingState.addingVirusPosList.length,
        Math.round(elapsedTime / (3000 / allNumberOfViruses))
      );

      if (model.preparingState.addingVirusPosList.length === 0) {
        initPlayingState(model);
        model.mode = MODE_READY;
      } else if (numberOfAddingViruses >= 1) {
        U.range(1, numberOfAddingViruses).forEach(() => {
          const { row, col } = model.preparingState.addingVirusPosList.pop();
          model.bottle[row - 1][col - 1] = randomVirus();
          model.lastAddVirusTime = now;
          screen.append(view(model));
          screen.render();
        });
      }
      break;
    case MODE_READY:
      if (
        now - model.playingState.lastFalledTime >
        speedToFallTime(model.speed)
      ) {
        model.playingState.lastFalledTime = now;
        const newPos = movePos(DIRECTION_DOWN, model.current.pos);
      }
      break;
    case MODE_PLAYING:
      break;
    case MODE_LANDING:
      break;
    case MODE_VANISHING:
      break;
    case MODE_FALLING:
      break;
  }
};

/********** Main **********/

const main = (options) => {
  const model = initModel(options);

  const screen = B.screen({
    smartCSR: true,
    fullUnicode: true,
  });

  loop(screen, model);
  const intervalId = setInterval(() => {
    loop(screen, model);
  }, 1000 / model.fps);

  // Quit
  screen.key(["escape", "q", "C-c"], (ch, key) => {
    clearInterval(intervalId);
    process.exit(0);
  });
};

module.exports = {
  main,
  SPEED_LOW,
  SPEED_MIDDLE,
  SPEED_HIGH,
};
