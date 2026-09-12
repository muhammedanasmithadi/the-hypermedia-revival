import './site.js';
import { sleep } from './site.js';

// explorer · the same feature, two architectures on one table
const root = document.getElementById('explorer');
if (root) {
  const laneA = document.getElementById('lane-a');
  const laneB = document.getElementById('lane-b');
  const whoA = document.getElementById('lane-a-who');
  const whoB = document.getElementById('lane-b-who');
  const note = document.getElementById('explorer-note');
  const night = document.getElementById('explorer-night');
  const reset = document.getElementById('explorer-reset');
  const acts = [...root.querySelectorAll('.explorer-act')];
  let phase = 'idle';
  let bal = 40;
  let creditDone = false;
  let seq = 0;

  const MOVES = [
    { v: 'Check the balance', act: 'balance' },
    { v: 'Pay the bill', act: 'pay' },
    { v: 'View the receipt', act: 'receipt' }
  ];

  const docMenu = (extra) => MOVES.concat(extra || []).map((m) => {
    return `<button class="x-act${m.fresh ? ' fresh' : ''}" type="button" data-act="${m.act}">${m.v}</button>`;
  }).join('');

  const jsonFor = (act) => {
    if (act === 'balance') return '{ "balance": 40 }';
    if (act === 'pay') return '{ "status": "paid" }';
    if (act === 'receipt') return '{ "receipt": "R-4027-1" }';
    return '{ "credit": "applied" }';
  };

  const bindLaneA = () => {
    laneA.querySelectorAll('button[data-act]').forEach((b) => {
      b.addEventListener('click', () => { act(b.dataset.act); });
    });
  };

  const paneA = (extra) => `<div class="x-doc">
    <div class="x-doc-title">Account 4027 · bank of documents</div>
    <div class="x-doc-bal">Balance: $${bal}</div>
    <div class="x-actions">${docMenu(extra)}</div>
  </div>`;

  const paneB = (json) => `<div class="x-type">application/json</div>
    <div class="x-pre">${json}</div>
    <div class="xt-app">
      <div class="xt-app-name">the app, drawn from the build</div>
      <div class="xt-app-menu">${MOVES.map((m) => `<span class="xt-app-btn">${m.v}</span>`).join('')}</div>
    </div>`;

  const whoNorm = (act) => {
    if (act === 'pay') {
      return ['The reply carried the paid bill, and its own moves.', 'The reply carried the status line, and no moves.'];
    }
    if (act === 'receipt') {
      return ['The reply named the moves again, inside the document.', 'The app drew the menu again, from its build.'];
    }
    return ['The reply named three next moves.', 'The reply named no moves. The app drew them from its build.'];
  };

  const setNight = () => {
    const extra = creditDone
      ? []
      : [{ v: 'Apply the $10 credit', act: 'credit', fresh: true }];
    laneA.innerHTML = paneA(extra);
    laneB.innerHTML = paneB(`{ "balance": ${bal}, "credit": 10 }`);
    bindLaneA();
    whoA.textContent = creditDone
      ? 'The reply carried the credit and its own moves. The balance shows both.'
      : 'The server typed a new move into the reply. No build was needed.';
    whoB.textContent = creditDone
      ? 'The payload carried the new value. The app applied its own copy.'
      : 'The payload carried the value, not the move. The app still draws the old menu.';
  };

  const waiting = () => {
    laneA.innerHTML = '<div class="x-sending">sending…</div>';
    laneB.innerHTML = '<div class="x-sending">sending…</div>';
    whoA.textContent = '';
    whoB.textContent = '';
  };

  const act = async (a) => {
    const mine = ++seq;
    note.textContent = '';
    waiting();
    await sleep(320);
    if (mine !== seq) return;
    if (a === 'night') {
      phase = 'night';
      night.hidden = true;
      setNight();
      note.textContent = 'A night passed. A $10 credit became legal. Building A shipped it in the reply; Building B waits for a release.';
      return;
    }
    if (phase === 'night') {
      if (a === 'credit') {
        if (creditDone) {
          setNight();
          note.textContent = 'The credit is already in the balance.';
          return;
        }
        bal = 50;
        creditDone = true;
        setNight();
        note.textContent = 'The $10 credit applied. Balance is now $50, named in the reply.';
        return;
      }
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
  };

  const idle = () => {
    seq += 1;
    phase = 'idle';
    bal = 40;
    creditDone = false;
    night.hidden = true;
    note.textContent = '';
    laneA.innerHTML = '<p class="xt-wait">The document will name the moves in the reply.</p>';
    laneB.innerHTML = '<p class="xt-wait">The app will draw the moves from its build.</p>';
    whoA.textContent = 'Idle. Click a move to see who names it.';
    whoB.textContent = 'Idle. Click a move to see who names it.';
  };

  acts.forEach((b) => {
    b.addEventListener('click', () => { act(b.dataset.act); });
  });
  night.addEventListener('click', () => { act('night'); });
  reset.addEventListener('click', idle);
  idle();
}