// Shared page effects, as on the Framer site (podvoiska.com):
// 1. Content fades and slides up 40px the first time it scrolls into view (once).
// 2. A progressive blur strip fixed to the bottom of the screen.
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

  /* ---------- bottom blur: 8 layers, each blurring twice as much and masked to its own band ---------- */
  const blur = document.createElement('div');
  blur.className = 'bottom-blur';
  blur.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 8; i++) {
    const layer = document.createElement('div');
    const amount = `blur(${0.234375 * 2 ** i}px)`;
    const s = 12.5 * i;
    const mask = `linear-gradient(to bottom, transparent ${s}%, #000 ${s + 12.5}%, #000 ${s + 25}%, transparent ${s + 37.5}%)`;
    layer.style.cssText = `backdrop-filter:${amount};-webkit-backdrop-filter:${amount};mask-image:${mask};-webkit-mask-image:${mask}`;
    blur.appendChild(layer);
  }
  document.body.appendChild(blur);
})();
