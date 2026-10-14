(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Springs → CSS linear() easings
     Framer describes motion as springs. We simulate each spring and hand
     CSS the curve, so transitions feel the same as on the Framer site.
     ------------------------------------------------------------------ */
  const springCurve = ({ stiffness, damping, mass = 1, duration, bounce }) => {
    let w0, zeta;
    if (duration !== undefined) {
      // Framer "duration + bounce" springs
      zeta = 1 - bounce;
      w0 = Math.log(1000) / (zeta * duration);
    } else {
      w0 = Math.sqrt(stiffness / mass);
      zeta = damping / (2 * Math.sqrt(stiffness * mass));
    }
    const x = (t) => {
      if (zeta < 1) {
        const wd = w0 * Math.sqrt(1 - zeta * zeta);
        return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
      }
      if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      const wd = w0 * Math.sqrt(zeta * zeta - 1);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cosh(wd * t) + (zeta * w0 / wd) * Math.sinh(wd * t));
    };
    // Length: the given duration, or until the spring settles
    let total = duration;
    if (total === undefined) {
      total = 5;
      for (let t = 5; t > 0; t -= 0.01) if (Math.abs(1 - x(t)) > 0.001) { total = t + 0.01; break; }
    }
    const steps = 48;
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(i === steps ? 1 : +x((total * i) / steps).toFixed(4));
    return { easing: `linear(${pts.join(', ')})`, duration: `${total.toFixed(2)}s` };
  };

  if (CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    const springs = {
      hero: { duration: 1.4, bounce: 0.6 },   // wordmark
      sub:  { duration: 1.4, bounce: 0.1 },   // subtitle, clock
      marq: { duration: 1.4, bounce: 0.2 },   // image strip
      sec:  { duration: 2,   bounce: 0.2 },   // section entrances
      head: { stiffness: 210, damping: 30 },  // header drop-in
      menu: { stiffness: 250, damping: 60 },  // menu open/close
      icon: { stiffness: 250, damping: 30 },  // + / × icon
    };
    for (const [name, cfg] of Object.entries(springs)) {
      const { easing, duration } = springCurve(cfg);
      root.style.setProperty(`--e-${name}`, easing);
      root.style.setProperty(`--d-${name}`, duration);
    }
  }

  /* Play load animations on the next frame so the start state paints first */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded')));

  /* Menu */
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* Lisbon clock */
  const clock = document.getElementById('clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  /* Marquee: duplicate the set so the loop is seamless */
  const track = document.querySelector('.marquee__track');
  if (track) {
    const items = [...track.children];
    for (let i = 0; i < 3; i++) items.forEach((li) => track.appendChild(li.cloneNode(true)));
  }

  /* Intro text: split into words that rise in one after another */
  const words = document.querySelector('[data-words]');
  if (words) {
    words.innerHTML = words.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');
  }

  /* Reveal on scroll — fires as soon as any part enters the viewport, once */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0 });
  document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

  /* Count-up numbers */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.dataset.count);
      countIO.unobserve(el);
      if (reduceMotion) { el.textContent = target; return; }
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  /* Services carousel arrows */
  const sTrack = document.querySelector('.services__track');
  const prev = document.querySelector('.services__arrow--prev');
  const next = document.querySelector('.services__arrow--next');
  if (sTrack && prev && next) {
    const cardStep = () => sTrack.querySelector('.service').offsetWidth + 12;
    const sync = () => {
      prev.disabled = sTrack.scrollLeft <= 4;
      next.disabled = sTrack.scrollLeft + sTrack.clientWidth >= sTrack.scrollWidth - 4;
    };
    prev.addEventListener('click', () => sTrack.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
    next.addEventListener('click', () => sTrack.scrollBy({ left: cardStep(), behavior: 'smooth' }));
    sTrack.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
})();
