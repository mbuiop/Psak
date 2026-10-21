import { CONFIG } from './config.js';
const cache = new Map();
export class ApiError extends Error {}
async function get(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < CONFIG.cacheMs) return hit.data;
  let err;
  for (let n = 0; n <= CONFIG.retries; n++) {
    try {
      const r = await fetch(CONFIG.baseUrl + path);
      if (r.status === 429 || r.status === 418) throw new ApiError('محدودیت نرخ درخواست Binance (' + r.status + ')');
      if (r.status === 451) throw new ApiError('دسترسی به Binance از این منطقه مسدود است (451)');
      if (!r.ok) throw new ApiError('خطای HTTP ' + r.status);
      const data = await r.json();
      cache.set(path, { at: Date.now(), data, fetchedAt: Date.now() });
      return data;
    } catch (e) {
      err = e instanceof ApiError ? e : new ApiError('اتصال به شبکه برقرار نشد');
      if (/محدودیت|مسدود/.test(err.message)) break;
      await new Promise(res => setTimeout(res, 500 * 2 ** n));
    }
  }
  throw err;
}
export function normalizeKlines(rows, now = Date.now()) {
  return rows.map(k => ({ t: k[0] / 1000, o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5], closed: k[6] < now }))
    .filter(x => [x.o, x.h, x.l, x.c, x.v].every(Number.isFinite)).sort((a, b) => a.t - b.t);
}
export async function getCandles(symbol, tf) {
  const rows = await get(`/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${CONFIG.limit}`);
  return { candles: normalizeKlines(rows), source: 'Binance Spot', fetchedAt: Date.now() };
}
export async function getTicker(symbol) {
  const t = await get(`/api/v3/ticker/24hr?symbol=${symbol}`);
  return { price: +t.lastPrice, changePct: +t.priceChangePercent, quoteVolume: +t.quoteVolume };
}
