// صفحه خانه: خلاصه بازار، چارت، پنل تحلیل، حمایت/مقاومت، چندتایم‌فریم، رویدادها، کیفیت داده
import { getCandles, getAllTickers } from './api.js';
import { CONFIG } from './config.js';
import { analyze } from './scoring.js';
import { ema } from './indicators.js';
import * as chart from './m3.js';
const $ = id => document.getElementById(id), f = n => n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 5 : 2 });
const cp = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const LB = { bullish: 'صعودی', bearish: 'نزولی', neutral: 'خنثی', conflict: 'متناقض', insufficient: 'داده ناکافی' };
let seq = 0, bs = null;
export function mount(r, ctx) {
  r.innerHTML = `<section class="g4" id="sm"></section><div class="mid2"><div class="card" id="hc" style="height:360px;display:flex;padding:6px"></div><div class="card" id="gp"></div></div>
   <div class="g3"><div class="card" id="srp"></div><div class="card" id="mtf">در حال دریافت…</div><div class="card" id="evp"></div></div><div class="card dq" id="dq"></div>`;
  chart.mount($('hc'), ctx);
}
export const unmount = () => chart.unmount();
function events(k) {
  const cl = k.filter(x => x.closed), ev = []; if (cl.length < 30) return ev;
  const v = cl[cl.length - 1].v, av = cl.slice(-21, -1).reduce((s, x) => s + x.v, 0) / 20;
  if (av && v / av >= 2) ev.push(['افزایش حجم', `حجم آخرین کندل بسته ${(v / av).toFixed(1)} برابر میانگین ۲۰ کندل`, cl[cl.length - 1].t]);
  const c = cl.map(x => x.c), a = ema(c, 9), b = ema(c, 21);
  for (let i = cl.length - 5; i < cl.length; i++) { if (a[i - 1] == null || b[i - 1] == null) continue; const p = a[i - 1] - b[i - 1], q = a[i] - b[i];
    if (p <= 0 && q > 0) ev.push(['تقاطع EMA 9/21', 'تقاطع صعودی', cl[i].t]); if (p >= 0 && q < 0) ev.push(['تقاطع EMA 9/21', 'تقاطع نزولی', cl[i].t]); }
  return ev;
}
function top(ctx, a) {
  const t = ctx.ticker, up = chg => `class="${chg >= 0 ? 'bullish' : 'bearish'}"`;
  $('sm').innerHTML = `<div class="card"><small>${ctx.sym}</small><h2>${t ? f(t.price) : '—'}</h2>${t ? `<b ${up(t.changePct)}>${t.changePct >= 0 ? '+' : ''}${t.changePct.toFixed(2)}% · 24h</b>` : ''}</div>
   <div class="card"><small>حجم ۲۴ ساعته</small><h2>${t ? '$' + cp.format(t.quoteVolume) : '—'}</h2></div>
   <div class="card"><small>روند کلی (${ctx.tf})</small><h2 class="${a.label}">${LB[a.label]}</h2></div>
   <div class="card"><small>صعودی / نزولی (۱۰۰ ارز پرحجم)</small><h2>${bs ? `<span class="bullish">${bs[0]}</span> / <span class="bearish">${bs[1]}</span>` : '—'}</h2></div>`;
}
export async function update(ctx) {
  chart.update(ctx); const id = ++seq; if (!$('sm')) return;
  const a = analyze(ctx.candles), col = { bullish: '#22c55e', bearish: '#ef4444' }[a.label] || '#facc15';
  top(ctx, a);
  $('gp').innerHTML = `<h3>تحلیل جامع ${ctx.sym}</h3><svg viewBox="0 0 120 70" style="height:130px"><path d="M10 62A50 50 0 0 1 110 62" pathLength="100" fill="none" stroke="#12315a" stroke-width="10" stroke-linecap="round"/><path d="M10 62A50 50 0 0 1 110 62" pathLength="100" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${a.score ?? 0} 100"/><text x="60" y="56" text-anchor="middle" fill="#fff" font-size="22">${a.score ?? '—'}</text></svg>
   <p style="text-align:center" class="${a.label}"><b>${a.label === 'bullish' ? 'تمایل صعودی' : a.label === 'bearish' ? 'تمایل نزولی' : LB[a.label]}</b></p>
   ${a.label === 'insufficient' ? `<div class="msg">${a.reason || ctx.err || 'داده ناکافی'}</div>` : `<div class="row"><span>روند</span><b>${a.trend.toFixed(2)}</b></div><div class="row"><span>مومنتوم</span><b>${a.momentum.toFixed(2)}</b></div>`}
   <p class="muted">امتیاز الگوریتمی از ۱۰۰ است و به‌معنی احتمال افزایش یا کاهش قیمت نیست.</p>`;
  const { res, sup } = chart.sr(ctx.candles), p = ctx.ticker?.price, row = (x, n, c) => `<tr><td class="${c}">${n}</td><td>${f(x.p)}</td><td class="muted">${p ? ((x.p / p - 1) * 100).toFixed(2) + '%' : ''}</td><td class="muted">×${x.n}</td></tr>`;
  $('srp').innerHTML = `<h3>سطوح حمایت و مقاومت</h3><table>${res.map((x, i) => row(x, 'مقاومت ' + (i + 1), 'bearish')).join('')}${sup.map((x, i) => row(x, 'حمایت ' + (i + 1), 'bullish')).join('')}</table><p class="muted">ستون آخر: تعداد برخورد (قله/دره‌های کندل‌های بسته).</p>`;
  const ev = events(ctx.candles);
  $('evp').innerHTML = `<h3>رویدادها و هشدارها</h3>${ev.length ? ev.map(e => `<div class="row"><span><b>${e[0]}</b><br><small>${e[1]}</small></span><small>${new Date(e[2] * 1000).toLocaleTimeString('fa-IR')}</small></div>`).join('') : '<p class="muted">رویدادی از داده‌های واقعی ثبت نشد.</p>'}`;
  const fresh = ctx.fetchedAt && Date.now() - ctx.fetchedAt < 90000, lc = ctx.candles.filter(x => x.closed).pop();
  $('dq').innerHTML = `<span>منبع: Binance Spot</span><span>تایم‌فریم: ${ctx.tf}</span><span>آخرین کندل بسته: ${lc ? new Date(lc.t * 1000).toLocaleString('fa-IR') : '—'}</span><b class="${ctx.err ? 'bearish' : fresh ? 'bullish' : 'conflict'}">کیفیت داده: ${ctx.err ? 'خطا' : fresh ? 'تازه' : 'قدیمی'}</b>`;
  try { // شمارش صعودی/نزولی از ۱۰۰ ارز پرحجم
    const T = (await getAllTickers()).filter(x => !/(UP|DOWN)USDT$/.test(x.symbol)).sort((x, y) => y.vol - x.vol).slice(0, 100); bs = [T.filter(x => x.pct > 0).length, T.filter(x => x.pct < 0).length];
    const rows = await Promise.all(CONFIG.timeframes.map(async ([tf]) => { try { return [tf, analyze((await getCandles(ctx.sym, tf)).candles)]; } catch (e) { return [tf, { label: 'insufficient', reason: e.message }]; } }));
    if (id !== seq || !$('sm')) return; top(ctx, a);
    const v = rows.filter(r => r[1].label !== 'insufficient'), same = v.length > 1 && v.every(r => r[1].label === v[0][1].label);
    $('mtf').innerHTML = `<h3>تحلیل چندتایم‌فریمی</h3><table>${rows.map(([tf, x]) => `<tr><td>${tf}</td><td class="${x.label}">${LB[x.label]}</td><td class="muted">${x.score ?? '—'}</td></tr>`).join('')}</table><p class="${same ? v[0][1].label : 'conflict'}"><b>${v.length < 2 ? 'داده ناکافی برای هم‌سویی' : same ? 'تایم‌فریم‌ها هم‌سو هستند' : 'تضاد بین تایم‌فریم‌ها'}</b></p>`;
  } catch (e) { if (id === seq && $('mtf')) $('mtf').innerHTML = `<div class="msg">${e.message}</div>`; }
}
