/* ============================================================
   Positional Encoding Visualizer - Interactive Demo
   ============================================================ */

/* ---- i18n Translations ---- */
const TRANSLATIONS = {
  en: {
    title: 'Positional Encoding',
    subtitle: 'Explore how Large Language Models understand the sequence of words: from "Bag of Words" to "Absolute Positions", to modern "Rotary Position Embedding (RoPE)".',
    back: 'Back',
    stage0: {
      title: 'Weightless Words (Bag of Words)',
      desc: 'Without positional info, Attention sees all words at once. It cannot distinguish "cat chased mouse" from "mouse chased cat". Words float randomly like billiard balls.'
    },
    stage1: {
      title: 'Hanging Clocks (Absolute PE)',
      desc: 'Early models like GPT-2 hang a set of clocks under each word. The 1st word points to 12 o\'clock, later words rotate more. By looking at the clocks, the model reads the "barcode" of the position.'
    },
    stage2: {
      title: 'Rotary Compass (RoPE)',
      desc: 'Modern models (Llama, Qwen) use RoPE. Words are placed on a compass. Drag the slider to shift the entire sentence. Notice that while absolute angles change, the relative angle between any two words remains exactly the same!',
      slider: 'Shift overall position'
    },
    lang: 'EN / 中文'
  },
  zh: {
    title: '位置编码 (Positional Encoding)',
    subtitle: '探索大语言模型如何理解词语的先后顺序：从“词袋模型”到“绝对位置”，再到现代的“旋转罗盘 (RoPE)”。',
    back: '返回',
    stage0: {
      title: '失重的单词（词袋模型）',
      desc: '在不加任何位置信息时，Transformer 的注意力机制同时看到所有词，它分不清 "cat chased mouse" 和 "mouse chased cat"。词就像台球一样随机漂浮，没有顺序概念。'
    },
    stage1: {
      title: '挂上时钟（绝对位置编码）',
      desc: '早期的 GPT 给每个词挂上一组转速不同的时钟。第1个词指向12点，越往后的词，指针转得越多。模型通过看这些“表”的组合，就能知道它在第几个位置。'
    },
    stage2: {
      title: '旋转罗盘（旋转位置编码 RoPE）',
      desc: 'Llama 等现代大模型使用 RoPE。词被放在一个巨大的罗盘上旋转。拖动下方滑块平移整个句子，你会发现：虽然绝对角度变了，但词与词之间的相对夹角永远保持不变！相对距离才是语言理解的关键。',
      slider: '整体位置偏移 (Shift position)'
    },
    lang: '中文 / EN'
  }
};

/* ---- App State ---- */
let i18n;
let currentStage = 0;
let tokens = [];
let animationFrameId = null;

// Physics state for Stage 0
let floatingTokens = [];

// RoPE state
let ropeShift = 0;

/* ---- Initialization ---- */
function initApp() {
  i18n = new I18n({
    defaultLang: 'zh',
    translations: TRANSLATIONS,
    storageKey: 'pe-viz-lang'
  });

  // Bind Navigation
  document.querySelectorAll('.stage-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.stage-tab').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentStage = parseInt(e.target.getAttribute('data-stage'), 10);
      switchStage(currentStage);
    });
  });

  // Bind Input
  const inputEl = document.getElementById('sentenceInput');
  inputEl.addEventListener('input', () => {
    updateTokens(inputEl.value);
  });

  // Bind Slider
  const slider = document.getElementById('shift-slider');
  slider.addEventListener('input', (e) => {
    ropeShift = parseInt(e.target.value, 10);
    document.getElementById('shift-value').textContent = ropeShift;
    if (currentStage === 2) renderRoPE();
  });

  // Bind Lang toggle
  document.getElementById('langToggle').addEventListener('click', () => {
    i18n.toggle();
    i18n.updateDOM();
  });

  // Initial update
  i18n.updateDOM();
  updateTokens(inputEl.value);
  switchStage(0);
}

function updateTokens(text) {
  tokens = text.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) tokens = ['Empty'];
  if (tokens.length > 8) tokens = tokens.slice(0, 8); // limit for visualization

  // Re-init physics for Stage 0
  initPhysics();

  // Re-render current stage
  if (currentStage === 1) renderAbsolutePE();
  if (currentStage === 2) renderRoPE();
}

