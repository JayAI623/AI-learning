/* ============================================================
   GPT Architecture Visualizer — Main Application Logic
   Step-aware autoregressive demo with full computation visualization
   ============================================================ */

/* ============================================================
   i18n Setup
   ============================================================ */
const i18n = new I18n({
  defaultLang: 'zh',
  translations: {
    en: {
      back: 'Back', title: 'GPT Architecture Visualizer',
      subtitle: 'Click each module to inspect its matrix-level computation flow. The Transformer layer repeats N times with different weights.',
      layerTag: 'Transformer Layer', detailTip: 'Click modules above to explore',
      formula: 'Formula', dimensions: 'Dimensions',
      computationFlow: 'Computation Flow', matrixDemo: 'Matrix Demo',
      prev: 'Prev', next: 'Next'
    },
    zh: {
      back: '返回', title: 'GPT 架构可视化',
      subtitle: '点击每个模块，查看其矩阵级计算流程。Transformer 层以不同权重重复 N 次。',
      layerTag: 'Transformer 层', detailTip: '点击上方模块探索',
      formula: '公式', dimensions: '维度',
      computationFlow: '计算流程', matrixDemo: '矩阵演示',
      prev: '上一步', next: '下一步'
    }
  }
});

function T(en, zh) { return { en, zh }; }
function t(val) {
  if (val && typeof val === 'object' && !Array.isArray(val))
    return val[i18n.getLang()] || val.en || '';
  return val;
}
function tList(val) {
  if (val && typeof val === 'object' && !Array.isArray(val))
    return val[i18n.getLang()] || val.en || [];
  return val;
}

/* ============================================================
   Demo Data — language-aware tokens
   ============================================================ */
