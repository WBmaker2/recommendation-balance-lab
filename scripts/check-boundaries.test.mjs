import test from 'node:test';
import assert from 'node:assert/strict';
import { findBoundaryViolations } from './check-boundaries.mjs';

const forbidden = [
  ['fetch', 'fetch("/data")'],
  ['XMLHttpRequest', 'new XMLHttpRequest()'],
  ['WebSocket', 'new WebSocket("wss://example.test")'],
  ['EventSource', 'new EventSource("/events")'],
  ['sendBeacon', 'navigator.sendBeacon("/events", body)'],
  ['cookie', 'document.cookie = "session=1"'],
  ['localStorage', 'localStorage.setItem("key", "value")'],
  ['sessionStorage', 'sessionStorage.getItem("key")'],
];

test('reports each forbidden production API with its source path', () => {
  for (const [api, text] of forbidden) {
    assert.deepEqual(findBoundaryViolations([{ path: 'src/runtime.ts', text }]), [
      { path: 'src/runtime.ts', api },
    ]);
  }
});
test('excludes tests and test fixtures and permits matchMedia', () => {
  const files = [
    { path: 'src/test/setup.ts', text: 'fetch("/test")' },
    { path: 'src/runtime.test.ts', text: 'localStorage.setItem("x", "y")' },
    { path: 'tests/example.ts', text: 'navigator.sendBeacon("/test", body)' },
    { path: 'src/runtime.ts', text: 'window.matchMedia("(prefers-reduced-motion: reduce)")' },
  ];
  assert.deepEqual(findBoundaryViolations(files), []);
});

test('preserves strings so a URL cannot hide a later forbidden API', () => {
  assert.deepEqual(findBoundaryViolations([{
    path: 'src/runtime.ts',
    text: 'const endpoint = "https://example.test"; fetch(endpoint);',
  }]), [
    { path: 'src/runtime.ts', api: 'fetch' },
  ]);
});
