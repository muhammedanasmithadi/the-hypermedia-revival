// check-widgets.mjs
// Accessibility scan (axe-core via CDN) plus full state-machine walks of every
// widget, driven over the Chrome DevTools Protocol with no third-party deps.
//
// Deps: Bun (Bun.serve, Bun.spawn, global fetch/WebSocket) + a Chrome build.
//   CHROME_BIN   path or name of a Chrome/Chromium binary (default: search PATH)
//   CI           when set, fail fast and print only failures
//
// Usage: bun run scripts/check-widgets.mjs

import { spawn, file, sleep } from 'bun';

const IS_CI = !!process.env.CI;
const ROOT = new URL('..', import.meta.url).pathname;
const AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

const PAGES = [
  'index.html',
  '404.html',
  'lessons/index.html',
  'glossary.html',
  'lessons/0001-the-machine-that-prints-its-own-manual.html',
  'lessons/0002-how-the-idea-got-lost.html',
  'lessons/0003-two-architectures-on-the-same-table.html',
  'lessons/0004-the-status-line-names-what-happened.html',
  'lessons/0005-ask-without-harm-repeat-without-doubt.html',
  'lessons/0006-keep-the-old-copy-ask-if-it-is-still-good.html'
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

const failures = [];
let pending = 0;

function ok(label) { pending += 1; console.log(`  ok  ${label}`); }
function fail(label, detail) {
  failures.push({ label, detail });
  console.error(`FAIL  ${label}${detail ? `\n      ${detail}` : ''}`);
}
function assert(cond, label, detail) { (cond ? ok : fail)(label, detail); }

// ---------- static server ----------
function serve() {
  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      let rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      rel = rel.replace(/^the-hypermedia-revival\/?/, '');
      if (rel === '') rel = 'index.html';
      if (rel.endsWith('/')) rel += 'index.html';
      const target = file(ROOT + rel);
      if (!(await target.exists())) {
        // axe-core resolves @import urls against the document base, which
        // fabricates /lessons/styles/*.css lookups. Serve silence for those.
        if (/lessons\/styles\/.+\.css$/.test(rel)) {
          return new Response('', { headers: { 'content-type': 'text/css' } });
        }
        return new Response('not found', { status: 404 });
      }
      const ext = rel.slice(rel.lastIndexOf('.')) || '.html';
      return new Response(target, { headers: { 'content-type': MIME[ext] || 'application/octet-stream' } });
    }
  });
  return { port: server.port, stop: () => server.stop(true) };
}

// ---------- Chrome launch + CDP ----------
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const names = ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium', 'chrome'];
  for (const n of names) {
    try {
      const out = Bun.spawnSync([n, '--version'], { stdout: 'pipe', stderr: 'pipe' });
      if (out.exitCode === 0) return n;
    } catch { /* not found */ }
  }
  return 'chromium-browser';
}

