// چارت: کندل زنده، اندیکاتورهای کشیدنی (drag & drop) و حمایت/مقاومت واقعی از کندل‌های بسته
import { ema, sma, bollinger } from './indicators.js';
const DEF = {
  EMA20: ['#2dd4bf', c => [ema(c, 20)]], EMA50: ['#facc15', c => [ema(c, 50)]], EMA200: ['#a78bfa', c => [ema(c, 200)]],
  SMA20: ['#60a5fa', c => [sma(c, 20)]], BB: ['#f472b6', c => { const b = bollinger(c); return [b.upper, b.mid, b.lower]; }],
  VWAP: ['#fb923c', (c, k) => [k.map((x, i) => { if (i < 23) return null; let a = 0, w = 0; for (let j = i - 23; j <= i; j++) { a += (k[j].h + k[j].l + k[j].c) / 3 * k[j].v; w += k[j].v; } return w ? a / w : null; })]],
};
const LBL = { EMA20: 'EMA 20', EMA50: 'EMA 50', EMA200: 'EMA 200', SMA20: 'SMA 20', BB: 'Bollinger', VWAP: 'VWAP', SR: 'S/R' };
const on = new Set(['EMA20', 'EMA50', 'SR']);
let chart, candle, vol, cs = [], S = {}, PL = [], key = '', box, tray, ohlc, ctxRef;
export function sr(k) { // قله/دره ۵-چپ ۵-راست، گروه‌بندی ۰٫۳٪، امتیاز = تعداد برخورد
  const cl = k.filter(x => x.closed), n = 5, pts = [];
  for (let i = n; i < cl.length - n; i++) { const w = cl.slice(i - n, i + n + 1);
    if (cl[i].h === Math.max(...w.map(x => x.h))) pts.push(cl[i].h);
    if (cl[i].l === Math.min(...w.map(x => x.l))) pts.push(cl[i].l); }
  const g = []; pts.sort((a, b) => a - b).forEach(p => { const q = g[g.length - 1]; if (q && p / q.p - 1 < 0.003) { q.n++; q.s += p; q.p = q.s / q.n; } else g.push({ p, s: p, n: 1 }); });
  const price = cl.length ? cl[cl.length - 1].c : 0, near = f => g.filter(f).sort((a, b) => Math.abs(a.p - price) - Math.abs(b.p - price)).slice(0, 3);
  return { res: near(x => x.p > price), sup: near(x => x.p < price) };
}
function paintSR() {
  PL.forEach(l => candle.removePriceLine(l)); PL = []; if (!on.has('SR') || !cs.length) return;
  const { res, sup } = sr(cs), add = (arr, nm, color) => arr.forEach((x, i) => PL.push(candle.createPriceLine({ price: x.p, color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `${nm}${i + 1} ×${x.n}` })));
  add(res, 'R', '#ef4444'); add(sup, 'S', '#22c55e');
}
function paintOv(k) {
  (S[k] || []).forEach(s => chart.removeSeries(s)); delete S[k]; if (!on.has(k) || !cs.length) return;
  const [col, f] = DEF[k];
  S[k] = f(cs.map(x => x.c), cs).map(arr => { const s = chart.addLineSeries({ color: col, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    s.setData(arr.map((v, i) => (v == null || !isFinite(v) ? null : { time: cs[i].t, value: v })).filter(Boolean)); return s; });
}
const apply = k => (k === 'SR' ? paintSR() : paintOv(k)), sync = () => [...tray.children].forEach(b => b.classList.toggle('on', on.has(b.dataset.k)));
function wire() {
  tray.onpointerdown = e => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k, x0 = e.clientX, y0 = e.clientY; let g = null;
    const mv = ev => { if (!g && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) { g = document.createElement('div'); g.className = 'ghost'; g.textContent = b.textContent; document.body.append(g); } if (g) { g.style.left = ev.clientX + 'px'; g.style.top = ev.clientY + 'px'; } };
    const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (g) { g.remove(); const r = box.getBoundingClientRect(); if (ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom) on.add(k); }
      else on.has(k) ? on.delete(k) : on.add(k);
      sync(); apply(k); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };
}
export function mount(r) {
  r.innerHTML = `<div class="cw"><div class="ohlc" id="ohlc"></div><div id="chart"></div><div class="tray">${Object.keys(LBL).map(k => `<button data-k="${k}">${LBL[k]}</button>`).join('')}</div></div>`;
  box = r.querySelector('#chart'); tray = r.querySelector('.tray'); ohlc = r.querySelector('#ohlc'); key = ''; S = {}; PL = [];
  if (!window.LightweightCharts) { box.innerHTML = '<div class="msg">کتابخانه نمودار بارگذاری نشد (CDN در دسترس نیست).</div>'; return; }
  chart = LightweightCharts.createChart(box, { autoSize: true, layout: { background: { color: 'transparent' }, textColor: '#8fa6c9' }, grid: { vertLines: { color: '#0f2a4d' }, horzLines: { color: '#0f2a4d' } }, timeScale: { timeVisible: true, borderColor: '#1b4a78' }, rightPriceScale: { borderColor: '#1b4a78' }, crosshair: { mode: 0 } });
  candle = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false });
  vol = chart.addHistogramSeries({ priceScaleId: 'v', priceFormat: { type: 'volume' }, lastValueVisible: false });
  chart.priceScale('v').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
  chart.subscribeCrosshairMove(p => { const d = p.seriesData && p.seriesData.get(candle); ohlc.textContent = d ? `O ${d.open}  H ${d.high}  L ${d.low}  C ${d.close}` : closedTxt(); });
  sync(); wire();
}
const closedTxt = () => { const c = cs.filter(x => x.closed); return c.length ? 'آخرین کندل بسته: ' + new Date(c[c.length - 1].t * 1000).toLocaleString('fa-IR') : ''; };
export function update(ctx) {
  ctxRef = ctx; if (!chart) return;
  if (ctx.err && !ctx.candles.length) { ohlc.textContent = ctx.err; return; }
  cs = ctx.candles; const k = ctx.sym + ctx.tf;
  candle.setData(cs.map(x => ({ time: x.t, open: x.o, high: x.h, low: x.l, close: x.c })));
  vol.setData(cs.map(x => ({ time: x.t, value: x.v, color: x.c >= x.o ? '#22c55e55' : '#ef444455' })));
  Object.keys(DEF).forEach(paintOv); paintSR(); ohlc.textContent = closedTxt();
  if (k !== key) { key = k; chart.timeScale().fitContent(); }
}
export function unmount() { chart?.remove(); chart = null; }
