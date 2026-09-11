import './site.js';
import { createTicker, sleep } from './site.js';

// kiosk · a card terminal, hypermedia in miniature
const el = document.getElementById('kiosk');
if (el) {
  const title = document.getElementById('kiosk-title');
  const msg = document.getElementById('kiosk-msg');
  const note = document.getElementById('kiosk-note');
  const keys = document.getElementById('kiosk-keys');
  const bal = document.getElementById('kiosk-balance');
  const label = document.getElementById('kiosk-state-label');
  let balance = 40;

  const text = (v) => (typeof v === 'function' ? v() : v);
  const setBal = () => { bal.textContent = `balance: $${balance}`; };

  const states = {
    welcome: {
      key: 'welcome',
      title: 'Card payment terminal',
      msg: 'This little machine shows you the moves of the moment, and refuses a choice it cannot keep.',
      buttons: [{ label: 'Insert card', next: 'pin' }]
    },
    pin: {
      key: 'pin',
      title: 'Enter your PIN',
      msg: 'It reads only what it needs, and only in this state.',
      buttons: [{ label: 'OK · PIN correct', next: 'menu' }]
    },
    menu: {
      key: 'menu',
      title: 'Select an action',
      msg: () => `You have $${balance}. Your options follow from that.`,
      buttons: [
        { label: 'Check balance', next: 'balance' },
        {
          label: 'Withdraw $50',
          next: () => (balance >= 50 ? 'amount50' : 'low'),
          note: () => (balance >= 50 ? null : `The machine refused: you only have $${balance}.`)
        },
        { label: 'Deposit $10', next: 'deposit' },
        { label: 'Remove card', next: 'bye' }
      ]
    },
    balance: {
      key: 'balance',
      title: 'Your balance',
      msg: () => `You have $${balance}. That is all this screen has to say.`,
      buttons: [{ label: 'Back to menu', next: 'menu' }]
    },
    low: {
      key: 'refused',
      title: 'Not this time',
      msg: () => `You asked for $50, but the state allows $${balance}. The $50 move stays on the menu; it goes through only once the balance covers it.`,
      buttons: [
        { label: 'Withdraw $20', next: 'amount20' },
        { label: 'Deposit first', next: 'deposit' },
        { label: 'Back to menu', next: 'menu' }
      ]
    },
    amount50: {
      key: 'dispensing',
      title: 'Dispensing $50',
      msg: 'The state allowed this one. Take the money.',
      buttons: [{
        label: 'Take cash',
        next: 'after',
        leave: () => { balance -= 50; },
        note: () => `You now have $${balance}.`
      }]
    },
    amount20: {
      key: 'dispensing',
      title: 'Dispensing $20',
      msg: 'The state allowed this one. Take the money.',
      buttons: [{
        label: 'Take cash',
        next: 'after',
        leave: () => { balance -= 20; },
        note: () => `You now have $${balance}.`
      }]
    },
    after: {
      key: 'done',
      title: 'Done',
      msg: () => `Your balance is now $${balance}. Your options just changed.`,
      buttons: [{ label: 'Back to menu', next: 'menu' }]
    },
    deposit: {
      key: 'deposit',
      title: 'Deposit $10',
      msg: 'The menu rebuilds itself on the new balance.',
      buttons: [
        {
          label: 'Add the money',
          next: 'menu',
          leave: () => { balance += 10; },
          note: () => balance >= 50
            ? `Menu rebuilt: $${balance}. Withdraw $50 now goes through.`
            : `Menu rebuilt: $${balance}. Withdraw $50 still refuses until the balance allows.`
        },
        { label: 'Cancel', next: 'menu' }
      ]
    },
    bye: {
      key: 'goodbye',
      title: 'Take your card',
      msg: 'Goodbye. The machine never let you close the account. That move was not in any menu.',
      buttons: [{ label: 'Use it again', next: 'welcome', leave: () => { balance = 40; } }]
    }
  };

  const flash = (str) => {
    note.textContent = str;
    note.classList.add('show');
  };

  const act = (b) => {
    note.textContent = '';
    note.classList.remove('show');
    const keepFocus = document.activeElement &&
      (keys.contains(document.activeElement) ||
       document.activeElement.id === 'kiosk-reset');
    if (b.leave) b.leave();
    setBal();
    const next = typeof b.next === 'function' ? b.next() : b.next;
    const s = states[next];
    label.textContent = s.key;
    title.textContent = s.title;
    msg.textContent = text(s.msg);
    keys.textContent = '';
    s.buttons.forEach((btn) => {
      const tag = document.createElement('button');
      tag.className = 'kiosk-btn';
      tag.type = 'button';
      tag.textContent = btn.label;
      tag.addEventListener('click', () => { act(btn); });
      keys.appendChild(tag);
    });
    if (b.note) flash(text(b.note));
    if (keepFocus) {
      const firstBtn = keys.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }
  };

  act({ next: 'welcome' });
  document.getElementById('kiosk-reset').addEventListener('click', () => {
    act({ next: 'welcome', leave: () => { balance = 40; } });
  });
}

