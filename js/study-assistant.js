// Study assistant card: the AI-writer editor split between light and dark theme.
// Plays the 7s light → dark → light wipe on a loop (CSS keyframes in css/style.css).
// Markup source: animations/study-assistant/index.html
(() => {
  const ASSETS = 'animations/study-assistant/assets';
  const text = 'Humans have always been driven by an insatiable curiosity to explore the unknown, from charting distant oceans to climbing the highest mountains. But what lies beyond our planet offers perhaps the most alluring frontier of all: space. With billions of stars and countless unexplored worlds, space exploration sparks questions that push the limits of human imagination. Humans have always been driven by an insatiable curiosity to explore the unknown, from charting distant oceans to climbing the highest mountains. But what lies beyond our planet offers perhaps the most alluring';

  const selected = 'Humans have always been driven by an insatiable curiosity';
  const rest = text.slice(selected.length);

  const layer = (t) => {
    const a = (name) => `${ASSETS}/${t}/${name}.svg`;
    return `
    <div class="layer ${t}">
      <div class="group">
        <div class="abs tooltip">Bold ⌘+B</div>
        <div class="toolbar">
          <div class="chip ai"><img src="${ASSETS}/ai.svg" alt="">Edit with AI</div>
          <div class="sep"></div>
          <div class="chip">Text<img src="${a('arrow1')}" alt=""></div>
          <div class="sep"></div>
          <div class="icons">
            <div class="icon-btn active"><img src="${a('bold')}" alt=""></div>
            <div class="icon-btn"><img src="${a('italic')}" alt=""></div>
            <div class="icon-btn"><img src="${a('underline')}" alt=""></div>
            <div class="icon-btn"><img src="${a('strike')}" alt=""></div>
          </div>
          <div class="sep"></div>
          <div class="chip align"><span class="pad"><img src="${a('align')}" alt=""></span><img src="${a('arrow2')}" alt=""></div>
          <div class="sep"></div>
          <div class="chip cite"><img src="${a('cite')}" alt="">Cite</div>
          <div class="sep"></div>
          <div class="icon-btn"><img src="${a('link')}" alt=""></div>
          <div class="sep"></div>
          <div class="chip color"><img src="${a('color')}" alt=""><img src="${a('arrow3')}" alt=""></div>
        </div>
        <p class="copy"><span class="sel"><img class="handle l" src="${a('union-l')}" alt="">${selected}<img class="handle r" src="${a('union-r')}" alt=""></span>${rest}</p>
        <div class="abs fade"></div>
        <div class="abs cursor"><img src="${ASSETS}/cursor.svg" alt=""></div>
      </div>
    </div>`;
  };

  document.querySelectorAll('[data-study-assistant]').forEach((root) => {
    const stage = document.createElement('div');
    stage.className = 'sa__stage';
    stage.innerHTML = layer('light') + layer('dark');
    root.appendChild(stage);

    // Fit the square 768×768 stage into the card
    new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      root.style.setProperty('--sa-scale', Math.max(width, height) / 768);
    }).observe(root);
  });
})();
