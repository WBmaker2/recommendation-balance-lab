import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('declares an existing SVG favicon in the document head', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const favicon = fs.readFileSync('public/favicon.svg', 'utf8');

  assert.match(html, /<link rel="icon" href="\.\/favicon\.svg" type="image\/svg\+xml" \/>/);
  assert.match(favicon, /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(favicon, /<title>추천 균형 실험실<\/title>/);
});