const DEMO = {
  tokens: {
    zh: ['我', '爱', '编', '程'],
    en: ['I', 'love', 'to', 'code']
  },
  embeddings: [
    [0.50, 0.20, 0.80, 0.10],
    [0.30, 0.90, 0.40, 0.60],
    [0.70, 0.50, 0.20, 0.80],
    [0.40, 0.60, 0.70, 0.30]
  ],
  positions: [
    [ 0.01,  0.07, -0.02,  0.05],
    [-0.03,  0.05,  0.04, -0.01],
    [ 0.02, -0.04,  0.06,  0.03],
    [-0.01,  0.03, -0.03,  0.04]
  ],
  W_Q: [[0.2,0.5,0.3,0.8],[0.7,0.1,0.6,0.4],[0.3,0.9,0.2,0.5],[0.6,0.4,0.7,0.2]],
  W_K: [[0.5,0.3,0.7,0.2],[0.1,0.8,0.4,0.6],[0.9,0.2,0.5,0.3],[0.4,0.7,0.1,0.8]],
  W_V: [[0.8,0.2,0.6,0.3],[0.4,0.9,0.1,0.5],[0.2,0.6,0.8,0.4],[0.7,0.3,0.5,0.1]],
  W_1: [
    [0.3,-0.2,0.5,0.1,-0.4,0.2],
    [0.6,0.1,-0.3,0.4,0.2,-0.1],
    [-0.1,0.7,0.2,-0.5,0.3,0.4],
    [0.4,-0.3,0.1,0.6,-0.2,0.5]
  ],
  W_2: [
    [0.2,0.5,-0.1,0.3],
    [-0.3,0.4,0.6,-0.2],
    [0.1,-0.2,0.4,0.5],
    [0.4,0.3,-0.3,0.1],
    [-0.2,0.6,0.2,0.4],
    [0.3,-0.1,0.5,-0.3]
  ],
  sublayerAttn: [
    [0.12, -0.08, 0.25, -0.05],
    [0.15, -0.12, 0.18, -0.03],
    [0.08, -0.05, 0.22, -0.09],
    [0.10, -0.10, 0.20, -0.06]
  ],
  sublayerFfn: [
    [0.18, -0.14, 0.09, -0.07],
    [0.11, -0.06, 0.15, -0.10],
    [0.14, -0.09, 0.13, -0.04],
    [0.16, -0.11, 0.11, -0.08]
  ],
  vocabLabels: {
    zh: ['"的"','"爱"','"是"','"编"','"我"','"程"','"你"','"！"'],
    en: ['"the"','"love"','"am"','"to"','"I"','"code"','"you"','"!"']
  },
  predictions: {
    zh: [
      { best: '"爱"' },
      { best: '"编"' },
      { best: '"程"' },
      { best: '"！"' }
    ],
    en: [
      { best: '"love"' },
      { best: '"to"' },
      { best: '"code"' },
      { best: '"!"' }
    ]
  },
  softmax: {
    zh: [
      [{ tok: '"的"', lg: '0.43', ex: '1.54', pr: '0.07' },
       { tok: '"爱"', lg: '1.89', ex: '6.62', pr: '0.29' },
       { tok: '"是"', lg: '0.68', ex: '1.97', pr: '0.09' },
       { tok: '"编"', lg: '0.92', ex: '2.51', pr: '0.11' },
       { tok: '"我"', lg: '0.45', ex: '1.57', pr: '0.07' },
       { tok: '"程"', lg: '1.19', ex: '3.28', pr: '0.14' },
       { tok: '"你"', lg: '0.33', ex: '1.39', pr: '0.06' },
       { tok: '"！"', lg: '1.42', ex: '4.14', pr: '0.18' }],
      [{ tok: '"的"', lg: '0.60', ex: '1.82', pr: '0.05' },
       { tok: '"爱"', lg: '1.20', ex: '3.32', pr: '0.08' },
       { tok: '"是"', lg: '0.71', ex: '2.03', pr: '0.05' },
       { tok: '"编"', lg: '2.52', ex: '12.43', pr: '0.31' },
       { tok: '"我"', lg: '0.86', ex: '2.36', pr: '0.06' },
       { tok: '"程"', lg: '2.06', ex: '7.85', pr: '0.20' },
       { tok: '"你"', lg: '0.67', ex: '1.95', pr: '0.05' },
       { tok: '"！"', lg: '2.05', ex: '7.77', pr: '0.20' }],
      [{ tok: '"的"', lg: '0.48', ex: '1.62', pr: '0.04' },
       { tok: '"爱"', lg: '1.10', ex: '3.00', pr: '0.08' },
       { tok: '"是"', lg: '0.69', ex: '1.99', pr: '0.05' },
       { tok: '"编"', lg: '1.98', ex: '7.24', pr: '0.19' },
       { tok: '"我"', lg: '0.82', ex: '2.27', pr: '0.06' },
       { tok: '"程"', lg: '2.78', ex: '16.12', pr: '0.41' },
       { tok: '"你"', lg: '0.81', ex: '2.25', pr: '0.06' },
       { tok: '"！"', lg: '1.53', ex: '4.62', pr: '0.12' }],
      [{ tok: '"的"', lg: '0.56', ex: '1.75', pr: '0.06' },
       { tok: '"爱"', lg: '1.73', ex: '5.64', pr: '0.18' },
       { tok: '"是"', lg: '0.75', ex: '2.12', pr: '0.07' },
       { tok: '"编"', lg: '1.81', ex: '6.11', pr: '0.20' },
       { tok: '"我"', lg: '0.68', ex: '1.97', pr: '0.06' },
       { tok: '"程"', lg: '1.58', ex: '4.86', pr: '0.16' },
       { tok: '"你"', lg: '0.49', ex: '1.63', pr: '0.05' },
       { tok: '"！"', lg: '1.90', ex: '6.69', pr: '0.22' }]
    ],
    en: [
      [{ tok: '"the"', lg: '0.43', ex: '1.54', pr: '0.07' },
       { tok: '"love"',lg: '1.89', ex: '6.62', pr: '0.29' },
       { tok: '"am"',  lg: '0.68', ex: '1.97', pr: '0.09' },
       { tok: '"to"',  lg: '0.92', ex: '2.51', pr: '0.11' },
       { tok: '"I"',   lg: '0.45', ex: '1.57', pr: '0.07' },
       { tok: '"code"',lg: '1.19', ex: '3.28', pr: '0.14' },
       { tok: '"you"', lg: '0.33', ex: '1.39', pr: '0.06' },
       { tok: '"!"',   lg: '1.42', ex: '4.14', pr: '0.18' }],
      [{ tok: '"the"', lg: '0.60', ex: '1.82', pr: '0.05' },
       { tok: '"love"',lg: '1.20', ex: '3.32', pr: '0.08' },
       { tok: '"am"',  lg: '0.71', ex: '2.03', pr: '0.05' },
       { tok: '"to"',  lg: '2.52', ex: '12.43', pr: '0.31' },
       { tok: '"I"',   lg: '0.86', ex: '2.36', pr: '0.06' },
       { tok: '"code"',lg: '2.06', ex: '7.85', pr: '0.20' },
       { tok: '"you"', lg: '0.67', ex: '1.95', pr: '0.05' },
       { tok: '"!"',   lg: '2.05', ex: '7.77', pr: '0.20' }],
      [{ tok: '"the"', lg: '0.48', ex: '1.62', pr: '0.04' },
       { tok: '"love"',lg: '1.10', ex: '3.00', pr: '0.08' },
       { tok: '"am"',  lg: '0.69', ex: '1.99', pr: '0.05' },
       { tok: '"to"',  lg: '1.98', ex: '7.24', pr: '0.19' },
       { tok: '"I"',   lg: '0.82', ex: '2.27', pr: '0.06' },
       { tok: '"code"',lg: '2.78', ex: '16.12', pr: '0.41' },
       { tok: '"you"', lg: '0.81', ex: '2.25', pr: '0.06' },
       { tok: '"!"',   lg: '1.53', ex: '4.62', pr: '0.12' }],
      [{ tok: '"the"', lg: '0.56', ex: '1.75', pr: '0.06' },
       { tok: '"love"',lg: '1.73', ex: '5.64', pr: '0.18' },
       { tok: '"am"',  lg: '0.75', ex: '2.12', pr: '0.07' },
       { tok: '"to"',  lg: '1.81', ex: '6.11', pr: '0.20' },
       { tok: '"I"',   lg: '0.68', ex: '1.97', pr: '0.06' },
       { tok: '"code"',lg: '1.58', ex: '4.86', pr: '0.16' },
       { tok: '"you"', lg: '0.49', ex: '1.63', pr: '0.05' },
       { tok: '"!"',   lg: '1.90', ex: '6.69', pr: '0.22' }]
    ]
  },
  /* W_vocab^T: 4×8 — columns scattered: 的,爱,是,编,我,程,你,！ */
  W_vocab: [
    [0.2, 0.8, 0.4, 0.4, 0.3, 1.5, 0.3, 0.6],
    [0.4, 0.2, 0.3, 2.0, 0.5, 0.5, 0.2, 1.5],
    [0.3, 1.8, 0.5, 0.3, 0.2, 0.2, 0.1, 1.0],
    [0.1, 0.1, 0.2, 0.8, 0.4, 1.8, 0.6, 0.2]
  ]
};

const MAX_STEPS = 4;
let currentStep = 1;

/* ============================================================
   Helper Functions
   ============================================================ */
function getTokens() { return DEMO.tokens[i18n.getLang()] || DEMO.tokens.en; }
function getVocabLabels() { return DEMO.vocabLabels[i18n.getLang()] || DEMO.vocabLabels.en; }
function getPredictions() { return DEMO.predictions[i18n.getLang()] || DEMO.predictions.en; }
function getSoftmaxData() { return DEMO.softmax[i18n.getLang()] || DEMO.softmax.en; }

function gelu(x) {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)));
}

function layerNorm(matrix) {
  return matrix.map(row => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, v) => a + (v - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance + 1e-5);
    return row.map(v => +((v - mean) / std).toFixed(2));
  });
}

