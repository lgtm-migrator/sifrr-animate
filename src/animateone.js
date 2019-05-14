const Bezier = require('./bezier');
const types = require('./types');
const wait = require('./wait');
const digitRgx = /(\d+\.?\d*)/;
const frames = new Set();

function runFrames(currentTime) {
  frames.forEach(f => f(currentTime));
  window.requestAnimationFrame(runFrames);
}
window.requestAnimationFrame(runFrames);

function animateOne({
  target,
  prop,
  from,
  to,
  time = 300,
  type = 'ease',
  onUpdate,
  round = false,
  delay = 0 // number
}) {
  const toSplit = to.toString().split(digitRgx), l = toSplit.length, raw = [], fromNums = [], diffs = [];
  const fromSplit = (from || target[prop] || '').toString().split(digitRgx);
  const onUp = typeof onUpdate === 'function';
  for (let i = 0; i < l; i++) {
    const n = Number(toSplit[i]);
    if (isNaN(n) || !toSplit[i]) raw.push(toSplit[i]);
    else {
      fromNums.push(Number(fromSplit[i]) || 0);
      diffs.push(n - (Number(fromSplit[i]) || 0));
    }
  }
  type = typeof type === 'function' ? type : new Bezier(types[type] || type);
  const rawObj = { raw };

  return wait(delay).then(() => new Promise(resolve => {
    let startTime = performance.now();
    const frame = function(currentTime) {
      const percent = (currentTime - startTime) / time, bper = type(percent >= 1 ? 1 : percent);
      const next = diffs.map((d, i) => {
        const n = bper * d + fromNums[i];
        return round ? Math.round(n) : n;
      });
      const val = String.raw(rawObj, ...next);
      target[prop] = Number(val) || val;
      if (onUp) onUpdate(target, prop, target[prop]);
      if (percent >= 1) resolve(frames.delete(frame));
    };
    frames.add(frame);
  }));
}

module.exports = animateOne;
