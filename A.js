// اسکنر ارزهای پرپتانسیل: ۱۲ ارز پرحجم بر اساس امتیاز الگوریتمی تایم‌فریم انتخابی (نه پیش‌بینی)
import { getAllTickers, getCandles } from './api.js';
import { analyze } from './scoring.js';
import { rsi } from './indicators.js';
const $ = id => document.getElementById(id); let seq = 0;
export const mount = r => { r.innerHTML = '<h3>اسکنر ارزهای پرپتانسیل</h3><p class="muted">رتبه‌بندی فنی ۱۲ ارز پرحجم USDT؛ پیش‌بینی قیمت یا توصیه خرید نیست. روی ردیف بزن تا ارز انتخاب شود.</p><div class="card" id="sc">در حال اسکن…</div>'; $('sc').onclick = e => { const s = e.target.closest('tr')?.dataset.s; if (s) mount.ctx.pick(s); }; };
export async function update(ctx) {
  mount.ctx = ctx; if (!$('sc')) return; const id = ++seq, out = []; let fail = 0;
  try {
    const T = (await getAllTickers()).filter(x => !/(UP|DOWN)USDT$|^(USDC|FDUSD|TUSD|USDP|EUR|DAI)/.test(x.symbol)).sort((a, b) => b.vol - a.vol).slice(0, 12);
    for (const [i, t] of T.entries()) {
      try { const cs = (await getCandles(t.symbol, ctx.tf)).candles, a = analyze(cs), cl = cs.filter(x => x.closed);
        if (a.label === 'insufficient') throw 0; const av = cl.slice(-21, -1).reduce((s, x) => s + x.v, 0) / 20;
        out.push({ s: t.symbol, pct: t.pct, sc: a.score, lb: a.label, vr: cl[cl.length - 1].v / av, rsi: rsi(cl.map(x => x.c)).pop() }); } catch { fail++; }
      if (id !== seq || !$('sc')) return; $('sc').textContent = `در حال اسکن… ${i + 1}/${T.length}`;
    }
    out.sort((a, b) => b.sc - a.sc);
    $('sc').innerHTML = `<table><tr><th>ارز</th><th>امتیاز</th><th>حجم نسبی</th><th>RSI</th><th>۲۴h</th></tr>${out.map(x => `<tr data-s="${x.s}"><td class="${x.lb}">${x.s.replace('USDT', '')}</td><td>${x.sc}</td><td>×${x.vr.toFixed(1)}</td><td>${x.rsi.toFixed(0)}</td><td class="${x.pct >= 0 ? 'bullish' : 'bearish'}">${x.pct.toFixed(1)}%</td></tr>`).join('')}</table><p class="muted">تایم‌فریم ${ctx.tf} · امتیاز الگوریتمی ۰ تا ۱۰۰ · حجم نسبی = حجم آخرین کندل بسته به میانگین ۲۰ کندل${fail ? ` · ${fail} ارز به‌دلیل خطا/داده ناکافی کنار رفت` : ''}</p>`;
  } catch (e) { if ($('sc')) $('sc').innerHTML = `<div class="msg">${e.message}</div>`; }
}
