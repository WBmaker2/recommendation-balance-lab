import test from 'node:test';
import assert from 'node:assert/strict';
import { countSourceLines, findLineLimitViolations } from './check-line-limits.mjs';

const lines = (count) => Array.from({ length: count }, (_, index) => `line ${index + 1}`).join('\n');

test('counts source lines and accepts 499 lines', () => {
  assert.equal(countSourceLines(lines(499)), 499);
  assert.equal(countSourceLines(`${lines(499)}\n`), 499);
  assert.deepEqual(findLineLimitViolations([{ path: 'src/ok.ts', text: lines(499) }]), []);
});

test('reports a 500-line source file with its path and count', () => {
  assert.deepEqual(findLineLimitViolations([{ path: 'src/too-long.ts', text: lines(500) }]), [
    { path: 'src/too-long.ts', lines: 500 },
  ]);
});