class CdpClient {
  constructor(ws) { this.ws = ws; this.id = 0; this.waiters = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    const client = new CdpClient(ws);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data.toString());
      if (m.id && client.waiters.has(m.id)) {
        const { resolve, reject } = client.waiters.get(m.id);
        client.waiters.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
      }
    };
    return client;
  }
  cmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.waiters.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.cmd('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true
    });
    if (r.exceptionDetails) throw new Error(
      `page error: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result ? r.result.value : undefined;
  }
  close() { try { this.ws.close(); } catch { /* closed already */ } }
}

async function launchChrome() {
  const bin = findChrome();
  const cport = 9333 + Math.floor(Math.random() * 1000);
  const profile = `${process.env.TMPDIR || '/tmp'}/chrome-cdp-${process.pid}-${Date.now()}`;
  const errFile = `${profile}.stderr`;
  const proc = spawn([bin,
    '--headless=new',
    `--remote-debugging-port=${cport}`,
    `--remote-debugging-address=127.0.0.1`,
    '--user-data-dir=' + profile,
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=1280,2000`
  ], { stdout: 'ignore', stderr: file(errFile) });
  let list;
  for (let i = 0; i < 100; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${cport}/json/list`)).json();
      if (list.some((t) => t.type === 'page')) break;
    } catch { /* chrome still booting */ }
    await sleep(100);
  }
  if (!list) {
    let stderrText = '(no stderr captured)';
    try { stderrText = await file(errFile).text(); } catch { /* file never created */ }
    throw new Error(`chrome did not answer on port ${cport} (binary ${bin})\n${stderrText.slice(0, 2000)}`);
  }
  const target = list.find((t) => t.type === 'page');
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  await client.cmd('Page.enable');
  await client.cmd('Runtime.enable');
  await client.cmd('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await client.cmd('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  return {
    client,
    close: () => { try { client.close(); } catch {} try { proc.kill(); } catch {} }
  };
}

async function goto(client, url) {
  await client.cmd('Page.navigate', { url });
  for (let i = 0; i < 100; i++) {
    const ready = await client.eval('document.readyState');
    if (ready === 'complete') break;
    await sleep(50);
  }
  await sleep(120);
}

// ---------- axe ----------
async function scanAxe(client, label) {
  let axeSrc;
  const cached = process.env.AXE_CACHE;
  if (cached) axeSrc = await file(cached).text();
  else {
    const r = await fetch(AXE_CDN);
    if (!r.ok) throw new Error(`axe CDN ${r.status}`);
    axeSrc = await r.text();
  }
  await client.eval(axeSrc + '; window.__hasAxe = typeof axe === "object";');
  const report = await client.eval(`(async () => {
    const v = await axe.run(document, { resultTypes: ['violations'] });
    return v.violations.map((v) => ({
      id: v.id, impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 3)
    }));
  })()`);
  const bad = report.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  assert(bad.length === 0, `axe ${label}`, bad.length
    ? bad.map((v) => `${v.id} (${v.impact}) @ ${v.nodes.join(' | ')}`).join('\n      ')
    : undefined);
  for (const v of report) if (!bad.includes(v)) {
    console.log(`    ~ ${label}: ${v.id} (${v.impact})`);
  }
}

// ---------- page probes ----------
const probes = {
  noUlRoleGroup: `(() => {
    const bad = [...document.querySelectorAll('ul[role]')]
      .filter((ul) => ul.getAttribute('role') !== 'list')
      .map((ul) => ul.className);
    return bad;
  })()`,
  progressInMain: `(() => {
    const p = document.getElementById('progress');
    if (!p) return null;
    return !!p.closest('main');
  })()`
};

// ---------- widget state machines ----------
const WIDGETS = {
  'lessons/0001-the-machine-that-prints-its-own-manual.html': [
    async (c) => {
      await c.eval(`document.getElementById('kiosk-reset').click()`);
      await c.eval(`clickByText('.kiosk-btn', 'Insert card')`);
      const t1 = await c.eval(`document.getElementById('kiosk-title').textContent`);
      assert(t1.includes('Enter your PIN'), 'kiosk: insert card → pin');
      await c.eval(`clickByText('.kiosk-btn', 'OK · PIN correct')`);
      const t2 = await c.eval(`document.getElementById('kiosk-title').textContent`);
      assert(t2.includes('Select an action'), 'kiosk: pin → menu');
      await c.eval(`clickByText('.kiosk-btn', 'Withdraw $50')`);
      const st = await c.eval(`document.getElementById('kiosk-state-label').textContent`);
      assert(st === 'refused', 'kiosk: $50 refused at $40', st);
      const nu = await c.eval(`document.getElementById('kiosk-note').textContent`);
      assert(nu.includes('refused'), 'kiosk: refusal note', nu);
      await c.eval(`clickByText('.kiosk-btn', 'Deposit first')`);
      await c.eval(`clickByText('.kiosk-btn', 'Add the money')`);
      const bal1 = await c.eval(`document.getElementById('kiosk-balance').textContent`);
      assert(bal1 === 'balance: $50', 'kiosk: deposit $10 → $50', bal1);
      await c.eval(`clickByText('.kiosk-btn', 'Withdraw $50')`);
      const disp = await c.eval(`document.getElementById('kiosk-state-label').textContent`);
      assert(disp === 'dispensing', 'kiosk: $50 unlocks at $50', disp);
      await c.eval(`clickByText('.kiosk-btn', 'Take cash')`);
      const bal2 = await c.eval(`document.getElementById('kiosk-balance').textContent`);
      assert(bal2 === 'balance: $0', 'kiosk: cash out → $0', bal2);
      const focus = await c.eval(`document.activeElement && document.activeElement.className`);
      assert(focus === 'kiosk-btn', 'kiosk: focus moves to the replacement button', String(focus));
    },
    async (c) => {
      await c.eval(`document.getElementById('kiosk-reset').click()`);
      await c.eval(`clickByText('.kiosk-btn', 'Insert card')`);
      await c.eval(`clickByText('.kiosk-btn', 'OK · PIN correct')`);
      await c.eval(`clickByText('.kiosk-btn', 'Remove card')`);
      const tt = await c.eval(`document.getElementById('kiosk-title').textContent`);
      assert(tt.includes('Take your card'), 'kiosk: remove card → goodbye', tt);
      await c.eval(`clickByText('.kiosk-btn', 'Use it again')`);
      const tw = await c.eval(`document.getElementById('kiosk-state-label').textContent`);
      assert(tw === 'welcome', 'kiosk: use again → welcome');
    },
    async (c) => {
      const btn = `document.querySelector('.x-mode-btn[data-mode="html"]')`;
      await c.eval(`document.dispatchEvent(new PointerEvent('pointerdown'));`);
      await c.eval(`${btn}.click()`);
      await c.eval(`sleepP(400)`);
      const mime = await c.eval(`document.querySelector('.x-type').textContent`);
      assert(mime === 'text/html', 'experiment: html reply served');
      await c.eval(`clickByText('.x-act', 'Deposit')`);
      const status = await c.eval(`document.querySelector('.x-status').textContent`);
      assert(status.includes('Deposit received'), 'experiment: control → status');
    },
    async (c) => {
      const ev = (n) => `document.querySelectorAll('.loop-step')[${n}].dispatchEvent(new PointerEvent('pointerenter'))`;
      const on = () => `document.querySelector('.loop-step.on .ls-t').textContent`;
      await c.eval(`document.dispatchEvent(new PointerEvent('pointerdown')); document.querySelectorAll('.loop-step')[1].dispatchEvent(new PointerEvent('pointerenter'));`);
      const on2 = await c.eval(on());
      assert(on2 === 'Document', 'loop: pointer advances to Document', on2);
      const cur2 = await c.eval(`document.getElementById('loop-beats').querySelector('.loop-beat.on') !== null`);
      assert(cur2 === true, 'loop: beat indicator tracks the step');
      const ac = await c.eval(`document.querySelector('.loop-step.on').getAttribute('aria-current')`);
      assert(ac === 'step', 'loop: aria-current marks the active step', ac);
      await c.eval(ev(1));
      const cap = await c.eval(`document.querySelectorAll('.loop-step.on')[0] !== undefined`);
      assert(cap === true, 'loop: pointer back to Document keeps one active');
      await c.eval(ev(0));
      const on3 = await c.eval(on());
      assert(on3 === 'Request', 'loop: pointer returns to Request', on3);
    }
  ],
  'lessons/0002-how-the-idea-got-lost.html': [
    async (c) => {
      await c.eval(`clickByText('.ledger-btn', 'Check my sort')`);
      const e1 = await c.eval(`document.querySelector('.ledger-result').textContent`);
      assert(/Place the reasons first/.test(e1), 'ledger02: empty check message', e1);
      await c.eval(`clickByText('.chip', 'native apps')`);
      const pressed = await c.eval(`document.querySelector('.ledger-item.selected .chip').getAttribute('aria-pressed')`);
      assert(pressed === 'true', 'ledger02: selected chip aria-pressed');
      await c.eval(`clickByText('.ledger-col-name', 'Necessity')`);
      const p1 = await c.eval(`document.querySelector('.ledger-result').textContent`);
      assert(p1.includes('Placed in Necessity'), 'ledger02: place chip', p1);
    }
  ],
  'lessons/0003-two-architectures-on-the-same-table.html': [
    async (c) => {
      await c.eval(`clickByText('.explorer-act', 'Check the balance')`);
      await c.eval(`sleepP(400)`);
      const a = await c.eval(`document.getElementById('lane-a').textContent`);
      const b = await c.eval(`document.getElementById('lane-b').textContent`);
      assert(a.includes('bank of documents') && b.includes('balance'), 'explorer: both lanes answer',
        (a + ' || ' + b).slice(0, 120));
      await c.eval(`document.getElementById('explorer-night').click()`);
      await c.eval(`sleepP(400)`);
      const na = await c.eval(`document.getElementById('lane-a').textContent`);
      const nb = await c.eval(`document.getElementById('lane-b').textContent`);
      assert(na.includes('Apply the $10 credit'), 'explorer: night pass adds credit to A');
      assert(!nb.includes('Apply the $10 credit'), 'explorer: night pass leaves B without the move', nb.slice(0, 120));
      await c.eval(`clickByText('#lane-a .x-act', 'Apply the $10 credit')`);
      await c.eval(`sleepP(400)`);
      const na2 = await c.eval(`document.getElementById('lane-a').textContent`);
      assert(na2.includes('Balance: $50'), 'explorer: credit raises balance to 50', na2.slice(0, 80));
      const nb2 = await c.eval(`document.getElementById('lane-b').textContent`);
      assert(nb2.includes('"balance": 50'), 'explorer: B shows the new value', nb2.slice(0, 80));
      await c.eval(`clickByText('#lane-a .x-act', 'Check the balance')`);
      await c.eval(`sleepP(400)`);
      const na3 = await c.eval(`document.getElementById('lane-a').textContent`);
      assert(na3.includes('Balance: $50'), 'explorer: credit stays after later move', na3.slice(0, 80));
      await c.eval(`document.getElementById('explorer-reset').click()`);
      const na4 = await c.eval(`document.getElementById('lane-a-who').textContent`);
      assert(na4.includes('Idle'), 'explorer: reset returns to idle', na4);
    }
  ],
  'lessons/0004-the-status-line-names-what-happened.html': [
    async (c) => {
      await c.eval(`clickByText('.verdict-key', 'GET /account/4027')`);
      await c.eval(`clickByText('.verdict-rule', '2xx')`);
      const n1 = await c.eval(`document.getElementById('verdict-note') ? document.getElementById('verdict-note').textContent : ''`);
      const s1 = await c.eval(`document.getElementById('verdict-score') ? document.getElementById('verdict-score').textContent : ''`);
      assert(n1.includes('The reply carries the balance') && s1.includes('1 of 7'),
        'verdict: correct class', n1 + ' | ' + s1);
      await c.eval(`clickByText('.verdict-key', 'GET /account/4042')`);
      await c.eval(`clickByText('.verdict-rule', '2xx')`);
      const n2 = await c.eval(`document.getElementById('verdict-note') ? document.getElementById('verdict-note').textContent : ''`);
      assert(/You named 2xx/.test(n2), 'verdict: wrong class', n2);
      const s2 = await c.eval(`document.getElementById('verdict-score') ? document.getElementById('verdict-score').textContent : ''`);
      assert(s2.includes('1 of 7'), 'verdict: score holds');
    }
  ],
  'lessons/0005-ask-without-harm-repeat-without-doubt.html': [
    async (c) => {
      await c.eval(`clickByText('.chip', 'GET · read the balance')`);
      await c.eval(`clickByText('.ledger-col-name', 'Unsafe')`);
      const p1 = await c.eval(`document.querySelector('.ledger-result').textContent`);
      assert(p1.includes('Placed in Unsafe'), 'ledger05: wrong-sort placement allowed (learning)', p1);
      await c.eval(`clickByText('.ledger-btn', 'Check my sort')`);
      const r1 = await c.eval(`document.querySelector('.ledger-result').textContent`);
      assert(/still in the tray/.test(r1), 'ledger05: check scores partial', r1);
      await c.eval(`clickByText('.ledger-btn', 'Start over')`);
      const facts = await c.eval(`[...document.querySelectorAll('.chip')].map((b) => b.textContent)`);
      assert(facts.length === 6, 'ledger05: reset restores 6 chips');
    },
    async (c) => {
      await c.eval(`clickByText('.kiosk-btn', 'Send: POST /account/4027/pay')`);
      await c.eval(`sleepP(1000)`);
      const sel = await c.eval(`[...document.querySelectorAll('#retry-log-post div')].map((d) => d.textContent)`);
      assert(sel.some((s) => s.includes('connection lost')), 'retry: POST connection lost');
      await c.eval(`clickByText('#retry-keys .kiosk-btn', 'Retry the move')`);
      await c.eval(`sleepP(800)`);
      const out = await c.eval(`document.getElementById('retry-out-post').textContent`);
      assert(out.includes('Two charges'), 'retry: POST doubles the charge', out);
      await c.eval(`clickByText('.kiosk-btn', 'Send: PUT /profile/name')`);
      await c.eval(`sleepP(1000)`);
      await c.eval(`clickByText('#retry-keys .kiosk-btn', 'Retry the move')`);
      await c.eval(`sleepP(800)`);
      const out2 = await c.eval(`document.getElementById('retry-out-put').textContent`);
      assert(out2.includes('changed nothing'), 'retry: PUT changes once', out2);
      const sc = await c.eval(`document.getElementById('retry-score').textContent`);
      assert(sc.includes('POST charged twice · the PUT changed once'), 'retry: final score', sc);
      const st = await c.eval(`document.getElementById('retry-state').textContent`);
      assert(st.includes('recovered'), 'retry: state recovered');
      await c.eval(`document.getElementById('retry-reset').click()`);
      const sc2 = await c.eval(`document.getElementById('retry-score').textContent`);
      assert(sc2.includes('two moves, one connection'), 'retry: reset restores score');
    },
    async (c) => {
      await c.eval(`clickByText('.kiosk-btn', 'Send: POST /account/4027/pay')`);
      await c.eval(`sleepP(100)`);
      await c.eval(`clickByText('.kiosk-btn', 'Send: PUT /profile/name')`);
      await c.eval(`sleepP(1000)`);
      const btnP = await c.eval(`document.getElementById('retry-log-post').textContent`);
      const btnU = await c.eval(`document.getElementById('retry-log-put').textContent`);
      assert(btnP.includes('connection lost') && btnU.includes('connection lost'),
        'retry: interleaved lanes both lose connection', btnP + ' / ' + btnU);
      await c.eval(`clickByText('#retry-keys .kiosk-btn', 'Retry the move')`);
      await c.eval(`sleepP(800)`);
      await c.eval(`clickByText('#retry-keys .kiosk-btn', 'Retry the move')`);
      await c.eval(`sleepP(800)`);
      const outA = await c.eval(`document.getElementById('retry-out-post').textContent`);
      const outB = await c.eval(`document.getElementById('retry-out-put').textContent`);
      assert(outA.includes('Two charges'), 'retry: interleaved POST doubles', outA);
      assert(outB.includes('changed nothing'), 'retry: interleaved PUT keeps', outB);
      await c.eval(`document.getElementById('retry-reset').click()`);
    }
  ],
  'lessons/0006-keep-the-old-copy-ask-if-it-is-still-good.html': [
    async (c) => {
      // First fetch: no stored copy -> 200 with body and ETag v1
      await c.eval(`document.getElementById('cache-fetch').click()`);
      await c.eval(`sleepP(500)`);
      const body1 = await c.eval(`document.getElementById('cache-client-body').textContent`);
      assert(body1.includes('Wind 14'), 'cache: first fetch returns body');
      const tag1 = await c.eval(`document.getElementById('cache-client-tag').textContent`);
      assert(tag1.includes('v1'), 'cache: first fetch stores ETag v1');
      const state1 = await c.eval(`document.getElementById('cache-state').textContent`);
      assert(state1.includes('fresh'), 'cache: first fetch leaves copy fresh', state1);

      // Second fetch: still fresh -> served from cache, no request
      await c.eval(`document.getElementById('cache-fetch').click()`);
      await c.eval(`sleepP(500)`);
      const body2 = await c.eval(`document.getElementById('cache-client-body').textContent`);
      assert(body2.includes('Wind 14'), 'cache: fresh fetch keeps the old copy');
      const log2 = await c.eval(`[...document.querySelectorAll('#cache-log div')].map((d) => d.textContent).join(' ')`);
      assert(log2.includes('served from cache'), 'cache: fresh fetch serves from cache');
      const reqs2 = await c.eval(`[...document.querySelectorAll('#cache-log div.req')].length`);
      assert(reqs2 === 1, 'cache: fresh fetch sends no request', String(reqs2));

      // Let an hour pass: copy turns stale by age alone
      await c.eval(`document.getElementById('cache-aging').click()`);
      const state3 = await c.eval(`document.getElementById('cache-state').textContent`);
      assert(state3.includes('stale'), 'cache: hour pass makes copy stale', state3);
      const staleBox3 = await c.eval(`document.getElementById('cache-client-box').classList.contains('stale')`);
      assert(staleBox3 === true, 'cache: stale box marked on age');

      // Third fetch: stale + unchanged server -> 304, keeps copy, back to fresh
      await c.eval(`document.getElementById('cache-fetch').click()`);
      await c.eval(`sleepP(500)`);
      const body3 = await c.eval(`document.getElementById('cache-client-body').textContent`);
      assert(body3.includes('Wind 14'), 'cache: 304 keeps the old copy');
      const log3 = await c.eval(`[...document.querySelectorAll('#cache-log div')].map((d) => d.textContent).join(' ')`);
      assert(log3.includes('304'), 'cache: stale fetch returns 304');
      const state3b = await c.eval(`document.getElementById('cache-state').textContent`);
      assert(state3b.includes('fresh'), 'cache: 304 refreshes age to fresh', state3b);

      // Let an hour pass again, then change server state
      await c.eval(`document.getElementById('cache-aging').click()`);
      await c.eval(`document.getElementById('cache-change').click()`);
      const srvTag = await c.eval(`document.getElementById('server-tag').textContent`);
      assert(srvTag.includes('v2'), 'cache: change rotates to v2');

      // Fourth fetch: stale + mismatch -> 200 with new body
      await c.eval(`document.getElementById('cache-fetch').click()`);
      await c.eval(`sleepP(500)`);
      const body4 = await c.eval(`document.getElementById('cache-client-body').textContent`);
      assert(body4.includes('Rain'), 'cache: mismatched stale fetch gets v2 body');
      const tag4 = await c.eval(`document.getElementById('cache-client-tag').textContent`);
      assert(tag4.includes('v2'), 'cache: v2 body stored with tag v2');
      const log4 = await c.eval(`[...document.querySelectorAll('#cache-log div')].map((d) => d.textContent).join(' ')`);
      assert(log4.includes('200 OK'), 'cache: mismatch earns 200');

      // Reset: clears state
      await c.eval(`document.getElementById('cache-reset').click()`);
      const tagReset = await c.eval(`document.getElementById('cache-client-tag').textContent`);
      assert(tagReset.includes('no copy'), 'cache: reset clears stored copy');
      const stateReset = await c.eval(`document.getElementById('cache-state').textContent`);
      assert(stateReset.includes('no stored copy'), 'cache: reset resets state');
    }
  ]
};

// ---------- main ----------
const srv = serve();
const base = `http://127.0.0.1:${srv.port}/`;

