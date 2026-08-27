import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** @typedef {{ path: string, text: string }} SourceText */
/** @typedef {{ path: string, api: "fetch"|"XMLHttpRequest"|"WebSocket"|"EventSource"|"sendBeacon"|"cookie"|"localStorage"|"sessionStorage" }} BoundaryViolation */

const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'playwright-report', 'test-results', 'coverage', 'test']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mjs']);
const forbiddenPatterns = [
  ['fetch', /\bfetch\b/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['cookie', /\bcookies?\b/],
  ['localStorage', /\blocalStorage\b/],
  ['sessionStorage', /\bsessionStorage\b/],
];

/*
 * This is intentionally a small lexical boundary check: comments are blanked while
 * preserving line breaks, then each production source line is checked for the
 * forbidden API token. Test paths are excluded before scanning, and matchMedia has
 * no forbidden token, so ordinary reduced-motion feature detection remains valid.
 */
/** @param {string} text */
function withoutComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, ' '))
    .replace(/\/\/[^\r\n]*/g, '');
}

/** @param {string} sourcePath */
function isProductionSource(sourcePath) {
  const normalized = sourcePath.replaceAll('\\', '/');
  return normalized.startsWith('src/') && !normalized.startsWith('src/test/') && !/\.test\.[^/]+$/.test(normalized);
}

/** @param {SourceText[]} files @returns {BoundaryViolation[]} */
export function findBoundaryViolations(files) {
  /** @type {BoundaryViolation[]} */
  const violations = [];
  for (const file of files
    .filter((candidate) => isProductionSource(candidate.path) && EXTENSIONS.has(path.extname(candidate.path)))
    .sort((left, right) => left.path.localeCompare(right.path))) {
    const lines = withoutComments(file.text).split(/\r\n|\r|\n/);
    for (const line of lines) {
      for (const [api, pattern] of forbiddenPatterns) {
        if (pattern.test(line)) violations.push({ path: file.path.replaceAll('\\', '/'), api });
      }
    }
  }
  return violations;
}

/** @param {string} directory @param {string} relativeDirectory @returns {SourceText[]} */
function readSourceTree(directory, relativeDirectory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  return entries.flatMap((entry) => {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) return [];
      return readSourceTree(path.join(directory, entry.name), path.join(relativeDirectory, entry.name));
    }
    if (!entry.isFile() || !EXTENSIONS.has(path.extname(entry.name)) || /\.test\.[^/]+$/.test(entry.name)) return [];
    const sourcePath = path.join(relativeDirectory, entry.name).replaceAll('\\', '/');
    return [{ path: sourcePath, text: fs.readFileSync(path.join(directory, entry.name), 'utf8') }];
  });
}

function runCli() {
  const violations = findBoundaryViolations(readSourceTree('src', 'src'));
  if (violations.length === 0) {
    globalThis.console.log('No persistence or network boundary violations found.');
    return;
  }
  for (const violation of violations) globalThis.console.error(`${violation.path}: ${violation.api}`);
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.dirname(fileURLToPath(import.meta.url)) + '/check-boundaries.mjs') runCli();
