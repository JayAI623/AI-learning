/* ============================================================
   KV Cache Visualizer — Application Logic

   Two perspectives:
   1) Q/K/V projection computation
   2) Attention score + causal mask computation
   ============================================================ */

const TRANSLATIONS = {
  en: {
    lang: { label: '中文' },
    hero: {
      eyebrow: 'Inference Optimization',
      title: 'KV Cache: <em>QKV + Mask</em> View',
      subtitle: 'Understand KV cache by tracking Q/K/V projections and attention score/mask computation step-by-step.'
    },
    step1: {
      title: 'Q/K/V Computation Per Decode Step',
      desc: 'At decode step <code>t</code>: without cache, recompute <code>Q,K,V</code> for all <code>1..t</code> tokens. With cache, compute only <code>q_t,k_t,v_t</code> and reuse historical <code>K,V</code>.',
      callout: 'Compute savings come from removing repeated K/V projections on history.'
    },
    step2: {
      title: 'Attention Scores + Causal Mask',
      desc: 'Without cache, naive recomputation forms full <code>t×t</code> scores and applies mask to all rows. With cache, decoding needs only the last row: <code>q_t · K_{1:t}^T + mask_t</code>.',
      callout: 'Generation uses the current token output, so only the last attention row is required.'
    },
    step3: {
      title: 'What KV Cache Stores',
      desc: 'Cache keeps historical <code>K</code> and <code>V</code> only. Each new token appends one K-row and one V-row.',
      callout: 'Per layer, per head: K,V with shape [batch, heads, seq_len, head_dim].'
    },
    step4: {
      title: 'Why Not Cache Q?',
      desc: 'Past <code>Q</code> vectors are not queried again in future decoding steps. Future steps repeatedly read past <code>K,V</code>, not past <code>Q</code>.',
      callout: 'Cache what has future reuse: K/V yes, Q no.'
    },
    controls: {
      play: '▶ Play',
      pause: '⏸ Pause',
      step: '⏭ Step',
      reset: '↺ Reset',
      done: '✓ Done',
      speed: 'Speed',
      startHint: 'Click "Play" to start',
      complete: '✓ Complete!'
    },
    ui: {
      prompt: 'Prompt tokens',
      newToken: 'Current decode token',
      withCache: 'With KV Cache',
      withoutCache: 'Without KV Cache',
      projection: 'Projection work',
      score: 'Score work',
      total: 'Total relative work',
      ratio: 'Speedup',
      tokenStep: 'Decode step',
      qOnly: 'Compute q_t only for current token',
      kvReuse: 'Reuse K,V from cache',
      kvAppend: 'Append k_t, v_t to cache',
      fullRecompute: 'Recompute Q,K,V for all tokens 1..t',
      fullScore: 'Build full score matrix t×t',
      fullMask: 'Apply causal mask on all rows',
      lastRow: 'Need only the last row for generation',
      lastRowOnly: 'Compute only 1×t scores for q_t',
      maskRow: 'Apply mask only on the current row',
      kvStored: 'Stored in cache',
      qDropped: 'Not cached',
      reuseCount: 'Future reuse count',
      noFutureReuse: 'No future reuse',
      summary: 'Cumulative total'
    },
    footer: { text: 'Interactive KV Cache Visualizer — Q/K/V and attention-mask based explanation' }
  },
  zh: {
    lang: { label: 'EN' },
    hero: {
      eyebrow: '推理优化',
      title: 'KV Cache：<em>QKV + Mask</em> 视角',
      subtitle: '从 Q/K/V 投影计算和 attention score/mask 计算两条线，逐步理解 KV Cache。'
    },
    step1: {
      title: '单步解码时的 Q/K/V 计算',
      desc: '在第 <code>t</code> 步解码：无缓存时要对 <code>1..t</code> 所有 token 重算 <code>Q,K,V</code>；有缓存时只算当前 <code>q_t,k_t,v_t</code>，复用历史 <code>K,V</code>。',
      callout: '节省的核心来自：不再重复计算历史 token 的 K/V 投影。'
    },
    step2: {
      title: 'Attention Score + Causal Mask 计算',
      desc: '无缓存的朴素重算会形成完整 <code>t×t</code> 分数矩阵并对所有行做 mask；有缓存时，解码只需要最后一行：<code>q_t · K_{1:t}^T + mask_t</code>。',
      callout: '生成下一个 token 只依赖当前 token 的输出，所以只需要最后一行注意力。'
    },
    step3: {
      title: 'KV Cache 里存了什么',
      desc: '缓存中只保留历史 <code>K</code> 和 <code>V</code>。每来一个新 token，追加一行 K 和一行 V。',
      callout: '每层、每头典型形状：K,V 为 [batch, heads, seq_len, head_dim]。'
    },
    step4: {
      title: '为什么不缓存 Q？',
      desc: '历史 <code>Q</code> 在后续解码中不会再次被查询。未来步骤会反复读取历史 <code>K,V</code>，但不会读取历史 <code>Q</code>。',
      callout: '只缓存"未来可复用"的量：K/V 要缓存，Q 不需要。'
    },
    controls: {
      play: '▶ 播放',
      pause: '⏸ 暂停',
      step: '⏭ 下一步',
      reset: '↺ 重置',
      done: '✓ 完成',
      speed: '速度',
      startHint: '点击"播放"开始',
      complete: '✓ 完成！'
    },
    ui: {
      prompt: '提示词 token',
      newToken: '当前解码 token',
      withCache: '使用 KV Cache',
      withoutCache: '不使用 KV Cache',
      projection: '投影计算量',
      score: '分数计算量',
      total: '总相对计算量',
      ratio: '加速比',
      tokenStep: '解码步',
      qOnly: '仅计算当前 token 的 q_t',
      kvReuse: '复用缓存中的 K,V',
      kvAppend: '将 k_t, v_t 追加到缓存',
      fullRecompute: '对 1..t 全部 token 重算 Q,K,V',
      fullScore: '构建完整分数矩阵 t×t',
      fullMask: '对所有行应用因果 mask',
      lastRow: '生成只需要最后一行',
      lastRowOnly: '仅计算 q_t 对应的 1×t 分数',
      maskRow: '只对当前行应用 mask',
      kvStored: '缓存',
      qDropped: '不缓存',
      reuseCount: '未来复用次数',
      noFutureReuse: '未来不复用',
      summary: '累计总量'
    },
    footer: { text: '交互式 KV 缓存可视化 — 基于 Q/K/V 与 attention-mask 的解释' }
  }
};

