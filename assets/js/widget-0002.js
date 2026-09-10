import './site.js';
import { createTicker } from './site.js';
import { createLedger } from './ledger.js';

// timeline · the six beats of the move of the next move
const widget = document.getElementById('timeline');
const cap = document.getElementById('timeline-caption');
if (widget && cap) {
  const steps = [
    { c: 'The next move is unowned: anyone may carry it, or not.' },
    { c: 'The document carries the next move; a link reads itself.' },
    { c: 'REST puts a name on it: controls must travel with the facts.' },
    { c: 'AJAX moves the next move into the client\'s code.' },
    { c: 'The phone carries its own apps; the document stops being the only screen.' },
    { c: 'The contract takes the next move out of the document.' }
  ];
  const REST = 'As the years pass, a note under each entry names who held the next move.';
  let i = -1;

  const render = () => {
    const nodes = widget.querySelectorAll('li');
    nodes.forEach((node, n) => {
      node.classList.toggle('on', n === i);
    });
    cap.textContent = i >= 0 ? steps[i].c : REST;
  };

  const ticker = createTicker({
    widget,
    interval: 2400,
    onStep: () => {
      i = (i + 1) % steps.length;
      render();
    }
  });

  const replay = document.getElementById('timeline-replay');
  if (replay) {
    replay.addEventListener('click', () => {
      i = -1;
      ticker && ticker.stop();
      render();
      ticker && ticker.play();
    });
  }

  if (ticker) render();
}

// ledger · the JSON decade, sorted into necessity, fashion, cost
const ledgerRoot = document.getElementById('ledger');
if (ledgerRoot) {
  const wants = ['n', 'f', 'c'];
  const colUls = [...ledgerRoot.querySelectorAll('.ledger-cols .ledger-col ul')];
  const facts = [];
  colUls.forEach((ul, u) => {
    ul.querySelectorAll('li').forEach((li) => {
      facts.push({ txt: li.textContent.trim(), side: wants[u] });
    });
  });

  createLedger(ledgerRoot, {
    facts,
    sideOf: (f) => f.side,
    phases: [{ cols: null, wants, prompt: '' }],
    hint: 'select a reason, then choose a row (click or Enter)',
    poolLabel: 'Reasons to sort: select one, then choose a row',
    emptyMessage: () => 'Place the reasons first.',
    resultMessage: (phase, { right, placed, total }) => right === total && placed === total
      ? `${total} of ${total}. Necessity, fashion, and cost, weighed in the open.`
      : `${right} of ${total} right; ${total - placed} still in the tray.`
  });
}