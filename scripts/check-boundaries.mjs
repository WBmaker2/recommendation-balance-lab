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
 * forbidden API token. Quoted strings and template literals are copied verbatim so
 * URL text cannot turn the rest of a source line into a false comment. Test paths
 * are excluded before scanning, and matchMedia has no forbidden token.
 */
/** @param {string} text */
function withoutComments(text) {
  let output = '';
  let index = 0;

  const copyQuoted = (quote) => {
    output += quote;
    index += 1;
    let escaped = false;
    while (index < text.length) {
      const character = text[index];
      output += character;
      index += 1;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) return;
    }
  };

  const copyTemplate = () => {
    output += '`';
    index += 1;
    while (index < text.length) {
      const character = text[index];
      if (character === '\\') {
        output += character;
        index += 1;
        if (index < text.length) {
          output += text[index];
          index += 1;
        }
      } else if (character === '`') {
        output += character;
        index += 1;
        return;
      } else if (character === '$' && text[index + 1] === '{') {
        output += '${';
        index += 2;
        scanCode(true);
      } else {
        output += character;
        index += 1;
      }
    }
  };

  const scanCode = (untilBrace = false) => {
    while (index < text.length) {
      const character = text[index];
      const next = text[index + 1];
      if (untilBrace && character === '}') {
        output += character;
        index += 1;
        return;
      }
      if (character === '/' && next === '/') {
        output += '  ';
        index += 2;
        while (index < text.length && text[index] !== '\n' && text[index] !== '\r') {
          output += ' ';
          index += 1;
        }
      } else if (character === '/' && next === '*') {
        output += '  ';
        index += 2;
        while (index < text.length) {
          if (text[index] === '*' && text[index + 1] === '/') {
            output += '  ';
            index += 2;
            break;
          }
          output += text[index] === '\n' || text[index] === '\r' ? text[index] : ' ';
          index += 1;
        }
      } else if (character === "'" || character === '"') {
        copyQuoted(character);
      } else if (character === '`') {
        copyTemplate();
      } else if (character === '{') {
        output += character;
        index += 1;
        scanCode(true);
      } else {
        output += character;
        index += 1;
      }
    }
  };

  scanCode();
  return output;
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
