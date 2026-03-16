/* ============================================================
   Attention Visualizer - Interactive Autoregressive Demo
   Uses common MatrixComponent, HeatmapComponent, MatrixMath
   ============================================================ */

/* ---- Sample Data (language-specific prompts) ---- */
const SEQUENCE_DATA = {
  zh: {
    tokens: ['我', '爱', '编', '程'],
    embeddings: {
      '我': [0.5, 0.2, 0.8, 0.1],
      '爱': [0.3, 0.9, 0.4, 0.6],
      '编': [0.7, 0.5, 0.2, 0.8],
      '程': [0.4, 0.6, 0.7, 0.3]
    }
  },
  en: {
    tokens: ['I', 'love', 'to', 'code'],
    embeddings: {
      'I':    [0.5, 0.2, 0.8, 0.1],
      'love': [0.3, 0.9, 0.4, 0.6],
      'to':   [0.7, 0.5, 0.2, 0.8],
      'code': [0.4, 0.6, 0.7, 0.3]
    }
  }
};
const EMBEDDING_DIM = 4;
const MAX_STEPS = 4;

/** Get the input token sequence for current language */
function getInputSequence() {
  const lang = i18n ? i18n.getLang() : 'zh';
  return SEQUENCE_DATA[lang].tokens;
}

/** Get the embedding lookup table for current language */
function getEmbeddingTable() {
  const lang = i18n ? i18n.getLang() : 'zh';
  return SEQUENCE_DATA[lang].embeddings;
}

const W_Q = [
  [0.2, 0.5, 0.3, 0.8],
  [0.7, 0.1, 0.6, 0.4],
  [0.3, 0.9, 0.2, 0.5],
  [0.6, 0.4, 0.7, 0.2]
];
const W_K = [
  [0.5, 0.3, 0.7, 0.2],
  [0.1, 0.8, 0.4, 0.6],
  [0.9, 0.2, 0.5, 0.3],
  [0.4, 0.7, 0.1, 0.8]
];
const W_V = [
  [0.8, 0.2, 0.6, 0.3],
  [0.4, 0.9, 0.1, 0.5],
  [0.2, 0.6, 0.8, 0.4],
  [0.7, 0.3, 0.5, 0.1]
];

/* ---- i18n Translations ---- */
const TRANSLATIONS = {
  en: {
    title: 'Transformer Autoregressive Process',
    subtitle: 'Step-by-step visualization of how Transformer generates tokens one at a time using self-attention.',
    back: 'Back',
    timeStep: 'Step',
    seqLen: 'Seq Len',
    prev: 'Prev',
    next: 'Next',
    section: {
      sequence: 'Input Sequence',
      sequenceDesc: 'The model generates tokens left-to-right. At each step, only previously generated tokens are visible.',
      embedding: 'Embedding Lookup',
      embeddingDesc: 'Each token is mapped to a dense vector through the embedding table.',
      projection: 'Q, K, V Projections',
      projectionDesc: 'Linear projections create Query, Key, and Value matrices from embeddings.',
      scores: 'Attention Score Computation',
      scoresDesc: 'QK^T → Scale → Causal Mask → Softmax produces attention weights.',
      heatmap: 'Attention Weights Heatmap',
      heatmapDesc: 'Visualizing how much each token attends to others.',
      output: 'Weighted Output',
      outputDesc: 'Final contextual representation: Z = Attention × V'
    },
    formula: {
      qkv: 'Q = E·W_Q   K = E·W_K   V = E·W_V',
      attention: 'Attention = Softmax( QK^T / √d_k )',
      output: 'Z = Attention × V'
    },
    matrix: {
      embedding: 'E',
      wq: 'W_Q', wk: 'W_K', wv: 'W_V',
      q: 'Q', k: 'K', v: 'V',
      qkt: 'QK^T', scaled: 'Scaled', masked: 'Masked', softmax: 'Softmax',
      attention: 'Attention', output: 'Z'
    },
    lang: 'EN / 中文'
  },
  zh: {
    title: 'Transformer 自回归计算过程',
    subtitle: '逐步可视化 Transformer 如何通过自注意力机制逐个生成 Token。',
    back: '返回',
    timeStep: '时间步',
    seqLen: '序列长度',
    prev: '上一步',
    next: '下一步',
    section: {
      sequence: '输入序列',
      sequenceDesc: '模型从左到右生成 Token。每一步只能看到之前已生成的 Token。',
      embedding: '词嵌入查找',
      embeddingDesc: '每个 Token 通过嵌入表映射为一个稠密向量。',
      projection: 'Q, K, V 线性投影',
      projectionDesc: '通过线性变换从词嵌入生成 Query、Key、Value 矩阵。',
      scores: '注意力分数计算',
      scoresDesc: 'QK^T → 缩放 → 因果掩码 → Softmax，得到注意力权重。',
      heatmap: '注意力权重热力图',
      heatmapDesc: '可视化每个 Token 对其他 Token 的关注程度。',
      output: '加权输出',
      outputDesc: '最终的上下文相关表示：Z = Attention × V'
    },
    formula: {
      qkv: 'Q = E·W_Q   K = E·W_K   V = E·W_V',
      attention: 'Attention = Softmax( QK^T / √d_k )',
      output: 'Z = Attention × V'
    },
    matrix: {
      embedding: 'E',
      wq: 'W_Q', wk: 'W_K', wv: 'W_V',
      q: 'Q', k: 'K', v: 'V',
      qkt: 'QK^T', scaled: 'Scaled', masked: 'Masked', softmax: 'Softmax',
      attention: 'Attention', output: 'Z'
    },
    lang: '中文 / EN'
  }
};

