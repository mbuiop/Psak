// شاخص ترس و طمع (alternative.me) — شاخص کل بازار کریپتو، نه تک‌ارز
const $ = id => document.getElementById(id), FA = { 'Extreme Fear': 'ترس شدید', Fear: 'ترس', Neutral: 'خنثی', Greed: 'طمع', 'Extreme Greed': 'طمع شدید' };
let cache = null;
export const mount = r => { r.innerHTML = '<h3>ترس و طمع</h3><div class="card" id="fg">در حال دریافت…</div>'; };
export async function update() {
  if (!$('fg')) return;
  try {
    if (!cache || Date.now() - cache.at > 300000) { const r = await fetch('https://api.alternative.me/fng/?limit=30'); if (!r.ok) throw new Error('خطای HTTP ' + r.status); const j = await r.json(); if (!j.data?.length) throw new Error('داده‌ای دریافت نشد'); cache = { at: Date.now(), d: j.data.map(x => ({ v: +x.value, c: x.value_classification, t: +x.timestamp })).reverse() }; }
    if (!$('fg')) return; const d = cache.d, l = d[d.length - 1], col = l.v < 40 ? '#ef4444' : l.v > 60 ? '#22c55e' : '#facc15';
    const pts = d.map((x, i) => `${(i / (d.length - 1) * 300).toFixed(1)},${(76 - x.v / 100 * 72).toFixed(1)}`).join(' ');
    $('fg').innerHTML = `<svg viewBox="0 0 120 70" style="height:140px"><path d="M10 62A50 50 0 0 1 110 62" pathLength="100" fill="none" stroke="#12315a" stroke-width="10" stroke-linecap="round"/><path d="M10 62A50 50 0 0 1 110 62" pathLength="100" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${l.v} 100"/><text x="60" y="56" text-anchor="middle" fill="#fff" font-size="22">${l.v}</text></svg>
     <p style="text-align:center;color:${col}"><b>${FA[l.c] || l.c}</b></p><small class="muted">۳۰ روز اخیر (۰ تا ۱۰۰)</small>
     <svg viewBox="0 0 300 80" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#22d3ee" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
     <p class="muted">آخرین مقدار: ${new Date(l.t * 1000).toLocaleDateString('fa-IR')} · منبع: alternative.me · شاخص کل بازار است و توصیه مالی نیست.</p>`;
  } catch (e) { if ($('fg')) $('fg').innerHTML = `<div class="msg">${e.message || 'اتصال برقرار نشد'} — داده‌ای نمایش داده نمی‌شود.</div>`; }
}
