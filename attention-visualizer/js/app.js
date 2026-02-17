/* ============================================================
   Attention Mechanism — Application Logic
   
   This file contains ONLY the attention-specific computation
   and rendering logic. Reusable components live in common/:
     - common/js/matrix.js  → MatrixComponent, MatrixMultiplication,
                               StepAnimator, HeatmapComponent, MatrixMath
     - common/js/i18n.js    → I18n class
     - common/css/tokens.css → Design tokens
     - common/css/matrix.css → Matrix component styles
   ============================================================ */

/* ---- Translation Strings ---- */
const TRANSLATIONS = {
  en: {
    lang: { label: '中文', code: 'EN' },
    hero: {
      eyebrow: 'Interactive Visualization',
      title: 'Attention Is All You <em>Need</em>',
      subtitle: 'Scroll through the complete self-attention pipeline. Every matrix multiplication is animated and interactive.'
    },
    step1: {
      title: 'Input Embeddings',
      desc: 'Each token is converted to a <code>Token ID</code> via a tokenizer, then the ID looks up a row in a learned <code>Embedding Table E</code> (shape: vocab_size × d, where <code>d=4</code> in this demo). The looked-up rows are stacked to form input matrix <code>X</code>.',
      callout: 'The embedding table is learned during training. In GPT-2 it is 50257 × 768. Here we use d=4 (a tiny 1000 × 4 table) so you can see every number.',
      vocabTh: ['Row', 'Token', 'd₁', 'd₂', 'd₃', 'd₄'],
      flowLabel1: 'Tokenize',
      flowLabel2: 'Lookup row from E',
      flowLabel3: 'Stack rows → matrix X',
      sentenceLabel: 'Input Sentence',
      idsLabel: 'Token IDs'
    },
    step2: {
      title: 'Linear Projections — Q, K, V',
      desc: 'X is multiplied by three learned <code>square</code> weight matrices (d×d) simultaneously. <code>Q</code> = "what am I looking for?", <code>K</code> = "what do I contain?", <code>V</code> = "what info do I carry?".',
      btnCompute: 'Compute All Q, K, V',
      callout: 'Wq, Wk, Wv are all d×d square matrices. In multi-head attention each head uses d_model/h dimensions; here we show single-head for clarity.'
    },
    step3: {
      title: 'Attention Scores & Weights',
      desc: 'Compute <code>Q × K<sup>T</sup></code>, divide by <code>√d<sub>k</sub></code> to stabilize gradients, then apply row-wise <code>softmax</code> so each row sums to 1.',
      scaledLabel: 'Scaled',
      weightsLabel: 'Weights',
      callout: 'Each row of the final weights is a probability distribution (0–1) — it shows how much each token "pays attention" to every other token.',
      legendLow: 'Low',
      legendHigh: 'High'
    },
    step4: {
      title: 'Weighted Output',
      desc: 'Multiply attention weights by <code>V</code>. Each output row is a weighted combination of all Value vectors.',
      callout: 'Core insight: each token\'s output = weighted sum of all tokens\' Values, weighted by query-key compatibility.'
    },
    controls: {
      play: '▶ Play', pause: '⏸ Pause', step: '⏭ Step',
      reset: '↺ Reset', done: '✓ Done', speed: 'Speed',
      startHint: 'Click "Play" to start', complete: '✓ Complete!'
    },
    footer: { text: 'Interactive Attention Mechanism Visualizer — Built for learning.' }
  },

  zh: {
    lang: { label: 'EN', code: '中文' },
    hero: {
      eyebrow: '交互式可视化',
      title: 'Attention <em>注意力机制</em>',
      subtitle: '向下滚动浏览完整的自注意力流水线。每一步矩阵乘法都可交互、可动画演示。'
    },
    step1: {
      title: '输入嵌入',
      desc: '每个 token 先通过分词器转为 <code>Token ID</code>，然后用 ID 从学习到的<code>嵌入表 E</code>（形状：词表大小 × d，本演示 <code>d=4</code>）中查找对应行。查找到的行堆叠形成输入矩阵 <code>X</code>。',
      callout: '嵌入表在训练中学习。GPT-2 的嵌入表为 50257 × 768。这里使用 d=4（1000 × 4 的小型表格），让你能看清每一个数字。',
      vocabTh: ['行号', '词元', 'd₁', 'd₂', 'd₃', 'd₄'],
      flowLabel1: '分词',
      flowLabel2: '从 E 中查找对应行',
      flowLabel3: '堆叠行向量 → 矩阵 X',
      sentenceLabel: '输入句子',
      idsLabel: 'Token IDs'
    },
    step2: {
      title: '线性投影 — Q, K, V',
      desc: 'X 同时乘以三个学习到的 <code>方阵</code>权重矩阵（d×d）。<code>Q</code> = "我在找什么？"，<code>K</code> = "我有什么？"，<code>V</code> = "我携带什么信息？"。',
      btnCompute: '一键计算 Q, K, V',
      callout: 'Wq、Wk、Wv 都是 d×d 的方阵。在多头注意力中每个头使用 d_model/h 维度；这里展示单头以简化理解。'
    },
    step3: {
      title: '注意力分数与权重',
      desc: '计算 <code>Q × K<sup>T</sup></code>，除以 <code>√d<sub>k</sub></code> 以稳定梯度，再按行应用 <code>softmax</code> 使每行之和为 1。',
      scaledLabel: '缩放后',
      weightsLabel: '权重',
      callout: '最终权重每一行是一个概率分布（0–1）—— 表示每个 token 对其他所有 token 的"关注度"。',
      legendLow: '低',
      legendHigh: '高'
    },
    step4: {
      title: '加权输出',
      desc: '将注意力权重乘以 <code>V</code>。每个输出行是所有 Value 向量的加权组合。',
      callout: '核心洞察：每个 token 的输出 = 所有 token 的 Value 的加权求和，权重由 Q-K 兼容性决定。'
    },
    controls: {
      play: '▶ 播放', pause: '⏸ 暂停', step: '⏭ 下一步',
      reset: '↺ 重置', done: '✓ 完成', speed: '速度',
      startHint: '点击"播放"开始', complete: '✓ 完成！'
    },
    footer: { text: '交互式注意力机制可视化 — 为学习而构建。' }
  }
};

