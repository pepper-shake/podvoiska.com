// Shared page effects, as on the Framer site (podvoiska.com):
// 1. Content fades and slides up 40px the first time it scrolls into view (once).
// 2. Progressive blur strips fixed to the bottom and the top of the screen.
// 3. Every page: the header is pinned in front of the top blur; both hide on scroll down and return on scroll up.
// Load after any script that adds content (e.g. slider.js adds the slider buttons).
(() => {
  /* ---------- reveal on scroll ---------- */
  const targets = document.querySelectorAll('.grid > .card, .project__head, .project__body > *');
  const io = new IntersectionObserver((entries) => {
    // things that appear together (e.g. a row of cards) come in one after another
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      e.target.style.setProperty('--dl', `${0.1 + i * 0.08}s`);
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  targets.forEach((el) => io.observe(el));

  /* ---------- progressive blur strips: 8 layers, each blurring twice as much and masked to its own band ---------- */
  // to = the edge where the blur is strongest ('bottom' or 'top')
  const blurStrip = (className, to) => {
    const strip = document.createElement('div');
    strip.className = className;
    strip.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 8; i++) {
      const layer = document.createElement('div');
      const amount = `blur(${0.234375 * 2 ** i}px)`;
      const s = 12.5 * i;
      const mask = `linear-gradient(to ${to}, transparent ${s}%, #000 ${s + 12.5}%, #000 ${s + 25}%, transparent ${s + 37.5}%)`;
      layer.style.cssText = `backdrop-filter:${amount};-webkit-backdrop-filter:${amount};mask-image:${mask};-webkit-mask-image:${mask}`;
      strip.appendChild(layer);
    }
    document.body.appendChild(strip);
    return strip;
  };
  blurStrip('bottom-blur', 'bottom');
  blurStrip('top-blur', 'top');

  /* ---------- header (name, nav / ✕): visible on load, slides away while scrolling down, back on any scroll up ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const root = document.documentElement;
    let lastY = scrollY;
    // only scrolling the visitor does counts; the browser restoring the scroll position on reload doesn't hide it
    let byUser = false;
    const user = () => { byUser = true; };
    ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach((t) => addEventListener(t, user, { passive: true }));
    addEventListener('scroll', () => { // scroll events already fire at most once per frame
      const y = Math.max(0, scrollY);
      const dy = y - lastY;
      if (!byUser) { lastY = y; return; }
      if (Math.abs(dy) < 6) return; // ignore tiny jitters (trackpad, rubber-banding)
      root.classList.toggle('header-hidden', dy > 0 && y > 20 && !header.contains(document.activeElement));
      lastY = y;
    }, { passive: true });
    // tabbing into the header brings it back
    header.addEventListener('focusin', () => root.classList.remove('header-hidden'));
  }
})();