/* ============================================================
   DOM References
   ============================================================ */
const outerNodes  = Array.from(document.querySelectorAll('.arch-node[data-module]'));
const layerBlocks = Array.from(document.querySelectorAll('.layer-block[data-module]'));
const allModules  = [...outerNodes, ...layerBlocks];

const detailKicker = document.getElementById('detailKicker');
const detailTitle  = document.getElementById('detailTitle');
const detailDesc   = document.getElementById('detailDesc');
const formulaRow   = document.getElementById('formulaRow');
const dimRow       = document.getElementById('dimRow');
const flowList     = document.getElementById('flowList');
const matrixDemo   = document.getElementById('matrixDemo');
const langToggle   = document.getElementById('langToggle');
const stepSequence = document.getElementById('stepSequence');
const stepLabel    = document.getElementById('stepLabel');
const stepPrevBtn  = document.getElementById('stepPrev');
const stepNextBtn  = document.getElementById('stepNext');

const resources = new ResourceManager();

/* ============================================================
   Step Bar Rendering
   ============================================================ */
function renderStepBar() {
  stepSequence.innerHTML = '';
  const tokens = getTokens();

  tokens.forEach((tok, i) => {
    const chip = document.createElement('span');
    chip.className = 'step-token';
    if (i < currentStep - 1)      chip.classList.add('step-token--done');
    else if (i === currentStep - 1) chip.classList.add('step-token--current');
    else                            chip.classList.add('step-token--future');
    chip.textContent = tok;
    chip.addEventListener('click', () => setStep(i + 1));
    stepSequence.appendChild(chip);
  });

  const pred = getPredictions()[currentStep - 1];
  const arrow = document.createElement('span');
  arrow.className = 'step-predict';
  arrow.textContent = `→ ${pred.best}`;
  stepSequence.appendChild(arrow);

  stepLabel.textContent = `${t(T('Step','步骤'))} ${currentStep} / ${MAX_STEPS}`;
  stepPrevBtn.disabled = currentStep <= 1;
  stepNextBtn.disabled = currentStep >= MAX_STEPS;
}

function setStep(n) {
  currentStep = Math.max(1, Math.min(MAX_STEPS, n));
  renderStepBar();
  activateModule(currentModuleId);
}

/* ============================================================
   UI Helpers
   ============================================================ */
function createSectionLabel(text) {
  const label = document.createElement('h4');
  label.className = 'attn-section-label';
  label.textContent = text;
  return label;
}

function createFlowStepCardWithMask(data, label, colorScheme, rowLabels, colLabels, maskFn, desc) {
  const card = document.createElement('div');
  card.className = 'flow-step-card';

  const mtxWrap = document.createElement('div');
  const mtx = new MatrixComponent(mtxWrap, {
    data, label, colorScheme, rowLabels, colLabels, showDims: true
  });

  if (maskFn) {
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        if (maskFn(i, j)) {
          const cell = mtx._cells[i][j];
          cell.classList.add('mtx-cell--masked');
          cell.textContent = '—';
        }
      }
    }
  }

  card.appendChild(mtxWrap);

  const descEl = document.createElement('div');
  descEl.className = 'flow-step-card__desc';
  descEl.textContent = desc;
  card.appendChild(descEl);

  return card;
}

function createFlowArrow(symbol) {
  const arrow = document.createElement('div');
  arrow.className = 'flow-arrow';
  arrow.textContent = symbol;
  return arrow;
}

/* ============================================================
   Render Helpers — Step-aware, Full Sequence
   ============================================================ */

