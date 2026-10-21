'use strict';
const API = 'https://api.binance.com/api/v3';
const $ = id => document.getElementById(id);
const S = { sym: 'BTCUSDT', tf: '1h', ind: { ema: 1, sma: 0, bb: 1, vol: 1 }, cross: false, drawLine: false, lines: [], candles: [], levels: [], mouse: null };
const TFS = ['15m', '1h', '4h', '1d'];
const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d ?? (n >= 100 ? 2 : n >= 1 ? 4 : 6), maximumFractionDigits: d ?? (n >= 100 ? 2 : n >= 1 ? 4 : 6) });
const ic = { BTC: ['₿', '#f7931a'], ETH: ['Ξ', '#627eea'], SOL: ['◎', '#14f195'], DOGE: ['Ð', '#c2a633'] };

async function get(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

/* ---------- indicators ---------- */
const ema = (v, p) => { const k = 2 / (p + 1), o = Array(v.length).fill(null); if (v.length < p) return o; let e = v.slice(0, p).reduce((a, b) => a + b) / p; o[p - 1] = e; for (let i = p; i < v.length; i++) { e = v[i] * k + e * (1 - k); o[i] = e; } return o; };
const sma = (v, p) => v.map((_, i) => i < p - 1 ? null : v.slice(i - p + 1, i + 1).reduce((a, b) => a + b) / p);
const rsi = (v, p = 14) => { if (v.length <= p) return null; let g = 0, l = 0; for (let i = 1; i <= p; i++) { const d = v[i] - v[i - 1]; d > 0 ? g += d : l -= d; } g /= p; l /= p; for (let i = p + 1; i < v.length; i++) { const d = v[i] - v[i - 1]; g = (g * (p - 1) + Math.max(d, 0)) / p; l = (l * (p - 1) + Math.max(-d, 0)) / p; } return l === 0 ? 100 : 100 - 100 / (1 + g / l); };
const bb = (v, p = 20, m = 2) => v.map((_, i) => { if (i < p - 1) return null; const s = v.slice(i - p + 1, i + 1), a = s.reduce((x, y) => x + y) / p, sd = Math.sqrt(s.reduce((x, y) => x + (y - a) ** 2, 0) / p); return [a - m * sd, a, a + m * sd]; });

function pivots(c) {
  const hi = [], lo = [], n = 3;
  for (let i = n; i < c.length - n; i++) {
    let h = true, l = true;
    for (let j = 1; j <= n; j++) { if (c[i].h <= c[i - j].h || c[i].h <= c[i + j].h) h = false; if (c[i].l >= c[i - j].l || c[i].l >= c[i + j].l) l = false; }
    if (h) hi.push(c[i].h); if (l) lo.push(c[i].l);
  }
  return [...hi, ...lo];
}
function levels(c, price) {
  const pts = pivots(c).sort((a, b) => a - b), tol = price * 0.004, cl = [];
  pts.forEach(p => { const g = cl[cl.length - 1]; if (g && p - g.max <= tol) { g.p.push(p); g.max = p; } else cl.push({ p: [p], max: p }); });
  const lv = cl.map(g => ({ price: g.p.reduce((a, b) => a + b) / g.p.length, t: g.p.length }));
  const res = lv.filter(l => l.price > price).slice(0, 3), sup = lv.filter(l => l.price < price).reverse().slice(0, 3);
  return { res, sup };
}
const strength = t => t >= 3 ? ['قدرت بالا', 'hi'] : t === 2 ? ['قدرت متوسط', 'mid'] : ['قدرت پایین', 'lo'];

function analyze(c) {
  const cl = c.map(x => x.c), e20 = ema(cl, 20), e50 = ema(cl, 50), i = cl.length - 1;
  if (e50[i] == null) return null;
  const r = rsi(cl), vols = c.map(x => x.v), avg = vols.slice(-21, -1).reduce((a, b) => a + b) / 20;
  const trend = e20[i] > e50[i] && cl[i] > e50[i] ? 1 : e20[i] < e50[i] && cl[i] < e50[i] ? -1 : 0;
  const mom = r > 55 ? 1 : r < 45 ? -1 : 0;
  const volS = vols[i] > avg * 1.2 ? 1 : vols[i] < avg * 0.8 ? -1 : 0;
  const pv = c.slice(-60), hs = [], ls = [];
  for (let k = 2; k < pv.length - 2; k++) { if (pv[k].h > pv[k - 1].h && pv[k].h > pv[k + 1].h && pv[k].h > pv[k - 2].h && pv[k].h > pv[k + 2].h) hs.push(pv[k].h); if (pv[k].l < pv[k - 1].l && pv[k].l < pv[k + 1].l && pv[k].l < pv[k - 2].l && pv[k].l < pv[k + 2].l) ls.push(pv[k].l); }
  const st = hs.length > 1 && ls.length > 1 ? (hs.at(-1) > hs.at(-2) && ls.at(-1) > ls.at(-2) ? 1 : hs.at(-1) < hs.at(-2) && ls.at(-1) < ls.at(-2) ? -1 : 0) : null;
  return { trend, mom, volS, st, rsi: r, e20, e50, avg };
}

/* ---------- loading ---------- */
async function loadAll() {
  const cm = $('cmsg'); cm.textContent = 'در حال دریافت داده…';
  try {
    const [k, t] = await Promise.all([get(`/klines?symbol=${S.sym}&interval=${S.tf}&limit=300`), get(`/ticker/24hr?symbol=${S.sym}`)]);
    S.candles = k.map(x => ({ t: x[0], ct: x[6], o: +x[1], h: +x[2], l: +x[3], c: +x[4], v: +x[5], closed: x[6] < Date.now() }));
    cm.textContent = ''; S.tick = t; setConn(true);
    renderHead(t); renderPanels(); draw();
    loadMTF(); loadBreadth();
  } catch (e) {
    S.candles = []; cm.textContent = 'خطا در دریافت داده: ' + e.message + ' — نماد یا اتصال را بررسی کنید.'; setConn(false); draw();
    $('dqQ').textContent = 'کیفیت داده: ناموجود'; $('dqQ').className = 'red';
  }
}
function setConn(ok) { $('dot').className = 'dot ' + (ok ? 'on' : 'off'); $('conn').textContent = ok ? 'آنلاین' : 'قطع'; $('conn').className = ok ? 'green' : 'red'; if (ok) $('upd').textContent = new Date().toLocaleTimeString('en-GB'); }

function renderHead(t) {
  const b = S.sym.replace('USDT', ''), p = +t.lastPrice, ch = +t.priceChangePercent;
  $('sName').textContent = b; $('sPrice').textContent = fmt(p); $('sPrice').className = 'price ' + (ch >= 0 ? 'green' : 'red');
  $('sCh').innerHTML = `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%<small>24h</small>`; $('sCh').className = 'ch ' + (ch >= 0 ? 'green' : 'red');
  const v = +t.quoteVolume; $('sVol').textContent = '$' + (v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : (v / 1e6).toFixed(1) + 'M');
  const [s, col] = ic[b] || [b[0], '#1d6fa5']; $('coinIc').textContent = s; $('coinIc').style.background = col;
  $('cTitle').textContent = `${b}/USDT ${S.tf}`; $('cPrice').textContent = fmt(p) + '  ' + (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%'; $('cPrice').className = ch >= 0 ? 'green' : 'red';
  $('gSym').textContent = b + '/USDT'; $('dqT').textContent = 'تایم فریم: ' + S.tf;
}

function renderPanels() {
  const c = S.candles, price = c.at(-1).c, a = analyze(c.filter(x => x.closed));
  const L = levels(c, price); S.levels = [...L.res.map(l => ({ ...l, r: 1 })), ...L.sup.map(l => ({ ...l, r: 0 }))];
  $('sr').innerHTML = [...L.res.slice().reverse().map((l, i, arr) => ['مقاومت ' + (arr.length - i), l, 'r']), ...L.sup.map((l, i) => ['حمایت ' + (i + 1), l, 's'])]
    .map(([n, l, k]) => { const [s] = strength(l.t); return `<div class="row"><span class="tag ${k}">${n}</span><b dir="ltr">${fmt(l.price)}</b><small>${s}</small></div>`; }).join('') || '<div class="row">سطح معتبری یافت نشد</div>';
  const age = (Date.now() - c.at(-1).t) / 6e4, ok = c.every((x, i) => i === 0 || x.t > c[i - 1].t) && c.length >= 200;
  $('dqQ').textContent = 'کیفیت داده: ' + (ok ? 'عالی' : 'ناقص'); $('dqQ').className = ok ? 'green' : 'red';
  $('dqD').textContent = 'داده‌ها: ' + new Date(c.at(-1).t).toISOString().slice(0, 16).replace('T', ' ');
  if (!a) { $('gLabel').textContent = 'داده ناکافی'; $('gScore').textContent = '—'; $('gList').innerHTML = ''; return; }
  const rows = [['روند کلی', a.trend, ['صعودی', 'خنثی', 'نزولی']], ['مومنتوم', a.mom, ['مثبت', 'خنثی', 'منفی']], ['حجم', a.volS, ['افزایشی', 'عادی', 'کاهشی']], ['ساختار بازار', a.st, ['صعودی', 'خنثی', 'نزولی']]];
  const vals = rows.map(r => r[1]).filter(v => v !== null), score = Math.round((vals.reduce((x, y) => x + y, 0) / vals.length + 1) * 50);
  const lab = score >= 62 ? 'تمایل صعودی' : score <= 38 ? 'تمایل نزولی' : 'خنثی / رنج', col = score >= 62 ? '#2bff88' : score <= 38 ? '#ff4d5e' : '#ffd028';
  $('gLabel').textContent = lab; $('gLabel').style.color = col; $('gScore').textContent = score;
  $('garc').style.stroke = col; $('garc').setAttribute('stroke-dasharray', `${2.51 * score} 252`);
  $('gList').innerHTML = rows.map(([n, v, t]) => `<li><span>${n}</span><b class="${v === 1 ? 'green' : v === -1 ? 'red' : ''}">${v === null ? 'نامشخص' : t[1 - v]}</b></li>`).join('') +
    `<li><span>RSI(14)</span><b dir="ltr">${a.rsi.toFixed(1)}</b></li>`;
  S.a = a; renderEvents(c, a);
}
function renderEvents(c, a) {
  const ev = [], n = c.length, t = x => new Date(x).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  for (let i = n - 1; i > n - 40 && ev.length < 4; i--) {
    if (a.e20[i] != null && a.e50[i] != null && a.e20[i - 1] != null && a.e50[i - 1] != null) {
      const up = a.e20[i] > a.e50[i] && a.e20[i - 1] <= a.e50[i - 1], dn = a.e20[i] < a.e50[i] && a.e20[i - 1] >= a.e50[i - 1];
      if (up || dn) ev.push([c[i].t, up ? '🟢' : '🔴', 'تقاطع EMA20 و EMA50 — ' + (up ? 'صعودی' : 'نزولی')]);
    }
    if (c[i].v > a.avg * 2 && i < n - 1) ev.push([c[i].t, '🟠', 'حجم کندل بیش از ۲ برابر میانگین ۲۰ کندل']);
  }
  $('ev').innerHTML = ev.slice(0, 4).map(e => `<div class="ev"><span>${e[1]}</span><div><b>${e[2]}</b><small>${t(e[0])}</small></div></div>`).join('') || '<div class="row">رویداد مهمی در ۴۰ کندل اخیر ثبت نشده</div>';
}

async function loadMTF() {
  const out = [];
  for (const tf of TFS) {
    try {
      const k = await get(`/klines?symbol=${S.sym}&interval=${tf}&limit=120`), c = k.map(x => ({ c: +x[4], v: +x[5], h: +x[2], l: +x[3], closed: x[6] < Date.now() })).filter(x => x.closed);
      const a = analyze(c); out.push([tf, a ? a.trend : null, a ? a.rsi : null]);
    } catch { out.push([tf, null, null]); }
  }
  $('mtf').innerHTML = out.map(([tf, t, r]) => `<div class="row"><b dir="ltr">${tf}</b><b class="${t === 1 ? 'green' : t === -1 ? 'red' : ''}">${t === null ? 'نامشخص' : t === 1 ? '↑ صعودی' : t === -1 ? '↓ نزولی' : '— خنثی'}</b><small dir="ltr">RSI ${r ? r.toFixed(0) : '—'}</small></div>`).join('');
  const v = out.map(o => o[1]).filter(x => x !== null);
  $('mtfSum').innerHTML = !v.length ? 'داده کافی نیست' : v.every(x => x === 1) ? '<b class="green">✓ همه تایم‌فریم‌ها صعودی‌اند</b>' : v.every(x => x === -1) ? '<b class="red">✓ همه تایم‌فریم‌ها نزولی‌اند</b>' : '<b style="color:var(--yel)">تایم‌فریم‌ها همسو نیستند</b>';
}
async function loadBreadth() {
  try {
    const all = (await get('/ticker/24hr')).filter(x => x.symbol.endsWith('USDT') && !/(UP|DOWN|BULL|BEAR)USDT$/.test(x.symbol)).sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 100);
    const up = all.filter(x => +x.priceChangePercent > 0).length; $('up').textContent = up; $('dn').textContent = all.length - up;
    const t = up > 55 ? ['صعودی', 'green'] : up < 45 ? ['نزولی', 'red'] : ['خنثی', ''];
    $('sTrend').textContent = t[0]; $('sTrend').className = t[1]; $('sTrend').title = '۱۰۰ جفت‌ارز USDT با بیشترین حجم؛ تغییر ۲۴ ساعته مثبت = صعودی';
  } catch { $('up').textContent = $('dn').textContent = '—'; $('sTrend').textContent = 'ناموجود'; }
}

/* ---------- chart ---------- */
function draw() {
  const cv = $('cv'), dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
  const all = S.candles; if (!all.length) return;
  const AX = 64, volH = S.ind.vol ? 50 : 0, ch = H - volH - 22, N = Math.min(80, Math.floor((W - AX) / 6)), off = all.length - N, c = all.slice(off), cl = all.map(x => x.c);
  const e20 = ema(cl, 20).slice(off), e50 = ema(cl, 50).slice(off), s20 = sma(cl, 20).slice(off), s50 = sma(cl, 50).slice(off), bd = bb(cl).slice(off);
  let hi = Math.max(...c.map(x => x.h)), lo = Math.min(...c.map(x => x.l)); if (S.ind.bb) bd.forEach(b => { if (b) { hi = Math.max(hi, b[2]); lo = Math.min(lo, b[0]); } });
  const pad = (hi - lo) * .05; hi += pad; lo -= pad;
  const X = i => (i + .5) * (W - AX) / N, Y = p => 10 + (hi - p) / (hi - lo) * (ch - 10), bw = Math.max(2, (W - AX) / N * .65);
  g.font = '11px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#8fb0cc'; g.strokeStyle = '#12456b55';
  for (let i = 0; i <= 5; i++) { const p = lo + (hi - lo) * i / 5, y = Y(p); g.beginPath(); g.moveTo(0, y); g.lineTo(W - AX, y); g.stroke(); g.fillText(fmt(p, p > 100 ? 0 : undefined), W - AX + 6, y + 4); }
  const mx = Math.max(...c.map(x => x.v));
  c.forEach((x, i) => { const up = x.c >= x.o, col = up ? '#2bff88' : '#ff4d5e'; g.strokeStyle = g.fillStyle = col;
    if (S.ind.vol) { g.globalAlpha = .45; g.fillRect(X(i) - bw / 2, H - 20 - x.v / mx * volH, bw, x.v / mx * volH); g.globalAlpha = 1; }
    g.beginPath(); g.moveTo(X(i), Y(x.h)); g.lineTo(X(i), Y(x.l)); g.stroke(); const y1 = Y(Math.max(x.o, x.c)); g.fillRect(X(i) - bw / 2, y1, bw, Math.max(1, Math.abs(Y(x.o) - Y(x.c)))); });
  const line = (arr, col) => { g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); let s = 0; arr.forEach((v, i) => { if (v == null) return; s ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)); s = 1; }); g.stroke(); g.lineWidth = 1; };
  if (S.ind.ema) { line(e20, '#19b6ff'); line(e50, '#ffd028'); }
  if (S.ind.sma) { line(s20, '#c77dff'); line(s50, '#ff9f43'); }
  if (S.ind.bb) { line(bd.map(b => b && b[0]), '#3b8bd6'); line(bd.map(b => b && b[2]), '#3b8bd6'); }
  const tag = (p, col, txt) => { const y = Y(p); g.fillStyle = col; g.fillRect(W - AX, y - 9, AX, 18); g.fillStyle = '#021'; g.fillText(txt, W - AX + 4, y + 4); };
  S.levels.forEach(l => { if (l.price < lo || l.price > hi) return; const col = l.r ? '#ff4d5e' : '#2bff88'; g.strokeStyle = col; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(0, Y(l.price)); g.lineTo(W - AX, Y(l.price)); g.stroke(); g.setLineDash([]); tag(l.price, col, fmt(l.price, l.price > 100 ? 2 : undefined)); });
  S.lines.forEach(p => { if (p < lo || p > hi) return; g.strokeStyle = '#ffd028'; g.beginPath(); g.moveTo(0, Y(p)); g.lineTo(W - AX, Y(p)); g.stroke(); tag(p, '#ffd028', fmt(p, p > 100 ? 2 : undefined)); });
  const last = all.at(-1).c; tag(last, '#19e3d0', fmt(last, last > 100 ? 2 : undefined));
  if (S.cross && S.mouse) { g.strokeStyle = '#8fb0cc'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(S.mouse.x, 0); g.lineTo(S.mouse.x, H); g.moveTo(0, S.mouse.y); g.lineTo(W - AX, S.mouse.y); g.stroke(); g.setLineDash([]); tag(hi - (S.mouse.y - 10) / (ch - 10) * (hi - lo), '#8fb0cc', fmt(hi - (S.mouse.y - 10) / (ch - 10) * (hi - lo), 2)); }
  S.map = { hi, lo, ch };
}
const pos = e => { const r = $('cv').getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
$('cv').addEventListener('pointermove', e => { S.mouse = pos(e); if (S.cross) draw(); });
$('cv').addEventListener('pointerleave', () => { S.mouse = null; draw(); });
$('cv').addEventListener('click', e => { if (!S.drawLine || !S.map) return; const { y } = pos(e), m = S.map; S.lines.push(m.hi - (y - 10) / (m.ch - 10) * (m.hi - m.lo)); draw(); });
const tog = (id, k) => $(id).onclick = () => { S[k] = !S[k]; $(id).classList.toggle('on', S[k]); };
tog('tCross', 'cross'); tog('tLine', 'drawLine');
$('tClear').onclick = () => { S.lines = []; draw(); };
$('inds').onclick = e => { const k = e.target.dataset.i; if (!k) return; S.ind[k] = !S.ind[k]; e.target.classList.toggle('on', !!S.ind[k]); draw(); };
$('tfs').onclick = e => { const tf = e.target.dataset.tf; if (!tf) return; S.tf = tf; S.lines = []; [...$('tfs').children].forEach(b => b.classList.toggle('on', b === e.target)); loadAll(); };
addEventListener('resize', draw);

/* ---------- symbols / ui ---------- */
function chips() { $('chips').innerHTML = ['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'XRP'].map(b => `<button data-s="${b}USDT" class="${S.sym === b + 'USDT' ? 'on' : ''}">${b}/USDT</button>`).join(''); }
$('chips').onclick = e => { const s = e.target.dataset.s; if (s) setSym(s); };
function setSym(s) { S.sym = s; S.lines = []; chips(); loadAll(); }
$('q').addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return; let s = e.target.value.trim().toUpperCase().replace('/', ''); if (!s) return; if (!s.endsWith('USDT')) s += 'USDT';
  try { await get('/ticker/price?symbol=' + s); e.target.value = ''; setSym(s); } catch { modal('نماد پیدا نشد', `«${s}» در Binance Spot وجود ندارد.`); }
});
function modal(t, x) { $('mTitle').textContent = t; $('mText').textContent = x; $('modal').hidden = false; }
$('mClose').onclick = () => $('modal').hidden = true;
$('menuBtn').onclick = e => { e.stopPropagation(); $('menu').hidden = !$('menu').hidden; };
document.addEventListener('click', () => $('menu').hidden = true);
$('menu').onclick = e => { const m = e.target.dataset.m; if (m) modal(m, 'این بخش در مرحله بعدی ساخته می‌شود و هنوز پیاده‌سازی نشده است.'); };
$('detail').onclick = () => { const a = S.a; if (!a) return modal('جزئیات تحلیل', 'داده کافی برای تحلیل وجود ندارد.'); modal('جزئیات تحلیل', `قیمت ${a.trend === 1 ? 'بالای' : 'نسبت به'} EMA50 · EMA20=${fmt(a.e20.at(-1))} · EMA50=${fmt(a.e50.at(-1))} · RSI=${a.rsi.toFixed(1)}. امتیاز، میانگین چهار معیار ساده (روند، مومنتوم، حجم، ساختار) است و توصیه مالی یا پیش‌بینی قطعی نیست.`); };
document.querySelector('.nav').onclick = e => { const b = e.target.closest('button'); if (!b) return; const n = b.dataset.n;
  if (n === 'home') scrollTo({ top: 0, behavior: 'smooth' }); else if (n === 'analysis') $('gaugeBox').scrollIntoView({ behavior: 'smooth' }); else if (n === 'alerts') $('evBox').scrollIntoView({ behavior: 'smooth' });
  else modal(b.textContent.trim(), 'این بخش در مرحله بعدی ساخته می‌شود و هنوز پیاده‌سازی نشده است.'); };
$('refresh').onclick = loadAll;
chips(); loadAll(); setInterval(loadAll, 60000);
