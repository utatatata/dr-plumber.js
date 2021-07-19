const B = require("blessed");
const P = B.program();
const U = require("./utils.js");

/********** Constans **********/

const TYPE_VIRUS = Symbol();
const TYPE_MEDICINE = Symbol();
const TYPE_CAPSULE = Symbol();
const TYPE_VANISHING = Symbol();
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
const MODE_PLAYING_PREPARING = Symbol();
const MODE_PLAYING = Symbol();
const MODE_LANDING = Symbol();
const MODE_VANISHING_PREPARING = Symbol();
const MODE_VANISHING_READY = Symbol();
const MODE_VANISHING = Symbol();
const MODE_FALLING = Symbol();
const MODE_GAMEOVER_READY = Symbol();
const MODE_GAMEOVER = Symbol();
const SPEED_LOW = Symbol();
const SPEED_MIDDLE = Symbol();
const SPEED_HIGH = Symbol();
const ROTATE_LEFT = Symbol();
const ROTATE_RIGHT = Symbol();
const SELECT_YES = Symbol();
const SELECT_NO = Symbol();

const typeToStr = (type) => {
  switch (type) {
    case TYPE_VIRUS:
      return "＊";
    case TYPE_MEDICINE:
    case TYPE_CAPSULE:
      return "＠";
    case TYPE_VANISHING:
      return "◯";
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
const modeToStr = (mode) => {
  switch(mode) {
    case MODE_INIT:
      return "MODE_INIT";
    case MODE_PREPARING:
      return "MODE_PREPARING";
    case MODE_READY:
      return "MODE_READY";
    case MODE_PLAYING_PREPARING:
      return "MODE_PLAYING_PREPARING";
    case MODE_PLAYING:
      return "MODE_PLAYING";
    case MODE_LANDING:
      return "MODE_LANDING";
    case MODE_VANISHING_PREPARING:
      return "MODE_VANISHING_PREPARING";
    case MODE_VANISHING_READY:
      return "MODE_VANISHING_READY";
    case MODE_VANISHING:
      return "MODE_VANISHING";
    case MODE_FALLING:
      return "MODE_FALLING";
    case MODE_GAMEOVER_READY:
      return "MODE_GAMEOVER_READY";
    case MODE_GAMEOVER:
      return "MODE_GAMEOVER";
    default:
      throw `invalid mode '${mode}'`
  }
}

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
const movePosLeft = (pos) => movePos(DIRECTION_LEFT, pos);
const movePosRight = (pos) => movePos(DIRECTION_RIGHT, pos);
const movePosUp = (pos) => movePos(DIRECTION_UP, pos);
const movePosDown = (pos) => movePos(DIRECTION_DOWN, pos);

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

const rotateDir = (rotate, dir) => {
  if (
    (dir === DIRECTION_LEFT && rotate === ROTATE_LEFT) ||
    (dir === DIRECTION_RIGHT && rotate === ROTATE_RIGHT)
  ) {
    return DIRECTION_DOWN;
  } else if (
    (dir === DIRECTION_RIGHT && rotate === ROTATE_LEFT) ||
    (dir === DIRECTION_LEFT && rotate === ROTATE_RIGHT)
  ) {
    return DIRECTION_UP;
  } else if (
    (dir === DIRECTION_UP && rotate === ROTATE_LEFT) ||
    (dir === DIRECTION_DOWN && rotate === ROTATE_RIGHT)
  ) {
    return DIRECTION_LEFT;
  } else if (
    (dir === DIRECTION_DOWN && rotate === ROTATE_LEFT) ||
    (dir === DIRECTION_UP && rotate === ROTATE_RIGHT)
  ) {
    return DIRECTION_RIGHT;
  }
};
const rotateDirLeft = (dir) => rotateDir(ROTATE_LEFT, dir);
const rotateDirRight = (dir) => rotateDir(ROTATE_RIGHT, dir);
const reverseDir = (dir) => {
  switch (dir) {
    case DIRECTION_LEFT:
      return DIRECTION_RIGHT;
    case DIRECTION_RIGHT:
      return DIRECTION_LEFT;
    case DIRECTION_UP:
      return DIRECTION_DOWN;
    case DIRECTION_DOWN:
      return DIRECTION_UP;
  }
  throw `invalid direction '${dir}'`;
};

/********** Models **********/

const makeBlock = (type, color) => ({
  type,
  color,
});
const makeMedicine = (color) => makeBlock(TYPE_MEDICINE, color);
const makeVirus = (color) => makeBlock(TYPE_VIRUS, color);
// offset + 16 rows, offset + 8 cols
const makeEmptyBottle = () => [...Array(17)].map(() => Array(9).fill(null));
const makeCapsule = (color1, color2, pos, dir) => ({
  color1,
  color2,
  pos: { ...pos },
  dir,
});
const isVanishing = (block) => block.type === TYPE_VANISHING;
const toVanishing = (block) => {
  block.type = TYPE_VANISHING;
}

const getBlock = (bottle, { row, col }) => bottle[row][col];
const setBlock = (bottle, { row, col }, block) => {
  bottle[row][col] = block;
}
const modifyBlock = (bottle, pos, modify) => {
  setBlock(bottle, pos, modify(getBlock(bottle, pos), pos));
}

// row: 0 ~ 16, 0 is offset
const inRange = ({ row, col }) => U.between(0, 16, row) && U.between(1, 8, col);

const randomColor = () => U.randomChoice([COLOR_RED, COLOR_BLUE, COLOR_YELLOW]);
const randomMedicine = () => makeMedicine(randomColor());
const randomVirus = () => makeVirus(randomColor());
const randomCapsule = (pos, dir) =>
  makeCapsule(randomColor(), randomColor(), pos, dir);

const moveCapsule = (moveDir, { color1, color2, pos, dir }) =>
  makeCapsule(color1, color2, movePos(moveDir, pos), dir);
const moveCapsuleLeft = (capsule) => moveCapsule(DIRECTION_LEFT, capsule);
const moveCapsuleRight = (capsule) => moveCapsule(DIRECTION_RIGHT, capsule);
const moveCapsuleUp = (capsule) => moveCapsule(DIRECTION_UP, capsule);
const moveCapsuleDown = (capsule) => moveCapsule(DIRECTION_DOWN, capsule);

const rotateCapsule = (rotate, { color1, color2, pos, dir }) =>
  makeCapsule(color1, color2, pos, rotateDir(rotate, dir));
const rotateCapsuleLeft = (capsule) => rotateCapsule(ROTATE_LEFT, capsule);
const rotateCapsuleRight = (capsule) => rotateCapsule(ROTATE_RIGHT, capsule);

const capsuleToBlocks = ({ color1, color2, pos, dir }) => [
  {
    pos: { ...pos },
    block: { type: TYPE_CAPSULE, color: color1, linkDir: dir },
  },
  {
    pos: movePos(dir, pos),
    block: { type: TYPE_CAPSULE, color: color2, linkDir: reverseDir(dir) },
  },
];

const bottleToBlocks = (bottle) =>
  U.range(1, 16)
    .flatMap((row) =>
      U.range(1, 8).map((col) => ({
        pos: { row, col },
        block: getBlock(bottle, { row, col }),
      }))
    )
    .filter(({ pos, block }) => block !== null);

// Destructive
const setCapsule = (capsule, bottle) => {
  capsuleToBlocks(capsule).forEach(({ pos, block }) => {
    setBlock(bottle, pos, block);
  });
};

const notOverlapping = (pos, bottle) =>
  inRange(pos) && getBlock(bottle, pos) === null;

const notOverlappingCapsule = (capsule, bottle) =>
  capsuleToBlocks(capsule).every(({ pos }) => notOverlapping(pos, bottle));

const getSameColorColPosList = (color, pos, bottle) => {
  const posList = [{ ...pos }];

  for (let col = pos.col - 1; col >= 1; col--) {
    const block = getBlock(bottle, { ...pos, col });
    if (block !== null && block.color === color) {
      posList.push({ row: pos.row, col });
    } else {
      break;
    }
  }
  for (let col = pos.col + 1; col <= 8; col++) {
    const block = getBlock(bottle, { ...pos, col })
    if (block !== null && block.color === color) {
      posList.push({ row: pos.row, col });
    } else {
      break;
    }
  }

  return posList.length >= 4 ? posList : [];
};

const getSameColorRowPosList = (color, pos, bottle) => {
  const posList = [{ ...pos }];

  for (let row = pos.row - 1; row >= 1; row--) {
    const block = getBlock(bottle, { ...pos, row });
    if (block !== null && block.color === color) {
      posList.push({ row, col: pos.col });
    } else {
      break;
    }
  }
  for (let row = pos.row + 1; row <= 16; row++) {
    const block = getBlock(bottle, { ...pos, row });
    if (block !== null && block.color === color) {
      posList.push({ row, col: pos.col });
    } else {
      break;
    }
  }

  return posList.length >= 4 ? posList : [];
};

const isNullBlock = (bottle, pos) => inRange(pos) && getBlock(bottle, pos) === null

const isFloating = (bottle, pos) => {
  const block = getBlock(bottle, pos)
  const lowerPos = movePosDown(pos);

  if (block !== null) {
    if (block.type === TYPE_MEDICINE) {
      return isNullBlock(bottle, lowerPos)
    } else if (block.type === TYPE_CAPSULE) {
      const linkPos = movePos(block.linkDir, pos);
      const linkLowerPos = movePosDown(linkPos)
      return isNullBlock(bottle, lowerPos) && isNullBlock(bottle, linkLowerPos)
    } else {
      return false
    }
  } else {
    return false
  }
}

const getFloatingPosList = (bottle) =>
  U.range(1, 16).flatMap((row) =>
    U.range(1, 8).map((col) =>
      ({ row, col })
    )
  ).filter(pos => isFloating(bottle, pos))

const existsFloatingBlock = (bottle) => getFloatingPosList(bottle).length !== 0

const fallBlocks = (bottle) => {
  getFloatingPosList(bottle).forEach(pos => {
    const block = getBlock(bottle, pos);
    setBlock(bottle, pos, null)
    setBlock(bottle, movePosDown(pos), block)
  })
}

const getAllNumberOfViruses = (level) => (level + 1) * 4;

/********** Init **********/

const initModel = (options) => ({
  ...options,
  bottle: makeEmptyBottle(),
  current: null, // type Capsule
  next: [randomColor(), randomColor()],
  mode: MODE_INIT,
  pressedKeys: {},
  preparingState: {
    addingVirusPosList: [],
    lastAddVirusTime: Date.now(),
  },
  readyState: {
    readyStartTime: Date.now(),
  },
  playingState: {
    lastFalledTime: Date.now(),
  },
  landingState: {
    landingStartTime: Date.now(),
  },
  vanishingPreparingState: {},
  vanishingReadyState: {
    vanishingReadyStartTime: Date.now(),
  },
  vanishingState: {},
  fallingState: {
    lastFalledTime: Date.now(),
  },
  gameOverReadyState: {
    startTime: Date.now(),
  },
  gameOverState: {
    select: SELECT_YES,
  },
});

const modelToStr = (model) => {
  const copyModel = { ...model }
  copyModel.mode = modeToStr(copyModel.mode);
  return JSON.stringify(copyModel)
}

// Destructive
const initPreparingState = (model) => {
  const now = Date.now();

  model.preparingState.lastAddVirusTime = now;

  model.preparingState.addingVirusPosList = U.randomTake(
    U.range(3, 16).flatMap((row) => U.range(1, 8).map((col) => ({ row, col }))),
    getAllNumberOfViruses(model.level)
  );
};

// Destructive
const initReadyState = (model) => {
  const now = Date.now();

  model.readyState.readyStartTime = now;
};

// Destructive
const initPlayingState = (model) => {
  const now = Date.now();
};

// Destructive
const initPlayingPreparingState = (model) => {
  const now = Date.now();

  model.playingState.lastFalledTime = now;
};

// Destructive
const initLandingState = (model) => {
  const now = Date.now();

  model.landingState.landingStartTime = now;
};

// Destructive
const initVanishingPreparingState = (model) => {
  const now = Date.now();
};

// Destructive
const initVanishingReadyState = (model) => {
  const now = Date.now();

  model.vanishingReadyState.vanishingReadyStartTime = now;
};

// Destructive
const initVanishingState = (model) => {
  const now = Date.now();
};

// Destructive
const initFallingState = (model) => {
  const now = Date.now();
};

// Destructive
const initGameOverReadyState = (model) => {
  const now = Date.now();

  model.gameOverReadyState.startTime = now;
};

// Destructive
const initGameOverState = (model) => {
  const now = Date.now();

  model.gameOverState.select = SELECT_YES;
};

/********** Views **********/

const blockView = ({ row, col }, { type, color }) =>
  B.box({
    top: row - 1,
    left: col * 2 - 1,
    width: 2,
    height: 1,
    style: {
      fg: colorToStr(color),
      bg: "black",
    },
    content: typeToStr(type),
  });

const bottleLipView = ([color1, color2]) =>
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
      blockView({ row: 1, col: 3 }, makeMedicine(color1)),
      blockView({ row: 1, col: 4 }, makeMedicine(color2)),
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
        : capsuleToBlocks(current).map(({ pos, block }) =>
            blockView(pos, block)
          )),
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

const gameOverView = (hidden) =>
  B.box({
    top: 7,
    left: 2,
    width: 15,
    height: 3,
    hidden,
    style: {
      bg: "black",
    },
    border: {
      type: "line",
    },
    children: [
      B.text({
        top: 0,
        left: 2,
        style: {
          fg: "red",
          bg: "black",
        },
        content: "GAME OVER!",
      }),
      B.question({
        border: "line",
        height: "shrink",
        width: "half",
        top: "center",
        left: "center",
        label: " {blue-fg}Question{/blue-fg} ",
        tags: true,
        keys: true,
        vi: true,
      }),
    ],
  });

const continueView = (hidden, yes) =>
  B.box({
    top: 10,
    left: 1,
    width: 17,
    height: 5,
    hidden,
    style: {
      bg: "black",
    },
    border: {
      type: "line",
    },
    children: [
      B.box({
        top: 0,
        left: 3,
        width: 10,
        height: 1,
        style: {
          fg: "white",
          bg: "black",
        },
        content: "Continue ?",
      }),
      B.box({
        top: 2,
        left: 2,
        width: 3,
        height: 1,
        style: {
          fg: yes ? "black" : "white",
          bg: yes ? "white" : "black",
        },
        content: "YES",
      }),
      B.box({
        top: 2,
        left: 11,
        width: 3,
        height: 1,
        style: {
          fg: !yes ? "black" : "white",
          bg: !yes ? "white" : "black",
        },
        content: "NO",
      }),
    ],
  });

const debugView = (model, hidden) =>
  B.box({
    top: 0,
    left: 25,
    width: 80,
    height: 30,
    hidden,
    style: {
      bg: "black",
    },
    border: {
      type: "line",
    },
    children: [
      B.text({
        top: 0,
        left: 0,
        style: {
          fg: "white",
          bg: "black",
        },
        content: modelToStr(model),
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
      bottleView(model.bottle, model.current, model.next),
      gameOverView(model.mode !== MODE_GAMEOVER),
      continueView(
        model.mode !== MODE_GAMEOVER,
        model.gameOverState.select === SELECT_YES
      ),
      debugView(model, !model.debug),
    ],
  });

/********** Loop **********/

const loop = (screen, model) => {
  const now = Date.now();
  const keys = model.pressedKeys;

  switch (model.mode) {
    case MODE_INIT:
      initPreparingState(model);
      model.mode = MODE_PREPARING;

      screen.append(view(model));
      screen.render();
      break;
    case MODE_PREPARING:
      const allNumberOfViruses = getAllNumberOfViruses(model.level);
      const elapsedTime = now - model.preparingState.lastAddVirusTime;
      const numberOfAddingViruses = U.clamp(
        0,
        model.preparingState.addingVirusPosList.length,
        Math.round(elapsedTime / (3000 / allNumberOfViruses))
      );

      if (model.preparingState.addingVirusPosList.length === 0) {
        initReadyState(model);
        model.mode = MODE_READY;
      } else if (numberOfAddingViruses >= 1) {
        U.range(1, numberOfAddingViruses).forEach(() => {
          const pos = model.preparingState.addingVirusPosList.pop();
          setBlock(model.bottle, pos, randomVirus());
          model.lastAddVirusTime = now;
          screen.append(view(model));
          screen.render();
        });
      }
      break;
    case MODE_READY:
      if (now - model.readyState.readyStartTime > 500) {
        initPlayingPreparingState(model);
        model.mode = MODE_PLAYING_PREPARING;
      }
      break;
    case MODE_PLAYING_PREPARING:
      model.current = makeCapsule(
        model.next[0],
        model.next[1],
        { row: 1, col: 4 },
        DIRECTION_RIGHT
      );
      model.next = [randomColor(), randomColor()];

      if (notOverlappingCapsule(model.current, model.bottle)) {
        initPlayingState(model);
        model.mode = MODE_PLAYING;
      } else {
        initGameOverReadyState(model);
        model.mode = MODE_GAMEOVER_READY;
      }

      screen.append(view(model));
      screen.render();
      break;
    case MODE_PLAYING:
      if (model.current === null) {
        break;
      }
      if (!notOverlappingCapsule(model.current, model.bottle)) {
      }

      // Fall and Player controll
      if (
        now - model.playingState.lastFalledTime >
        speedToFallTime(model.speed)
      ) {
        model.playingState.lastFalledTime = now;
        const newCurrent = moveCapsuleDown(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        } else {
          initLandingState(model);
          model.mode = MODE_LANDING;
        }
      } else if (keys["left"] !== void 0) {
        const newCurrent = moveCapsuleLeft(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        }
      } else if (keys["right"] !== void 0) {
        const newCurrent = moveCapsuleRight(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        }
      } else if (keys["down"] !== void 0) {
        const newCurrent = moveCapsuleDown(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        } else {
          initLandingState(model);
          model.mode = MODE_LANDING;
        }
      } else if (keys["d"] !== void 0) {
        const newCurrent = rotateCapsuleLeft(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        } else {
          const newCurrent2 = moveCapsule(
            reverseDir(newCurrent.dir),
            newCurrent
          );
          if (notOverlappingCapsule(newCurrent2, model.bottle)) {
            model.current = newCurrent2;
          }
        }
      } else if (keys["f"] !== void 0) {
        const newCurrent = rotateCapsuleRight(model.current);
        if (notOverlappingCapsule(newCurrent, model.bottle)) {
          model.current = newCurrent;
        } else {
          const newCurrent2 = moveCapsule(
            reverseDir(newCurrent.dir),
            newCurrent
          );
          if (notOverlappingCapsule(newCurrent2, model.bottle)) {
            model.current = newCurrent2;
          }
        }
      }

      screen.append(view(model));
      screen.render();
      break;
    case MODE_LANDING:
      if (now - model.landingState.landingStartTime > 200) {
        initVanishingPreparingState(model);
        model.mode = MODE_VANISHING_PREPARING;
      }
      break;
    case MODE_VANISHING_PREPARING:
      setCapsule(model.current, model.bottle);

      const color1 = model.current.color1;
      const pos1 = model.current.pos;
      const color2 = model.current.color2;
      const pos2 = movePos(model.current.dir, model.current.pos);
      const vanishingBlockList = [
        ...getSameColorColPosList(color1, pos1, model.bottle),
        ...getSameColorRowPosList(color1, pos1, model.bottle),
        ...getSameColorColPosList(color2, pos2, model.bottle),
        ...getSameColorRowPosList(color2, pos2, model.bottle),
      ];

      model.current = null;

      if (vanishingBlockList.length === 0) {
        initPlayingPreparingState(model);
        model.mode = MODE_PLAYING_PREPARING;
      } else {
        vanishingBlockList.forEach((pos) => {
          const block = getBlock(model.bottle, pos)
          if (block !== null) {
            if (block.type === TYPE_CAPSULE) {
              // unlink
              const linkPos = movePos(block.linkDir, pos);
              modifyBlock(model.bottle, linkPos, (b, p) => makeMedicine(b.color));
            }
            toVanishing(getBlock(model.bottle, pos))
          }
        });

        initVanishingReadyState(model);
        model.mode = MODE_VANISHING_READY;
      }

      screen.append(view(model));
      screen.render();
      break;
    case MODE_VANISHING_READY:
      if (now - model.vanishingReadyState.vanishingReadyStartTime > 400) {
        initVanishingState(model);
        model.mode = MODE_VANISHING;
      }
      break;
    case MODE_VANISHING:
      U.range(1, 16).forEach((row) => {
        U.range(1, 8).forEach((col) => {
          const block = getBlock(model.bottle, { row, col })
          if (block !== null && isVanishing(block)) {
            setBlock(model.bottle, { row, col }, null);
          }
        });
      });

      initFallingState(model);
      model.mode = MODE_FALLING;

      screen.append(view(model));
      screen.render();
      break;
    case MODE_FALLING:
      if (!existsFloatingBlock(model.bottle)) {
        model.mode = MODE_PLAYING_PREPARING;
      } else {
        fallBlocks(model.bottle);
      }

      screen.append(view(model));
      screen.render();
      break;
    case MODE_GAMEOVER_READY:
      if (now - model.gameOverReadyState.startTime > 500) {
        initGameOverState(model);
        model.mode = MODE_GAMEOVER;
      }
      break;
    case MODE_GAMEOVER:
      if (keys["left"] !== void 0) {
        model.gameOverState.select = SELECT_YES;
      } else if (keys["right"] !== void 0) {
        model.gameOverState.select = SELECT_NO;
      } else if (keys["enter"] !== void 0) {
        switch (model.gameOverState.select) {
          case SELECT_YES:
            model = initModel({
              level: model.level,
              fps: model.fps,
              speed: model.speed,
            });
            break;
          case SELECT_NO:
            process.exit(0);
            break;
        }
      }

      screen.append(view(model));
      screen.render();
      break;
  }

  model.pressedKeys = {};
};

/********** Main **********/

const main = (options) => {
  const model = initModel(options);

  const screen = B.screen({
    smartCSR: true,
    fullUnicode: true,
  });
  screen.on("keypress", (ch, key) => {
    model.pressedKeys[key.name] = key;
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