/* ---- App State ---- */
let currentStep = 0;
let isAnimating = false;
let i18n;

/* Component references (destroyed & rebuilt on each update) */
let matComponents = {};

/* ---- Initialization ---- */
function initApp() {
  // Setup i18n
  i18n = new I18n({
    defaultLang: 'zh',
    translations: TRANSLATIONS,
    storageKey: 'attention-viz-lang'
  });

  // Bind navigation
  document.getElementById('prevBtn').addEventListener('click', prevStep);
  document.getElementById('nextBtn').addEventListener('click', nextStep);
  document.getElementById('langToggle').addEventListener('click', () => {
    i18n.toggle();
    updateAll();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevStep();
    if (e.key === 'ArrowRight') nextStep();
  });

  // Initial render
  updateAll();
}

/* ---- Navigation ---- */
function prevStep() {
  if (isAnimating || currentStep <= 0) return;
  isAnimating = true;
  currentStep--;
  updateAll();
  setTimeout(() => { isAnimating = false; }, 400);
}

function nextStep() {
  if (isAnimating || currentStep >= MAX_STEPS - 1) return;
  isAnimating = true;
  currentStep++;
  updateAll();
  setTimeout(() => { isAnimating = false; }, 400);
}

/* ---- Master Update ---- */
function updateAll() {
  const t = i18n.t.bind(i18n);
  const seq = getInputSequence().slice(0, currentStep + 1);

  // Update text content
  document.querySelector('.page-title').textContent = t('title');
  document.querySelector('.page-subtitle').textContent = t('subtitle');
  document.querySelector('.back-link span').textContent = t('back');

  // Step nav
  document.getElementById('stepLabel').textContent = t('timeStep');
  document.getElementById('stepValue').textContent = currentStep + 1;
  document.getElementById('seqLabel').textContent = t('seqLen');
  document.getElementById('seqValue').textContent = seq.length;
  document.getElementById('prevBtn').textContent = t('prev');
  document.getElementById('nextBtn').textContent = t('next');
  document.getElementById('prevBtn').disabled = currentStep === 0;
  document.getElementById('nextBtn').disabled = currentStep === MAX_STEPS - 1;
  document.getElementById('langToggle').textContent = t('lang');

  // Section titles & descriptions
  const sections = ['sequence', 'embedding', 'projection', 'scores', 'heatmap', 'output'];
  sections.forEach(s => {
    const titleEl = document.getElementById(`${s}Title`);
    const descEl = document.getElementById(`${s}Desc`);
    if (titleEl) titleEl.textContent = t(`section.${s}`);
    if (descEl) descEl.textContent = t(`section.${s}Desc`);
  });

  // Render sections
  renderSequence(seq, t);
  renderEmbedding(seq, t);
  renderProjection(seq, t);
  renderScores(seq, t);
  renderHeatmap(seq, t);
  renderOutput(seq, t);
}