/* ---- Position Embedding (full sequence) ---- */
function renderPositionDemo(container) {
  const n = currentStep;
  const tokens = getTokens().slice(0, n);
  const embs = DEMO.embeddings.slice(0, n);
  const poss = DEMO.positions.slice(0, n);
  const sums = embs.map((emb, i) => emb.map((v, j) => +(v + poss[i][j]).toFixed(2)));

  container.appendChild(createHint(t(T(
    `Position encoding for ${n} token${n > 1 ? 's' : ''} — element-wise add:`,
    `${n} 个 token 的位置编码 — 逐元素相加：`
  ))));

  const layout = document.createElement('div');
  layout.className = 'mtx-multiply';

  const xDiv = document.createElement('div');
  resources.register(new MatrixComponent(xDiv, {
    label: 'X (Token Embed)', colorScheme: 'query',
    data: embs, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
  layout.appendChild(xDiv);

  const plusOp = document.createElement('div');
  plusOp.className = 'mtx-multiply__op';
  plusOp.textContent = '+';
  layout.appendChild(plusOp);

  const pDiv = document.createElement('div');
  resources.register(new MatrixComponent(pDiv, {
    label: 'P (Position)', colorScheme: 'key',
    data: poss, rowLabels: tokens.map((_, i) => `pos=${i+1}`),
    colLabels: ['h1','h2','h3','h4'], precision: 2, showDims: true
  }));
  layout.appendChild(pDiv);

  const eqOp = document.createElement('div');
  eqOp.className = 'mtx-multiply__op';
  eqOp.textContent = '=';
  layout.appendChild(eqOp);

  const hDiv = document.createElement('div');
  resources.register(new MatrixComponent(hDiv, {
    label: 'H = X + P', colorScheme: 'output',
    data: sums, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
  layout.appendChild(hDiv);

  container.appendChild(layout);
}

/* ---- Self-Attention (full process like attention-visualizer) ---- */
function renderAttnDemo(container) {
  const n = currentStep;
  const tokens = getTokens().slice(0, n);
  const H = DEMO.embeddings.slice(0, n);

  const Q = MatrixMath.multiply(H, DEMO.W_Q);
  const K = MatrixMath.multiply(H, DEMO.W_K);
  const V = MatrixMath.multiply(H, DEMO.W_V);
  const KT = MatrixMath.transpose(K);
  const QKT = MatrixMath.multiply(Q, KT);
  const dk = 4;
  const scale = Math.sqrt(dk);
  const scaled = QKT.map(row => row.map(v => +(v / scale).toFixed(4)));
  const masked = scaled.map((row, i) => row.map((v, j) => j > i ? -Infinity : v));
  const weights = masked.map(row => {
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => +(e / sum).toFixed(4));
  });

  /* --- Section 1: QKV Projections --- */
  container.appendChild(createSectionLabel(t(T(
    '1. Q, K, V Projections', '1. Q、K、V 投影'
  ))));

  const formula1 = document.createElement('div');
  formula1.className = 'formula-bar';
  formula1.style.gap = 'var(--space-6)';
  formula1.innerHTML = `
    <span class="f-eq"><span class="f-var f-var--q">Q</span> <span class="f-op">=</span> <span class="f-var">H</span>·<span class="f-var">W</span><sub>Q</sub></span>
    <span class="f-eq"><span class="f-var f-var--k">K</span> <span class="f-op">=</span> <span class="f-var">H</span>·<span class="f-var">W</span><sub>K</sub></span>
    <span class="f-eq"><span class="f-var f-var--v">V</span> <span class="f-op">=</span> <span class="f-var">H</span>·<span class="f-var">W</span><sub>V</sub></span>
  `;
  container.appendChild(formula1);

  const weightsRow = document.createElement('div');
  weightsRow.className = 'matrix-row-layout';
  weightsRow.style.marginBottom = 'var(--space-6)';
  const wqDiv = document.createElement('div');
  const wkDiv = document.createElement('div');
  const wvDiv = document.createElement('div');
  resources.register(new MatrixComponent(wqDiv, { data: DEMO.W_Q, label: 'W_Q', colorScheme: 'query', precision: 1, showDims: true }));
  resources.register(new MatrixComponent(wkDiv, { data: DEMO.W_K, label: 'W_K', colorScheme: 'key', precision: 1, showDims: true }));
  resources.register(new MatrixComponent(wvDiv, { data: DEMO.W_V, label: 'W_V', colorScheme: 'value', precision: 1, showDims: true }));
  weightsRow.appendChild(wqDiv);
  weightsRow.appendChild(wkDiv);
  weightsRow.appendChild(wvDiv);
  container.appendChild(weightsRow);

  const arrowDown = document.createElement('div');
  arrowDown.style.cssText = 'text-align:center;margin:var(--space-3) 0;font-size:var(--text-2xl);color:var(--color-text-dim);opacity:0.4';
  arrowDown.textContent = '↓';
  container.appendChild(arrowDown);

  const resultRow = document.createElement('div');
  resultRow.className = 'matrix-row-layout';
  const qDiv = document.createElement('div');
  const kDiv = document.createElement('div');
  const vDiv = document.createElement('div');
  resources.register(new MatrixComponent(qDiv, { data: Q, label: 'Q', colorScheme: 'query', rowLabels: tokens, showDims: true }));
  resources.register(new MatrixComponent(kDiv, { data: K, label: 'K', colorScheme: 'key', rowLabels: tokens, showDims: true }));
  resources.register(new MatrixComponent(vDiv, { data: V, label: 'V', colorScheme: 'value', rowLabels: tokens, showDims: true }));
  resultRow.appendChild(qDiv);
  resultRow.appendChild(kDiv);
  resultRow.appendChild(vDiv);
  container.appendChild(resultRow);

  /* --- Section 2: Attention Scores --- */
  container.appendChild(createSectionLabel(t(T(
    '2. Attention Scores', '2. 注意力分数'
  ))));

  const formula2 = document.createElement('div');
  formula2.className = 'formula-bar';
  formula2.innerHTML = `
    <span class="f-var f-var--attn">Attention</span>
    <span class="f-op">=</span>
    <span class="f-fn">Softmax</span>
    <span class="f-paren">(</span>
    <span class="f-var f-var--q">Q</span><span class="f-var f-var--k">K</span><sup>T</sup>
    <span class="f-op">/</span>
    √<span class="f-var">d</span><sub>k</sub>
    <span class="f-paren">)</span>
  `;
  container.appendChild(formula2);

  const flow = document.createElement('div');
  flow.className = 'computation-flow';

  const qktCard = createFlowStepCardWithMask(
    QKT, 'QK^T', 'score', tokens, tokens, null,
    t(T('Raw similarity scores', '原始相似度分数'))
  );
  flow.appendChild(qktCard);
  flow.appendChild(createFlowArrow('→'));

  const scaledFull = scaled.map((row, i) => row.map((v, j) => j > i ? 0 : v));
  const scaledCard = createFlowStepCardWithMask(
    scaledFull, 'Scaled', 'score', tokens, tokens,
    (i, j) => j > i,
    t(T(`÷ √d_k = ÷ ${scale.toFixed(0)}`, `÷ √d_k = ÷ ${scale.toFixed(0)}`))
  );
  flow.appendChild(scaledCard);
  flow.appendChild(createFlowArrow('→'));

  const softmaxCard = createFlowStepCardWithMask(
    weights, 'Softmax', 'output', tokens, tokens,
    (i, j) => weights[i][j] === 0 && j > i,
    t(T('Mask + Softmax → probabilities', '掩码 + Softmax → 概率'))
  );
  flow.appendChild(softmaxCard);
  container.appendChild(flow);

  /* --- Section 3: Heatmap --- */
  container.appendChild(createSectionLabel(t(T(
    '3. Attention Heatmap', '3. 注意力热力图'
  ))));

  const heatmapWrap = document.createElement('div');
  heatmapWrap.className = 'heatmap-container';
  resources.register(new HeatmapComponent(heatmapWrap, {
    data: weights, rowLabels: tokens, colLabels: tokens,
    title: t(T('Attention Weights', '注意力权重')),
    precision: 2, colorHigh: [30, 64, 175],
    rowAxis: 'Query', colAxis: 'Key',
    lowLabel: '0.00', highLabel: '1.00'
  }));
  container.appendChild(heatmapWrap);

  /* --- Section 4: Weighted Output --- */
  container.appendChild(createSectionLabel(t(T(
    '4. Weighted Output: Z = Attn × V', '4. 加权输出：Z = Attn × V'
  ))));

  const outputFormula = document.createElement('div');
  outputFormula.className = 'formula-bar';
  outputFormula.innerHTML = `
    <span class="f-var f-var--z">Z</span>
    <span class="f-op">=</span>
    <span class="f-var f-var--attn">Attention</span>
    <span class="f-op">×</span>
    <span class="f-var f-var--v">V</span>
  `;
  container.appendChild(outputFormula);

  const multiplyDiv = document.createElement('div');
  container.appendChild(multiplyDiv);
  resources.register(new MatrixMultiplication(multiplyDiv, {
    matA: { data: weights, label: 'Attention', colorScheme: 'score', rowLabels: tokens, precision: 2 },
    matB: { data: V, label: 'V', colorScheme: 'value', rowLabels: tokens, precision: 2 },
    resultConfig: { label: 'Z', colorScheme: 'output', precision: 2 },
    speed: 200, showDetail: true, autoStart: false
  }));
}

/* ---- Add & Norm (full sequence) ---- */
function renderAddNormDemo(container, variant) {
  const n = currentStep;
  const tokens = getTokens().slice(0, n);
  const embs = DEMO.embeddings.slice(0, n);
  const sublayer = variant === 1
    ? DEMO.sublayerAttn.slice(0, n)
    : DEMO.sublayerFfn.slice(0, n);
  const sublayerName = variant === 1
    ? t(T('Self-Attention output', '自注意力输出'))
    : t(T('FFN output', 'FFN 输出'));

  container.appendChild(createHint(t(T(
    `Residual connection for ${n} token${n > 1 ? 's' : ''} — add ${variant === 1 ? 'attention' : 'FFN'} output back, then layer-normalize.`,
    `${n} 个 token 的残差连接 — 将${variant === 1 ? '注意力' : 'FFN'}输出加回输入，再进行层归一化。`
  ))));

  const sum = embs.map((emb, i) => emb.map((v, j) => +(v + sublayer[i][j]).toFixed(2)));
  const norm = layerNorm(sum);

  const host = document.createElement('div');
  container.appendChild(host);

  resources.register(new MatrixComponent(host, {
    label: 'Input X (residual)', colorScheme: 'query',
    data: embs, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
  resources.register(new MatrixComponent(host, {
    label: `SubLayer(X) — ${sublayerName}`, colorScheme: 'key',
    data: sublayer, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
  resources.register(new MatrixComponent(host, {
    label: 'X + SubLayer(X)', colorScheme: 'value',
    data: sum, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
  resources.register(new MatrixComponent(host, {
    label: 'LayerNorm(X + SubLayer(X))', colorScheme: 'output',
    data: norm, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
    precision: 2, showDims: true
  }));
}

/* ---- FFN (two matrix multiplications) ---- */
function renderFfnDemo(container) {
  const n = currentStep;
  const tokens = getTokens().slice(0, n);
  const embs = DEMO.embeddings.slice(0, n);

  const sub = DEMO.sublayerAttn.slice(0, n);
  const sum = embs.map((emb, i) => emb.map((v, j) => +(v + sub[i][j]).toFixed(4)));
  const input = layerNorm(sum);

  /* --- Step 1: Expand X × W₁ --- */
  container.appendChild(createSectionLabel(t(T(
    '1. Expand: X × W₁', '1. 扩展：X × W₁'
  ))));
  container.appendChild(createHint(t(T(
    `Linear projection: expand from d_model=4 to d_ff=6:`,
    `线性投影：从 d_model=4 扩展到 d_ff=6：`
  ))));

  const host1 = document.createElement('div');
  container.appendChild(host1);
  resources.register(new MatrixMultiplication(host1, {
    matA: {
      label: 'X (input)', colorScheme: 'query',
      data: input, rowLabels: tokens, colLabels: ['h1','h2','h3','h4'],
      showDims: true, precision: 2
    },
    matB: {
      label: 'W₁ (expand)', colorScheme: 'key',
      data: DEMO.W_1,
      rowLabels: ['h1','h2','h3','h4'], colLabels: ['f1','f2','f3','f4','f5','f6'],
      showDims: true, precision: 1
    },
    resultConfig: { label: 'Hidden (pre-GELU)', colorScheme: 'output', precision: 2 },
    speed: 200, showDetail: true, autoStart: false
  }));

  /* --- Step 2: GELU activation --- */
  container.appendChild(createSectionLabel(t(T(
    '2. GELU Activation', '2. GELU 激活'
  ))));
  container.appendChild(createHint(t(T(
    'GELU(x) ≈ x · Φ(x) — smooth ReLU variant, applied element-wise:',
    'GELU(x) ≈ x · Φ(x) — 平滑版 ReLU，逐元素应用：'
  ))));

  const preGelu = MatrixMath.multiply(input, DEMO.W_1);
  const postGelu = preGelu.map(row => row.map(v => +gelu(v).toFixed(2)));

  const geluHost = document.createElement('div');
  container.appendChild(geluHost);
  resources.register(new MatrixComponent(geluHost, {
    label: 'GELU(Hidden)', colorScheme: 'value',
    data: postGelu, rowLabels: tokens, colLabels: ['f1','f2','f3','f4','f5','f6'],
    precision: 2, showDims: true
  }));

  /* --- Step 3: Compress GELU(H) × W₂ --- */
  container.appendChild(createSectionLabel(t(T(
    '3. Compress: GELU(H) × W₂', '3. 压缩：GELU(H) × W₂'
  ))));
  container.appendChild(createHint(t(T(
    `Linear projection: compress back from d_ff=6 to d_model=4:`,
    `线性投影：从 d_ff=6 压缩回 d_model=4：`
  ))));

  const host2 = document.createElement('div');
  container.appendChild(host2);
  resources.register(new MatrixMultiplication(host2, {
    matA: {
      label: 'GELU(H)', colorScheme: 'value',
      data: postGelu, rowLabels: tokens, colLabels: ['f1','f2','f3','f4','f5','f6'],
      showDims: true, precision: 2
    },
    matB: {
      label: 'W₂ (compress)', colorScheme: 'key',
      data: DEMO.W_2,
      rowLabels: ['f1','f2','f3','f4','f5','f6'], colLabels: ['h1','h2','h3','h4'],
      showDims: true, precision: 1
    },
    resultConfig: { label: 'FFN Output', colorScheme: 'output', precision: 2 },
    speed: 200, showDetail: true, autoStart: false
  }));
}

/* ---- Softmax demo ---- */
function renderSoftmaxDemo(container) {
  const idx = currentStep - 1;
  const tokens = getTokens();
  const ctx = tokens.slice(0, currentStep).join(' ');
  const pred = getPredictions()[idx];

  container.appendChild(createHint(t(T(
    `Given "${ctx}", predict next token via softmax over full vocabulary:`,
    `给定 "${ctx}"，通过 softmax 在完整词表上预测下一个 token：`
  ))));

  const table = document.createElement('table');
  table.className = 'mini-softmax';

  const rows = getSoftmaxData()[idx];
  const rowsHtml = rows.map(r => {
    const isBest = r.tok === pred.best;
    return `<tr${isBest ? ' class="softmax-best"' : ''}><td>${r.tok}</td><td>${r.lg}</td><td>${r.ex}</td><td>${r.pr}</td></tr>`;
  }).join('');

  table.innerHTML = `
    <thead>
      <tr><th>Token</th><th>Logit</th><th>exp(logit)</th><th>${t(T('Probability','概率'))}</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  `;
  container.appendChild(table);
}

/* ============================================================
   Module Data Registry
   ============================================================ */
const MODULES = {
  'token-embedding': {
    kicker: T('Input Mapping', '输入映射'),
    title:  T('Token Embedding', '词元嵌入'),
    desc:   T('Convert token id into hidden vector. Conceptually this equals one-hot vector times embedding matrix.',
              '将 token id 转换为隐藏向量。概念上等价于 one-hot 向量乘以嵌入矩阵。'),
    formulas: ['x_t = OneHot(id_t) × W_E'],
    dims: ['OneHot: T×V', 'W_E: V×d_model', 'X: T×d_model'],
    flow: {
      en: ['Receive token id t from tokenizer.','Create one-hot selector vector (concept view).','Multiply selector by embedding matrix W_E.','Extract dense vector x_t for downstream layers.'],
      zh: ['从分词器接收 token id t。','创建 one-hot 选择向量（概念视角）。','用选择向量乘以嵌入矩阵 W_E。','提取稠密向量 x_t 供后续层使用。']
    },
    renderDemo(container) {
      const n = currentStep;
      const tokens = getTokens().slice(0, n);
      const allTokens = getTokens();
      const seq = tokens.join(' ');

      const oneHotData = tokens.map((_, i) =>
        allTokens.map((__, j) => j === i ? 1 : 0)
      );

      container.appendChild(createHint(t(T(
        `Embed ${n} token${n > 1 ? 's' : ''}: "${seq}" — each row selects its embedding:`,
        `嵌入 ${n} 个 token："${seq}" — 每行选出对应的嵌入向量：`
      ))));

      resources.register(new MatrixMultiplication(container, {
        matA: {
          label: `One-Hot (${n}×${allTokens.length})`, colorScheme: 'query',
          data: oneHotData, rowLabels: tokens, colLabels: allTokens,
          precision: 0, showDims: true
        },
        matB: {
          label: 'W_E', colorScheme: 'key',
          data: DEMO.embeddings, rowLabels: allTokens,
          colLabels: ['h1','h2','h3','h4'], precision: 2, showDims: true
        },
        resultConfig: { label: 'X (embeddings)', colorScheme: 'output', precision: 2 },
        speed: 200, showDetail: true, autoStart: false
      }));
    }
  },

  'position-embedding': {
    kicker: T('Order Injection', '位置注入'),
    title:  T('Position Embedding', '位置嵌入'),
    desc:   T('Inject token order by adding a position vector P(pos) to each token embedding.',
              '通过将位置向量 P(pos) 加到每个词元嵌入上来注入顺序信息。'),
    formulas: ['H = X + P'],
    dims: ['X: T×d_model', 'P: T×d_model', 'H: T×d_model'],
    flow: {
      en: ['Look up position vector P by absolute index for each token.','Add token embeddings and position embeddings element-wise.','Produce initial hidden states H for Transformer layers.'],
      zh: ['根据绝对位置索引为每个 token 查找位置向量 P。','将词元嵌入与位置嵌入逐元素相加。','生成初始隐藏状态 H，供 Transformer 层使用。']
    },
    renderDemo(container) { renderPositionDemo(container); }
  },

  'self-attn': {
    kicker: T('Transformer Layer · Sub-block', 'Transformer 层 · 子模块'),
    title:  T('Multi-Head Self-Attention', '多头自注意力'),
    desc:   T('Each token attends to all previous tokens via Q/K/V projections and scaled dot-product attention.',
              '每个 token 通过 Q/K/V 投影和缩放点积注意力关注所有之前的 token。'),
    formulas: ['Q = H × W_Q,  K = H × W_K,  V = H × W_V','Score = Q × K^T / √d_k','Attention = softmax(Score + mask)','Output = Attention × V'],
    dims: ['H: T×d_model', 'W_Q/W_K/W_V: d_model×d_k', 'Score: T×T', 'Output: T×d_v'],
    flow: {
      en: ['Project hidden states H into Query, Key, Value subspaces.','Compute pairwise similarity scores via Q × K^T.','Scale by 1/√d_k to stabilize gradients.','Apply causal mask to prevent attending to future tokens.','Normalize with softmax to get attention weights.','Aggregate value vectors: Output = Attention × V.'],
      zh: ['将隐藏状态 H 投影到 Query、Key、Value 子空间。','通过 Q × K^T 计算两两相似度分数。','除以 √d_k 来稳定梯度。','应用因果掩码，防止关注未来的 token。','用 softmax 归一化得到注意力权重。','聚合值向量：Output = Attention × V。']
    },
    renderDemo(container) { renderAttnDemo(container); }
  },

  'add-norm-1': {
    kicker: T('Transformer Layer · Sub-block', 'Transformer 层 · 子模块'),
    title:  T('Add & Layer Norm (post-Attention)', '残差加和 & 层归一化（注意力后）'),
    desc:   T('Residual connection adds the attention output back to the input, then layer-normalizes.',
              '残差连接将注意力输出加回输入，然后进行层归一化。'),
    formulas: ['Y = LayerNorm(X + SelfAttn(X))','ŷ_i = (y_i − μ) / (σ + ε) · γ + β'],
    dims: ['X: T×d_model', 'SelfAttn(X): T×d_model', 'Y: T×d_model'],
    flow: {
      en: ['Save input X as the residual branch.','Receive attention output SelfAttn(X).','Element-wise add: X + SelfAttn(X).','Compute mean and std across d_model dimension.','Normalize, then scale by γ and shift by β (learned).'],
      zh: ['保存输入 X 作为残差分支。','接收注意力输出 SelfAttn(X)。','逐元素相加：X + SelfAttn(X)。','沿 d_model 维度计算均值和标准差。','归一化后，用可学习参数 γ 缩放、β 偏移。']
    },
    renderDemo(container) { renderAddNormDemo(container, 1); }
  },

  'ffn': {
    kicker: T('Transformer Layer · Sub-block', 'Transformer 层 · 子模块'),
    title:  T('Feed-Forward Network (FFN)', '前馈网络（FFN）'),
    desc:   T('Two-layer FFN with GELU activation. Expands to wider dimension then compresses back.',
              '两层 FFN，使用 GELU 激活。先扩展到更宽维度再压缩回来。'),
    formulas: ['FFN(X) = GELU(X × W₁ + b₁) × W₂ + b₂','GELU(x) ≈ x · Φ(x)'],
    dims: ['X: T×d_model', 'W₁: d_model×d_ff', 'W₂: d_ff×d_model', 'd_ff = 4·d_model'],
    flow: {
      en: ['Linear projection: expand to d_ff = 4 · d_model.','Apply GELU activation (smooth ReLU variant).','Linear projection: compress back to d_model.','Each token processed independently (no cross-token interaction).'],
      zh: ['线性投影：扩展到 d_ff = 4 · d_model。','应用 GELU 激活函数（平滑版 ReLU）。','线性投影：压缩回 d_model。','每个 token 独立处理（无跨 token 交互）。']
    },
    renderDemo(container) { renderFfnDemo(container); }
  },

  'add-norm-2': {
    kicker: T('Transformer Layer · Sub-block', 'Transformer 层 · 子模块'),
    title:  T('Add & Layer Norm (post-FFN)', '残差加和 & 层归一化（FFN 后）'),
    desc:   T('Second residual connection — same as post-attention, but after the FFN.',
              '第二次残差连接 — 与注意力后相同，但应用于 FFN 之后。'),
    formulas: ['Z = LayerNorm(Y + FFN(Y))','ẑ_i = (z_i − μ) / (σ + ε) · γ + β'],
    dims: ['Y: T×d_model', 'FFN(Y): T×d_model', 'Z: T×d_model'],
    flow: {
      en: ['Save FFN input Y as residual.','Add FFN output: Y + FFN(Y).','Layer-normalize across d_model.','Output Z becomes input to the next Transformer layer.'],
      zh: ['保存 FFN 输入 Y 作为残差。','加上 FFN 输出：Y + FFN(Y)。','沿 d_model 进行层归一化。','输出 Z 成为下一个 Transformer 层的输入。']
    },
    renderDemo(container) { renderAddNormDemo(container, 2); }
  },

  'lm-head': {
    kicker: T('Vocabulary Projection', '词表投影'),
    title:  T('LM Head', '语言模型头'),
    desc:   T('Map final hidden states to vocabulary logits using a large projection matrix.',
              '通过大型投影矩阵将最终隐藏状态映射为词表 logits。'),
    formulas: ['logits = H^N × W_vocab^T'],
    dims: ['H^N: T×d_model', 'W_vocab^T: d_model×V', 'logits: T×V'],
    flow: {
      en: ['Take all hidden states after final layer norm.','Multiply by output weight matrix W_vocab^T.','Produce logit vectors for each position.','The last position\'s logits determine the next token.'],
      zh: ['取最后一层归一化后的所有 token 隐藏状态。','乘以输出权重矩阵 W_vocab^T。','为每个位置生成 logit 向量。','最后一个位置的 logits 决定下一个 token。']
    },
    renderDemo(container) {
      const n = currentStep;
      const tokens = getTokens().slice(0, n);
      const vocab = getVocabLabels();
      const ctx = tokens.join(' ');
      const pred = getPredictions()[currentStep - 1];

      container.appendChild(createSectionLabel(t(T(
        '1. Matrix Multiplication', '1. 矩阵乘法'
      ))));
      container.appendChild(createHint(t(T(
        `Context: "${ctx}" → project all ${n} hidden state${n > 1 ? 's' : ''} to vocabulary (V=${vocab.length}) logits:`,
        `上下文："${ctx}" → 将全部 ${n} 个隐藏状态投影到词表（V=${vocab.length}）logits：`
      ))));

      const logits = MatrixMath.multiply(DEMO.embeddings.slice(0, n), DEMO.W_vocab);

      const mm = resources.register(new MatrixMultiplication(container, {
        matA: {
          label: 'H^N (hidden states)', colorScheme: 'query',
          data: DEMO.embeddings.slice(0, n), rowLabels: tokens,
          colLabels: ['h1','h2','h3','h4'], precision: 2, showDims: true
        },
        matB: {
          label: 'W_vocab^T', colorScheme: 'key',
          data: DEMO.W_vocab,
          rowLabels: ['h1','h2','h3','h4'], colLabels: vocab,
          precision: 2, showDims: true
        },
        resultConfig: { label: 'logits', colorScheme: 'score', precision: 2 },
        speed: 180, showDetail: true, autoStart: false
      }));

      /* Pre-fill the result matrix with computed logits and highlight max per row */
      for (let i = 0; i < logits.length; i++) {
        let maxCol = 0;
        for (let j = 0; j < logits[i].length; j++) {
          mm.matC.setCellValue(i, j, logits[i][j]);
          if (logits[i][j] > logits[i][maxCol]) maxCol = j;
        }
        mm.matC.highlightCell(i, maxCol, 'mtx-cell--active');
      }
      mm.matC.highlightRow(logits.length - 1, 'mtx-cell--highlight-row');

      const noteDiv = document.createElement('div');
      noteDiv.className = 'lm-head-note';
      noteDiv.innerHTML = t(T(
        `<b>🎓 Training:</b> compute all ${n} row${n > 1 ? 's' : ''} — each row predicts its next token, providing ${n} loss signals in one forward pass.`
        + `<br><b>⚡ Inference:</b> only the <em>last row</em> matters → next token = ${pred.best}`
        + `<br><br><b>💡 Can we skip earlier rows at inference?</b>`
        + `<br>• <b>LM Head / FFN:</b> Yes! Each token is independent — only compute the last one.`
        + `<br>• <b>Self-Attention:</b> No — the last token must attend to <i>all</i> previous K and V. But we can <b>cache</b> them!`
        + `<br>• <b>KV Cache:</b> Cache previous tokens' K,V. Each new step only computes 1 new K,V row instead of recomputing the full sequence. Complexity drops from O(n²) → O(n) per step.`,

        `<b>🎓 训练时：</b>计算全部 ${n} 行 — 每行预测下一个 token，一次前向传播提供 ${n} 个 loss 信号。`
        + `<br><b>⚡ 推理时：</b>只需<em>最后一行</em> → 下一个 token = ${pred.best}`
        + `<br><br><b>💡 推理时能不能偷懒不算前面的行？</b>`
        + `<br>• <b>LM Head / FFN：</b>可以！每个 token 独立处理，只需算最后一个。`
        + `<br>• <b>Self-Attention：</b>不行 — 最后一个 token 的 Q 必须和<i>所有</i>前面 token 的 K、V 做注意力计算。但可以<b>缓存</b>它们！`
        + `<br>• <b>KV Cache：</b>缓存已计算的 K、V。每步只需算 1 个新 token 的 K、V，不重复计算整个序列。复杂度从 O(n²) 降到 O(n)。`
      ));
      container.appendChild(noteDiv);
    }
  },

  softmax: {
    kicker: T('Token Selection', 'Token 选择'),
    title:  T('Softmax', 'Softmax'),
    desc:   T('Normalize logits into probability distribution for next-token prediction.',
              '将 logits 归一化为概率分布，用于下一个 token 的预测。'),
    formulas: ['p_i = exp(logit_i) / Σ_j exp(logit_j)'],
    dims: ['input logits: 1×V', 'output probs: 1×V', 'Σ probs = 1'],
    flow: {
      en: ['Exponentiate each logit value.','Compute partition sum across vocabulary.','Divide each exponent by the sum.','Sample or argmax to pick next token.'],
      zh: ['对每个 logit 值取指数。','计算整个词表上的归一化和。','将每个指数除以总和。','通过采样或 argmax 选取下一个 token。']
    },
    renderDemo(container) { renderSoftmaxDemo(container); }
  }
};

/* ============================================================
   Module Activation
   ============================================================ */
let currentModuleId = 'token-embedding';

function activateModule(moduleId) {
  const moduleData = MODULES[moduleId];
  if (!moduleData) return;
  currentModuleId = moduleId;

  allModules.forEach(el => el.classList.toggle('is-active', el.dataset.module === moduleId));

  detailKicker.textContent = t(moduleData.kicker);
  detailTitle.textContent  = t(moduleData.title);
  detailDesc.textContent   = t(moduleData.desc);
  createChips(formulaRow, moduleData.formulas, 'formula-chip');
  createChips(dimRow, moduleData.dims, 'dim-chip');
  createFlowList(flowList, tList(moduleData.flow));

  resources.clear();
  matrixDemo.innerHTML = '';
  moduleData.renderDemo(matrixDemo);
}

/* ============================================================
   Event Listeners — Click-only activation (no hover)
   ============================================================ */
outerNodes.forEach(node => {
  const moduleId = node.dataset.module;
  node.addEventListener('click', () => activateModule(moduleId));
  node.addEventListener('focus', () => activateModule(moduleId));
});

layerBlocks.forEach(block => {
  const moduleId = block.dataset.module;
  block.addEventListener('click', e => { e.stopPropagation(); activateModule(moduleId); });
  block.addEventListener('focus', () => activateModule(moduleId));
});

langToggle.addEventListener('click', () => {
  i18n.toggle();
  renderStepBar();
  activateModule(currentModuleId);
});

stepPrevBtn.addEventListener('click', () => setStep(currentStep - 1));
stepNextBtn.addEventListener('click', () => setStep(currentStep + 1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  setStep(currentStep - 1);
  if (e.key === 'ArrowRight') setStep(currentStep + 1);
});

/* ============================================================
   Init
   ============================================================ */
i18n.updateDOM();
renderStepBar();
activateModule('token-embedding');
