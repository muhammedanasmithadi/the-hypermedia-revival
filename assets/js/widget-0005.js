import './site.js';
import { sleep } from './site.js';
import { createLedger } from './ledger.js';

// methods · sort the verbs by harm, then by repeatability
const methodsRoot = document.getElementById('methods');
if (methodsRoot) {
  const FACTS = [
    { txt: 'GET · read the balance', harm: 's', rep: 'y' },
    { txt: 'HEAD · ask for the headers only', harm: 's', rep: 'y' },
    { txt: 'OPTIONS · ask what the server allows', harm: 's', rep: 'y' },
    { txt: 'POST · create or pay', harm: 'u', rep: 'n' },
    { txt: 'PUT · replace a named resource', harm: 'u', rep: 'y' },
    { txt: 'DELETE · remove a named resource', harm: 'u', rep: 'y' }
  ];

  createLedger(methodsRoot, {
    facts: FACTS,
    sideOf: (f, phase) => (phase === 0 ? f.harm : f.rep),
    phases: [
      { cols: ['Safe', 'Unsafe'], wants: ['s', 'u'], prompt: 'Which methods may never change state?' },
      { cols: ['Idempotent', 'Not idempotent'], wants: ['y', 'n'], prompt: 'Which methods may repeat with the same effect?' }
    ],
    advanceLabel: 'Now sort by repeatability',
    hint: 'select a method, then choose a row (click or Enter)',
    poolLabel: 'Methods to sort: select one, then choose a row',
    emptyMessage: () => 'Place the methods first.',
    resultMessage: (phase, { right, placed, total }) => right === total && placed === total
      ? phase === 0
        ? '6 of 6. Safe and unsafe, told apart. Now sort by repeatability.'
        : '6 of 6. Idempotent and not, told apart.'
      : `${right} of ${total} right; ${total - placed} still in the tray.`
  });
}

// replay · one wire, two moves, one drop
const retryRoot = document.getElementById('retry');
if (retryRoot) {
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
  let seq = 0;

  const line = (log, text) => {
    const d = document.createElement('div');
    d.textContent = text;
    log.appendChild(d);
  };

  const lanes = LANES.map((cfg) => {
    const lane = {
      cfg,
      log: logs[cfg.id],
      out: outs[cfg.id],
      step: 0,
      btn: document.createElement('button')
    };
    lane.btn.type = 'button';
    lane.btn.className = 'kiosk-btn';
    lane.btn.textContent = `Send: ${cfg.req}`;
    lane.btn.addEventListener('click', async () => {
      const mine = ++seq;
      if (lane.step === 0) {
        line(lane.log, `> ${cfg.req}  body ${cfg.body}`);
        lane.btn.disabled = true;
        lane.step = 1;
        await sleep(900);
        if (mine !== seq) return;
        line(lane.log, cfg.lost);
        lane.btn.disabled = false;
        lane.btn.textContent = 'Retry the move';
        lane.step = 2;
      } else if (lane.step === 2) {
        line(lane.log, `> ${cfg.req}  body ${cfg.body}  (retry)`);
        lane.btn.disabled = true;
        lane.step = 3;
        await sleep(700);
        if (mine !== seq) return;
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
      }
    });
    keys.appendChild(lane.btn);
    return lane;
  });

  reset.addEventListener('click', () => {
    seq += 1;
    lanes.forEach((lane) => {
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
}