/* ---- Render: Token Sequence ---- */
function renderSequence(seq) {
  const container = document.getElementById('tokenBar');
  container.innerHTML = '';

  getInputSequence().forEach((token, idx) => {
    if (idx > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'token-arrow';
      arrow.textContent = '→';
      container.appendChild(arrow);
    }

    const chip = document.createElement('div');
    chip.className = 'token-chip';

    if (idx < currentStep) {
      chip.classList.add('token-chip--active');
      chip.textContent = token;
    } else if (idx === currentStep) {
      chip.classList.add('token-chip--current');
      chip.textContent = token;
    } else {
      chip.classList.add('token-chip--future');
      chip.textContent = '?';
    }

    chip.setAttribute('aria-label', idx <= currentStep ? token : 'Unknown token');
    container.appendChild(chip);
  });
}

/* ---- Render: Embedding Lookup ---- */
function renderEmbedding(seq, t) {
  const container = document.getElementById('embeddingArea');
  container.innerHTML = '';

  const lang = i18n.getLang();

  // Main layout: vocab table → arrow → result matrix
  const layout = document.createElement('div');
  layout.className = 'embedding-layout';

  // LEFT: Vocabulary Embedding Table
  const vocabSection = document.createElement('div');
  vocabSection.className = 'embedding-vocab';

  const vocabTitle = document.createElement('div');
  vocabTitle.className = 'embedding-vocab__title';
  vocabTitle.textContent = lang === 'zh' ? '词嵌入表（全部词汇）' : 'Embedding Table (All Tokens)';
  vocabSection.appendChild(vocabTitle);

  const vocabTable = document.createElement('div');
  vocabTable.className = 'embedding-vocab__table';

  // Header row for dimension labels
  const headerRow = document.createElement('div');
  headerRow.className = 'embedding-vocab__row embedding-vocab__row--header';
  const headerToken = document.createElement('div');
  headerToken.className = 'embedding-vocab__token';
  headerToken.textContent = lang === 'zh' ? '词' : 'Token';
  headerRow.appendChild(headerToken);
  const headerArrow = document.createElement('div');
  headerArrow.className = 'embedding-vocab__arrow';
  headerArrow.textContent = '';
  headerRow.appendChild(headerArrow);
  const headerVector = document.createElement('div');
  headerVector.className = 'embedding-vocab__vector';
  headerVector.textContent = lang === 'zh' ? '嵌入向量' : 'Embedding Vector';
  headerRow.appendChild(headerVector);
  const headerStatus = document.createElement('div');
  headerStatus.className = 'embedding-vocab__status';
  headerStatus.textContent = '';
  headerRow.appendChild(headerStatus);
  vocabTable.appendChild(headerRow);

  // Show all vocabulary entries, highlight active tokens
  getInputSequence().forEach((token) => {
    const isActive = seq.includes(token);
    const row = document.createElement('div');
    row.className = `embedding-vocab__row${isActive ? ' embedding-vocab__row--active' : ''}`;

    const tokenLabel = document.createElement('div');
    tokenLabel.className = 'embedding-vocab__token';
    tokenLabel.textContent = token;
    row.appendChild(tokenLabel);

    const arrow = document.createElement('div');
    arrow.className = 'embedding-vocab__arrow';
    arrow.textContent = '→';
    row.appendChild(arrow);

    const vector = document.createElement('div');
    vector.className = 'embedding-vocab__vector';
    const vals = getEmbeddingTable()[token].map(v => v.toFixed(1));
    vector.textContent = `[${vals.join(', ')}]`;
    row.appendChild(vector);

    const status = document.createElement('div');
    status.className = 'embedding-vocab__status';
    if (isActive) {
      status.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    }
    row.appendChild(status);

    vocabTable.appendChild(row);
  });

  vocabSection.appendChild(vocabTable);
  layout.appendChild(vocabSection);

  // CENTER: Lookup arrow
  const lookupArrow = document.createElement('div');
  lookupArrow.className = 'embedding-lookup-arrow';
  const arrowLabel = document.createElement('span');
  arrowLabel.className = 'embedding-lookup-arrow__label';
  arrowLabel.textContent = lang === 'zh' ? '查表提取' : 'Lookup';
  lookupArrow.appendChild(arrowLabel);
  const arrowIcon = document.createElement('span');
  arrowIcon.className = 'embedding-lookup-arrow__icon';
  arrowIcon.textContent = '⟹';
  lookupArrow.appendChild(arrowIcon);
  const arrowDesc = document.createElement('span');
  arrowDesc.className = 'embedding-lookup-arrow__desc';
  arrowDesc.textContent = lang === 'zh'
    ? `提取 ${seq.length} 行`
    : `Extract ${seq.length} row${seq.length > 1 ? 's' : ''}`;
  lookupArrow.appendChild(arrowDesc);
  layout.appendChild(lookupArrow);

  // RIGHT: Result embedding matrix
  const resultSection = document.createElement('div');
  resultSection.className = 'embedding-result';

  const embeddings = seq.map(token => getEmbeddingTable()[token]);
  new MatrixComponent(resultSection, {
    data: embeddings,
    label: t('matrix.embedding'),
    colorScheme: 'weight',
    precision: 1,
    rowLabels: seq,
    showDims: true,
    annotation: `${seq.length}×${EMBEDDING_DIM}`
  });

  layout.appendChild(resultSection);
  container.appendChild(layout);
}

