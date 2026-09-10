// Validates every inline script on every shipped page.
// Usage: node scripts/check-js.mjs

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pages = [
  'index.html',
  '404.html',
  'lessons/index.html',
  'lessons/0001-the-machine-that-prints-its-own-manual.html',
  'lessons/0002-how-the-idea-got-lost.html',
  'lessons/0003-two-architectures-on-the-same-table.html',
  'lessons/0004-the-status-line-names-what-happened.html',
  'lessons/0005-ask-without-harm-repeat-without-doubt.html',
  'glossary.html'
];

const widgetFiles = [
  'assets/js/widget-0001.js',
  'assets/js/widget-0002.js',
  'assets/js/widget-0003.js',
  'assets/js/widget-0004.js',
  'assets/js/widget-0005.js'
];

const scriptRe = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
const tmp = mkdtempSync(join(tmpdir(), 'thr-check-js-'));
let failures = 0;
let checked = 0;

for (const file of widgetFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures += 1;
    console.error(`FAIL ${file}: parse error\n${result.stderr}`);
  } else {
    checked += 1;
  }
}

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const match of html.matchAll(scriptRe)) {
    if (/\bsrc=/.test(match[0])) continue;
    const spec = `${page.replace(/[^\w]+/g, '_')}-${checked}.js`;
    writeFileSync(join(tmp, spec), match[1]);
    const result = spawnSync(process.execPath, ['--check', join(tmp, spec)], {
      encoding: 'utf8'
    });
    if (result.status !== 0) {
      failures += 1;
      console.error(`FAIL ${page}: script ${checked}\n${result.stderr}`);
    } else {
      checked += 1;
    }
  }
}

console.log(`check-js: ${checked} script(s) parsed clean${failures ? `, ${failures} failed` : ''}`);
process.exit(failures === 0 ? 0 : 1);