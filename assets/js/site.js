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

  const secs = document.querySelectorAll('.section[id]');
  if (secs.length && 'IntersectionObserver' in window) {
    const label = (s) => {
      const k = s.querySelector('.section-head .kicker');
      const h = s.querySelector('.section-head h2');
      return `${k ? `${k.textContent} · ` : ''}${h ? h.childNodes[0].textContent.trim() : ''}`;
    };
    const near = new Map();
    secs.forEach((s, i) => near.set(s, i));
    const setActive = (i) => {
      cur.textContent = label(secs[i]);
      cur.classList.add('is-active');
    };
    setActive(0);
    const obs = new IntersectionObserver((entries) => {
      let lowest = null;
      entries.forEach((e) => {
        const i = near.get(e.target);
        if (e.isIntersecting && (lowest === null || i > lowest)) lowest = i;
      });
      if (lowest !== null) {
        setActive(lowest);
      } else {
        cur.classList.remove('is-active');
      }
    }, { threshold: 0.05 });
    secs.forEach((s) => obs.observe(s));
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
  els.forEach((el) => { el.classList.add('will-reveal'); el.inert = true; obs.observe(el); });
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