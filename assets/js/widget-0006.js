import './site.js';
import { sleep } from './site.js';

const root = document.getElementById('cache');
if (root) {
  const fetchBtn = document.getElementById('cache-fetch');
  const changeBtn = document.getElementById('cache-change');
  const ageBtn = document.getElementById('cache-aging');
  const resetBtn = document.getElementById('cache-reset');
  const serverTag = document.getElementById('server-tag');
  const serverBody = document.getElementById('server-body');
  const clientTag = document.getElementById('cache-client-tag');
  const clientBody = document.getElementById('cache-client-body');
  const clientBox = document.getElementById('cache-client-box');
  const logEl = document.getElementById('cache-log');
  const stateEl = document.getElementById('cache-state');
  const metaEl = document.getElementById('cache-meta');

  const DOCS = {
    v1: 'Wind 14 km/h, from the west. Clouds pass.',
    v2: 'Wind 68 km/h, from the north. Rain reaches the coast.'
  };

  const SERVER = 'metric.example';
  const URI = '/document';
  const MAX_AGE = 3600;

  let serverEt = 'v1';
  let clientEt = null;
  let clientTxt = null;
  let age = 0;
  let seq = 0;
  let busy = false;

  const line = (text, cls) => {
    const d = document.createElement('div');
    d.textContent = text || '\u00a0';
    d.className = `cache-line ${cls || ''}`;
    logEl.appendChild(d);
  };

  const renderServer = () => {
    serverTag.textContent = `ETag "${serverEt}"`;
    serverBody.textContent = DOCS[serverEt];
  };

  const renderClient = () => {
    if (clientEt) {
      clientTag.textContent = `ETag "${clientEt}"`;
      clientBody.textContent = clientTxt;
      clientBox.classList.remove('gone');
      const stale = age >= MAX_AGE;
      clientBox.classList.toggle('stale', stale);
    } else {
      clientTag.textContent = 'no copy';
      clientBody.textContent = '\u2014';
      clientBox.classList.remove('stale');
      clientBox.classList.add('gone');
    }
  };

  const renderState = () => {
    if (!clientEt) {
      stateEl.textContent = 'no stored copy';
      metaEl.textContent = 'stored copy: none';
      return;
    }
    const stale = age >= MAX_AGE;
    stateEl.textContent = `stored copy: ETag "${clientEt}" \u00b7 ${stale ? 'stale' : 'fresh'}`;
    metaEl.textContent = `stored copy: ETag "${clientEt}" \u00b7 age ${age}s of ${MAX_AGE}s \u00b7 ${stale ? 'stale' : 'fresh'}`;
  };

  const setBusy = (v) => {
    busy = v;
    fetchBtn.disabled = v;
    changeBtn.disabled = v;
    ageBtn.disabled = v;
  };

  // --- Fetch the document ---
  fetchBtn.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    const mine = ++seq;

    if (clientEt && age < MAX_AGE) {
      line('(served from cache, no request)', 'note');
      line(`The stored copy stays fresh for ${MAX_AGE - age} more seconds.`, 'note');
      renderClient();
      setBusy(false);
      renderState();
      return;
    }

    line(`> GET ${URI} HTTP/1.1`, 'req');
    line(`  Host: ${SERVER}`, 'hdr');
    if (clientEt) {
      line(`  If-None-Match: "${clientEt}"`, 'hdr');
    }
    line('', 'blank');

    await sleep(350);
    if (mine !== seq) { setBusy(false); return; }

    if (clientEt && clientEt === serverEt && age >= MAX_AGE) {
      line(`< HTTP/1.1 304 Not Modified`, 'res kept');
      line(`  ETag: "${serverEt}"`, 'hdr');
      line('', 'blank');
      line('Your stored copy is still good. No body sent.', 'note');
      age = 0;
      renderClient();
      setBusy(false);
      renderState();
    } else {
      line(`< HTTP/1.1 200 OK`, 'res fresh');
      line(`  Content-Type: text/plain`, 'hdr');
      line(`  Cache-Control: max-age=${MAX_AGE}`, 'hdr');
      line(`  ETag: "${serverEt}"`, 'hdr');
      line('', 'blank');
      line(DOCS[serverEt], 'body');
      clientEt = serverEt;
      clientTxt = DOCS[serverEt];
      age = 0;
      renderClient();
      setBusy(false);
      renderState();
    }
  });

  // --- Let an hour pass ---
  ageBtn.addEventListener('click', () => {
    if (busy) return;
    if (!clientEt) {
      line('Store a copy first. Then its age can rise.', 'note');
      return;
    }
    const mine = ++seq;
    line('', 'blank');
    line('An hour passes. The stored copy ages.', 'note');
    age = MAX_AGE;
    renderClient();
    renderState();
  });

  // --- Change the server state ---
  changeBtn.addEventListener('click', () => {
    if (busy) return;
    const mine = ++seq;
    line('', 'blank');
    line('Server state changed.', 'note');

    serverEt = serverEt === 'v1' ? 'v2' : 'v1';
    renderServer();
    renderClient();
    renderState();
  });

  // --- Reset ---
  resetBtn.addEventListener('click', () => {
    seq += 1;
    serverEt = 'v1';
    clientEt = null;
    clientTxt = null;
    age = 0;
    logEl.innerHTML = '';
    renderServer();
    renderClient();
    renderState();
    setBusy(false);
  });

  renderServer();
  renderClient();
  renderState();
}