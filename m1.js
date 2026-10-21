// اندیکاتور: ۳۰ اندیکاتور با مقدار عددی و تمایل. فقط از کندل‌های بسته‌شده.
import { CONFIG } from './config.js';
import { ema, rsi, macd, atr, bollinger } from './indicators.js';
const L = a => a[a.length - 1], P = (a, k) => a[a.length - 1 - k], sg = (x, t = 0) => (x > t ? 1 : x < -t ? -1 : 0);
const sum = (a, n = a.length) => a.slice(-n).reduce((x, y) => x + y, 0), avg = (a, n) => sum(a, n) / n;
const hh = (a, n) => Math.max(...a.slice(-n)), ll = (a, n) => Math.min(...a.slice(-n)), pct = (a, b) => (a / b - 1) * 100;
const tp = d => d.c.map((c, i) => (d.h[i] + d.l[i] + c) / 3), cum = a => { let s = 0; return a.map(x => (s += x)); };
const tr = (d, i) => Math.max(d.h[i] - d.l[i], Math.abs(d.h[i] - d.c[i - 1]), Math.abs(d.l[i] - d.c[i - 1]));
const clv = d => d.c.map((c, i) => { const r = d.h[i] - d.l[i]; return r ? ((c - d.l[i]) - (d.h[i] - c)) / r * d.v[i] : 0; });
const nn = a => a.filter(x => x !== null);
export const IND = [
  ['EMA 9/21', d => { const v = pct(L(ema(d.c, 9)), L(ema(d.c, 21))); return [v, sg(v)]; }],
  ['EMA 50/200', d => { const v = pct(L(ema(d.c, 50)), L(ema(d.c, 200))); return [v, sg(v)]; }],
  ['SMA 20', d => { const v = pct(L(d.c), avg(d.c, 20)); return [v, sg(v)]; }],
  ['VWAP 24', d => { const t = tp(d).slice(-24), w = d.v.slice(-24), vw = t.reduce((s, x, i) => s + x * w[i], 0) / sum(w); const v = pct(L(d.c), vw); return [v, sg(v)]; }],
  ['Donchian 20', d => { const v = (L(d.c) - ll(d.l, 20)) / (hh(d.h, 20) - ll(d.l, 20)) * 100; return [v, sg(v - 50, 10)]; }],
  ['DMI 14', d => { let p = 0, m = 0, t = 0; const n = d.c.length; for (let i = n - 14; i < n; i++) { const u = d.h[i] - d.h[i - 1], w = d.l[i - 1] - d.l[i]; p += u > w && u > 0 ? u : 0; m += w > u && w > 0 ? w : 0; t += tr(d, i); } const v = 100 * (p - m) / t; return [v, sg(v, 5)]; }],
  ['Aroon 25', d => { const h = d.h.slice(-26), l = d.l.slice(-26); const v = 4 * (h.lastIndexOf(Math.max(...h)) - l.lastIndexOf(Math.min(...l))); return [v, sg(v, 30)]; }],
  ['Ichimoku T/K', d => { const m = n => (hh(d.h, n) + ll(d.l, n)) / 2; const v = pct(m(9), m(26)); return [v, sg(v)]; }],
  ['RSI 14', d => { const v = L(rsi(d.c, 14)); return [v, sg(v - 50, 5)]; }],
  ['MACD', d => { const v = L(macd(d.c).hist); return [v, sg(v)]; }],
  ['Stoch 14', d => { const v = (L(d.c) - ll(d.l, 14)) / (hh(d.h, 14) - ll(d.l, 14)) * 100; return [v, sg(v - 50, 10)]; }],
  ['ROC 12', d => { const v = pct(L(d.c), P(d.c, 12)); return [v, sg(v)]; }],
  ['Williams %R', d => { const v = -100 * (hh(d.h, 14) - L(d.c)) / (hh(d.h, 14) - ll(d.l, 14)); return [v, sg(v + 50, 10)]; }],
  ['CCI 20', d => { const t = tp(d).slice(-20), m = avg(t, 20), md = avg(t.map(x => Math.abs(x - m)), 20); const v = (L(t) - m) / (0.015 * md); return [v, sg(v, 50)]; }],
  ['MFI 14', d => { const t = tp(d); let p = 0, n = 0; for (let i = t.length - 14; i < t.length; i++) { const f = t[i] * d.v[i]; t[i] > t[i - 1] ? (p += f) : (n += f); } const v = n === 0 ? 100 : 100 - 100 / (1 + p / n); return [v, sg(v - 50, 5)]; }],
  ['Awesome Osc', d => { const m = d.h.map((x, i) => (x + d.l[i]) / 2); const v = avg(m, 5) - avg(m, 34); return [v, sg(v)]; }],
  ['TRIX 15', d => { const t = nn(ema(nn(ema(nn(ema(d.c, 15)), 15)), 15)); const v = pct(L(t), P(t, 1)); return [v, sg(v)]; }],
  ['Elder Power', d => { const e = L(ema(d.c, 13)); const v = (L(d.h) - e) + (L(d.l) - e); return [v, sg(v)]; }],
  ['Bollinger %B', d => { const b = bollinger(d.c); const v = (L(d.c) - L(b.lower)) / (L(b.upper) - L(b.lower)) * 100; return [v, sg(v - 50, 10)]; }],
  ['Keltner (ATR)', d => { const v = (L(d.c) - L(ema(d.c, 20))) / L(atr(d.k, 10)); return [v, sg(v, 0.5)]; }],
  ['OBV', d => { let o = 0; const s = d.c.map((c, i) => (i ? (o += c > d.c[i - 1] ? d.v[i] : c < d.c[i - 1] ? -d.v[i] : 0) : 0)); const v = (L(s) - P(s, 20)) / sum(d.v, 20) * 100; return [v, sg(v, 5)]; }],
  ['CMF 20', d => { const v = sum(clv(d), 20) / sum(d.v, 20); return [v, sg(v, 0.05)]; }],
  ['A/D Line', d => { const m = cum(clv(d)); const v = (L(m) - P(m, 20)) / sum(d.v, 20) * 100; return [v, sg(v, 2)]; }],
  ['Force Index', d => { const f = d.c.map((c, i) => (i ? (c - d.c[i - 1]) * d.v[i] : 0)).slice(1); const v = L(ema(f, 13)); return [v, sg(v)]; }],
  ['Ultimate Osc', d => { const bp = [], t = []; for (let i = 1; i < d.c.length; i++) { const lo = Math.min(d.l[i], d.c[i - 1]); bp.push(d.c[i] - lo); t.push(Math.max(d.h[i], d.c[i - 1]) - lo); } const a = k => sum(bp, k) / sum(t, k); const v = 100 * (4 * a(7) + 2 * a(14) + a(28)) / 7; return [v, sg(v - 50, 5)]; }],
  ['LinReg 50', d => { const y = d.c.slice(-50), mx = 24.5, my = avg(y, 50); let a = 0, b = 0; y.forEach((q, i) => { a += (i - mx) * (q - my); b += (i - mx) ** 2; }); const v = a / b / my * 5000; return [v, sg(v, 0.3)]; }],
  ['Vortex 14', d => { let p = 0, m = 0, t = 0; for (let i = d.c.length - 14; i < d.c.length; i++) { p += Math.abs(d.h[i] - d.l[i - 1]); m += Math.abs(d.l[i] - d.h[i - 1]); t += tr(d, i); } const v = (p - m) / t; return [v, sg(v, 0.1)]; }],
  ['Z-Score 20', d => { const w = d.c.slice(-20), m = avg(w, 20), s = Math.sqrt(avg(w.map(x => (x - m) ** 2), 20)); const v = (L(d.c) - m) / s; return [v, sg(v, 0.5)]; }],
  ['Pivot', d => { const i = d.c.length - 2, p = (d.h[i] + d.l[i] + d.c[i]) / 3; const v = pct(L(d.c), p); return [v, sg(v)]; }],
  ['Efficiency 10', d => { const w = d.c.slice(-11); let s = 0; for (let i = 1; i < 11; i++) s += Math.abs(w[i] - w[i - 1]); const v = (w[10] - w[0]) / s * 100; return [v, sg(v, 30)]; }],
];
const LB = { 1: ['صعودی', 'bullish'], 0: ['خنثی', 'neutral'], '-1': ['نزولی', 'bearish'] };
export const mount = r => { r.innerHTML = '<div class="card" id="sum"></div><div class="card" id="rows"></div>'; };
export function update(ctx) {
  const S = document.getElementById('sum'), R = document.getElementById('rows'); if (!S) return;
  const cl = ctx.candles.filter(x => x.closed);
  if (cl.length < CONFIG.minCandles) { S.innerHTML = `<div class="msg">${ctx.err || `داده ناکافی (${cl.length}/${CONFIG.minCandles} کندل بسته)`}</div>`; R.innerHTML = ''; return; }
  const d = { k: cl, c: cl.map(x => x.c), h: cl.map(x => x.h), l: cl.map(x => x.l), v: cl.map(x => x.v) };
  const res = IND.map(([n, f]) => { try { const [v, s] = f(d); return Number.isFinite(v) ? { n, v, s } : { n }; } catch { return { n }; } });
  const ok = res.filter(x => x.v !== undefined), c = k => ok.filter(x => x.s === k).length, b = c(1), z = c(0), n = c(-1), lean = (b - n) / (ok.length || 1);
  const lab = lean > 0.2 ? ['تمایل صعودی', 'bullish'] : lean < -0.2 ? ['تمایل نزولی', 'bearish'] : ['خنثی / متناقض', 'neutral'];
  S.innerHTML = `<b class="${lab[1]}" style="font-size:18px">${lab[0]}</b> <span class="muted">${ctx.sym} · ${ctx.tf}</span>
   <div class="gauge"><i style="width:${b / ok.length * 100}%;background:var(--up)"></i><i style="width:${z / ok.length * 100}%;background:#475569"></i><i style="width:${n / ok.length * 100}%;background:var(--dn)"></i></div>
   <span class="bullish">${b} صعودی</span> · <span class="neutral">${z} خنثی</span> · <span class="bearish">${n} نزولی</span> (از ${ok.length} اندیکاتور معتبر)
   <p class="muted">آخرین کندل بسته: ${new Date(L(cl).t * 1000).toLocaleString('fa-IR')}. شمارش تمایل است، نه احتمال موفقیت؛ بعضی اندیکاتورها همبسته‌اند. توصیه مالی نیست.</p>`;
  R.innerHTML = res.map(x => x.v === undefined ? `<div class="row"><span>${x.n}</span><b>—</b><span class="badge neutral">نامعتبر</span></div>` : `<div class="row"><span>${x.n}</span><b>${x.v.toFixed(Math.abs(x.v) < 1 ? 4 : 2)}</b><span class="badge ${LB[x.s][1]}">${LB[x.s][0]}</span></div>`).join('');
}
