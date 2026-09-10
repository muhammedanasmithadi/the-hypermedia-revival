
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

  const sec = document.getElementById('two-architectures-on-the-same-table');
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

(function explorer() {
  const root = document.getElementById('explorer');
  if (!root) return;
  const laneA = document.getElementById('lane-a');
  const laneB = document.getElementById('lane-b');
  const whoA = document.getElementById('lane-a-who');
  const whoB = document.getElementById('lane-b-who');
  const note = document.getElementById('explorer-note');
  const night = document.getElementById('explorer-night');
  const reset = document.getElementById('explorer-reset');
  const acts = Array.from(root.querySelectorAll('.explorer-act'));
  let phase = 'idle';
  let timer = null;

  const MOVES = [
    { v: 'Check the balance', act: 'balance' },
    { v: 'Pay the bill', act: 'pay' },
    { v: 'View the receipt', act: 'receipt' }
  ];

  function docMenu(extra) {
    return MOVES.concat(extra || []).map((m) => {
      return `<button class="x-act${m.fresh ? ' fresh' : ''}" type="button" data-act="${m.act}">${m.v}</button>`;
    }).join('');
  }

  function jsonFor(act) {
    if (act === 'balance') return '{ "balance": 40 }';
    if (act === 'pay') return '{ "status": "paid" }';
    if (act === 'receipt') return '{ "receipt": "R-4027-1" }';
    return '{ "credit": "applied" }';
  }

  function bindLaneA() {
    laneA.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => { act(b.getAttribute('data-act')); });
    });
  }

  function paneA(extra) {
    return `<div class="x-doc">` +
      `<div class="x-doc-title">Account 4027 · bank of documents</div>` +
      `<div class="x-doc-bal">Balance: $40</div>` +
      `<div class="x-actions">${docMenu(extra)}</div></div>`;
  }

  function paneB(json) {
    return `<div class="x-type">application/json</div>` +
      `<div class="x-pre">${json}</div>` +
      `<div class="xt-app">` +
      `<div class="xt-app-name">the app, drawn from the build</div>` +
      `<div class="xt-app-menu">${MOVES.map((m) => {
        return `<span class="xt-app-btn">${m.v}</span>`;
      }).join('')}</div></div>`;
  }

  function whoNorm(act) {
    if (act === 'pay') {
      return ['The reply carried the paid bill, and its own moves.', 'The reply carried the status line, and no moves.'];
    }
    if (act === 'receipt') {
      return ['The reply named the moves again, inside the document.', 'The app drew the menu again, from its build.'];
    }
    return ['The reply named three next moves.', 'The reply named no moves. The app drew them from its build.'];
  }

  function setNight() {
    laneA.innerHTML = paneA([{ v: 'Apply the $10 credit', act: 'credit', fresh: true }]);
    laneB.innerHTML = paneB('{ "balance": 40, "credit": 10 }');
    bindLaneA();
    whoA.textContent = 'The server typed a new move into the reply. No build was needed.';
    whoB.textContent = 'The payload carried the value, not the move. The app still draws the old menu.';
  }

  function waiting() {
    laneA.innerHTML = '<div class="x-sending">sending…</div>';
    laneB.innerHTML = '<div class="x-sending">sending…</div>';
    whoA.textContent = '';
    whoB.textContent = '';
  }

  function act(a) {
    if (timer) clearTimeout(timer);
    note.textContent = '';
    waiting();
    timer = setTimeout(() => {
      if (a === 'night') {
        phase = 'night';
        night.hidden = true;
        setNight();
        note.textContent = 'A night passed. A $10 credit became legal. Building A shipped it in the reply; Building B waits for a release.';
        return;
      }
      if (phase === 'night') {
        setNight();
        return;
      }
      if (phase === 'idle') {
        phase = 'active';
        night.hidden = false;
      }
      laneA.innerHTML = paneA();
      laneB.innerHTML = paneB(jsonFor(a));
      bindLaneA();
      const w = whoNorm(a);
      whoA.textContent = w[0];
      whoB.textContent = w[1];
    }, 320);
  }

  function idle() {
    if (timer) clearTimeout(timer);
    phase = 'idle';
    night.hidden = true;
    note.textContent = '';
    laneA.innerHTML = '<p class="xt-wait">The document will name the moves in the reply.</p>';
    laneB.innerHTML = '<p class="xt-wait">The app will draw the moves from its build.</p>';
    whoA.textContent = 'Idle. Click a move to see who names it.';
    whoB.textContent = 'Idle. Click a move to see who names it.';
  }

  acts.forEach((b) => {
    b.addEventListener('click', () => { act(b.getAttribute('data-act')); });
  });
  night.addEventListener('click', () => { act('night'); });
  reset.addEventListener('click', idle);
  idle();
})();

