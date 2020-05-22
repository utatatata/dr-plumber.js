const between = (low, hi, x) => low <= x && x <= hi;

const clamp = (low, hi, x) => Math.min(hi, Math.max(low, x));

const range = (start, end) => {
  const step = start <= end ? 1 : -1;
  return Array(Math.abs(end - start) + 1)
    .fill(start)
    .map((n, i) => n + i * step);
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = (xs) => xs[randomInt(0, xs.length - 1)];

const randomTake = (xs, n) => {
  const result = [];
  range(0, Math.min(xs.length, n) - 1).forEach(() => {
    const i = randomInt(0, xs.length - 1);
    result.push(xs[i]);
    xs = [...xs.slice(0, i), ...xs.slice(i + 1)];
  });
  return result;
};

module.exports = {
  between,
  clamp,
  range,
  randomInt,
  randomChoice,
  randomTake,
};
