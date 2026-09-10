// Verifies the site against scripts/manifest.json.
// Usage: node scripts/check-consistency.mjs [--write]
//   default   fail on mismatch, report first
//   --write   regenerate sitemap.xml from the manifest, never fails

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const writeMode = process.argv.includes('--write');

const site = JSON.parse(readFileSync(join(root, 'scripts/manifest.json'), 'utf8'));
const pad2 = (n) => String(n).padStart(2, '0');
const pad4 = (n) => String(n).padStart(4, '0');
const read = (p) => readFileSync(join(root, p), 'utf8');
const has = (p) => existsSync(join(root, p));

const live = site.sections.filter((s) => s.num <= site.state.liveMax);
const slugFile = (s) => `lessons/${pad4(s.num)}-${s.slug}.html`;
const url = (path) => `${site.rootUrl}/${path}`;
const clean = (s) => s.replace(/\s+/g, ' ').trim();

const failures = [];
let checks = 0;
const ok = (label) => { checks += 1; };
const fail = (label, detail) => { failures.push(`FAIL ${label}\n      ${detail}`); };
const eq = (got, want, label) => {
  checks += 1;
  if (got !== want) fail(label, `got:    ${String(got).slice(0, 160)}\n      want: ${String(want).slice(0, 160)}`);
};

// 1. Every live section file exists.
for (const s of live) {
  eq(has(slugFile(s)), true, `section file ${slugFile(s)} exists`);
}

// 2. Canonical + og:url on every canonical-bearing page.
const canonicalPages = [
  'index.html',
  'lessons/index.html',
  ...live.map(slugFile),
  'glossary.html'
];
for (const p of canonicalPages) {
  const html = read(p);
  eq(html.includes(`<link rel="canonical" href="${url(p)}">`), true, `canonical for ${p}`);
  eq(html.includes(`<meta property="og:url" content="${url(p)}">`), true, `og:url for ${p}`);
}

// 3. 404.html exists and carries no canonical.
eq(has('404.html'), true, '404.html exists');
eq(read('404.html').includes('<link rel="canonical"'), false, '404.html has no canonical');

// 4. Sitemap matches the shipped set.
const sitemapBlocks = [
  ['index.html', 0.9],
  ['lessons/index.html', 0.8],
  ...live.map((s) => [slugFile(s), 0.8]),
  ['glossary.html', 0.8]
];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapBlocks.flatMap(([path, priority]) => [
    '  <url>',
    `    <loc>${url(path)}</loc>`,
    `    <lastmod>${site.lastmod}</lastmod>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ]),
  '</urlset>',
  ''
].join('\n');

if (writeMode) {
  writeFileSync(join(root, 'sitemap.xml'), sitemap);
  console.log(`consistency: sitemap.xml written (${sitemapBlocks.length} url entries)`);
} else {
  let current;
  try { current = read('sitemap.xml'); } catch { current = null; }
  eq(current, sitemap, 'sitemap.xml matches the manifest');
}

// 5. Home status block.
const home = read('index.html');
eq(home.includes(`<span class="done">Done:</span> 01-${pad2(site.state.liveMax)}`), true, 'home Done range');
eq(home.includes('Coming:'), true, 'home Coming marker');
const next = site.sections.find((s) => s.num === site.state.next);
eq(home.includes(`<li>${pad2(site.state.next)} · ${next.title}</li>`), true, 'home next list item');

// 6. Lessons index: byline + cards.
const lessons = read('lessons/index.html');
eq(lessons.includes(`sections 01-${pad2(site.state.liveMax)} live`), true, 'lessons byline live range');
const cards = [...lessons.matchAll(/<a class="card" href="([^"]+)">[\s\S]*?<span class="card-title">([\s\S]*?)<\/span>[\s\S]*?<span class="card-blurb">([\s\S]*?)<\/span>/g)]
  .map((m) => ({ href: m[1], title: clean(m[2]), blurb: clean(m[3]) }));
eq(cards.length, live.length, 'lessons card count');
for (const s of live) {
  const card = cards.find((c) => c.href === `${pad4(s.num)}-${s.slug}.html`);
  if (!card) { fail('lessons card', `no card href for ${slugFile(s)}`); continue; }
  eq(card.title, s.title, `card ${s.num} title`);
  eq(card.blurb, s.blurb, `card ${s.num} blurb`);
}

// 7. Topbar invariants.
const topbarPages = canonicalPages;
for (const p of topbarPages) {
  const html = read(p);
  eq(html.includes('class="brand"'), true, `${p} brand`);
  eq(html.includes('class="topnav" aria-label="Site"'), true, `${p} topnav`);
  eq(html.includes('>Sections<'), true, `${p} nav Sections`);
  eq(html.includes('>Glossary<'), true, `${p} nav Glossary`);
}
for (const p of live.map(slugFile)) {
  const html = read(p);
  eq(html.includes('id="cur-section"'), true, `${p} cur-section`);
  eq(html.includes('aria-live="polite"'), true, `${p} aria-live`);
}

// 8. Stylesheet arrangement (adapts through the CSS refactor).
const loader = 'assets/styles.css';
const legacy = 'assets/shared-styles.css';
if (has(loader)) {
  ok();
  const css = read(loader);
  const imports = [...css.matchAll(/@import\s+url\("styles\/([^"]+)\.css"\);/g)].map((m) => m[1]);
  eq(JSON.stringify(imports), JSON.stringify(site.styles), 'styles.css import order');
  for (const id of site.styles) eq(has(`assets/styles/${id}.css`), true, `module asset styles/${id}.css exists`);
  for (const p of topbarPages) eq(read(p).includes('rel="stylesheet"'), true, `${p} stylesheet`); 
} else {
  const base = legacy.split('/').pop();
  for (const p of topbarPages) {
    const html = read(p);
    eq(html.includes('rel="stylesheet"') && html.includes(base), true, `${p} stylesheet link`);
  }
}

if (writeMode) {
  console.log(`consistency: ${checks} check(s) passed in write mode`);
  process.exit(0);
}

if (failures.length) {
  console.error(`consistency: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`consistency: ${checks} check(s) passed`);