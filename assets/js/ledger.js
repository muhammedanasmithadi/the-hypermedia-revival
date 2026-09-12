// Shared ledger widget: sort chips into rows, check the sort.
// Used by 0002 (one phase) and 0005 (two phases).

export function createLedger(root, config) {
  const {
    facts,
    sideOf,          // (item, phase) => side string
    phases,          // [{ cols, wants, prompt }]
    checkLabel = 'Check my sort',
    againLabel = 'Start over',
    advanceLabel = null,
    hint = '',
    poolLabel = '',
    emptyMessage,    // (phase) => string
    resultMessage    // (phase, {right, placed, total}) => string
  } = config;

  const colsWrap = root.querySelector('.ledger-cols');
  const head = root.querySelector('.ledger-head');
  if (!root || !colsWrap || !head) return;
  const cols = [...colsWrap.querySelectorAll('.ledger-col')];
  const uls = cols.map((col) => col.querySelector('ul'));
  if (cols.length === 0 || uls.some((u) => !u)) return;

  let phaseIdx = 0;
  let selected = null;
  let check, advance, again, pool, res;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function chipFor(f) {
    const li = document.createElement('li');
    li.className = 'ledger-item';
    li.dataset.side = sideOf(f, phaseIdx);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = f.txt;
    b.setAttribute('aria-pressed', 'false');
    li.chip = b;
    b.addEventListener('click', () => {
      li.classList.remove('ok', 'bad');
      if (li.parentNode === pool) {
        if (selected) selected.classList.remove('selected');
        selected = li;
        li.classList.add('selected');
        b.setAttribute('aria-pressed', 'true');
        root.classList.add('sorting');
      } else {
        if (selected) return;
        clearSel();
        pool.appendChild(li);
        root.classList.remove('sorting');
      }
    });
    li.appendChild(b);
    return li;
  }

  function clearSel() {
    if (selected) {
      selected.classList.remove('selected');
      selected.chip.setAttribute('aria-pressed', 'false');
    }
    selected = null;
  }

  function placeInto(col) {
    if (!selected || selected.parentNode !== pool) return;
    selected.classList.remove('selected');
    selected.chip.setAttribute('aria-pressed', 'false');
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
    res.textContent = phases[phaseIdx].prompt;
  }

  function setPhase(p) {
    phaseIdx = p;
    const ph = phases[p];
    if (ph.cols) {
      cols.forEach((col, i) => {
        const name = ph.cols[i];
        col.querySelector('.ledger-col-name').textContent = name;
        col.setAttribute('aria-label', `${name} row`);
      });
    }
  }

  pool = document.createElement('ul');
  pool.className = 'ledger-pool';
  pool.setAttribute('role', 'list');
  pool.setAttribute('aria-label', poolLabel);
  colsWrap.parentNode.insertBefore(pool, colsWrap);

  cols.forEach((col) => {
    col.setAttribute('tabindex', '0');
    col.setAttribute('role', 'group');
    col.setAttribute('aria-label', `Place the selected card in the ${col.querySelector('.ledger-col-name').textContent} row`);
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
  check.textContent = checkLabel;
  bar.appendChild(check);
  if (advanceLabel) {
    advance = document.createElement('button');
    advance.type = 'button';
    advance.className = 'ledger-btn';
    advance.textContent = advanceLabel;
    advance.hidden = true;
    bar.appendChild(advance);
  }
  again = document.createElement('button');
  again.type = 'button';
  again.className = 'ledger-btn';
  again.textContent = againLabel;
  bar.appendChild(again);

  root.appendChild(bar);

  res = document.createElement('div');
  res.className = 'ledger-result';
  res.setAttribute('aria-live', 'polite');
  root.appendChild(res);

  const hintEl = document.createElement('span');
  hintEl.className = 'ledger-hint';
  hintEl.textContent = hint;
  head.appendChild(hintEl);

  check.addEventListener('click', () => {
    let placed = 0;
    let right = 0;
    const wants = phases[phaseIdx].wants;
    uls.forEach((ul, u) => {
      const want = wants[u];
      ul.querySelectorAll('li').forEach((li) => {
        placed++;
        const ok = li.dataset.side === want;
        right += ok ? 1 : 0;
        li.classList.toggle('ok', ok);
        li.classList.toggle('bad', !ok);
      });
    });
    if (placed === 0) {
      res.textContent = emptyMessage(phaseIdx);
      return;
    }
    const total = facts.length;
    res.textContent = resultMessage(phaseIdx, { right, placed, total });
    if (advance && right === total && placed === total && phaseIdx < phases.length - 1) {
      advance.hidden = false;
    }
  });

  if (advance) {
    advance.addEventListener('click', () => {
      advance.hidden = true;
      setPhase(phaseIdx + 1);
      render();
      const first = pool.querySelector('.chip');
      if (first) first.focus();
    });
  }

  again.addEventListener('click', () => {
    if (advance) advance.hidden = true;
    setPhase(0);
    render();
    const first = pool.querySelector('.chip');
    if (first) first.focus();
  });

  setPhase(0);
  render();
}