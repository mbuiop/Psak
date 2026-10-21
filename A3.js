// تحلیل دستی: ماشین‌حساب ریسک/ریوارد و اندازه پوزیشن + یادداشت (localStorage)
const $ = id => document.getElementById(id), n = id => parseFloat($(id).value);
let sym = '';
const kv = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch { return ''; } };
function calc() {
  const side = $('sd').value, e = n('en'), s = n('sl'), t = n('tp'), bal = n('bl'), rk = n('rk');
  if (![e, s, t, bal, rk].every(Number.isFinite)) { $('out').innerHTML = '<p class="muted">همه فیلدها را پر کن.</p>'; return; }
  const ok = side === 'long' ? s < e && t > e : s > e && t < e;
  if (!ok) { $('out').innerHTML = `<div class="msg">برای ${side === 'long' ? 'لانگ' : 'شورت'} باید ${side === 'long' ? 'حد ضرر < ورود < هدف' : 'هدف < ورود < حد ضرر'} باشد.</div>`; return; }
  const risk = bal * rk / 100, size = risk / Math.abs(e - s), val = size * e, rr = Math.abs(t - e) / Math.abs(e - s);
  $('out').innerHTML = `<div class="row"><span>ریسک به ریوارد</span><b>1 : ${rr.toFixed(2)}</b></div><div class="row"><span>زیان در صورت حد ضرر</span><b class="bearish">${risk.toFixed(2)}</b></div><div class="row"><span>سود در صورت هدف</span><b class="bullish">${(size * Math.abs(t - e)).toFixed(2)}</b></div><div class="row"><span>حجم پوزیشن (واحد)</span><b>${size.toPrecision(4)}</b></div><div class="row"><span>ارزش پوزیشن</span><b>${val.toFixed(2)}</b></div>${val > bal ? `<p class="conflict">ارزش پوزیشن از سرمایه بیشتر است (اهرم ≈ ${(val / bal).toFixed(1)}×).</p>` : ''}<p class="muted">محاسبه ریاضی ساده، بدون کارمزد و لغزش؛ توصیه مالی نیست.</p>`;
}
export function mount(r, ctx) {
  sym = ctx.sym;
  r.innerHTML = `<h3>تحلیل دستی — ${sym}</h3><div class="card"><div class="g2"><select id="sd"><option value="long">لانگ</option><option value="short">شورت</option></select><input id="en" type="number" step="any" placeholder="قیمت ورود" value="${ctx.ticker?.price ?? ''}"><input id="sl" type="number" step="any" placeholder="حد ضرر"><input id="tp" type="number" step="any" placeholder="هدف"><input id="bl" type="number" step="any" placeholder="سرمایه" value="${kv('radar-bal') || ''}"><input id="rk" type="number" step="any" placeholder="ریسک ٪" value="${kv('radar-rk') || 1}"></div><div id="out"></div></div>
   <div class="card"><b>یادداشت ${sym}</b><textarea id="nt" rows="5" placeholder="سناریو، شرایط ورود و ابطال…">${kv('radar-note:' + sym) || ''}</textarea></div>`;
  r.querySelector('.card').oninput = () => { kv('radar-bal', $('bl').value); kv('radar-rk', $('rk').value); calc(); };
  $('nt').oninput = () => kv('radar-note:' + sym, $('nt').value); calc();
}
export const update = () => {};
