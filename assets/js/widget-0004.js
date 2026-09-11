import './site.js';

// verdict · name the class, read the status line
const root = document.getElementById('verdict');
if (root) {
  const msg = document.getElementById('verdict-msg');
  const line = document.getElementById('verdict-line');
  const rules = document.getElementById('verdict-rules');
  const note = document.getElementById('verdict-note');
  const keys = document.getElementById('verdict-keys');
  const state = document.getElementById('verdict-state');
  const score = document.getElementById('verdict-score');
  const reset = document.getElementById('verdict-reset');
  const offer = document.getElementById('verdict-offer');

  const REQUESTS = [
    { req: 'GET /account/4027', code: 200, reason: 'OK', kind: 'the request worked', line: 'The reply carries the balance and its moves.' },
    { req: 'POST /account/4027/open', code: 201, reason: 'Created', kind: 'the request worked', line: 'A new resource appeared, and the reply names it.' },
    { req: 'POST /account/4027/pay', code: 204, reason: 'No Content', kind: 'the request worked', line: 'The reply carries no body. The balance changed all the same.' },
    { req: 'POST /account/4027/leave', code: 303, reason: 'See Other', kind: 'look elsewhere', line: 'The answer lives at another URI. The client follows it.' },
    { req: 'GET /account/4027 (stored copy)', code: 304, reason: 'Not Modified', kind: 'keep your stored copy', line: 'Your stored copy is still good. The client keeps it.' },
    { req: 'GET /account/4042', code: 404, reason: 'Not Found', kind: 'the client erred', line: 'The server state holds no such account.' },
    { req: 'GET /account/4027/statement', code: 500, reason: 'Internal Server Error', kind: 'the server erred', line: 'The server broke before it answered.' }
  ];

  const CLASSES = ['2xx', '3xx', '4xx', '5xx'];

  let current = null;
  let named = 0;
  const judged = new Set();

  const buildRules = () => {
    rules.innerHTML = CLASSES.map((c) => {
      return `<button type="button" class="x-mode-btn verdict-rule" data-class="${c[0]}">${c}</button>`;
    }).join('');
    rules.querySelectorAll('.verdict-rule').forEach((b) => {
      b.addEventListener('click', () => { choose(b.getAttribute('data-class')); });
    });
  };

  const buildKeys = () => {
    keys.innerHTML = '';
    REQUESTS.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kiosk-btn verdict-key';
      b.textContent = r.req;
      b.addEventListener('click', () => { pick(i); });
      keys.appendChild(b);
    });
  };

  const keyFor = (i) => keys.querySelectorAll('.verdict-key')[i];

  const clearRules = () => {
    rules.querySelectorAll('.verdict-rule').forEach((b) => {
      b.classList.remove('on');
    });
  };

  const readCount = () => keys.querySelectorAll('.verdict-key.read').length;

  const display = (r) => {
    const fd = String(r.code)[0];
    line.classList.remove('active');
    state.textContent = `${fd}xx · ${r.kind}`;
    line.textContent = `HTTP/1.1 ${r.code} ${r.reason}`;
    offer.hidden = r.code !== 404;
    msg.textContent = readCount() === REQUESTS.length
      ? 'All seven requests have verdicts.'
      : 'Pick the next request, or reread one above.';
    const key = keyFor(current);
    const hit = key.dataset.hit === 'ok';
    note.textContent = hit
      ? r.line
      : `You named ${key.dataset.class}xx. The reply said ${fd}xx: ${r.kind}. ${r.line}`;
  };

  const pick = (i) => {
    current = i;
    keys.querySelectorAll('.verdict-key').forEach((b) => { b.classList.remove('active-key'); });
    const key = keyFor(i);
    key.classList.add('active-key');
    if (key.classList.contains('read')) {
      display(REQUESTS[i]);
      return;
    }
    state.textContent = 'request on the wire';
    line.classList.add('active');
    line.textContent = REQUESTS[i].req;
    note.textContent = '';
    offer.hidden = true;
    msg.textContent = 'Name the class you expect. Then the station reads the verdict.';
  };

  const choose = (first) => {
    if (current === null) {
      note.textContent = 'No request on the wire. The station waits for a request.';
      return;
    }
    const r = REQUESTS[current];
    const key = keyFor(current);
    const fd = String(r.code)[0];
    const wasJudged = key.classList.contains('read');
    const prevHit = wasJudged ? key.dataset.hit === 'ok' : false;
    const hit = fd === first;
    key.classList.remove('read', 'ok', 'bad');
    key.classList.add('read', hit ? 'ok' : 'bad');
    key.dataset.hit = hit ? 'ok' : 'bad';
    key.dataset.class = first;
    if (prevHit !== hit) {
      named += hit ? 1 : -1;
    }
    if (hit && !wasJudged) {
      judged.add(current);
    }
    score.textContent = `you named ${named} of ${REQUESTS.length}`;
    display(r);
  };

  const idle = () => {
    current = null;
    named = 0;
    judged.clear();
    state.textContent = 'welcome';
    line.classList.remove('active');
    line.textContent = '';
    note.textContent = '';
    offer.hidden = true;
    msg.textContent = 'Seven requests wait on the wire. The station reads one and hears the class you name.';
    score.textContent = 'you named 0 of 7';
    clearRules();
    buildKeys();
  };

  buildRules();
  reset.addEventListener('click', idle);
  offer.addEventListener('click', () => { pick(0); });
  idle();
}