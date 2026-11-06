import test from 'node:test';
import assert from 'node:assert/strict';
import * as lib from '../dist/esm/index.js';
function random(seed = 123456789) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test('known distance and actual edit script', () => {
  const r = lib.alignSequences('kitten', 'sitting');
  assert.equal(r.distance, 3);
  assert.equal(r.operations.filter((x) => x.kind !== 'equal').length, 3);
});
test('Unicode code points not UTF16 units', () => {
  assert.equal(lib.alignSequences('😀a', '😃a').distance, 1);
  assert.equal(lib.alignSequences('', '😀').operations.length, 1);
  assert.equal(lib.alignSequences('é', 'e\u0301').distance, 2);
});
test('weighted delete insert beat replacement', () => {
  const r = lib.alignSequences('a', 'b', { substituteCost: 5 });
  assert.equal(r.distance, 2);
  assert.deepEqual(
    r.operations.map((x) => x.kind),
    ['insert', 'delete'],
  );
});
test('empty and zero costs', () => {
  assert.deepEqual(lib.alignSequences('', ''), { distance: 0, operations: [] });
  assert.equal(lib.alignSequences('abc', '', { deleteCost: 0 }).distance, 0);
});
test('cell bounds and overflow', () => {
  assert.throws(() => lib.alignSequences('ab', 'c', { maxCells: 5 }), RangeError);
  assert.equal(lib.alignSequences('ab', 'c', { maxCells: 6 }).distance, 2);
  assert.throws(() => lib.alignSequences('x', 'y', { insertCost: -1 }), RangeError);
  assert.throws(() => lib.alignSequences('', 'ab', { insertCost: Number.MAX_VALUE }), RangeError);
});
test('seeded recursive oracle and script replay', () => {
  const rng = random();
  for (let t = 0; t < 150; t++) {
    const word = () =>
      Array.from(
        { length: Math.floor(rng() * 5) },
        () => ['a', 'b', '😀'][Math.floor(rng() * 3)],
      ).join('');
    const a = word(),
      b = word(),
      aa = Array.from(a),
      bb = Array.from(b),
      ins = Math.floor(rng() * 3),
      del = Math.floor(rng() * 3),
      sub = Math.floor(rng() * 4);
    const go = (i, j) =>
      i === aa.length
        ? (bb.length - j) * ins
        : j === bb.length
          ? (aa.length - i) * del
          : Math.min(
              go(i + 1, j + 1) + (aa[i] === bb[j] ? 0 : sub),
              del + go(i + 1, j),
              ins + go(i, j + 1),
            );
    const r = lib.alignSequences(a, b, { insertCost: ins, deleteCost: del, substituteCost: sub });
    assert.equal(r.distance, go(0, 0));
    let cursor = 0,
      out = '',
      cost = 0;
    for (const op of r.operations) {
      if (op.kind === 'insert') {
        out += op.value;
        cost += ins;
      } else if (op.kind === 'replace') {
        assert.equal(aa[cursor++], op.from);
        out += op.to;
        cost += sub;
      } else {
        assert.equal(aa[cursor++], op.value);
        if (op.kind === 'equal') out += op.value;
        else cost += del;
      }
    }
    assert.equal(cursor, aa.length);
    assert.equal(out, b);
    assert.equal(cost, r.distance);
  }
});
