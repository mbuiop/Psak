export const CONFIG = {
  baseUrl: 'https://api.binance.com',
  symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'],
  timeframes: [['15m', '۱۵ دقیقه'], ['1h', '۱ ساعت'], ['4h', '۴ ساعت'], ['1d', 'روزانه']],
  limit: 500, cacheMs: 20000, refreshMs: 30000, retries: 2,
  minCandles: 210,
  weights: { trend: 0.6, momentum: 0.4 }, // قابل تغییر
  thresholds: { bias: 0.3, rsiHigh: 55, rsiLow: 45 },
};
