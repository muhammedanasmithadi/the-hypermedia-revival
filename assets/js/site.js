// chrome: reading progress + section scrollspy, reveal-on-scroll.
// Runs once when a widget module imports it.

const progress = document.getElementById('progress');
const cur = document.getElementById('cur-section');

if (progress && cur) {
  const doc = document.documentElement;
  const onScroll = () => {
    const h = doc.scrollHeight - window.innerHeight;
    const p = h > 0 ? doc.scrollTop / h : 0;
    progress.style.width = `${(p * 100).toFixed(1)}%`;
    progress.setAttribute('aria-valuenow', (p * 100).toFixed(1));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  const sec = document.querySelector('.section[id]');
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
}

const els = document.querySelectorAll('.reveal');
const show = (el) => { el.inert = false; el.classList.add('in'); };
if (!('IntersectionObserver' in window) ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
  els.forEach(show);
} else {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        show(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0 });
  els.forEach((el) => { el.inert = true; obs.observe(el); });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTicker(options) {
  const {
    widget,
    interval,
    onStep
  } = options;
  if (!widget) return null;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  let timer = null;
  let interacted = false;
  let inView = false;

  const arm = () => { interacted = true; if (inView) play(); };
  document.addEventListener('pointerdown', arm, { once: true, passive: true });
  document.addEventListener('keydown', arm, { once: true });
  document.addEventListener('touchstart', arm, { once: true, passive: true });

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function play() {
    if (timer || !interacted) return;
    timer = setInterval(onStep, interval);
  }

  widget.addEventListener('pointerenter', stop);
  widget.addEventListener('pointerleave', play);
  widget.addEventListener('focusin', stop);
  widget.addEventListener('focusout', play);
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        inView = e.isIntersecting;
        if (e.isIntersecting) play(); else stop();
      });
    }, { threshold: 0.3 });
    obs.observe(widget);
  } else {
    play();
  }

  return { stop, play };
}