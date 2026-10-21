// همه توابع: ورودی آرایه عددی، خروجی آرایه هم‌طول با null برای نبود داده کافی.
const sum = a => a.reduce((x, y) => x + y, 0);
export const sma = (v, p) => v.map((_, i) => (i < p - 1 ? null : sum(v.slice(i - p + 1, i + 1)) / p));
export function ema(v, p) {
  const o = Array(v.length).fill(null);
  if (v.length < p) return o;
  const k = 2 / (p + 1);
  let e = sum(v.slice(0, p)) / p;
  o[p - 1] = e;
  for (let i = p; i < v.length; i++) { e = v[i] * k + e * (1 - k); o[i] = e; }
  return o;
}
export function rsi(v, p = 14) { // Wilder
  const o = Array(v.length).fill(null);
  if (v.length <= p) return o;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = v[i] - v[i - 1]; d > 0 ? (g += d) : (l -= d); }
  g /= p; l /= p;
  const val = () => (l === 0 ? (g === 0 ? 50 : 100) : 100 - 100 / (1 + g / l));
  o[p] = val();
  for (let i = p + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    g = (g * (p - 1) + Math.max(d, 0)) / p; l = (l * (p - 1) + Math.max(-d, 0)) / p;
    o[i] = val();
  }
  return o;
}
export function macd(v, f = 12, s = 26, sg = 9) {
  const ef = ema(v, f), es = ema(v, s);
  const line = v.map((_, i) => (es[i] === null ? null : ef[i] - es[i]));
  const sig = Array(v.length).fill(null), seg = ema(line.slice(s - 1), sg);
  seg.forEach((x, i) => (sig[i + s - 1] = x));
  return { line, signal: sig, hist: line.map((x, i) => (sig[i] === null ? null : x - sig[i])) };
}
export function atr(c, p = 14) { // c: [{h,l,c}]
  const o = Array(c.length).fill(null);
  if (c.length <= p) return o;
  const tr = c.map((x, i) => (i === 0 ? x.h - x.l : Math.max(x.h - x.l, Math.abs(x.h - c[i - 1].c), Math.abs(x.l - c[i - 1].c))));
  let a = sum(tr.slice(1, p + 1)) / p;
  o[p] = a;
  for (let i = p + 1; i < c.length; i++) { a = (a * (p - 1) + tr[i]) / p; o[i] = a; }
  return o;
}
export function bollinger(v, p = 20, m = 2) {
  const mid = sma(v, p);
  const sd = v.map((_, i) => (mid[i] === null ? null : Math.sqrt(sum(v.slice(i - p + 1, i + 1).map(x => (x - mid[i]) ** 2)) / p)));
  return { mid, upper: mid.map((x, i) => x === null ? null : x + m * sd[i]), lower: mid.map((x, i) => x === null ? null : x - m * sd[i]) };
}