function switchStage(stageIdx) {
  // Hide all canvases
  document.querySelectorAll('.stage-section').forEach(el => {
    el.style.display = 'none';
  });
  
  // Stop physics loop if not on stage 0
  if (stageIdx !== 0 && animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Show selected
  const activeSection = document.getElementById(`stage-${stageIdx}`);
  activeSection.style.display = 'block';

  // Trigger render
  if (stageIdx === 0) {
    initPhysics();
    runPhysicsLoop();
  } else if (stageIdx === 1) {
    renderAbsolutePE();
  } else if (stageIdx === 2) {
    document.getElementById('shift-value').textContent = ropeShift;
    renderRoPE();
  }
}

/* ============================================================
   Stage 0: No PE (Floating Words)
   ============================================================ */
function initPhysics() {
  const container = document.getElementById('canvas-0');
  container.innerHTML = '';
  floatingTokens = [];

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 400;

  tokens.forEach((token, i) => {
    const el = document.createElement('div');
    el.className = 'floating-token';
    el.textContent = token;
    
    // Assign random colors from tokens
    const colors = ['var(--color-cyan)', 'var(--color-amber)', 'var(--color-rose)', 'var(--color-violet)', 'var(--color-emerald)'];
    el.style.color = colors[i % colors.length];
    el.style.borderColor = colors[i % colors.length];

    container.appendChild(el);

    // Initial random position and velocity
    floatingTokens.push({
      el,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 50) + 25,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      width: 0, height: 0
    });
  });

  // Need a tiny timeout to get actual dimensions
  setTimeout(() => {
    floatingTokens.forEach(t => {
      t.width = t.el.offsetWidth;
      t.height = t.el.offsetHeight;
    });
  }, 10);
}

function runPhysicsLoop() {
  if (currentStage !== 0) return;

  const container = document.getElementById('canvas-0');
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  floatingTokens.forEach(t => {
    t.x += t.vx;
    t.y += t.vy;

    // Bounce off walls
    if (t.x <= 0) { t.x = 0; t.vx *= -1; }
    if (t.x + t.width >= cw) { t.x = cw - t.width; t.vx *= -1; }
    if (t.y <= 0) { t.y = 0; t.vy *= -1; }
    if (t.y + t.height >= ch) { t.y = ch - t.height; t.vy *= -1; }

    t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
  });

  animationFrameId = requestAnimationFrame(runPhysicsLoop);
}


/* ============================================================
   Stage 1: Absolute PE (Clocks)
   ============================================================ */
function renderAbsolutePE() {
  const container = document.getElementById('canvas-1');
  container.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'tokens-row';

  tokens.forEach((token, pos) => {
    const col = document.createElement('div');
    col.className = 'abs-token-col';

    const tEl = document.createElement('div');
    tEl.className = 'abs-token';
    tEl.textContent = token;
    col.appendChild(tEl);

    // Create 3 clocks (High, Mid, Low freq)
    // Angles based on position. In real transformer: pos / 10000^(2i/d_model)
    // For visualization: high freq rotates 90deg per pos, mid 30deg, low 10deg.
    const freqs = [
      { name: 'Fast', speed: 90 },
      { name: 'Mid', speed: 30 },
      { name: 'Slow', speed: 5 }
    ];

    freqs.forEach(f => {
      const angle = pos * f.speed;
      const clock = createSVGClock(angle, f.name);
      col.appendChild(clock);
    });

    row.appendChild(col);
  });

  container.appendChild(row);
}

function createSVGClock(angle, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'clock-container';

  // Math for SVG
  // SVG default 0 is right (3 o'clock). We want 0 to be top (12 o'clock).
  // So we subtract 90 degrees.
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 50 50");
  svg.setAttribute("class", "clock-svg");

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "25");
  circle.setAttribute("cy", "25");
  circle.setAttribute("r", "20");
  circle.setAttribute("class", "clock-face");
  svg.appendChild(circle);

  // Tic marks
  for(let i=0; i<12; i++) {
    const a = i * 30 * Math.PI / 180;
    const r1 = 17, r2 = 20;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", 25 + Math.sin(a)*r1);
    line.setAttribute("y1", 25 - Math.cos(a)*r1);
    line.setAttribute("x2", 25 + Math.sin(a)*r2);
    line.setAttribute("y2", 25 - Math.cos(a)*r2);
    line.setAttribute("stroke", "var(--color-border-subtle)");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  }

  const hand = document.createElementNS(svgNS, "line");
  hand.setAttribute("x1", "25");
  hand.setAttribute("y1", "25");
  hand.setAttribute("x2", "25");
  hand.setAttribute("y2", "10"); // Points to 12 o'clock initially
  hand.setAttribute("class", "clock-hand");
  hand.style.transform = `rotate(${angle}deg)`;
  svg.appendChild(hand);

  const center = document.createElementNS(svgNS, "circle");
  center.setAttribute("cx", "25");
  center.setAttribute("cy", "25");
  center.setAttribute("r", "3");
  center.setAttribute("class", "clock-center");
  svg.appendChild(center);

  wrapper.appendChild(svg);

  const lbl = document.createElement('div');
  lbl.style.fontSize = '10px';
  lbl.style.color = 'var(--color-text-muted)';
  lbl.style.textAlign = 'center';
  lbl.style.fontFamily = 'var(--font-mono)';
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  return wrapper;
}


/* ============================================================
   Stage 2: RoPE (Rotary Compass)
   ============================================================ */
