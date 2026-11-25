// WIRCO site interactions
(function () {
  // Header: transparent over the hero, solid once the page scrolls
  const header = document.querySelector('.header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 120);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Logo lockup: stretch the full organisation name to exactly the width of "WIRCO SOUTH SUDAN"
  const fitBrand = () => {
    document.querySelectorAll('.brand-text').forEach(box => {
      const top = box.querySelector('strong');
      const line = box.querySelector('span');
      if (!top || !line || line.offsetParent === null) return; // hidden on small phones
      line.style.fontSize = '';
      line.style.letterSpacing = '0px';
      const target = top.getBoundingClientRect().width;
      let width = line.getBoundingClientRect().width;
      if (!target || !width) return;
      // 1) scale the font so the line is close to the target width
      const size = parseFloat(getComputedStyle(line).fontSize) * (target / width);
      line.style.fontSize = Math.min(Math.max(size, 7), 13) + 'px';
      // 2) spread any leftover space evenly between the letters
      width = line.getBoundingClientRect().width;
      const gaps = Math.max(line.textContent.length - 1, 1);
      line.style.letterSpacing = ((target - width) / gaps) + 'px';
      // letter-spacing also adds space after the last letter; pull it back so both edges line up
      line.style.marginRight = (-(target - width) / gaps) + 'px';
    });
  };
  fitBrand();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBrand);
  if (document.fonts) document.fonts.addEventListener('loadingdone', fitBrand);
  window.addEventListener('load', fitBrand);
  window.addEventListener('resize', fitBrand);
  // Re-fit whenever the top line changes size (e.g. when the web font finishes loading)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => requestAnimationFrame(fitBrand));
    document.querySelectorAll('.brand-text strong').forEach(el => ro.observe(el));
  }

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
  window.addEventListener('resize', () => { if (window.innerWidth > 1200 && isOpen()) setMenu(false); });

  // Mega menus
  // Phones/tablets: the arrow button next to Programs / Get involved expands its links
  document.querySelectorAll('.has-mega').forEach(item => {
    const toggle = item.querySelector('.sub-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const open = !item.classList.contains('sub-open');
      document.querySelectorAll('.has-mega.sub-open').forEach(o => {
        if (o !== item) { o.classList.remove('sub-open'); o.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('sub-open', open);
      toggle.setAttribute('aria-expanded', open);
    });
  });
  // Desktop: Escape closes an open mega panel (when opened with the keyboard)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const openMega = document.activeElement && document.activeElement.closest('.has-mega');
    if (openMega && window.innerWidth > 1200) document.activeElement.blur(); // panel closes when focus leaves it
  });

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

  // ---------- Scroll animations ----------
  // 1) Tag content blocks so they animate in (no need to mark every element in the HTML)
  const tag = (selector, ...classes) =>
    document.querySelectorAll(selector).forEach(el => el.classList.add('reveal', ...classes));

  tag('.section-head');
  tag('.split-block .split-media');                         // photo slides in from its side (direction set below)
  tag('.ticks li, .give-list li, .chips .chip, .faq-item, .filters, .result, .stat, .step');
  tag('.grid-2 > *, .grid-3 > *, .grid-4 > *, .grid-5 > *, .quote-grid > *, .contact-cards > *, .mv-grid > *');
  tag('.split > div', 'zoom');

  // Two-column blocks: text comes from the opposite side to the photo
  document.querySelectorAll('.split-block').forEach(block => {
    const media = block.querySelector('.split-media');
    const text = [...block.children].find(c => c !== media && !c.matches('form'));
    const mediaFirst = media && !block.classList.contains('reverse');
    if (media) media.classList.add(mediaFirst ? 'from-left' : 'from-right');
    if (text) text.classList.add('reveal', mediaFirst ? 'from-right' : 'from-left');
  });

  // 2) Photos wipe in
  document.querySelectorAll('.card-img, .split-media, .about-media, .approach-media, .featured')
    .forEach(el => el.classList.add('img-reveal'));

  // 3) Stagger items that sit side by side or in a list
  const staggerGroups = '.grid-2, .grid-3, .grid-4, .grid-5, .steps, .stat-grid, .results, .quote-grid, .contact-cards, .mv-grid, .ticks, .give-list, .chips, .faq > div:last-child, .split';
  document.querySelectorAll(staggerGroups).forEach(group => {
    [...group.children].filter(c => c.classList.contains('reveal')).forEach((child, i) => {
      child.style.setProperty('--d', Math.min(i, 6) * 90 + 'ms');
    });
  });

  // 4) Watch everything and animate when it scrolls into view
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
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal, .img-reveal, .mark, [data-count], [data-height], [data-width]').forEach(el => io.observe(el));

  // Page banners and hero animate on load
  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));

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
