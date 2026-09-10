
(function chrome() {
  const progress = document.getElementById('progress');
  const cur = document.getElementById('cur-section');
  const doc = document.documentElement;

  function onScroll() {
    const h = doc.scrollHeight - window.innerHeight;
    const p = h > 0 ? doc.scrollTop / h : 0;
    progress.style.width = `${(p * 100).toFixed(1)}%`;
    progress.setAttribute('aria-valuenow', (p * 100).toFixed(1));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  const sec = document.getElementById('the-machine-that-prints-its-own-manual');
  if (sec && 'IntersectionObserver' in window) {
    const k = sec.querySelector('.section-head .kicker');
    const h = sec.querySelector('.section-head h2');
    cur.textContent = `${k ? `${k.textContent} · ` : ''}${h ? h.childNodes[0].textContent.trim() : ''}`;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        cur.classList.toggle('is-active', e.isIntersecting);
      });
    }, { threshold: 0.05 });
    obs.observe(sec);
  }
})();

(function reveal() {
  const els = document.querySelectorAll('.reveal');
  function show(el) { el.inert = false; el.classList.add('in'); }
  if (!('IntersectionObserver' in window) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    els.forEach(show);
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        show(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0 });
  els.forEach((el) => { el.inert = true; obs.observe(el); });
})();

