const B = require("blessed");
const P = B.program();
const U = require("./utils.js");

const TYPE_MEDICINE = Symbol();
const TYPE_VIRUS = Symbol();
const COLOR_RED = Symbol();
const COLOR_BLUE = Symbol();
const COLOR_YELLOW = Symbol();
const DIRECTION_RIGHT = Symbol();
const DIRECTION_LEFT = Symbol();
const DIRECTION_TOP = Symbol();
const DIRECTION_BOTTOM = Symbol();
const MODE_PREPARE = Symbol();
const MODE_PLAY = Symbol();
const MODE_LAND = Symbol();
const MODE_VANISH = Symbol();
const MODE_FALL = Symbol();

const typeToStr = (type) => {
  switch (type) {
    case TYPE_MEDICINE:
      return "＠";
    case TYPE_VIRUS:
      return "＊";
  }
  throw `invalid block type '${type}'`;
};

const randomColor = () => U.randomChoice([COLOR_RED, COLOR_BLUE, COLOR_YELLOW]);

const colorToStr = (color) => {
  switch (color) {
    case COLOR_RED:
      return "red";
    case COLOR_BLUE:
      return "blue";
    case COLOR_YELLOW:
      return "yellow";
  }
  throw `invalid color '${color}'`;
};

const colorFromStr = (colorStr) => {
  switch (colorStr) {
    case "red":
      return COLOR_RED;
    case "blue":
      return COLOR_BLUE;
    case "yellow":
      return COLOR_YELLOW;
  }
  throw `invalid color '${colorStr}'`;
};

const makeVirus = (color) => ({
  type: TYPE_VIRUS,
  color,
});

const makeMedicine = (color) => ({
  type: TYPE_MEDICINE,
  color,
});

const makeCapsule = (color1, color2, dir) => ({
  fst: makeMedicine(color1),
  snd: makeMedicine(color2),
  dir,
});

const randomCapsule = (dir) => makeCapsule(randomColor(), randomColor(), dir);

const capsuleToBlocks = ({ fst, snd, dir }, pos) => {
  switch (dir) {
    case DIRECTION_LEFT:
      return [
        { block: fst, pos },
        { block: snd, pos: { row: pos.row, col: pos.col + 1 } },
      ];
    case DIRECTION_RIGHT:
      return [
        { block: fst, pos },
        { block: snd, pos: { row: pos.row, col: pos.col - 1 } },
      ];
    case DIRECTION_TOP:
      return [
        { block: fst, pos },
        { block: snd, pos: { row: pos.row - 1, col: pos.col } },
      ];
    case DIRECTION_BOTTOM:
      return [
        { block: fst, pos },
        { block: snd, pos: { row: pos.row + 1, col: pos.col } },
      ];
  }
  throw `invalid direction '${dir}'`;
};

const posInRange = ({ row, col }) =>
  U.between(0, 15, row) && U.between(0, 7, col);

const posEq = (pos1, pos2) => pos1.row === pos2.row && pos1.col === pos2.col;

const notOverlapping = ({ capsule, pos }, blocks) => {
  const [fst, snd] = capsuleToBlocks(capsule);
  return (
    posInRange(fst.pos) &&
    posInRange(snd.pos) &&
    blocks.find(({ pos }) => posEq(pos, fst.pos) || posEq(pos, snd.pos)) ===
      void 0
  );
};

const initModel = (numberOfViruses) => ({
  blocks: U.randomTake(
    U.range(2, 15).flatMap((row) => U.range(0, 7).map((col) => ({ row, col }))),
    numberOfViruses
  ).map((pos) => ({
    pos,
    block: makeVirus(randomColor()),
  })),
  currentCapsule: null,
  nextCapsule: randomCapsule(DIRECTION_RIGHT),
  mode: MODE_PREPARE,
});

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

const bottleView = (blocks, currentCapsule, nextCapsule) =>
  B.box({
    top: 0,
    left: 0,
    width: 19,
    height: 20,
    style: {
      bg: "black",
    },
    children: [
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
          blockView({ row: 0, col: 2 }, nextCapsule.fst),
          blockView({ row: 0, col: 3 }, nextCapsule.snd),
        ],
      }),
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
          ...blocks,
          ...(currentCapsule === null ? [] : capsuleToBlocks(currentCapsule)),
        ].map(({ pos, block }) => blockView(pos, block)),
      }),
      B.box({
        top: 2,
        left: 7,
        width: 5,
        height: 2,
        style: {
          bg: "black",
        },
      }),
    ],
  });

const view = (model) =>
  B.box({
    width: "100%",
    height: "100%",
    style: {
      bg: "black",
    },
    children: [
      bottleView(model.blocks, model.currentCapsule, model.nextCapsule),
    ],
  });

const start = ({ level }) => {
  const screen = B.screen({
    smartCSR: true,
    fullUnicode: true,
  });
  screen.key(["escape", "q", "C-c"], (ch, key) => process.exit(0));

  const model = initModel(4 + level * 4);

  screen.append(view(model));
  screen.render();
};

module.exports = {
  start,
  TYPE_MEDICINE,
  TYPE_VIRUS,
  COLOR_RED,
  COLOR_BLUE,
  COLOR_YELLOW,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_TOP,
  DIRECTION_BOTTOM,
};
