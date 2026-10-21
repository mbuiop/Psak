import { CONFIG } from './config.js';
import { getCandles, getTicker } from './api.js';
import { ema } from './indicators.js';
import { analyze } from './scoring.js';
const $ = id => document.getElementById(id), LBL = { bullish: 'تمایل صعودی', bearish: 'تمایل نزولی', neutral: 'خنثی', conflict: 'شواهد متناقض', insufficient: 'داده ناکافی' };
const st = { sym: CONFIG.symbols[0], tf: '1h' }, fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 5 : 2 });
const clock = s => new Date(s * 1000).toLocaleString('fa-IR');
let chart, series, vols, lines = [];
function err(m) { $('msg').hidden = !m; $('msg').textContent = m || ''; }
function initChart() {
  if (!window.LightweightCharts) { err('کتابخانه نمودار بارگذاری نشد (CDN در دسترس نیست). تحلیل متنی همچنان کار می‌کند.'); return; }
  chart = LightweightCharts.createChart($('chart'), { autoSize: true, layout: { background: { color: '#0e1730' }, textColor: '#8393b2' }, grid: { vertLines: { color: '#1b2a4a' }, horzLines: { color: '#1b2a4a' } }, timeScale: { timeVisible: true } });
  series = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false });
  vols = chart.addHistogramSeries({ priceScaleId: 'v', priceFormat: { type: 'volume' } });
  chart.priceScale('v').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
  lines = [[20, '#2dd4bf'], [50, '#f59e0b'], [200, '#a78bfa']].map(([p, color]) => ({ p, s: chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false }) }));
}
function draw(cs) {
  if (!chart) return;
  series.setData(cs.map(({ t, o, h, l, c }) => ({ time: t, open: o, high: h, low: l, close: c })));
  vols.setData(cs.map(x => ({ time: x.t, value: x.v, color: x.c >= x.o ? '#22c55e55' : '#ef444455' })));
  const closes = cs.map(x => x.c);
  lines.forEach(({ p, s }) => { const e = ema(closes, p); s.setData(cs.map((x, i) => e[i] === null ? null : { time: x.t, value: e[i] }).filter(Boolean)); });
}
async function refreshTicker() {
  try { const t = await getTicker(st.sym); $('price').textContent = fmt(t.price); $('chg').textContent = t.changePct.toFixed(2) + '%'; $('chg').className = t.changePct >= 0 ? 'bullish' : 'bearish'; $('vol').textContent = fmt(t.quoteVolume); }
  catch (e) { ['price', 'chg', 'vol'].forEach(i => ($(i).textContent = 'نامشخص')); throw e; }
}
async function refresh() {
  try {
    err(''); await refreshTicker();
    const main = await getCandles(st.sym, st.tf); draw(main.candles);
    const rows = await Promise.all(CONFIG.timeframes.map(async ([tf, name]) => {
      const r = tf === st.tf ? main : await getCandles(st.sym, tf); return { name, a: analyze(r.candles) };
    }));
    $('mtf').tBodies[0].innerHTML = rows.map(({ name, a }) => `<tr><td>${name}</td><td class="${a.label}">${LBL[a.label]}</td><td>${a.trend?.toFixed(2) ?? '—'}</td><td>${a.momentum?.toFixed(2) ?? '—'}</td><td>${a.score ?? '—'}</td><td>${a.lastClosed ? clock(a.lastClosed) : a.reason || '—'}</td></tr>`).join('');
    const sel = rows.find(r => r.name === CONFIG.timeframes.find(x => x[0] === st.tf)[1]).a;
    $('ev').innerHTML = sel.evidence.map(e => `<li class="${e.dir > 0 ? 'bullish' : e.dir < 0 ? 'bearish' : ''}">${e.text}</li>`).join('');
    $('conn').textContent = 'متصل'; $('conn').className = 'pill ok'; $('upd').textContent = 'داده: ' + new Date(main.fetchedAt).toLocaleTimeString('fa-IR') + ' • ' + main.source;
  } catch (e) { $('conn').textContent = 'قطع'; $('conn').className = 'pill bad'; err(e.message + ' — داده‌ای نمایش داده نمی‌شود تا اتصال برقرار شود.'); }
}
$('sym').innerHTML = CONFIG.symbols.map(s => `<option>${s}</option>`).join('');
$('sym').onchange = e => { st.sym = e.target.value; refresh(); };
$('tfs').innerHTML = CONFIG.timeframes.map(([id, n]) => `<button data-tf="${id}" class="${id === st.tf ? 'on' : ''}">${n}</button>`).join('');
$('tfs').onclick = e => { const tf = e.target.dataset.tf; if (!tf) return; st.tf = tf; [...$('tfs').children].forEach(b => b.classList.toggle('on', b.dataset.tf === tf)); refresh(); };
initChart(); refresh(); setInterval(refresh, CONFIG.refreshMs);
