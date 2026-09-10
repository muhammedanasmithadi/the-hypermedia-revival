
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

  const sec = document.getElementById('ask-without-harm-repeat-without-doubt');
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

(function methods() {
  const PHASES = [
    { cols: ['Safe', 'Unsafe'], wants: ['s', 'u'], prompt: 'Which methods may never change state?' },
    { cols: ['Idempotent', 'Not idempotent'], wants: ['y', 'n'], prompt: 'Which methods may repeat with the same effect?' }
  ];
  const FACTS = [
    { txt: 'GET · read the balance', harm: 's', rep: 'y' },
    { txt: 'HEAD · ask for the headers only', harm: 's', rep: 'y' },
    { txt: 'OPTIONS · ask what the server allows', harm: 's', rep: 'y' },
    { txt: 'POST · create or pay', harm: 'u', rep: 'n' },
    { txt: 'PUT · replace a named resource', harm: 'u', rep: 'y' },
    { txt: 'DELETE · remove a named resource', harm: 'u', rep: 'y' }
  ];
  const root = document.getElementById('methods');
  if (!root) return;
  const head = root.querySelector('.ledger-head');
  const cols = root.querySelectorAll('.ledger-col');
  const uls = root.querySelectorAll('.ledger-col ul');
  let pool, check, advance, again, res;
  let selected = null;
  let phase = 0;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function chipFor(f) {
    const li = document.createElement('li');
    li.className = 'ledger-item';
    li.dataset.side = phase === 0 ? f.harm : f.rep;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = f.txt;
    li.chip = b;
    b.addEventListener('click', () => {
      li.classList.remove('ok', 'bad');
      if (li.parentNode === pool) {
        if (selected) selected.classList.remove('selected');
        selected = li;
        li.classList.add('selected');
        root.classList.add('sorting');
      } else {
        clearSel();
        pool.appendChild(li);
        root.classList.remove('sorting');
      }
    });
    li.appendChild(b);
    return li;
  }

  function clearSel() {
    if (selected) selected.classList.remove('selected');
    selected = null;
  }

  function clearErrAll() {
    root.querySelectorAll('.ledger-item').forEach((li) => {
      li.classList.remove('ok', 'bad');
    });
  }

  function placeInto(col) {
    if (!selected || selected.parentNode !== pool) return;
    selected.classList.remove('selected');
    col.querySelector('ul').appendChild(selected);
    res.textContent = `Placed in ${col.querySelector('.ledger-col-name').textContent}.`;
    selected.chip.focus();
    selected = null;
    root.classList.remove('sorting');
  }

  function render() {
    clearSel();
    clearErrAll();
    root.classList.remove('sorting');
    uls.forEach((ul) => { ul.innerHTML = ''; });
    pool.innerHTML = '';
    shuffle(FACTS).forEach((f) => { pool.appendChild(chipFor(f)); });
    res.textContent = PHASES[phase].prompt;
  }

  pool = document.createElement('ul');
  pool.className = 'ledger-pool';
  pool.setAttribute('role', 'group');
  pool.setAttribute('aria-label', 'Methods to sort: select one, then choose a row');
  cols[0].parentNode.insertBefore(pool, cols[0]);

  cols.forEach((col) => {
    col.setAttribute('tabindex', '0');
    col.setAttribute('role', 'group');
    col.setAttribute('aria-label', `${col.querySelector('.ledger-col-name').textContent} row`);
    col.addEventListener('click', () => { placeInto(col); });
    col.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        placeInto(col);
      }
    });
  });

  const bar = document.createElement('div');
  bar.className = 'ledger-controls';
  check = document.createElement('button');
  check.type = 'button';
  check.className = 'ledger-btn primary';
  check.textContent = 'Check my sort';
  advance = document.createElement('button');
  advance.type = 'button';
  advance.className = 'ledger-btn';
  advance.textContent = 'Now sort by repeatability';
  advance.hidden = true;
  again = document.createElement('button');
  again.type = 'button';
  again.className = 'ledger-btn';
  again.textContent = 'Start over';
  res = document.createElement('div');
  res.className = 'ledger-result';
  res.setAttribute('aria-live', 'polite');
  bar.appendChild(check);
  bar.appendChild(advance);
  bar.appendChild(again);
  root.appendChild(bar);
  root.appendChild(res);

  const hint = document.createElement('span');
  hint.className = 'ledger-hint';
  hint.textContent = 'select a method, then choose a row (click or Enter)';
  head.appendChild(hint);

  function setPhase(p) {
    phase = p;
    const ph = PHASES[p];
    cols.forEach((col, i) => {
      col.querySelector('.ledger-col-name').textContent = ph.cols[i];
      col.setAttribute('aria-label', `${ph.cols[i]} row`);
    });
    res.textContent = ph.prompt;
  }

  check.addEventListener('click', () => {
    let placed = 0, right = 0;
    const wants = PHASES[phase].wants;
    for (let u = 0; u < uls.length; u++) {
      const want = wants[u];
      uls[u].querySelectorAll('li').forEach((li) => {
        placed++;
        const ok = li.dataset.side === want;
        right += ok ? 1 : 0;
        li.classList.toggle('ok', ok);
        li.classList.toggle('bad', !ok);
      });
    }
    if (placed === 0) {
      res.textContent = 'Place the methods first.';
      return;
    }
    if (right === FACTS.length && placed === FACTS.length) {
      if (phase === 0) {
        res.textContent = '6 of 6. Safe and unsafe, told apart. Now sort by repeatability.';
        advance.hidden = false;
      } else {
        res.textContent = '6 of 6. Idempotent and not, told apart.';
      }
    } else {
      res.textContent = `${right} of ${FACTS.length} right; ${FACTS.length - placed} still in the tray.`;
    }
  });

  advance.addEventListener('click', () => {
    advance.hidden = true;
    setPhase(1);
    render();
  });

  again.addEventListener('click', () => {
    advance.hidden = true;
    setPhase(0);
    render();
  });

  setPhase(0);
  render();
})();

