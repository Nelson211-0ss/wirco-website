// WIRCO site interactions
(function () {
  // Header: transparent over the hero, solid once the page scrolls
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 120);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Start hero/banner photos just below the blue announcement bar, so no faces sit behind it
  const topbar = document.querySelector('.topbar');
  const setTopbarH = () => topbar && document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
  setTopbarH();
  window.addEventListener('resize', setTopbarH);

  // Story filters (Stories page)
  const filterBtns = document.querySelectorAll('.filter');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    filterBtns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); });
    document.querySelectorAll('.story[data-cat]').forEach(card => {
      card.classList.toggle('is-hidden', cat !== 'all' && card.dataset.cat !== cat);
    });
  }));

  // Mobile menu
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.menu');
  const backdrop = document.querySelector('.menu-backdrop');
  const isOpen = () => menu.classList.contains('open');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    if (backdrop) backdrop.classList.toggle('show', open);
    document.body.classList.toggle('menu-locked', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', e => { e.stopPropagation(); setMenu(!isOpen()); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  // Close when tapping anywhere outside the menu (including the dimmed backdrop)
  if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
  document.addEventListener('click', e => {
    if (isOpen() && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000 && isOpen()) setMenu(false); });

  // Donation amount chips
  document.querySelectorAll('.amounts').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.amount');
      if (!btn) return;
      group.querySelectorAll('.amount').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  // Count-up numbers
  const countUp = el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1800;
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal, bars, progress and counters when in view
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in');
      if (el.dataset.count) countUp(el);
      if (el.dataset.height) el.style.height = el.dataset.height;
      if (el.dataset.width) el.style.width = el.dataset.width;
      io.unobserve(el);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal, [data-count], [data-height], [data-width]').forEach(el => io.observe(el));

  // Duplicate testimonials for a seamless loop
  const track = document.querySelector('.track');
  if (track) {
    track.innerHTML += track.innerHTML;
    [...track.children].slice(track.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true'));
  }

  // Hero slider
  const slider = document.querySelector('.hero-slider');
  if (slider) {

    const bgs = slider.querySelectorAll('.hero-slide');
    const texts = slider.querySelectorAll('.hero-text');
    const dots = slider.querySelectorAll('.hero-dot');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DELAY = 6000;
    const counter = slider.querySelector('.hero-current');
    const bar = slider.querySelector('.hero-progress i');
    slider.style.setProperty('--hero-delay', DELAY + 'ms');
    let current = 0, timer = null;

    const runBar = () => {
      if (!bar || reduceMotion) return;
      bar.classList.remove('run');
      void bar.offsetWidth; // restart the animation
      bar.classList.add('run');
    };

    const go = i => {
      current = (i + bgs.length) % bgs.length;
      if (counter) counter.textContent = String(current + 1).padStart(2, '0');
      runBar();
      [bgs, texts, dots].forEach(list => list.forEach((el, n) => el.classList.toggle('is-active', n === current)));
      texts.forEach((t, n) => t.setAttribute('aria-hidden', n === current ? 'false' : 'true'));
      texts.forEach((t, n) => t.querySelectorAll('a').forEach(a => a.tabIndex = n === current ? 0 : -1));
    };
    const start = () => { if (!reduceMotion) { stop(); timer = setInterval(() => go(current + 1), DELAY); } };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };

    slider.querySelector('.next').addEventListener('click', () => { go(current + 1); restart(); });
    slider.querySelector('.prev').addEventListener('click', () => { go(current - 1); restart(); });
    dots.forEach((d, n) => d.addEventListener('click', () => { go(n); restart(); }));

    // Pause while hovered or focused, and when the tab is hidden
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', () => { start(); runBar(); });
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    // Keyboard arrows
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { go(current + 1); restart(); }
      if (e.key === 'ArrowLeft') { go(current - 1); restart(); }
    });

    // Touch swipe
    let x0 = null;
    slider.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { go(current + (dx < 0 ? 1 : -1)); restart(); }
      x0 = null;
    });

    go(0);
    start();
  }

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
