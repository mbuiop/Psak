// فیبوناچی (۱۰۰ کندل بسته اخیر) و پیوت کلاسیک (از آخرین کندل بسته تایم‌فریم انتخابی)
const $ = id => document.getElementById(id), f = n => n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 5 : 2 });
export const mount = r => { r.innerHTML = '<h3>فیبوناچی و پیوت</h3><div class="card" id="fb"></div><div class="card" id="pv"></div>'; };
export function update(ctx) {
  if (!$('fb')) return; const cl = ctx.candles.filter(x => x.closed);
  if (cl.length < 60) { $('fb').innerHTML = `<div class="msg">${ctx.err || 'داده ناکافی'}</div>`; $('pv').innerHTML = ''; return; }
  const w = cl.slice(-100), hi = w.reduce((m, x, i) => (x.h > w[m].h ? i : m), 0), lo = w.reduce((m, x, i) => (x.l < w[m].l ? i : m), 0), H = w[hi].h, L = w[lo].l, up = lo < hi, p = cl[cl.length - 1].c;
  const tbl = (rows) => { const near = rows.reduce((m, r, i) => (Math.abs(r[1] - p) < Math.abs(rows[m][1] - p) ? i : m), 0); return `<table>${rows.map((r, i) => `<tr class="${i === near ? 'near' : ''}"><td>${r[0]}</td><td>${f(r[1])}</td><td class="muted">${((r[1] / p - 1) * 100).toFixed(2)}%</td></tr>`).join('')}</table>`; };
  $('fb').innerHTML = `<b>فیبوناچی ${up ? '(اصلاح بعد از موج صعودی)' : '(اصلاح بعد از موج نزولی)'}</b><p class="muted">سقف ${f(H)} · کف ${f(L)} · قیمت ${f(p)}</p>` + tbl([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(r => [(r * 100).toFixed(1) + '%', up ? H - (H - L) * r : L + (H - L) * r]));
  const k = cl[cl.length - 1], P = (k.h + k.l + k.c) / 3;
  $('pv').innerHTML = `<b>پیوت کلاسیک</b><p class="muted">بر پایه آخرین کندل بسته ${ctx.tf}</p>` + tbl([['R3', k.h + 2 * (P - k.l)], ['R2', P + k.h - k.l], ['R1', 2 * P - k.l], ['P', P], ['S1', 2 * P - k.h], ['S2', P - (k.h - k.l)], ['S3', k.l - 2 * (k.h - P)]]) + '<p class="muted">سطح نزدیک‌تر به قیمت هایلایت شده است. توصیه مالی نیست.</p>';
}
