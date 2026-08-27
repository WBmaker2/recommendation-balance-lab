import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** @typedef {{ path: string, text: string }} SourceText */
/** @typedef {{ path: string, lines: number }} LineLimitViolation */

const ROOTS = new Set(['src', 'tests', 'scripts']);
const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mjs']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'playwright-report', 'test-results', 'coverage']);

/** @param {string} text */
export function countSourceLines(text) {
  if (text.length === 0) return 0;
  const lines = text.split(/\r\n|\r|\n/);
  return lines.at(-1) === '' ? lines.length - 1 : lines.length;
}

/** @param {string} sourcePath */
function isDeclaredSource(sourcePath) {
  const normalized = sourcePath.replaceAll('\\', '/');
  const root = normalized.split('/')[0];
  return ROOTS.has(root) && EXTENSIONS.has(path.extname(normalized));
}

/** @param {SourceText[]} files @returns {LineLimitViolation[]} */
export function findLineLimitViolations(files) {
  return files
    .filter((file) => isDeclaredSource(file.path))
    .map((file) => ({ path: file.path.replaceAll('\\', '/'), lines: countSourceLines(file.text) }))
    .filter((file) => file.lines >= 500)
    .sort((left, right) => left.path.localeCompare(right.path));
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
    if (!entry.isFile() || !EXTENSIONS.has(path.extname(entry.name))) return [];
    const sourcePath = path.join(relativeDirectory, entry.name).replaceAll('\\', '/');
    return [{ path: sourcePath, text: fs.readFileSync(path.join(directory, entry.name), 'utf8') }];
  });
}

function runCli() {
  const files = [...ROOTS].sort().flatMap((root) => readSourceTree(root, root));
  const violations = findLineLimitViolations(files);
  if (violations.length === 0) {
    globalThis.console.log('All checked source files are under 500 lines.');
    return;
  }
  for (const violation of violations) globalThis.console.error(`${violation.path}: ${violation.lines} lines`);
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.dirname(fileURLToPath(import.meta.url)) + '/check-line-limits.mjs') runCli();