/* ---- Demo Data ---- */
const TOKENS = ['I', 'love', 'AI'];
const TOKEN_IDS = [42, 156, 891];

const DATA = {
  X: [
    [0.8, 0.2, 0.5, 0.1],
    [0.3, 0.9, 0.1, 0.7],
    [0.6, 0.4, 0.8, 0.3]
  ],
  /* Square weight matrices (4×4) — d_model × d_model */
  Wq: [
    [0.5, 0.3, 0.2, 0.4],
    [0.1, 0.8, 0.4, 0.2],
    [0.7, 0.2, 0.6, 0.3],
    [0.3, 0.5, 0.1, 0.7]
  ],
  Wk: [
    [0.4, 0.6, 0.1, 0.5],
    [0.2, 0.3, 0.7, 0.1],
    [0.5, 0.1, 0.8, 0.4],
    [0.6, 0.4, 0.2, 0.3]
  ],
  Wv: [
    [0.3, 0.7, 0.5, 0.2],
    [0.8, 0.1, 0.3, 0.6],
    [0.2, 0.5, 0.6, 0.4],
    [0.4, 0.3, 0.8, 0.1]
  ]
};

const DERIVED = {};
function recompute() {
  DERIVED.Q = MatrixMath.multiply(DATA.X, DATA.Wq);
  DERIVED.K = MatrixMath.multiply(DATA.X, DATA.Wk);
  DERIVED.V = MatrixMath.multiply(DATA.X, DATA.Wv);
  DERIVED.Kt = MatrixMath.transpose(DERIVED.K);
  DERIVED.scores = MatrixMath.multiply(DERIVED.Q, DERIVED.Kt);
  const dk = DATA.Wq[0].length;
  DERIVED.scaled = MatrixMath.scale(DERIVED.scores, 1 / Math.sqrt(dk));
  DERIVED.weights = MatrixMath.softmax(DERIVED.scaled);
  DERIVED.output = MatrixMath.multiply(DERIVED.weights, DERIVED.V);
}
recompute();