function renderRoPE() {
  const container = document.getElementById('rope-compass-container');
  container.innerHTML = '';

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "-150 -150 300 300");
  svg.setAttribute("class", "compass-svg");

  // Grid / Axis
  const xAxis = document.createElementNS(svgNS, "line");
  xAxis.setAttribute("x1", "-140"); xAxis.setAttribute("y1", "0");
  xAxis.setAttribute("x2", "140"); xAxis.setAttribute("y2", "0");
  xAxis.setAttribute("class", "compass-axis");
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS(svgNS, "line");
  yAxis.setAttribute("x1", "0"); yAxis.setAttribute("y1", "-140");
  yAxis.setAttribute("x2", "0"); yAxis.setAttribute("y2", "140");
  yAxis.setAttribute("class", "compass-axis");
  svg.appendChild(yAxis);

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "0"); circle.setAttribute("cy", "0");
  circle.setAttribute("r", "100");
  circle.setAttribute("class", "compass-circle");
  svg.appendChild(circle);

  // We'll show up to 3 tokens to keep the diagram clean, or all if short.
  const displayTokens = tokens.length > 4 ? [tokens[0], tokens[tokens.length-1]] : tokens;
  const indices = tokens.length > 4 ? [0, tokens.length-1] : tokens.map((_, i) => i);

  // Base rotation speed per position step (e.g. 30 degrees)
  const ROTATION_PER_STEP = 30;
  
  // Render an arc representing the relative angle between the first and last displayed token
  if (displayTokens.length >= 2) {
    const pos1 = indices[0] + ropeShift;
    const pos2 = indices[indices.length - 1] + ropeShift;
    const a1 = pos1 * ROTATION_PER_STEP;
    const a2 = pos2 * ROTATION_PER_STEP;
    
    // Draw arc
    const radius = 30;
    const rad1 = a1 * Math.PI / 180;
    const rad2 = a2 * Math.PI / 180;
    const x1 = Math.cos(rad1) * radius;
    const y1 = Math.sin(rad1) * radius;
    const x2 = Math.cos(rad2) * radius;
    const y2 = Math.sin(rad2) * radius;

    const largeArcFlag = Math.abs(a2 - a1) > 180 ? 1 : 0;
    
    // Only draw if difference is not a full circle
    if (Math.abs(a2 - a1) > 0 && Math.abs(a2 - a1) < 360) {
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`);
      path.setAttribute("class", "rope-angle-arc");
      svg.appendChild(path);

      // Label the relative distance
      const midRad = (rad1 + rad2) / 2;
      const lblX = Math.cos(midRad) * (radius + 20);
      const lblY = Math.sin(midRad) * (radius + 20);
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", lblX);
      text.setAttribute("y", lblY);
      text.setAttribute("class", "rope-angle-text");
      text.textContent = `Δ=${indices[indices.length - 1] - indices[0]}`;
      svg.appendChild(text);
    }
  }

  // Render Token Vectors
  displayTokens.forEach((token, arrIdx) => {
    const originalPos = indices[arrIdx];
    const shiftedPos = originalPos + ropeShift;
    
    // Calculate angle (0 is right, rotating clockwise)
    const angle = shiftedPos * ROTATION_PER_STEP;
    const rad = angle * Math.PI / 180;
    
    const r = 100; // vector length
    const x = Math.cos(rad) * r;
    const y = Math.sin(rad) * r;

    // Line
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", x);
    line.setAttribute("y2", y);
    line.setAttribute("class", "rope-vector");
    
    // Color them nicely
    const colors = ['#0EA5E9', '#F59E0B', '#8B5CF6'];
    line.setAttribute("stroke", colors[arrIdx % colors.length]);
    svg.appendChild(line);

    // Dot at the end
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "4");
    dot.setAttribute("fill", colors[arrIdx % colors.length]);
    svg.appendChild(dot);

    // Label Group
    const labelGroup = document.createElementNS(svgNS, "g");
    // Push label out a bit further
    const lx = Math.cos(rad) * (r + 25);
    const ly = Math.sin(rad) * (r + 25);
    labelGroup.setAttribute("transform", `translate(${lx}, ${ly})`);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("class", "rope-token-text");
    text.setAttribute("fill", colors[arrIdx % colors.length]);
    text.textContent = token;
    
    // Background rect for text (approximate width)
    // To make it look clean over grids
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("class", "rope-token-bg");
    rect.setAttribute("x", -token.length * 5 - 10);
    rect.setAttribute("y", -10);
    rect.setAttribute("width", token.length * 10 + 20);
    rect.setAttribute("height", 20);
    rect.setAttribute("stroke", colors[arrIdx % colors.length]);

    labelGroup.appendChild(rect);
    labelGroup.appendChild(text);
    svg.appendChild(labelGroup);
  });

  container.appendChild(svg);
}


/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', initApp);
