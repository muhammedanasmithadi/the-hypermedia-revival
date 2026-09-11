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

// 1b. Every widget file named in the manifest exists.
for (const w of site.widgets) {
  eq(has(w.file), true, `widget file ${w.file} exists`);
}

// 1c. Every shared script named in the manifest exists.
for (const f of site.sharedScripts) {
  eq(has(f), true, `shared script ${f} exists`);
}

// 1d. Every widget page loads its widget as an ES module.
for (const w of site.widgets) {
  const file = w.file.replace('assets/js/', '');
  const html = read(w.page);
  eq(html.includes(`<script type="module" src="../assets/js/${file}"></script>`), true, `${w.page} loads ${file} as a module`);
}

// 1e. Every widget imports the shared scripts it relies on.
for (const w of site.widgets) {
  const js = read(w.file);
  eq(js.includes("import './site.js';"), true, `${w.file} imports site.js`);
}
for (const f of ['assets/js/widget-0002.js', 'assets/js/widget-0005.js']) {
  eq(read(f).includes("from './ledger.js';"), true, `${f} imports ledger.js`);
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

// 8. Stylesheet loader imports match the manifest; every page links it.
ok();
const css = read('assets/styles.css');
const imports = [...css.matchAll(/@import\s+url\("styles\/([^"]+)\.css"\);/g)].map((m) => m[1]);
eq(JSON.stringify(imports), JSON.stringify(site.styles), 'styles.css import order');
for (const id of site.styles) eq(has(`assets/styles/${id}.css`), true, `module asset styles/${id}.css exists`);
for (const p of topbarPages) eq(read(p).includes('rel="stylesheet"'), true, `${p} stylesheet link`);

// 8b. Every media asset referenced by HTML or the manifest exists on disk.
const asFile = (ref, base) => {
  // Absolute URL: strip the rootUrl prefix when it matches.
  if (ref.startsWith(site.rootUrl)) return ref.slice(site.rootUrl.length + 1);
  // Root-relative path like /the-hypermedia-revival/assets/...
  if (ref.startsWith('/')) return ref.replace(/^\/[^/]+\//, '');
  // Relative URL: resolve against the referencing page directory.
  return base ? join(base, ref) : ref;
};
const assetChecks = [];
for (const p of [...topbarPages, '404.html']) {
  const html = read(p);
  const base = dirname(p) === '.' ? '' : dirname(p);
  const og = [...html.matchAll(/<meta property="og:image" content="([^"]+)">/g)].map((m) => m[1]);
  const icons = [...html.matchAll(/<link rel="apple-touch-icon" href="([^"]+)">/g)].map((m) => m[1]);
  for (const ref of og.concat(icons)) assetChecks.push([p, asFile(ref, base), ref]);
}
assetChecks.push(['manifest.json', asFile(site.ogImage, ''), site.ogImage]);
for (const [page, file, ref] of assetChecks) {
  eq(has(file), true, `${page} asset exists: ${file}`);
}

// 9. Shared head and footer chrome do not drift across sections.
const headInvariants = [
  '<meta property="og:site_name" content="Hypermedia">',
  '<meta property="og:type" content="article">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<link rel="icon" type="image/png" href="../assets/favicon-32.png">',
  '<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">',
  "<script>document.documentElement.classList.add('js');</script>",
  '<link rel="stylesheet" href="../assets/styles.css">',
  '<a class="skip-link" href="#top">Skip to content</a>',
  '<div class="progress" id="progress" role="progressbar" aria-label="reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'
];
const footInvariants = [
  '<footer class="doc-footer">',
  '<nav class="foot-nav" aria-label="section navigation">',
  'Hypermedia Course · Section'
];
for (const s of live) {
  const file = slugFile(s);
  const html = read(file);
  for (const inv of headInvariants) eq(html.includes(inv), true, `${file} head: ${inv.slice(0, 50)}`);
  for (const inv of footInvariants) eq(html.includes(inv), true, `${file} foot: ${inv.slice(0, 40)}`);
  eq(html.includes(`Hypermedia Course · Section ${s.num} of ${site.sections.length}`), true,
    `${file} closing section ${s.num}`);
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