/* ---- State ---- */
let i18n;

/* ---- Initialization ---- */
document.addEventListener('DOMContentLoaded', () => {
  i18n = new I18n({
    defaultLang: 'en',
    translations: TRANSLATIONS,
    storageKey: 'attn-viz-lang'
  });

  const langBtn = document.getElementById('lang-toggle');
  langBtn.addEventListener('click', () => {
    i18n.toggle();
    renderAll();
  });

  i18n.onChange(lang => {
    i18n.updateDOM();
    langBtn.textContent = i18n.t('lang.label');
  });

  i18n.updateDOM();
  langBtn.textContent = i18n.t('lang.label');

  renderAll();
});

function renderAll() {
  recompute();
  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];
  steps.forEach((fn, idx) => {
    try {
      fn();
    } catch (e) {
      const viz = document.getElementById(`viz-step${idx + 1}`);
      if (viz) {
        viz.innerHTML = `<pre style="color:#fb7185;font-size:13px;padding:16px;white-space:pre-wrap;word-break:break-all;">
Error in Stage ${idx + 1} (${fn.name}):\n${e.message}\n\nStack:\n${e.stack}</pre>`;
      }
      console.error(`Stage ${idx + 1} error:`, e);
    }
  });
}

/* ---- Helpers ---- */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/** Build an insight/explanation box. title: string, bodyHtml: string */
function buildInsight(title, bodyHtml) {
  const box = el('div', 'insight');
  box.appendChild(el('div', 'insight__title', `📖 ${title}`));
  box.appendChild(el('div', 'insight__body', bodyHtml));
  return box;
}

/** Bilingual text helper: returns en or zh based on current lang */
function bi(en, zh) { return i18n.getLang() === 'zh' ? zh : en; }

/** Get i18n labels for animation controls (overrides DEFAULT_CONTROL_LABELS) */
function getCtrlLabels() {
  const labels = {};
  for (const key of Object.keys(DEFAULT_CONTROL_LABELS)) {
    labels[key] = i18n.t(`controls.${key}`);
  }
  return labels;
}

/**
 * Build heatmap config with shared attention-viz defaults.
 * Only override what differs per call site (title, precision, colorHigh).
 */
function heatmapConfig(data, overrides = {}) {
  return {
    data,
    rowLabels: TOKENS,
    colLabels: TOKENS,
    colorLow: [6, 10, 24],
    colorHigh: [60, 160, 255],
    rowAxis: bi('Query (token i)', '查询 (token i)'),
    colAxis: bi('Key (token j)', '键 (token j)'),
    lowLabel: i18n.t('step4.legendLow'),
    highLabel: i18n.t('step4.legendHigh'),
    ...overrides
  };
}

/* ============================================================
   Stage 1: Token → ID → Embedding Table → X
   ============================================================ */
