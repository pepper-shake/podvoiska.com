// Pages carousel (E-commerce): one row of full-length website designs that scrolls sideways.
// Markup: <div class="pages" data-pages><div class="pages__track"> <figure class="pages__item">…</figure> … </div></div>
// - Native horizontal scroll: trackpad, touch swipe, shift + wheel; snaps to the start of each page.
// - Mouse drag, ← → buttons (added here, same look as the slider controls), arrow keys when focused.
// - The bar between the buttons shows how much is visible and where you are.
(() => {
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8.333M8.333 12l4-4-4-4"/></svg>';
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  document.querySelectorAll('[data-pages]').forEach((pages) => {
    const track = pages.querySelector('.pages__track');
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
    const go = (dir) => {
      const x = track.scrollLeft;
      const list = stops();
      const target = dir > 0 ? list.find((s) => s > x + 2) : list.reverse().find((s) => s < x - 2);
      track.scrollTo({ left: target ?? (dir > 0 ? track.scrollWidth : 0), behavior: smooth });
    };
    controls.querySelector('.slider__btn--prev').addEventListener('click', () => go(-1));
    controls.querySelector('.slider__btn--next').addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    const paint = () => {
      const max = track.scrollWidth - track.clientWidth;
      const visible = track.clientWidth / track.scrollWidth;
      progress.style.width = `${visible * 100}%`;
      progress.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * (1 / visible - 1) * 100 : 0}%)`;
    };
    track.addEventListener('scroll', paint, { passive: true });
    new ResizeObserver(paint).observe(track);
    items.forEach((el) => el.querySelector('img')?.addEventListener('load', paint));
    paint();

    // mouse drag (touch and trackpads already scroll natively)
    let startX = 0, startLeft = 0, dragging = false, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
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
