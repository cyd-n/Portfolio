const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const ease = {
  lin: t => t, smooth: t => t * t * (3 - 2 * t), inCubic: t => t * t * t, outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
};
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const tweens = [];
function tween(dur, update, o = {}) { const tw = { t: -(o.delay || 0), dur, update, e: o.ease || ease.outCubic, done: o.done }; tweens.push(tw); return tw; }
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; tw.t += dt; if (tw.t < 0) continue;
    const p = clamp(tw.t / tw.dur, 0, 1); tw.update(tw.e(p), p);
    if (p >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
  }
}
function identicon(seed) {
  const c = document.createElement('canvas'); c.width = c.height = 10; const x = c.getContext('2d'), h = hash(seed), R = rng(h), hue = h % 360;
  x.fillStyle = `hsl(${hue},50%,16%)`; x.fillRect(0, 0, 10, 10);
  const cols = [`hsl(${hue},80%,62%)`, `hsl(${(hue + 40) % 360},90%,72%)`, `hsl(${hue},70%,42%)`];
  for (let y = 1; y < 9; y++) for (let q = 1; q < 5; q++) if (R() > .42) { x.fillStyle = cols[Math.floor(R() * 3)]; x.fillRect(q, y, 1, 1); x.fillRect(9 - q, y, 1, 1); }
  return c.toDataURL();
}
function spatial(items, i, dir) {
  if (!items[i]) return i;
  const a = items[i].getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2; let best = i, bs = Infinity;
  items.forEach((el, j) => {
    if (j === i) return; const b = el.getBoundingClientRect(), dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
    const main = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy, cross = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (main <= 4) return; const s = main + cross * 2.2; if (s < bs) { bs = s; best = j; }
  });
  return best;
}