try {
  let chrome;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      chrome = await launchChrome();
      if (chrome) break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`chrome launch attempt ${attempt} failed (${err.message.split('\n')[0]}); retrying`);
      await sleep(800);
    }
  }
  const { client, close } = chrome;
  try {
    const inject =
      `window.clickByText = (sel, text) => {
        const found = [...document.querySelectorAll(sel)].find((el) =>
          el.textContent.trim().startsWith(text));
        if (!found) throw new Error('no element ' + sel + ' starts with ' + JSON.stringify(text));
        found.focus();
        found.click();
      }; window.sleepP = (ms) => new Promise((r) => setTimeout(r, ms)); true;`;

    for (const page of PAGES) {
      console.log(`\n== ${page}`);
      await goto(client, base + page);
      await client.eval(inject);
      const bad = await client.eval(probes.noUlRoleGroup);
      assert(bad.length === 0, `${page}: no ul[role=group]`, bad.join(', '));
      const inMain = await client.eval(probes.progressInMain);
      assert(inMain !== false, `${page}: #progress inside main`, String(inMain));
      if (WIDGETS[page]) {
        for (const walker of WIDGETS[page]) await walker(client);
      }
    }

    console.log('\n== axe scans (after reveal)');
    // reveal everything: emulate reduced motion already shows .reveal fully
    for (const page of PAGES) {
      await goto(client, base + page);
      await scanAxe(client, page);
    }
  } finally {
    close();
  }
} finally {
  srv.stop();
}

console.log(`\nwidgets: ${pending} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('\nFAILURES');
  for (const f of failures) console.error(`  - ${f.label}${f.detail ? `: ${f.detail}` : ''}`);
  process.exit(1);
}