import { CONFIG } from './config.js';
import { ema, rsi, macd } from './indicators.js';
const sgn = x => (x > 0) - (x < 0);
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
/** فقط کندل‌های بسته‌شده استفاده می‌شوند. امتیاز ۰..۱۰۰ الگوریتمی است، نه احتمال موفقیت. */
export function analyze(candles) {
  const cl = candles.filter(x => x.closed);
  if (cl.length < CONFIG.minCandles) return { label: 'insufficient', reason: `کندل کافی نیست (${cl.length}/${CONFIG.minCandles})`, evidence: [] };
  const c = cl.map(x => x.c), at = a => a[a.length - 1], p = at(c);
  const e20 = at(ema(c, 20)), e50 = at(ema(c, 50)), e200 = at(ema(c, 200));
  const r = at(rsi(c, 14)), h = at(macd(c).hist);
  const t = CONFIG.thresholds, ev = [];
  const trendV = [[p > e200, 'قیمت بالاتر از EMA200', 'قیمت پایین‌تر از EMA200'], [e20 > e50, 'EMA20 بالاتر از EMA50', 'EMA20 پایین‌تر از EMA50'], [p > e50, 'قیمت بالاتر از EMA50', 'قیمت پایین‌تر از EMA50']];
  const trend = avg(trendV.map(([ok, u, d]) => { ev.push({ dir: ok ? 1 : -1, text: ok ? u : d }); return ok ? 1 : -1; }));
  const rv = r > t.rsiHigh ? 1 : r < t.rsiLow ? -1 : 0, mv = sgn(h);
  ev.push({ dir: rv, text: `RSI(14) = ${r.toFixed(1)}` }, { dir: mv, text: 'هیستوگرام MACD ' + (mv > 0 ? 'مثبت' : 'منفی') });
  const momentum = avg([rv, mv]); // RSI و MACD هم‌بسته‌اند: یک گروه
  const total = CONFIG.weights.trend * trend + CONFIG.weights.momentum * momentum;
  const conflict = trend !== 0 && momentum !== 0 && sgn(trend) !== sgn(momentum);
  const label = conflict ? 'conflict' : total > t.bias ? 'bullish' : total < -t.bias ? 'bearish' : 'neutral';
  return { label, trend, momentum, score: Math.round((total + 1) * 50), evidence: ev, lastClosed: cl[cl.length - 1].t };
}
