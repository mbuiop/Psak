import { CONFIG } from './config.js';
import { getCandles, getTicker } from './api.js';
import * as m1 from './m1.js'; import * as m2 from './m2.js'; import * as m3 from './m3.js';
const $ = id => document.getElementById(id), mods = { m1, m2, m3 };
const ctx = { sym: CONFIG.symbols[0], tf: '1h', candles: [], ticker: null, err: '', fetchedAt: 0, pick };
let cur = 'm3';
function fs(on) { // تمام‌صفحه و افقی (قفل جهت فقط در بعضی مرورگرهای موبایل کار می‌کند)
  const d = document;
  if (on && !d.fullscreenElement) d.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  else if (!on && d.fullscreenElement) { screen.orientation?.unlock?.(); d.exitFullscreen?.(); }
}
function show(v) {
  mods[cur].unmount?.(); cur = v; document.body.dataset.v = v;
  [...$('nav').children].forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('view').innerHTML = ''; mods[v].mount($('view'), ctx); mods[v].update(ctx);
}
function paint() {
  const t = ctx.ticker, p = t ? `${t.price.toLocaleString('en-US')} · ${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}%` : (ctx.err || 'در حال دریافت…');
  $('info').textContent = `⚠ توصیه مالی نیست · ${ctx.sym} · ${ctx.tf} · ${p}`;
}
async function load() {
  try {
    const [t, r] = await Promise.all([getTicker(ctx.sym), getCandles(ctx.sym, ctx.tf)]);
    Object.assign(ctx, { ticker: t, candles: r.candles, fetchedAt: r.fetchedAt, err: '' });
  } catch (e) { ctx.err = e.message; }
  paint(); mods[cur].update(ctx);
}
function pick(sym) {
  if (![...$('sym').options].some(o => o.value === sym)) $('sym').add(new Option(sym, sym));
  $('sym').value = ctx.sym = sym; ctx.ticker = null; load();
}
$('sym').innerHTML = CONFIG.symbols.map(s => `<option>${s}</option>`).join('');
$('sym').onchange = e => pick(e.target.value);
$('tfs').innerHTML = ['1d', '4h', '1h', '15m'].map(t => `<button data-tf="${t}" class="${t === ctx.tf ? 'on' : ''}">${t}</button>`).join('');
$('tfs').onclick = e => { const t = e.target.dataset.tf; if (!t) return; ctx.tf = t; [...$('tfs').children].forEach(b => b.classList.toggle('on', b.dataset.tf === t)); load(); };
$('nav').onclick = e => { const v = e.target.dataset.v; if (!v) return; fs(v === 'm3'); show(v); };
show('m3'); load(); setInterval(load, CONFIG.refreshMs);