function renderStep1() {
  const viz = document.getElementById('viz-step1');
  viz.innerHTML = '';

  const t = (k) => i18n.t(`step1.${k}`);
  const vocabTh = TRANSLATIONS[i18n.getLang()].step1.vocabTh;

  const flow = el('div', 'embed-flow');

  // Row 1: sentence → tokenize → IDs
  const row1 = el('div', 'embed-flow__row');

  const sentBox = el('div', '');
  sentBox.appendChild(el('div', 'embed-flow__label', t('sentenceLabel')));
  const chips = el('div', 'tokens tokens--mt');
  TOKENS.forEach(tok => chips.appendChild(el('div', 'token-chip', tok)));
  sentBox.appendChild(chips);
  row1.appendChild(sentBox);

  row1.appendChild(el('div', 'embed-flow__arrow', '→'));
  row1.appendChild(el('div', 'embed-flow__label', t('flowLabel1')));
  row1.appendChild(el('div', 'embed-flow__arrow', '→'));

  const idsBox = el('div', '');
  idsBox.appendChild(el('div', 'embed-flow__label', t('idsLabel')));
  const idsRow = el('div', 'tokens tokens--mt');
  TOKENS.forEach((tok, i) => {
    const chip = el('div', 'token-id');
    chip.innerHTML = `<span class="token-id__word">"${tok}"</span><span class="token-id__num">${TOKEN_IDS[i]}</span>`;
    idsRow.appendChild(chip);
  });
  idsBox.appendChild(idsRow);
  row1.appendChild(idsBox);

  flow.appendChild(row1);

  // Arrow down + label
  flow.appendChild(el('div', 'embed-flow__arrow', '↓'));
  flow.appendChild(el('div', 'embed-flow__label', t('flowLabel2')));

  // Embedding table
  const tw = el('div', 'scroll-x');
  const table = document.createElement('table');
  table.className = 'vocab-table';

  const thead = document.createElement('thead');
  const hRow = document.createElement('tr');
  vocabTh.forEach(h => { const th = document.createElement('th'); th.textContent = h; hRow.appendChild(th); });
  thead.appendChild(hRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const rows = [
    { id: '⋮', tok: '⋮', vals: null, type: 'ellipsis' },
    { id: TOKEN_IDS[0], tok: TOKENS[0], vals: DATA.X[0], type: 'highlight' },
    { id: '⋮', tok: '⋮', vals: null, type: 'ellipsis' },
    { id: TOKEN_IDS[1], tok: TOKENS[1], vals: DATA.X[1], type: 'highlight' },
    { id: '⋮', tok: '⋮', vals: null, type: 'ellipsis' },
    { id: TOKEN_IDS[2], tok: TOKENS[2], vals: DATA.X[2], type: 'highlight' },
    { id: '⋮', tok: '⋮', vals: null, type: 'ellipsis' },
  ];

  rows.forEach(r => {
    const tr = document.createElement('tr');
    if (r.type === 'ellipsis') tr.className = 'vocab-table__ellipsis';
    if (r.type === 'highlight') tr.className = 'vocab-table__highlight';

    const tdId = document.createElement('td'); tdId.textContent = r.id; tr.appendChild(tdId);
    const tdTok = document.createElement('td'); tdTok.textContent = r.type === 'highlight' ? `"${r.tok}"` : '⋮'; tr.appendChild(tdTok);

    if (r.vals) {
      r.vals.forEach(v => { const td = document.createElement('td'); td.textContent = v.toFixed(1); tr.appendChild(td); });
    } else {
      for (let k = 0; k < 4; k++) { const td = document.createElement('td'); td.textContent = '⋮'; tr.appendChild(td); }
    }
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tw.appendChild(table);
  flow.appendChild(tw);

  // Arrow + result X
  flow.appendChild(el('div', 'embed-flow__arrow', '↓'));
  flow.appendChild(el('div', 'embed-flow__label', t('flowLabel3')));

  const xW = el('div', 'mtx-center mtx-center--mt');
  new MatrixComponent(xW, {
    data: DATA.X, label: 'X', colorScheme: 'weight',
    editable: true, precision: 1,
    rowLabels: TOKENS.map((tok, i) => `${tok}[${TOKEN_IDS[i]}]`),
    colLabels: ['d₁', 'd₂', 'd₃', 'd₄']
  }).onChange((i, j, val) => { DATA.X[i][j] = val; recompute(); });
  flow.appendChild(xW);

  viz.appendChild(flow);

  // Insight
  const d = DATA.X[0].length;
  viz.appendChild(buildInsight(
    bi('What does X mean?', 'X 代表什么？'),
    bi(
      `<p>X is a <span class="insight__tag insight__tag--dim">${TOKENS.length} × ${d}</span> matrix. Each row is a <b>${d}-dimensional vector</b> (d=${d} for this demo) representing one token's position in a continuous vector space.</p>
       <p>"<b>${TOKENS[0]}</b>" is represented as [${DATA.X[0].map(v=>v.toFixed(1)).join(', ')}] — a point in ${d}D space. Tokens with similar meanings will have nearby vectors. These embeddings are <b>learned during training</b>, not hand-designed.</p>`,
      `<p>X 是一个 <span class="insight__tag insight__tag--dim">${TOKENS.length} × ${d}</span> 矩阵。每一行是一个 <b>${d} 维向量</b>（本演示 d=${d}），表示一个 token 在连续向量空间中的位置。</p>
       <p>"<b>${TOKENS[0]}</b>" 表示为 [${DATA.X[0].map(v=>v.toFixed(1)).join(', ')}] — ${d} 维空间中的一个点。含义相近的 token 在空间中距离更近。这些嵌入向量是<b>训练过程中学习到的</b>，而非人工设计。</p>`
    )
  ));
}

/* ============================================================
   Stage 2: Parallel Q, K, V (square weight matrices)
   ============================================================ */
function renderStep2() {
  const viz = document.getElementById('viz-step2');
  viz.innerHTML = '';

  // Shared X — keep reference for highlighting
  const xW = el('div', 'mtx-center mtx-center--mb');
  const xMtx = new MatrixComponent(xW, { data: DATA.X, label: 'X', colorScheme: 'weight', precision: 2, rowLabels: TOKENS });
  viz.appendChild(xW);

  viz.appendChild(el('div', 'embed-flow__arrow', '↓'));

  // Three columns — keep references to W matrices and result matrices
  const parallel = el('div', 'qkv-parallel mt-xl');

  const projs = [
    { key: 'Q', w: 'Wq', wD: DATA.Wq, rD: DERIVED.Q, cs: 'query', cls: 'q' },
    { key: 'K', w: 'Wk', wD: DATA.Wk, rD: DERIVED.K, cs: 'key', cls: 'k' },
    { key: 'V', w: 'Wv', wD: DATA.Wv, rD: DERIVED.V, cs: 'value', cls: 'v' }
  ];

  const wMtxComps = [];   // weight matrix components (for highlighting columns)
  const resultComps = [];  // result matrix components

  projs.forEach(p => {
    const col = el('div', `qkv-column qkv-column--${p.cls}`);
    col.appendChild(el('div', 'qkv-column__formula', `${p.key} = X × ${p.w}`));

    // Weight matrix — save reference
    const wW = el('div', 'mtx-size--sm');
    const wComp = new MatrixComponent(wW, { data: p.wD, label: `${p.w} (4×4)`, colorScheme: 'weight', precision: 1, showDims: true });
    wMtxComps.push(wComp);
    col.appendChild(wW);

    col.appendChild(el('div', 'embed-flow__arrow', '↓'));

    // Result matrix (starts empty)
    const rW = el('div', 'mtx-size--md');
    const rMtx = new MatrixComponent(rW, {
      data: p.rD, label: p.key, colorScheme: p.cs,
      precision: 2, startEmpty: true, rowLabels: TOKENS
    });
    resultComps.push({ mtx: rMtx, data: p.rD });
    col.appendChild(rW);

    parallel.appendChild(col);
  });

  viz.appendChild(parallel);

  // Build flat step list: [{mi (matrix index), i (row), j (col)}, ...]
  // Result[mi][i][j] = sum_k( X[i][k] * W[mi][k][j] )
  // So highlight: X row i, W[mi] col j, Result[mi] cell (i,j)
  const steps2 = [];
  resultComps.forEach(({ data }, mi) => {
    for (let i = 0; i < data.length; i++)
      for (let j = 0; j < data[0].length; j++)
        steps2.push({ mi, i, j });
  });

  const insightBox = el('div', '');

  // Clear all highlights helper
  function clearAllHighlights() {
    xMtx.clearHighlights();
    wMtxComps.forEach(w => w.clearHighlights());
    resultComps.forEach(({ mtx }) => mtx.clearHighlights());
  }

  const ctrlWrap = el('div', '');
  viz.appendChild(ctrlWrap);
  new StepAnimator(ctrlWrap, {
    totalSteps: steps2.length,
    speed: 80,
    labels: getCtrlLabels(),
    onStep: (idx) => {
      const s = steps2[idx];
      // Clear previous highlights
      clearAllHighlights();
      // Highlight row i of X (the token embedding being used)
      xMtx.highlightRow(s.i);
      // Highlight column j of the current weight matrix
      wMtxComps[s.mi].highlightCol(s.j);
      // Set and highlight the result cell
      resultComps[s.mi].mtx.setCellValue(s.i, s.j, resultComps[s.mi].data[s.i][s.j], true);
      resultComps[s.mi].mtx.highlightCell(s.i, s.j);
    },
    onComplete: () => {
      clearAllHighlights();
      const dim = DATA.Wq[0].length;
      insightBox.innerHTML = '';
      insightBox.appendChild(buildInsight(
        bi('What are Q, K, V?', 'Q, K, V 是什么？'),
        bi(
          `<p>Each weight matrix is <span class="insight__tag insight__tag--dim">${dim}×${dim}</span> (square, d=${dim}). After projection:</p>
           <p>• <span class="insight__tag insight__tag--q">Q (Query)</span> — what this token is <b>searching for</b>.</p>
           <p>• <span class="insight__tag insight__tag--k">K (Key)</span> — what this token <b>offers</b> to others.</p>
           <p>• <span class="insight__tag insight__tag--v">V (Value)</span> — the actual <b>information content</b> passed when attended to.</p>
           <p>All three are <span class="insight__tag insight__tag--dim">${TOKENS.length}×${dim}</span> — same shape as X, rotated into different subspaces.</p>`,
          `<p>每个权重矩阵都是 <span class="insight__tag insight__tag--dim">${dim}×${dim}</span>（方阵，d=${dim}）。投影后：</p>
           <p>• <span class="insight__tag insight__tag--q">Q（查询）</span> — 这个 token 在<b>寻找什么</b>。</p>
           <p>• <span class="insight__tag insight__tag--k">K（键）</span> — 能<b>提供什么</b>给其他 token。</p>
           <p>• <span class="insight__tag insight__tag--v">V（值）</span> — 被关注时传递的<b>信息内容</b>。</p>
           <p>三者维度都是 <span class="insight__tag insight__tag--dim">${TOKENS.length}×${dim}</span> — 与 X 同形状，旋转到不同子空间。</p>`
        )
      ));
    },
    onReset: () => {
      clearAllHighlights();
      resultComps.forEach(({ mtx }) => mtx.resetToEmpty());
      insightBox.innerHTML = '';
    }
  });

  viz.appendChild(insightBox);
}

/* ============================================================
   Stage 3: Q × K^T → Scale → Softmax → Weights  (merged 3+4)
   Phase A: Animated matrix multiply  Q × K^T → Scores
   Phase B: Animated cell-fill  Scores → Scaled → Weights
   Final:   Heatmap with 0–1 scale (softmax output ∈ [0,1])
   ============================================================ */
function renderStep3() {
  const viz = document.getElementById('viz-step3');
  viz.innerHTML = '';

  viz.appendChild(el('div', 'formula',
    '<span class="score">Weights</span> = softmax( <span class="q">Q</span> × <span class="k">K<sup>T</sup></span> / √d<sub>k</sub> )'));

  // --- Phase A: Matrix multiplication Q × K^T ---
  const multContainer = el('div', '');
  viz.appendChild(multContainer);

  // --- Phase B container (revealed after Phase A completes) ---
  const phaseBContainer = el('div', '');
  phaseBContainer.style.display = 'none';
  viz.appendChild(phaseBContainer);

  // Heatmap container (revealed after Phase B completes)
  const hmContainer = el('div', '');
  viz.appendChild(hmContainer);

  const mult = new MatrixMultiplication(multContainer, {
    matA: { data: DERIVED.Q, label: 'Q', colorScheme: 'query', rowLabels: TOKENS },
    matB: { data: DERIVED.Kt, label: 'K^T', colorScheme: 'key', colLabels: TOKENS },
    resultConfig: { label: 'Scores', colorScheme: 'score' },
    speed: 300, showDetail: true, labels: getCtrlLabels()
  });

  mult.onComplete(() => {
    // Reveal Phase B
    phaseBContainer.style.display = '';
    phaseBContainer.appendChild(el('div', 'embed-flow__arrow', '↓'));

    // Scores → Scaled → Weights row
    const row = el('div', 'mtx-row');

    const rawW = el('div', '');
    new MatrixComponent(rawW, {
      data: DERIVED.scores, label: 'Scores', colorScheme: 'score',
      precision: 2, rowLabels: TOKENS, colLabels: TOKENS
    });
    row.appendChild(rawW);

    row.appendChild(el('div', 'mtx-multiply__op', '→'));

    const scW = el('div', '');
    const scMtx = new MatrixComponent(scW, {
      data: DERIVED.scores, label: i18n.t('step3.scaledLabel'),
      colorScheme: 'score', precision: 2, startEmpty: true,
      rowLabels: TOKENS, colLabels: TOKENS
    });
    row.appendChild(scW);

    row.appendChild(el('div', 'mtx-multiply__op', '→'));

    const wW = el('div', '');
    const wMtx = new MatrixComponent(wW, {
      data: DERIVED.weights, label: i18n.t('step3.weightsLabel'),
      colorScheme: 'output', precision: 3, startEmpty: true,
      rowLabels: TOKENS, colLabels: TOKENS
    });
    row.appendChild(wW);

    phaseBContainer.appendChild(row);

    // Phase B animation
    const n = TOKENS.length;
    const totalCells = n * n;
    const ctrlWrap = el('div', '');
    phaseBContainer.appendChild(ctrlWrap);

    new StepAnimator(ctrlWrap, {
      totalSteps: totalCells * 2,
      speed: 80,
      labels: getCtrlLabels(),
      onStep: (idx) => {
        if (idx < totalCells) {
          const r = Math.floor(idx / n), c = idx % n;
          scMtx.setCellValue(r, c, DERIVED.scaled[r][c], true);
        } else {
          const si = idx - totalCells;
          const r = Math.floor(si / n), c = si % n;
          wMtx.setCellValue(r, c, DERIVED.weights[r][c], true);
        }
      },
      onComplete: () => {
        // Heatmap coloring on weights matrix — direct 0-1 mapping
        wMtx.applyHeatmap(val => {
          return MatrixMath.interpolateColor([8, 14, 40], [232, 168, 56], val).css;
        });

        // Standalone heatmap with 0–1 fixed scale
        const dk = DATA.Wq[0].length;
        new HeatmapComponent(hmContainer, heatmapConfig(DERIVED.weights, {
          title: bi('Attention Weights (0–1 probability)', '注意力权重（0–1 概率分布）'),
          precision: 3
        }));

        // Insight
        const hi = MatrixMath.max(DERIVED.scores);
        const lo = MatrixMath.min(DERIVED.scores);
        let distHtml = '';
        TOKENS.forEach((tok, i) => {
          const parts = TOKENS.map((t2, j) =>
            `<span class="insight__highlight">${MatrixMath.pct(DERIVED.weights[i][j])}</span> → "${t2}"`
          ).join('，');
          distHtml += `<p>"<b>${tok}</b>": ${parts}</p>`;
        });
        hmContainer.appendChild(buildInsight(
          bi('Scores → Weights', '分数 → 权重'),
          bi(
            `<p>Raw scores: highest <span class="insight__highlight">"${TOKENS[hi.row]}" → "${TOKENS[hi.col]}" = ${hi.val.toFixed(2)}</span>, lowest <span class="insight__highlight">"${TOKENS[lo.row]}" → "${TOKENS[lo.col]}" = ${lo.val.toFixed(2)}</span>.</p>
             <p>After ÷ <span class="insight__highlight">√${dk}=${Math.sqrt(dk).toFixed(2)}</span> and softmax, each row sums to 100%:</p>${distHtml}
             <p>Each value is now ∈ [0, 1] — a proper probability distribution over tokens.</p>`,
            `<p>原始分数：最高 <span class="insight__highlight">"${TOKENS[hi.row]}" → "${TOKENS[hi.col]}" = ${hi.val.toFixed(2)}</span>，最低 <span class="insight__highlight">"${TOKENS[lo.row]}" → "${TOKENS[lo.col]}" = ${lo.val.toFixed(2)}</span>。</p>
             <p>除以 <span class="insight__highlight">√${dk}=${Math.sqrt(dk).toFixed(2)}</span> 并 softmax 后，每行之和为 100%：</p>${distHtml}
             <p>每个值现在 ∈ [0, 1] —— 是 token 上的概率分布。</p>`
          )
        ));
      },
      onReset: () => {
        scMtx.resetToEmpty();
        wMtx.resetToEmpty();
        hmContainer.innerHTML = '';
      }
    });
  });
}

/* ============================================================
   Stage 4: Weights × V → Output  (was Stage 5)
   ============================================================ */
function renderStep4() {
  const viz = document.getElementById('viz-step4');
  viz.innerHTML = '';

  viz.appendChild(el('div', 'formula',
    '<span class="out">Output</span> = <span class="score">Weights</span> × <span class="v">V</span>'));

  const mc = el('div', '');
  viz.appendChild(mc);

  const insightBox = el('div', '');
  viz.appendChild(insightBox);

  const mult = new MatrixMultiplication(mc, {
    matA: { data: DERIVED.weights, label: 'Weights', colorScheme: 'score', precision: 3, rowLabels: TOKENS, colLabels: TOKENS },
    matB: { data: DERIVED.V, label: 'V', colorScheme: 'value', colLabels: ['d₁', 'd₂', 'd₃', 'd₄'] },
    resultConfig: { label: 'Output', colorScheme: 'output', precision: 2 },
    speed: 350, showDetail: true, labels: getCtrlLabels()
  });

  mult.onComplete(() => {
    const d = DATA.Wq[0].length;
    let maxSelf = 0, maxSelfIdx = 0;
    DERIVED.weights.forEach((row, i) => {
      if (row[i] > maxSelf) { maxSelf = row[i]; maxSelfIdx = i; }
    });

    insightBox.appendChild(buildInsight(
      bi('What is the Output?', '输出是什么？'),
      bi(
        `<p>Output is <span class="insight__tag insight__tag--dim">${TOKENS.length}×${d}</span> — <b>same shape as X</b> (${TOKENS.length} tokens × d=${d}). But now each row contains <b>context-enriched</b> information:</p>
         <p>• X row for "${TOKENS[0]}" only knew about "${TOKENS[0]}" itself.</p>
         <p>• Output row for "${TOKENS[0]}" is a <b>weighted blend</b> of ALL tokens' Values: ${TOKENS.map((t, j) => `${MatrixMath.pct(DERIVED.weights[0][j])} from "${t}"`).join(' + ')}.</p>
         <p>"<b>${TOKENS[maxSelfIdx]}</b>" pays <span class="insight__highlight">${MatrixMath.pct(maxSelf)}</span> attention to itself — the highest self-attention. This means it relies mostly on its own information.</p>
         <p>This is the power of attention: <b>each token's output is informed by every other token</b>, with learned weights deciding how much to listen to each one. The output goes to the next layer for further processing.</p>`,
        `<p>输出为 <span class="insight__tag insight__tag--dim">${TOKENS.length}×${d}</span> — <b>与 X 形状相同</b>（${TOKENS.length} 个 token × d=${d}）。但现在每一行包含了<b>融合上下文后的信息</b>：</p>
         <p>• X 中 "${TOKENS[0]}" 那一行只知道自己的信息。</p>
         <p>• 输出中 "${TOKENS[0]}" 那一行是所有 token 的 Value 的<b>加权混合</b>：${TOKENS.map((t, j) => `${MatrixMath.pct(DERIVED.weights[0][j])} 来自 "${t}"`).join(' + ')}。</p>
         <p>"<b>${TOKENS[maxSelfIdx]}</b>" 对自身的注意力为 <span class="insight__highlight">${MatrixMath.pct(maxSelf)}</span> — 最高的自注意力。这意味着它主要依赖自己的信息。</p>
         <p>这就是注意力的力量：<b>每个 token 的输出都融合了所有其他 token 的信息</b>，由学习到的权重决定"听"多少。输出将传入下一层继续处理。</p>`
      )
    ));
  });
}
