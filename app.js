import { CONFIG } from './config.js';
import { getCandles, getTicker } from './api.js';
import * as home from './home.js'; import * as m1 from './m1.js'; import * as m2 from './m2.js'; import * as m3 from './m3.js';
import * as A from './A.js'; import * as A1 from './A1.js'; import * as A2 from './A2.js'; import * as A3 from './A3.js';
const $ = id => document.getElementById(id), mods = { home, m1, m2, m3, A, A1, A2, A3 };
const ctx = { sym: CONFIG.symbols[0], tf: '1h', candles: [], ticker: null, err: '', fetchedAt: 0, pick };
let cur = 'home';
function fs(on) { const d = document; // تمام‌صفحه و افقی فقط برای چارت
  if (on && !d.fullscreenElement) d.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  else if (!on && d.fullscreenElement) { screen.orientation?.unlock?.(); d.exitFullscreen?.(); } }
function show(v) {
  mods[cur].unmount?.(); cur = v; document.body.dataset.v = v; $('dr').hidden = true;
  [...$('nav').children].forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('view').innerHTML = ''; mods[v].mount($('view'), ctx); mods[v].update(ctx);
}
function paint() {
  $('dot').className = ctx.err ? 'bad' : ctx.fetchedAt ? 'ok' : ''; $('stx').textContent = ctx.err ? 'قطع' : ctx.fetchedAt ? 'آنلاین' : '…';
  $('upd').textContent = ctx.fetchedAt ? new Date(ctx.fetchedAt).toLocaleTimeString('fa-IR') : '';
  $('info').textContent = '⚠ توصیه مالی نیست · همیشه حد ضرر بگذار' + (ctx.err ? ' · ' + ctx.err : '');
  $('chips').innerHTML = [...new Set([...CONFIG.symbols, ctx.sym])].map(s => `<button data-s="${s}" class="${s === ctx.sym ? 'on' : ''}">${s.replace('USDT', '/USDT')}</button>`).join('');
}
async function load() {
  try { const [t, r] = await Promise.all([getTicker(ctx.sym), getCandles(ctx.sym, ctx.tf)]); Object.assign(ctx, { ticker: t, candles: r.candles, fetchedAt: r.fetchedAt, err: '' }); }
  catch (e) { ctx.err = e.message; }
  paint(); mods[cur].update(ctx);
}
function pick(sym) { ctx.sym = sym; ctx.ticker = null; ctx.candles = []; paint(); load(); }
$('dl').innerHTML = CONFIG.symbols.map(s => `<option value="${s}">`).join('');
$('q').onchange = e => { let s = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!s) return; if (!s.endsWith('USDT')) s += 'USDT'; e.target.value = ''; pick(s); };
$('chips').onclick = e => { const s = e.target.dataset.s; if (s) pick(s); };
$('tfs').innerHTML = ['1d', '4h', '1h', '15m'].map(t => `<button data-tf="${t}" class="${t === ctx.tf ? 'on' : ''}">${t}</button>`).join('');
$('tfs').onclick = e => { const t = e.target.dataset.tf; if (!t) return; ctx.tf = t; [...$('tfs').children].forEach(b => b.classList.toggle('on', b.dataset.tf === t)); load(); };
$('nav').onclick = e => { const v = e.target.closest('button')?.dataset.v; if (!v) return; if (v === 'menu') { $('dr').hidden = false; return; } fs(v === 'm3'); show(v); };
$('mn').onclick = () => { $('dr').hidden = false; };
$('dr').onclick = e => { const v = e.target.dataset.v; if (v) show(v); else if (e.target.id === 'dr') $('dr').hidden = true; };
show('home'); load(); setInterval(load, CONFIG.refreshMs);