// experiment · json reply vs document reply
const exp = document.getElementById('exp');
if (exp) {
  const body = document.getElementById('x-body');
  const note = document.getElementById('x-reqnote');
  const btns = Array.from(document.querySelectorAll('.x-mode-btn'));
  let mode = 'json';
  let seq = 0;

  const docMarkup = () => `<div class="x-doc">
    <div class="x-doc-title">Bank of Documents</div>
    <div class="x-doc-bal">Balance: $40</div>
    <div class="x-actions">
      <button class="x-act" type="button" data-act="Deposit">Deposit</button>
      <button class="x-act" type="button" data-act="Statement">Statement</button>
      <button class="x-act" type="button" data-act="Close">Close</button>
    </div>
    <div class="x-status" aria-live="polite"></div>
  </div>`;

  const waiting = () => {
    body.innerHTML = '<div class="x-pane"><div class="x-type">no request yet</div>' +
      '<p>Choose a reply type to send the request.</p></div>';
  };

  const bindActs = (scope) => {
    scope.querySelectorAll('.x-act').forEach((b) => {
      b.addEventListener('click', () => {
        b.closest('.x-doc').querySelector('.x-status').textContent =
          `${b.getAttribute('data-act')} received · the server renders the next document`;
      });
    });
  };

  const renderReply = () => {
    if (mode === 'json') {
      body.innerHTML = '<div class="x-pane"><div class="x-type">application/json</div>' +
        '<div class="x-pre">{ "balance": 40 }</div>' +
        '<p class="x-note">One fact. No controls. A client that receives this must already know the moves.</p></div>';
    } else {
      body.innerHTML = '<div class="x-pane"><div class="x-type">text/html</div>' +
        docMarkup() +
        '<p class="x-note">Controls came with the fact. The document names its own next moves.</p></div>';
    }
    bindActs(body);
  };

  const send = async () => {
    const mine = ++seq;
    note.textContent = 'sending…';
    body.innerHTML = '<div class="x-pane"><div class="x-type">in transit</div>' +
      '<div class="x-sending">GET /account/balance …</div></div>';
    await sleep(320);
    if (mine !== seq) return;
    note.textContent = `→ 200 OK · ${mode === 'json' ? 'application/json' : 'text/html'}`;
    renderReply();
  };

  btns.forEach((b) => {
    b.addEventListener('click', () => {
      btns.forEach((x) => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      mode = b.getAttribute('data-mode');
      send();
    });
  });

  waiting();
}

// loop · the hypermedia loop, one step at a time
const loopTray = document.getElementById('loop-steps');
const loopCap = document.getElementById('loop-caption');
const loopWidget = document.getElementById('loop');
if (loopTray && loopCap && loopWidget) {
  const steps = [
    { t: 'Request', s: 'user picks a control', c: 'The user clicks a link or a button. The browser turns that control into a request to the server.' },
    { t: 'Document', s: 'facts + controls', c: 'The server reads the current state and answers with one document: the facts, and the controls those facts allow.' },
    { t: 'Choice', s: 'user selects a move', c: 'The user picks one of the controls in the document. That pick becomes the next request.' },
    { t: 'Next document', s: 'server advances state', c: 'The server advances its state and answers with a fresh document. The loop repeats from Request.' }
  ];
  let cur = 0;

  const paint = () => {
    const nodes = loopTray.querySelectorAll('.loop-step');
    nodes.forEach((node, i) => {
      node.classList.toggle('on', i === cur);
    });
    loopCap.textContent = steps[cur].c;
  };

  const ticker = createTicker({
    widget: loopWidget,
    interval: 1800,
    onStep: () => {
      cur = (cur + 1) % steps.length;
      paint();
    }
  });
  if (ticker) paint();
}