/* ---- Render: QKV Projections ---- */
function renderProjection(seq, t) {
  const container = document.getElementById('projectionArea');
  container.innerHTML = '';

  const lang = i18n.getLang();
  const embeddings = seq.map(token => getEmbeddingTable()[token]);
  const Q = MatrixMath.multiply(embeddings, W_Q);
  const K = MatrixMath.multiply(embeddings, W_K);
  const V = MatrixMath.multiply(embeddings, W_V);

  // Formula row
  const formula = document.createElement('div');
  formula.className = 'formula-row';
  formula.innerHTML = `
    <span class="f-eq"><span class="f-var f-var--q">Q</span> <span class="f-op">=</span> <span class="f-var">E</span> · <span class="f-var">W</span><sub>Q</sub></span>
    <span class="f-eq"><span class="f-var f-var--k">K</span> <span class="f-op">=</span> <span class="f-var">E</span> · <span class="f-var">W</span><sub>K</sub></span>
    <span class="f-eq"><span class="f-var f-var--v">V</span> <span class="f-op">=</span> <span class="f-var">E</span> · <span class="f-var">W</span><sub>V</sub></span>
  `;
  container.appendChild(formula);

  // Description
  const desc = document.createElement('div');
  desc.className = 'step-desc';
  desc.textContent = lang === 'zh'
    ? 'Q = 查询（我要找什么）  K = 键（我能匹配什么）  V = 值（我携带什么信息）'
    : 'Q = Query (what to look for)  K = Key (what to match)  V = Value (what info to carry)';
  container.appendChild(desc);

  // Weight matrices row
  const weightsRow = document.createElement('div');
  weightsRow.className = 'matrix-row-layout';
  weightsRow.style.marginBottom = 'var(--space-8)';

  const wqDiv = document.createElement('div');
  const wkDiv = document.createElement('div');
  const wvDiv = document.createElement('div');

  new MatrixComponent(wqDiv, { data: W_Q, label: 'W_Q', colorScheme: 'query', precision: 1, showDims: true });
  new MatrixComponent(wkDiv, { data: W_K, label: 'W_K', colorScheme: 'key', precision: 1, showDims: true });
  new MatrixComponent(wvDiv, { data: W_V, label: 'W_V', colorScheme: 'value', precision: 1, showDims: true });

  weightsRow.appendChild(wqDiv);
  weightsRow.appendChild(wkDiv);
  weightsRow.appendChild(wvDiv);
  container.appendChild(weightsRow);

  // Arrow
  const arrowDiv = document.createElement('div');
  arrowDiv.className = 'flow-arrow';
  arrowDiv.style.textAlign = 'center';
  arrowDiv.style.margin = 'var(--space-4) 0';
  arrowDiv.textContent = '↓';
  arrowDiv.style.fontSize = 'var(--text-2xl)';
  container.appendChild(arrowDiv);

  // Result matrices
  const resultRow = document.createElement('div');
  resultRow.className = 'matrix-row-layout';

  const qDiv = document.createElement('div');
  const kDiv = document.createElement('div');
  const vDiv = document.createElement('div');

  new MatrixComponent(qDiv, { data: Q, label: 'Q', colorScheme: 'query', rowLabels: seq, showDims: true });
  new MatrixComponent(kDiv, { data: K, label: 'K', colorScheme: 'key', rowLabels: seq, showDims: true });
  new MatrixComponent(vDiv, { data: V, label: 'V', colorScheme: 'value', rowLabels: seq, showDims: true });

  resultRow.appendChild(qDiv);
  resultRow.appendChild(kDiv);
  resultRow.appendChild(vDiv);
  container.appendChild(resultRow);
}

