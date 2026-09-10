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

  const sec = document.getElementById('how-the-idea-got-lost');
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

(function timeline() {
  const steps = [
    { c: 'The next move is unowned: anyone may carry it, or not.' },
    { c: 'The document carries the next move; a link reads itself.' },
    { c: 'REST puts a name on it: controls must travel with the facts.' },
    { c: 'AJAX moves the next move into the client\'s code.' },
    { c: 'The phone carries its own apps; the document stops being the only screen.' },
    { c: 'The contract takes the next move out of the document.' }
  ];
  const widget = document.getElementById('timeline');
  const cap = document.getElementById('timeline-caption');
  const replay = document.getElementById('timeline-replay');
  const REST = 'As the years pass, a note under each entry names who held the next move.';
  let i = -1;
  let timer = null;
  let interacted = false;
  let inView = false;
  function arm() { interacted = true; if (inView) play(); }
  document.addEventListener('pointerdown', arm, { once: true, passive: true });
  document.addEventListener('keydown', arm, { once: true });
  document.addEventListener('touchstart', arm, { once: true, passive: true });
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!widget || !cap || reduced) return;

  function render() {
    const nodes = widget.querySelectorAll('li');
    for (let n = 0; n < nodes.length; n++) {
      nodes[n].classList.toggle('on', n === i);
    }
    cap.textContent = i >= 0 ? steps[i].c : REST;
  }

  function stop() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function tick() {
    i = (i + 1) % steps.length;
    render();
    timer = setTimeout(tick, 2400);
  }

  function play() {
    if (timer || !interacted) return;
    tick();
  }

  widget.addEventListener('pointerenter', stop);
  widget.addEventListener('pointerleave', play);
  widget.addEventListener('focusin', stop);
  widget.addEventListener('focusout', play);
  if (replay) {
    replay.addEventListener('click', () => {
      i = -1;
      stop();
      render();
      play();
    });
  }
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        inView = e.isIntersecting;
        if (e.isIntersecting) {
          play();
        } else {
          stop();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(widget);
  } else {
    play();
  }
})();

(function ledger() {
  const root = document.getElementById('ledger');
  const head = root && root.querySelector('.ledger-head');
  const cols = root && root.querySelector('.ledger-cols');
  const uls = cols ? cols.querySelectorAll('.ledger-col ul') : [];
  const facts = [];
  let pool, check, again, res;
  let selected = null;
  if (!root || !head || !cols || uls.length < 2) return;

  uls[0].querySelectorAll('li').forEach((li) => {
    facts.push({ txt: li.textContent.trim(), side: 'n' });
  });
  uls[1].querySelectorAll('li').forEach((li) => {
    facts.push({ txt: li.textContent.trim(), side: 'f' });
  });
  uls[2].querySelectorAll('li').forEach((li) => {
    facts.push({ txt: li.textContent.trim(), side: 'c' });
  });
  uls.forEach((ul) => { ul.innerHTML = ''; });

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
    li.dataset.side = f.side;
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

  function placeInto(col) {
    if (!selected || selected.parentNode !== pool) return;
    selected.classList.remove('selected');
    col.querySelector('ul').appendChild(selected);
    res.textContent = `Placed in ${col.querySelector('.ledger-col-name').textContent}.`;
    selected.chip.focus();
    selected = null;
    root.classList.remove('sorting');
  }

  function clearErrAll() {
    root.querySelectorAll('.ledger-item').forEach((li) => {
      li.classList.remove('ok', 'bad');
    });
  }

  function render() {
    clearSel();
    clearErrAll();
    root.classList.remove('sorting');
    uls.forEach((ul) => { ul.innerHTML = ''; });
    pool.innerHTML = '';
    shuffle(facts).forEach((f) => { pool.appendChild(chipFor(f)); });
    res.textContent = '';
  }

  pool = document.createElement('ul');
  pool.className = 'ledger-pool';
  pool.setAttribute('role', 'group');
  pool.setAttribute('aria-label', 'Reasons to sort: select one, then choose a row');
  cols.parentNode.insertBefore(pool, cols);

  cols.querySelectorAll('.ledger-col').forEach((col) => {
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
  again = document.createElement('button');
  again.type = 'button';
  again.className = 'ledger-btn';
  again.textContent = 'Start over';
  res = document.createElement('div');
  res.className = 'ledger-result';
  res.setAttribute('aria-live', 'polite');
  bar.appendChild(check);
  bar.appendChild(again);
  root.appendChild(bar);
  root.appendChild(res);

  const hint = document.createElement('span');
  hint.className = 'ledger-hint';
  hint.textContent = 'select a reason, then choose a row (click or Enter)';
  head.appendChild(hint);

  check.addEventListener('click', () => {
    let placed = 0, right = 0;
    const wants = ['n', 'f', 'c'];
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
    res.textContent = placed === 0
      ? 'Place the reasons first.'
: right === facts.length
          ? `${facts.length} of ${facts.length}. Necessity, fashion, and cost, weighed in the open.`
          : `${right} of ${facts.length} right; ${facts.length - placed} still in the tray.`;
  });

  again.addEventListener('click', render);
  render();
})();