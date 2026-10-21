import test from 'node:test';
import assert from 'node:assert/strict';
import { sma, ema, rsi, macd, atr, bollinger } from './indicators.js';
import { normalizeKlines } from './api.js';
import { analyze } from './scoring.js';
const up = Array.from({ length: 300 }, (_, i) => 100 + i), near = (a, b) => Math.abs(a - b) < 1e-9;
test('sma', () => assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]));
test('ema', () => assert.deepEqual(ema([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]));
test('rsi حدی', () => { assert.equal(rsi(up).at(-1), 100); assert.equal(rsi([...up].reverse()).at(-1), 0); });
test('macd ثابت صفر', () => assert.ok(near(macd(Array(100).fill(5)).hist.at(-1), 0)));
test('atr', () => assert.ok(near(atr(Array.from({ length: 30 }, () => ({ h: 12, l: 10, c: 11 }))).at(-1), 2)));
test('bollinger ثابت', () => { const b = bollinger(Array(30).fill(7)); assert.equal(b.upper.at(-1), b.lower.at(-1)); });
test('کندل ناقص', () => {
  const k = normalizeKlines([[2000, '1', '2', '0.5', '1.5', '10', 2999], [1000, '1', '2', '0.5', '1.5', '10', 1999]], 2500);
  assert.deepEqual(k.map(x => x.closed), [true, false]); assert.ok(k[0].t < k[1].t);
});
test('داده ناکافی', () => assert.equal(analyze([]).label, 'insufficient'));
test('روند صعودی', () => assert.equal(analyze(up.map((c, i) => ({ t: i, o: c, h: c, l: c, c, v: 1, closed: true }))).label, 'bullish'));