(function replay() {
  const root = document.getElementById('retry');
  if (!root) return;
  const keys = document.getElementById('retry-keys');
  const reset = document.getElementById('retry-reset');
  const score = document.getElementById('retry-score');
  const state = document.getElementById('retry-state');
  const logs = {
    post: document.getElementById('retry-log-post'),
    put: document.getElementById('retry-log-put')
  };
  const outs = {
    post: document.getElementById('retry-out-post'),
    put: document.getElementById('retry-out-put')
  };

  const LANES = [
    {
      id: 'post',
      req: 'POST /account/4027/pay',
      body: 'amount=20',
      lost: 'connection lost. the server may have answered before it fell.',
      reply: '204 No Content. The bank charges again.',
      done: 'Two charges on the account. The repeat doubled the move.',
      kind: 'warn'
    },
    {
      id: 'put',
      req: 'PUT /profile/name',
      body: 'name=Anas',
      lost: 'connection lost. the server may have answered before it fell.',
      reply: '204 No Content. The same name is set again.',
      done: 'One value on the server. The repeat changed nothing.',
      kind: 'ok'
    }
  ];

  let finished = 0;
  let stateKey = 'standing by';

  function line(log, text) {
    const d = document.createElement('div');
    d.textContent = text;
    log.appendChild(d);
  }

  const lanes = LANES.map((cfg) => {
    const lane = {
      cfg: cfg,
      log: logs[cfg.id],
      out: outs[cfg.id],
      timer: null,
      step: 0,
      btn: document.createElement('button')
    };
    lane.btn.type = 'button';
    lane.btn.className = 'kiosk-btn';
    lane.btn.textContent = `Send: ${cfg.req}`;
    lane.btn.addEventListener('click', () => {
      if (lane.step === 0) {
        line(lane.log, `> ${cfg.req}  body ${cfg.body}`);
        lane.btn.disabled = true;
        lane.step = 1;
        lane.timer = setTimeout(() => {
          line(lane.log, cfg.lost);
          lane.btn.disabled = false;
          lane.btn.textContent = 'Retry the move';
          lane.step = 2;
        }, 900);
      } else if (lane.step === 2) {
        line(lane.log, `> ${cfg.req}  body ${cfg.body}  (retry)`);
        lane.btn.disabled = true;
        lane.step = 3;
        lane.timer = setTimeout(() => {
          line(lane.log, cfg.reply);
          lane.out.textContent = cfg.done;
          lane.out.className = `lane-outcome ${cfg.kind}`;
          lane.step = 4;
          lane.btn.textContent = 'Done';
          finished += 1;
          if (finished === LANES.length) {
            stateKey = 'recovered, differently';
            state.textContent = stateKey;
            score.textContent = 'the POST charged twice · the PUT changed once';
          }
        }, 700);
      }
    });
    keys.appendChild(lane.btn);
    return lane;
  });

  reset.addEventListener('click', () => {
    lanes.forEach((lane) => {
      clearTimeout(lane.timer);
      lane.log.innerHTML = '';
      lane.out.textContent = '';
      lane.out.className = 'lane-outcome';
      lane.btn.disabled = false;
      lane.btn.textContent = `Send: ${lane.cfg.req}`;
      lane.step = 0;
    });
    finished = 0;
    stateKey = 'standing by';
    state.textContent = stateKey;
    score.textContent = 'two moves, one connection';
  });
})();
