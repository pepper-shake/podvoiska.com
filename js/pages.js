// Image carousel used on every project page: one endless row that scrolls sideways.
// Markup: <div class="pages [pages--wide]" data-pages [data-start="1"]><div class="pages__track"> <figure class="pages__item">…</figure> … </div></div>
// - Every image has the same height; widths follow the images (pages--wide: 966×528 slides, Figma size).
// - data-start: which image (0-based) sits at the start of the text column on load.
// - Native horizontal scroll: trackpad, touch swipe, shift + wheel; snaps to the start of each page.
// - Endless: the pages are copied on both sides; once scrolling settles, the row jumps by exactly one
//   set to the same picture in the middle copy, so it never runs out in either direction.
// - Mouse drag, ← → buttons (added here, same look as the slider controls), arrow keys when focused.
// - The bar between the buttons shows where you are within one round of pages.
(() => {
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8.333M8.333 12l4-4-4-4"/></svg>';
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  document.querySelectorAll('[data-pages]').forEach((pages) => {
    const track = pages.querySelector('.pages__track');
    const originals = [...track.children];
    const n = originals.length;
    if (n < 2) return;

    // one copy before and one after the real pages
    const clone = (el) => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c; };
    originals.slice().reverse().forEach((el) => track.prepend(clone(el)));
    originals.forEach((el) => track.append(clone(el)));
    const items = [...track.children];

    const controls = document.createElement('div');
    controls.className = 'slider__controls';
    controls.innerHTML = `
      <button class="slider__btn slider__btn--prev" type="button" aria-label="Previous page">${arrow}</button>
      <div class="slider__bar" aria-hidden="true"><span class="slider__progress"></span></div>
      <button class="slider__btn slider__btn--next" type="button" aria-label="Next page">${arrow}</button>`;
    pages.after(controls);
    const progress = controls.querySelector('.slider__progress');
    progress.style.transition = 'none';

    // scroll position of each page = its left edge minus the track's start padding
    const pad = () => parseFloat(getComputedStyle(track).paddingLeft);
    const stops = () => items.map((el) => el.offsetLeft - track.offsetLeft - pad());
    const setWidth = () => items[n].offsetLeft - items[0].offsetLeft; // one full round of pages, gaps included

    // keep the view inside the middle copy: jump by one set, which shows exactly the same picture
    const recenter = () => {
      const w = setWidth();
      if (track.scrollLeft < w * 0.5) track.scrollLeft += w;
      else if (track.scrollLeft >= w * 1.5) track.scrollLeft -= w;
    };

    const go = (dir) => {
      recenter();
      const x = track.scrollLeft;
      const list = stops();
      const target = dir > 0 ? list.find((s) => s > x + 2) : list.reverse().find((s) => s < x - 2);
      track.scrollTo({ left: target, behavior: smooth });
    };
    controls.querySelector('.slider__btn--prev').addEventListener('click', () => go(-1));
    controls.querySelector('.slider__btn--next').addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    // progress within one round: the bar wraps around with the pages
    const paint = () => {
      const w = setWidth();
      const visible = Math.min(1, track.clientWidth / w);
      const d = Math.round(track.scrollLeft - stops()[n]); // rounded, so sub-pixel offsets don't wrap to the end
      const off = ((d % w) + w) % w;
      const pos = w - off < 2 ? 0 : off / w;
      progress.style.width = `${visible * 100}%`;
      progress.style.transform = `translateX(${pos * (1 / visible - 1) * 100}%)`;
    };

    // recenter once scrolling has settled (scrollend where supported, otherwise a short pause)
    let dragging = false, settle;
    const settled = () => { if (!dragging) { recenter(); paint(); } };
    track.addEventListener('scroll', () => {
      paint();
      clearTimeout(settle);
      settle = setTimeout(settled, 150);
    }, { passive: true });
    track.addEventListener('scrollend', settled);

    // start on the first real page (or data-start), in line with the text column; on resize stay on the same page
    let current = n + ((Number(pages.dataset.start) || 0) % n);
    const nearestIndex = () => {
      const x = track.scrollLeft;
      return stops().reduce((best, s, i, all) => (Math.abs(s - x) < Math.abs(all[best] - x) ? i : best), 0);
    };
    track.addEventListener('scroll', () => { current = nearestIndex(); }, { passive: true });
    const place = () => { track.scrollLeft = stops()[current]; recenter(); paint(); };
    place();
    new ResizeObserver(place).observe(track);

    // mouse drag (touch and trackpads already scroll natively)
    let startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      recenter();
      dragging = true; moved = false;
      startX = e.clientX; startLeft = track.scrollLeft;
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.classList.add('is-dragging');
        try { track.setPointerCapture(e.pointerId); } catch {}
      }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      // let snapping settle on the nearest page once the drag ends
      const x = track.scrollLeft;
      track.classList.remove('is-dragging');
      track.scrollLeft = x;
      const nearest = stops().reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
      track.scrollTo({ left: nearest, behavior: smooth });
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
  });
})();