/* ---- Render: Attention Scores ---- */
function renderScores(seq, t) {
  const container = document.getElementById('scoresArea');
  container.innerHTML = '';

  const lang = i18n.getLang();
  const embeddings = seq.map(token => getEmbeddingTable()[token]);
  const Q = MatrixMath.multiply(embeddings, W_Q);
  const K = MatrixMath.multiply(embeddings, W_K);

  // QK^T
  const KT = MatrixMath.transpose(K);
  const QKT = MatrixMath.multiply(Q, KT);

  // Scale
  const scale = Math.sqrt(EMBEDDING_DIM);
  const scaled = QKT.map(row => row.map(v => +(v / scale).toFixed(4)));

  // Causal mask
  const masked = scaled.map((row, i) =>
    row.map((v, j) => j > i ? -Infinity : v)
  );

  // Softmax
  const weights = masked.map(row => {
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => +(e / sum).toFixed(4));
  });

  // Formula — proper math typography
  const formula = document.createElement('div');
  formula.className = 'formula-bar';
  formula.innerHTML = `
    <span class="f-var f-var--attn">Attention</span>
    <span class="f-op">=</span>
    <span class="f-fn">Softmax</span>
    <span class="f-paren">(</span>
    <span class="f-var f-var--q">Q</span><span class="f-var f-var--k">K</span><sup>T</sup>
    <span class="f-op">/</span>
    √<span class="f-var">d</span><sub>k</sub>
    <span class="f-paren">)</span>
  `;
  container.appendChild(formula);

  // Step description
  const desc = document.createElement('div');
  desc.className = 'step-desc';
  desc.textContent = lang === 'zh'
    ? '先点积 → 再缩放 → 掩码未来 → 归一化为概率'
    : 'dot product → scale → mask future → normalize to probabilities';
  container.appendChild(desc);

  // Computation flow — aligned cards
  const flow = document.createElement('div');
  flow.className = 'computation-flow';
  flow.style.marginTop = 'var(--space-6)';

  // Step 1: QK^T — mask upper triangle as gray
  const qktCard = createFlowStepCardWithMask(
    QKT, 'QK^T', 'score', seq, seq, null,
    lang === 'zh' ? 'Q · K 的转置，衡量相似度' : 'Q · transpose of K, measures similarity'
  );
  flow.appendChild(qktCard);
  flow.appendChild(createFlowArrow('→'));

  // Step 2: Scaled — show masked upper triangle as gray
  const scaledFull = scaled.map((row, i) => row.map((v, j) => j > i ? 0 : v));
  const scaledCard = createFlowStepCardWithMask(
    scaledFull, 'Scaled', 'score', seq, seq,
    (i, j) => j > i,
    lang === 'zh' ? `÷ √d = ÷ ${scale.toFixed(0)}，防止梯度消失` : `÷ √d = ÷ ${scale.toFixed(0)}, prevent vanishing gradients`
  );
  flow.appendChild(scaledCard);
  flow.appendChild(createFlowArrow('→'));

  // Step 3: Attention weights — mask upper triangle
  const softmaxCard = createFlowStepCardWithMask(
    weights, 'Attention', 'output', seq, seq,
    (i, j) => weights[i][j] === 0 && j > i,
    lang === 'zh' ? '掩码 + Softmax，归一化为概率' : 'Mask + Softmax, normalize to probabilities'
  );
  flow.appendChild(softmaxCard);

  container.appendChild(flow);
}

/**
 * Create a flow step card with matrix + description,
 * and gray out masked cells (upper triangle).
 * @param {Function|null} maskFn - (i, j) => boolean, true = gray out
 */
