const yargs = require("yargs");
const G = require("./game.js");
const U = require("./utils.js");

const defaultOptions = {
  level: 10,
  fps: 64,
  speed: "mid",
};

const validateSpeed = (speed) => {
  switch (speed) {
    case "low":
      return G.SPEED_LOW;
    case "mid":
      return G.SPEED_MIDDLE;
    case "hi":
      return G.SPEED_HIGH;
  }
  throw `invalid speed '${speed}': should be 'low', 'mid', or 'hi'`;
};

const validate = (options) => {
  if (!U.between(1, 20, options.level)) {
    throw `invalid level '${options.level}': should be from 1 to 20`;
  }
  if (!options.fps > 0) {
    throw `invalid fps '${options.fps}': should be more then 0`;
  }

  return {
    ...options,
    speed: validateSpeed(options.speed),
  };
};

module.exports = yargs
  .locale("en")
  .strict(true)
  .command(
    "$0",
    "Start game",
    (yargs) =>
      yargs
        .option("level", {
          describe: "Level 1~20",
          type: "number",
          default: defaultOptions.level,
        })
        .option("fps", {
          describe: "FPS",
          type: "number",
          default: defaultOptions.fps,
        })
        .option("speed", {
          describe: "fall speed",
          choices: ["low", "mid", "hi"],
          default: "mid",
        }),
    async (options) => {
      G.main(validate(options));
    }
  );
