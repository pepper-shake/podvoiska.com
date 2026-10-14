// Image slider for project pages (Figma: Concepts / Gen AI Illustrations, API Playground).
// Markup: <div class="slider [slider--peek]" data-slider [data-start="1"]>
//           <div class="slider__track"> <figure class="slider__slide">…</figure> … </div>
//         </div>
// - Endless: slides are cloned on both sides, so it never rewinds from the last slide to the first.
// - Moves with a smooth ease; the incoming image settles from a slight zoom while it brightens.
// - Drag / swipe with mouse or touch, click an image, ← → buttons (added here), arrow keys when focused.
(() => {
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8.333M8.333 12l4-4-4-4"/></svg>';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const track = slider.querySelector('.slider__track');
    const originals = [...track.children];
    const n = originals.length;
    if (n < 2) return;

    // rail = the moving row inside the track; clones of all slides on each side make it endless
    const rail = document.createElement('div');
    rail.className = 'slider__rail';
    const clone = (el) => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('img').forEach((i) => { i.loading = 'lazy'; }); return c; };
    originals.forEach((el) => rail.appendChild(clone(el)));
    originals.forEach((el) => rail.appendChild(el));
    originals.forEach((el) => rail.appendChild(clone(el)));
    track.appendChild(rail);
    const slides = [...rail.children];

    // controls
    const controls = document.createElement('div');
    controls.className = 'slider__controls';
    controls.innerHTML = `
      <button class="slider__btn slider__btn--prev" type="button" aria-label="Previous slide">${arrow}</button>
      <div class="slider__bar" aria-hidden="true"><span class="slider__progress"></span></div>
      <button class="slider__btn slider__btn--next" type="button" aria-label="Next slide">${arrow}</button>`;
    slider.after(controls);
    const progress = controls.querySelector('.slider__progress');
    progress.style.width = `${100 / n}%`;

    let index = n + (Number(slider.dataset.start) || 0); // position on the rail (middle copy = real slides)
    const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
    const real = (i) => ((i - n) % n + n) % n;

    const setX = (x, animate) => {
      rail.classList.toggle('is-moving', animate && !reduce);
      rail.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    const paint = () => {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      progress.style.transform = `translateX(${real(index) * 100}%)`;
    };
    const go = (i, animate = true) => {
      index = i;
      setX(-index * step(), animate);
      paint();
    };

    // after a move lands on a clone, swap to the identical real slide without animation
    rail.addEventListener('transitionend', (e) => {
      if (e.target !== rail || e.propertyName !== 'transform') return;
      rail.classList.remove('is-moving');
      if (index < n || index >= 2 * n) {
        const target = n + real(index);
        slides.forEach((s) => s.classList.add('no-anim'));
        go(target, false);
        rail.offsetWidth; // apply instantly
        slides.forEach((s) => s.classList.remove('no-anim'));
      }
    });

    const prev = () => go(index - 1);
    const next = () => go(index + 1);
    controls.querySelector('.slider__btn--prev').addEventListener('click', prev);
    controls.querySelector('.slider__btn--next').addEventListener('click', next);
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });

    // drag / swipe
    let startX = 0, startY = 0, dx = 0, t0 = 0, dragging = false, horizontal = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true; horizontal = null; dx = 0;
      startX = e.clientX; startY = e.clientY; t0 = performance.now();
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const mx = e.clientX - startX, my = e.clientY - startY;
      if (horizontal === null && Math.abs(mx) + Math.abs(my) > 6) {
        horizontal = Math.abs(mx) > Math.abs(my);
        if (horizontal) { try { track.setPointerCapture(e.pointerId); } catch {} track.classList.add('is-dragging'); }
      }
      if (!horizontal) return;
      dx = mx;
      // a little resistance makes the drag feel heavier than the pointer
      setX(-index * step() + dx * 0.9, false);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (!horizontal) return;
      const v = dx / Math.max(1, performance.now() - t0); // px per ms
      const far = Math.abs(dx) > step() * 0.18 || Math.abs(v) > 0.45;
      go(far ? index - Math.sign(dx) : index);
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    // a drag shouldn't count as a click on anything inside the slider
    track.addEventListener('click', (e) => { if (Math.abs(dx) > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    // click an image: a neighbour slides into the middle, the active one moves on to the next
    track.addEventListener('click', (e) => {
      const i = slides.indexOf(e.target.closest('.slider__slide'));
      if (i < 0) return;
      go(i === index ? index + 1 : i);
    });
    track.addEventListener('dragstart', (e) => e.preventDefault());

    // keep the active slide in place whenever the slider changes size (window resize, orientation, fonts…)
    new ResizeObserver(() => go(index, false)).observe(track);
    addEventListener('resize', () => go(index, false));
    go(index, false);
  });
})();