const PROMPT_TOKENS = ['I', 'love', 'AI'];
const GEN_STEPS = 4;

let i18n;

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function createTokenFlow(tokens, label) {
  const wrap = el('div', 'token-flow');
  wrap.appendChild(el('div', 'token-flow__label', label));
  const row = el('div', 'token-flow__tokens');
  tokens.forEach((token) => row.appendChild(el('div', 'token-chip', token)));
  wrap.appendChild(row);
  return wrap;
}

function createPathCard(title) {
  const card = el('div', 'compare-card');
  card.appendChild(el('div', 'compare-card__title', title));
  card.appendChild(el('div', 'compare-card__body'));
  return card;
}

function addLine(card, text, cls) {
  const row = el('div', cls || 'compare-row', text);
  card.querySelector('.compare-card__body').appendChild(row);
}

function clearCard(card) {
  card.querySelector('.compare-card__body').innerHTML = '';
}

function getCtrlLabels() {
  return {
    play: i18n.t('controls.play'),
    pause: i18n.t('controls.pause'),
    step: i18n.t('controls.step'),
    reset: i18n.t('controls.reset'),
    done: i18n.t('controls.done'),
    speed: i18n.t('controls.speed'),
    startHint: i18n.t('controls.startHint'),
    complete: i18n.t('controls.complete')
  };
}