(function kiosk() {
  const el = document.getElementById('kiosk');
  if (!el) return;
  const title = document.getElementById('kiosk-title');
  const msg = document.getElementById('kiosk-msg');
  const note = document.getElementById('kiosk-note');
  const keys = document.getElementById('kiosk-keys');
  const bal = document.getElementById('kiosk-balance');
  const label = document.getElementById('kiosk-state-label');
  let balance = 40;
  const pending = 0;

  function text(v) { return typeof v === 'function' ? v() : v; }
  function setBal() { bal.textContent = 'balance: $' + balance; }

  function flash(str) {
    note.textContent = str;
    note.classList.add('show');
  }

  function act(b) {
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
  }

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
      msg: () => { return `You have $${balance}. Your options follow from that.`; },
      buttons: [
        { label: 'Check balance', next: 'balance' },
        { label: 'Withdraw $50', next: () => { return balance >= 50 ? 'amount50' : 'low'; },
          note: () => { return balance >= 50 ? null : `The machine refused: you only have $${balance}.`; } },
        { label: 'Deposit $10', next: 'deposit' },
        { label: 'Remove card', next: 'bye' }
      ]
    },
    balance: {
      key: 'balance',
      title: 'Your balance',
      msg: () => { return `You have $${balance}. That is all this screen has to say.`; },
      buttons: [{ label: 'Back to menu', next: 'menu' }]
    },
    low: {
      key: 'refused',
      title: 'Not this time',
      msg: () => { return `You asked for $50, but the state allows $${balance}. The $50 move stays on the menu; it goes through only once the balance covers it.`; },
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
      buttons: [{ label: 'Take cash',
        next: 'after',
        leave: () => { balance -= 50; },
        note: () => { return `You now have $${balance}.`; } }]
    },
    amount20: {
      key: 'dispensing',
      title: 'Dispensing $20',
      msg: 'The state allowed this one. Take the money.',
      buttons: [{ label: 'Take cash',
        next: 'after',
        leave: () => { balance -= 20; },
        note: () => { return `You now have $${balance}.`; } }]
    },
    after: {
      key: 'done',
      title: 'Done',
      msg: () => { return `Your balance is now $${balance}. Your options just changed.`; },
      buttons: [{ label: 'Back to menu', next: 'menu' }]
    },
    deposit: {
      key: 'deposit',
      title: 'Deposit $10',
      msg: 'The menu rebuilds itself on the new balance.',
      buttons: [
        { label: 'Add the money',
          next: 'menu',
          leave: () => { balance += 10; },
          note: () => { return balance >= 50 ? `Menu rebuilt: $${balance}. Withdraw $50 now goes through.` : `Menu rebuilt: $${balance}. Withdraw $50 still refuses until the balance allows.`; } },
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

  act({ next: 'welcome' });
  document.getElementById('kiosk-reset').addEventListener('click', () => {
    act({ next: 'welcome', leave: () => { balance = 40; } });
  });
})();

(function experiment() {
  const el = document.getElementById('exp');
  if (!el) return;
  const body = document.getElementById('x-body');
  const note = document.getElementById('x-reqnote');
  const btns = Array.from(document.querySelectorAll('.x-mode-btn'));
  let mode = 'json';
  let timer = null;

  function bindActs(scope) {
    scope.querySelectorAll('.x-act').forEach((b) => {
      b.addEventListener('click', () => {
        b.parentNode.parentNode.querySelector('.x-status').textContent =
          `${b.getAttribute('data-act')} received · the server renders the next document`;
      });
    });
  }

  function docMarkup() {
    return '<div class="x-doc">' +
      '<div class="x-doc-title">Bank of Documents</div>' +
      '<div class="x-doc-bal">Balance: $40</div>' +
      '<div class="x-actions">' +
      '<button class="x-act" type="button" data-act="Deposit">Deposit</button>' +
      '<button class="x-act" type="button" data-act="Statement">Statement</button>' +
      '<button class="x-act" type="button" data-act="Close">Close</button>' +
      '</div>' +
      '<div class="x-status" aria-live="polite"></div>' +
      '</div>';
  }

  function waiting() {
    body.innerHTML = '<div class="x-pane"><div class="x-type">no request yet</div>' +
      '<p>Choose a reply type to send the request.</p></div>';
  }

  function renderReply() {
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
  }

  function send() {
    note.textContent = 'sending…';
    body.innerHTML = '<div class="x-pane"><div class="x-type">in transit</div>' +
      '<div class="x-sending">GET /account/balance …</div></div>';
    clearTimeout(timer);
    timer = setTimeout(() => {
      note.textContent = '→ 200 OK · ' + (mode === 'json' ? 'application/json' : 'text/html');
      renderReply();
    }, 320);
  }

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
})();

(function loop() {
  const steps = [
    { t: 'Request', s: 'user picks a control', c: 'The user clicks a link or a button. The browser turns that control into a request to the server.' },
    { t: 'Document', s: 'facts + controls', c: 'The server reads the current state and answers with one document: the facts, and the controls those facts allow.' },
    { t: 'Choice', s: 'user selects a move', c: 'The user picks one of the controls in the document. That pick becomes the next request.' },
    { t: 'Next document', s: 'server advances state', c: 'The server advances its state and answers with a fresh document. The loop repeats from Request.' }
  ];
  const tray = document.getElementById('loop-steps');
  const cap = document.getElementById('loop-caption');
  const widget = document.getElementById('loop');
  let cur = 0;
  let timer = null;
  let interacted = false;
  let inView = false;
  function arm() { interacted = true; if (inView) play(); }
  document.addEventListener('pointerdown', arm, { once: true, passive: true });
  document.addEventListener('keydown', arm, { once: true });
  document.addEventListener('touchstart', arm, { once: true, passive: true });
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!tray || !cap || reduced) return;

  function paint() {
    const nodes = tray.querySelectorAll('.loop-step');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle('on', i === cur);
    }
    cap.textContent = steps[cur].c;
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function play() {
    if (timer || reduced || !interacted) return;
    timer = setInterval(() => {
      cur = (cur + 1) % steps.length;
      paint();
    }, 1800);
  }

  paint();
  widget.addEventListener('pointerenter', stop);
  widget.addEventListener('pointerleave', play);
  widget.addEventListener('focusin', stop);
  widget.addEventListener('focusout', play);
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        inView = e.isIntersecting;
        e.isIntersecting ? play() : stop();
      });
    }, { threshold: 0.3 });
    obs.observe(widget);
  } else {
    play();
  }
})();

