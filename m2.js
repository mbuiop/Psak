// نقشه حرارتی بازار (۲۴ ساعته، اندازه = حجم) + نسبت لانگ/شورت Binance Futures
import { getAllTickers, getLongShort } from './api.js';
const BAD = /(UP|DOWN|BULL|BEAR)USDT$|^(USDC|FDUSD|TUSD|USDP|EUR|AEUR|DAI|USDE|XUSD|BFUSD|USD1)/;
let seq = 0;
const $ = id => document.getElementById(id);
export const mount = r => { r.innerHTML = '<h3>نقشه حرارتی بازار (۲۴ ساعت)</h3><div id="hm" class="hm"></div><p class="muted">اندازه = حجم معاملات، رنگ = تغییر قیمت. روی هر ارز بزن تا انتخاب شود.</p><h3 id="lst">لانگ / شورت</h3><div class="card" id="ls">در حال دریافت…</div>'; $('hm').onclick = e => { const b = e.target.closest('.tile'); if (b) mount.ctx.pick(b.dataset.s); }; };
export async function update(ctx) {
  mount.ctx = ctx; const id = ++seq; if (!$('hm')) return;
  try {
    const t = (await getAllTickers()).filter(x => !BAD.test(x.symbol)).sort((a, b) => b.vol - a.vol).slice(0, 36), mx = t[0].vol;
    if (id !== seq || !$('hm')) return;
    $('hm').innerHTML = t.map(x => { const a = 0.25 + Math.min(Math.abs(x.pct) / 8, 1) * 0.65, col = x.pct >= 0 ? '34,197,94' : '239,68,68';
      return `<button class="tile" data-s="${x.symbol}" style="flex:${(Math.sqrt(x.vol / mx) * 100).toFixed(0)} 1 70px;background:rgba(${col},${a.toFixed(2)})"><b>${x.symbol.replace('USDT', '')}</b><br>${x.pct >= 0 ? '+' : ''}${x.pct.toFixed(2)}%</button>`; }).join('');
  } catch (e) { if ($('hm')) $('hm').innerHTML = `<div class="msg">${e.message}</div>`; }
  $('lst').textContent = `لانگ / شورت — ${ctx.sym} (${ctx.tf})`;
  try {
    const r = await getLongShort(ctx.sym, ctx.tf); if (id !== seq || !$('ls')) return;
    const last = r[r.length - 1], lo = Math.min(...r.map(x => x.long)), hi = Math.max(...r.map(x => x.long)), span = hi - lo || 1;
    const pts = r.map((x, i) => `${(i / (r.length - 1) * 300).toFixed(1)},${(76 - (x.long - lo) / span * 72).toFixed(1)}`).join(' ');
    $('ls').innerHTML = `<div style="display:flex;justify-content:space-between"><b class="bullish">لانگ ${(last.long * 100).toFixed(1)}%</b><b class="bearish">شورت ${(last.short * 100).toFixed(1)}%</b></div>
     <div class="gauge"><i style="width:${last.long * 100}%;background:var(--up)"></i><i style="width:${last.short * 100}%;background:var(--dn)"></i></div>
     <svg viewBox="0 0 300 80" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#22d3ee" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
     <p class="muted">روند سهم حساب‌های لانگ در ۳۰ نقطه اخیر. نسبت حساب‌هاست، نه حجم پوزیشن؛ منبع: Binance Futures. توصیه مالی نیست.</p>`;
  } catch (e) { if ($('ls')) $('ls').innerHTML = `<div class="msg">${e.message} — داده لانگ/شورت نمایش داده نمی‌شود.</div>`; }
}