function buildScoreGrid(size) {
  const table = document.createElement('table');
  table.className = 'score-table';
  const tbody = document.createElement('tbody');
  for (let i = 0; i < size; i++) {
    const tr = document.createElement('tr');
    for (let j = 0; j < size; j++) {
      const td = document.createElement('td');
      td.textContent = j <= i ? '•' : '×';
      td.className = j <= i ? 'score-cell score-cell--valid' : 'score-cell score-cell--masked';
      td.dataset.row = String(i);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function highlightLastRow(table, rowIdx) {
  table.querySelectorAll('.score-cell').forEach((cell) => {
    cell.classList.remove('score-cell--active');
    if (Number(cell.dataset.row) === rowIdx) {
      cell.classList.add('score-cell--active');
    }
  });
}

/* ============================================================
   Stage 1: QKV Projection — With vs Without Cache
   ============================================================ */
function renderStage1() {
  const viz = document.getElementById('viz-step1');
  viz.innerHTML = '';

  const seqLen = PROMPT_TOKENS.length + 1;
  const status = el('div', 'stage-status', i18n.t('controls.startHint'));

  viz.appendChild(createTokenFlow(PROMPT_TOKENS, i18n.t('ui.prompt')));
  viz.appendChild(createTokenFlow(['t'], i18n.t('ui.newToken')));

  const grid = el('div', 'compare-grid');
  const noCard = createPathCard(i18n.t('ui.withoutCache'));
  const yesCard = createPathCard(i18n.t('ui.withCache'));
  grid.appendChild(noCard);
  grid.appendChild(yesCard);
  viz.appendChild(grid);
  viz.appendChild(status);

  const ctrl = el('div', '');
  viz.appendChild(ctrl);

  new StepAnimator(ctrl, {
    totalSteps: 3,
    speed: 650,
    labels: getCtrlLabels(),
    onStep: (idx) => {
      if (idx === 0) {
        addLine(noCard, `${i18n.t('ui.fullRecompute')}  →  ${i18n.t('ui.projection')}: 3 × ${seqLen}`);
        addLine(yesCard, `${i18n.t('ui.qOnly')} + k_t + v_t  →  ${i18n.t('ui.projection')}: 3`);
      }
      if (idx === 1) {
        addLine(noCard, `${i18n.t('ui.fullScore')}  →  ${i18n.t('ui.score')}: ${seqLen}²`);
        addLine(yesCard, `${i18n.t('ui.kvReuse')}  →  ${i18n.t('ui.lastRowOnly')}: 1 × ${seqLen}`);
      }
      if (idx === 2) {
        addLine(noCard, `<strong>${i18n.t('ui.total')}: ${3 * seqLen + seqLen * seqLen}</strong>`, 'compare-row compare-row--sum');
        addLine(yesCard, `<strong>${i18n.t('ui.total')}: ${3 + seqLen}</strong>`, 'compare-row compare-row--sum');
      }
      status.textContent = `${i18n.t('controls.step')} ${idx + 1} / 3`;
    },
    onReset: () => {
      clearCard(noCard);
      clearCard(yesCard);
      status.textContent = i18n.t('controls.startHint');
    },
    onComplete: () => { status.textContent = i18n.t('controls.complete'); }
  });
}

/* ============================================================
   Stage 2: Score Matrix + Mask — Full t×t vs Last Row
   ============================================================ */
function renderStage2() {
  const viz = document.getElementById('viz-step2');
  viz.innerHTML = '';

  const size = PROMPT_TOKENS.length + 1;
  const status = el('div', 'stage-status', i18n.t('controls.startHint'));

  const grid = el('div', 'compare-grid');

  const fullPanel = createPathCard(i18n.t('ui.withoutCache'));
  const fullMatrix = buildScoreGrid(size);
  fullPanel.querySelector('.compare-card__body').appendChild(fullMatrix);
  fullPanel.querySelector('.compare-card__body').appendChild(
    el('div', 'compare-row', `${i18n.t('ui.fullMask')} → ${size} × ${size} = ${size * size}`)
  );

  const cachePanel = createPathCard(i18n.t('ui.withCache'));
  const rowContainer = el('div', 'score-row-only');
  cachePanel.querySelector('.compare-card__body').appendChild(rowContainer);

  grid.appendChild(fullPanel);
  grid.appendChild(cachePanel);
  viz.appendChild(grid);
  viz.appendChild(status);

  const ctrl = el('div', '');
  viz.appendChild(ctrl);

  new StepAnimator(ctrl, {
    totalSteps: 3,
    speed: 700,
    labels: getCtrlLabels(),
    onStep: (idx) => {
      if (idx === 0) {
        status.textContent = `1/3  ${i18n.t('ui.fullScore')}`;
      }
      if (idx === 1) {
        highlightLastRow(fullMatrix, size - 1);
        status.textContent = `2/3  ${i18n.t('ui.lastRow')}`;
      }
      if (idx === 2) {
        rowContainer.innerHTML = '';
        for (let j = 0; j < size; j++) {
          rowContainer.appendChild(el('div', 'score-row-cell', '•'));
        }
        cachePanel.querySelector('.compare-card__body').appendChild(
          el('div', 'compare-row', `${i18n.t('ui.lastRowOnly')} → 1 × ${size} = ${size}`)
        );
        status.textContent = `3/3  ${i18n.t('ui.maskRow')}`;
      }
    },
    onReset: () => {
      highlightLastRow(fullMatrix, -1);
      rowContainer.innerHTML = '';
      const body = cachePanel.querySelector('.compare-card__body');
      while (body.children.length > 1) body.removeChild(body.lastChild);
      status.textContent = i18n.t('controls.startHint');
    },
    onComplete: () => { status.textContent = i18n.t('controls.complete'); }
  });
}

/* ============================================================
   Stage 3: What KV Cache Stores (K/V stored, Q not stored)
   ============================================================ */
function renderStage3() {
  const viz = document.getElementById('viz-step3');
  viz.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'perf-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Tensor</th>
        <th>Status</th>
        <th>${i18n.t('ui.reuseCount')}</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  const status = el('div', 'stage-status', i18n.t('controls.startHint'));

  viz.appendChild(table);
  viz.appendChild(status);

  const ctrl = el('div', '');
  viz.appendChild(ctrl);

  const data = [
    { tensor: 'K (past tokens)', stored: `✅ ${i18n.t('ui.kvStored')}`, reuse: `${GEN_STEPS}+` },
    { tensor: 'V (past tokens)', stored: `✅ ${i18n.t('ui.kvStored')}`, reuse: `${GEN_STEPS}+` },
    { tensor: 'Q (past tokens)', stored: `❌ ${i18n.t('ui.qDropped')}`, reuse: i18n.t('ui.noFutureReuse') }
  ];

  new StepAnimator(ctrl, {
    totalSteps: data.length,
    speed: 650,
    labels: getCtrlLabels(),
    onStep: (idx) => {
      const d = data[idx];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.tensor}</td><td>${d.stored}</td><td>${d.reuse}</td>`;
      tbody.appendChild(tr);
      status.textContent = `${i18n.t('controls.step')} ${idx + 1} / ${data.length}`;
    },
    onReset: () => {
      tbody.innerHTML = '';
      status.textContent = i18n.t('controls.startHint');
    },
    onComplete: () => { status.textContent = i18n.t('controls.complete'); }
  });
}

/* ============================================================
   Stage 4: Cumulative Compute Comparison Table
   ============================================================ */
function renderStage4() {
  const viz = document.getElementById('viz-step4');
  viz.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'perf-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>${i18n.t('ui.tokenStep')}</th>
        <th>${i18n.t('ui.withoutCache')}</th>
        <th>${i18n.t('ui.withCache')}</th>
        <th>${i18n.t('ui.ratio')}</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  const summary = el('div', 'chart-summary');
  const status = el('div', 'stage-status', i18n.t('controls.startHint'));

  viz.appendChild(table);
  viz.appendChild(summary);
  viz.appendChild(status);

  const rows = [];
  let cumNo = 0, cumYes = 0;
  for (let step = 1; step <= GEN_STEPS; step++) {
    const t = PROMPT_TOKENS.length + step;
    const noCache = 3 * t + t * t;
    const withCache = 3 + t;
    cumNo += noCache;
    cumYes += withCache;
    rows.push({ step, noCache, withCache, ratio: noCache / withCache, cumNo, cumYes });
  }

  const ctrl = el('div', '');
  viz.appendChild(ctrl);

  new StepAnimator(ctrl, {
    totalSteps: rows.length,
    speed: 700,
    labels: getCtrlLabels(),
    onStep: (idx) => {
      const r = rows[idx];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.step}</td>
        <td>${r.noCache}</td>
        <td>${r.withCache}</td>
        <td>${r.ratio.toFixed(1)}×</td>
      `;
      tbody.appendChild(tr);
      summary.innerHTML = `
        <strong>${i18n.t('ui.summary')}:</strong>
        ${i18n.t('ui.withoutCache')} = ${r.cumNo} &nbsp;|&nbsp;
        ${i18n.t('ui.withCache')} = ${r.cumYes} &nbsp;|&nbsp;
        <strong>${i18n.t('ui.ratio')}: ${(r.cumNo / r.cumYes).toFixed(1)}×</strong>
      `;
      status.textContent = `${i18n.t('controls.step')} ${idx + 1} / ${rows.length}`;
    },
    onReset: () => {
      tbody.innerHTML = '';
      summary.innerHTML = '';
      status.textContent = i18n.t('controls.startHint');
    },
    onComplete: () => { status.textContent = i18n.t('controls.complete'); }
  });
}

/* ---- Render all stages ---- */
function renderAll() {
  renderStage1();
  renderStage2();
  renderStage3();
  renderStage4();
}

/* ---- Init ---- */
function init() {
  i18n = new I18n({
    defaultLang: 'en',
    translations: TRANSLATIONS,
    storageKey: 'kv-cache-lang'
  });

  const langBtn = document.getElementById('lang-toggle');
  langBtn.addEventListener('click', () => i18n.toggle());
  i18n.onChange(() => {
    i18n.updateDOM();
    langBtn.textContent = i18n.t('lang.label');
    renderAll();
  });

  i18n.updateDOM();
  langBtn.textContent = i18n.t('lang.label');
  renderAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