function createFlowStepCardWithMask(data, label, colorScheme, rowLabels, colLabels, maskFn, desc) {
  const card = document.createElement('div');
  card.className = 'flow-step-card';

  const mtxWrap = document.createElement('div');
  const mtx = new MatrixComponent(mtxWrap, {
    data: data,
    label: label,
    colorScheme: colorScheme,
    rowLabels: rowLabels,
    colLabels: colLabels,
    showDims: true
  });

  // Apply gray mask to upper triangle cells
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

/* ---- Render: Heatmap ---- */
function renderHeatmap(seq, t) {
  const container = document.getElementById('heatmapArea');
  container.innerHTML = '';

  const embeddings = seq.map(token => getEmbeddingTable()[token]);
  const Q = MatrixMath.multiply(embeddings, W_Q);
  const K = MatrixMath.multiply(embeddings, W_K);
  const KT = MatrixMath.transpose(K);
  const QKT = MatrixMath.multiply(Q, KT);
  const scale = Math.sqrt(EMBEDDING_DIM);
  const scaled = QKT.map(row => row.map(v => +(v / scale).toFixed(4)));
  const masked = scaled.map((row, i) =>
    row.map((v, j) => j > i ? -Infinity : v)
  );
  const weights = masked.map(row => {
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => +(e / sum).toFixed(4));
  });

  const heatmapWrap = document.createElement('div');
  heatmapWrap.className = 'heatmap-container';

  new HeatmapComponent(heatmapWrap, {
    data: weights,
    rowLabels: seq,
    colLabels: seq,
    title: t('section.heatmap'),
    precision: 2,
    colorHigh: [30, 64, 175],
    rowAxis: 'Query',
    colAxis: 'Key',
    lowLabel: '0.00',
    highLabel: '1.00'
  });

  container.appendChild(heatmapWrap);
}

/* ---- Render: Weighted Output ---- */
function renderOutput(seq, t) {
  const container = document.getElementById('outputArea');
  container.innerHTML = '';

  const embeddings = seq.map(token => getEmbeddingTable()[token]);
  const Q = MatrixMath.multiply(embeddings, W_Q);
  const K = MatrixMath.multiply(embeddings, W_K);
  const V = MatrixMath.multiply(embeddings, W_V);
  const KT = MatrixMath.transpose(K);
  const QKT = MatrixMath.multiply(Q, KT);
  const scale = Math.sqrt(EMBEDDING_DIM);
  const scaled = QKT.map(row => row.map(v => +(v / scale).toFixed(4)));
  const masked = scaled.map((row, i) =>
    row.map((v, j) => j > i ? -Infinity : v)
  );
  const weights = masked.map(row => {
    const validMax = Math.max(...row.filter(v => v !== -Infinity));
    const exps = row.map(v => v === -Infinity ? 0 : Math.exp(v - validMax));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => +(e / sum).toFixed(4));
  });

  const lang = i18n.getLang();

  // Formula
  const formula = document.createElement('div');
  formula.className = 'formula-bar';
  formula.innerHTML = `
    <span class="f-var f-var--z">Z</span>
    <span class="f-op">=</span>
    <span class="f-var f-var--attn">Attention</span>
    <span class="f-op">×</span>
    <span class="f-var f-var--v">V</span>
  `;
  container.appendChild(formula);

  // Description
  const desc = document.createElement('div');
  desc.className = 'step-desc';
  desc.textContent = lang === 'zh'
    ? '用注意力权重对 V 加权求和，得到每个 Token 融合上下文后的最终表示'
    : 'Weighted sum of V using attention weights → each token gets a context-aware representation';
  container.appendChild(desc);

  // Use MatrixMultiplication for animated display
  const multiplyDiv = document.createElement('div');
  multiplyDiv.style.marginTop = 'var(--space-6)';

  new MatrixMultiplication(multiplyDiv, {
    matA: {
      data: weights,
      label: 'Attention',
      colorScheme: 'score',
      rowLabels: seq,
      precision: 2
    },
    matB: {
      data: V,
      label: 'V',
      colorScheme: 'value',
      precision: 2
    },
    resultConfig: {
      label: 'Z',
      colorScheme: 'output',
      precision: 2
    },
    speed: 200,
    showDetail: true,
    labels: {
      play: '▶ Play',
      pause: '⏸ Pause',
      step: '⏭ Step',
      reset: '↺ Reset',
      done: '✓ Done',
      speed: 'Speed',
      startHint: 'Click "Play" to animate the multiplication',
      complete: '✓ Z = Attention × V computed!'
    }
  });

  container.appendChild(multiplyDiv);
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', initApp);
