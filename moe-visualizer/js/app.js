/* ============================================================
   MOE Visualizer — Interactive Logic
   ============================================================ */

(function () {
  'use strict';

  /* ── i18n ─────────────────────────────────────────────── */
  const I18N = {
    title:       { zh: 'Mixture of Experts 可视化', en: 'Mixture of Experts Visualizer' },
    subtitle:    { zh: '理解 MOE 如何通过稀疏激活实现"用更多参数、花更少算力"的高效推理。',
                   en: 'Understand how MOE achieves efficient inference with sparse activation — more parameters, less compute.' },
    stepLabel:   { zh: '步骤', en: 'Step' },
    prev:        { zh: '上一步', en: 'Prev' },
    next:        { zh: '下一步', en: 'Next' },
    backHome:    { zh: '返回首页', en: 'Back to Home' },
    step1Nav:    { zh: '架构概览', en: 'Architecture' },
    step2Nav:    { zh: '路由机制', en: 'Router' },
    step3Nav:    { zh: '流程对比', en: 'Flow Compare' },
    step4Nav:    { zh: '计算对比', en: 'Envelope Math' },

    s1Title:     { zh: '什么是 Mixture of Experts？', en: 'What is Mixture of Experts?' },
    s1Desc:      { zh: '在标准 Transformer 中，每个 token 都要经过同一个巨大的 FFN 层。MOE 的核心思想：<strong>把一个大 FFN 拆成多个小"专家"，每个 token 只激活其中几个</strong>。',
                   en: 'In a standard Transformer every token passes through one large FFN. MOE\'s key idea: <strong>split the FFN into multiple small "experts" and activate only a few per token</strong>.' },
    s1Insight:   { zh: '<strong>核心洞察：</strong>Attention 层完全相同，区别只在 FFN 层。Dense 模型激活所有参数，MOE 只激活被选中的专家——用更大容量换更低计算量。',
                   en: '<strong>Key insight:</strong> The Attention layer is identical. The difference is in FFN: Dense activates all parameters while MOE only activates selected experts — trading capacity for lower compute.' },
    denseModel:  { zh: 'Dense 模型', en: 'Dense Model' },
    moeModel:    { zh: 'MOE 模型', en: 'MOE Model' },
    allNeurons:  { zh: '所有神经元都参与计算', en: 'All neurons participate' },

    s2Title:     { zh: '路由器如何选择专家？', en: 'How Does the Router Select Experts?' },
    s2Desc:      { zh: '点击 Play 观看每个 token 依次通过路由器的过程，或点击单个 token 查看其路由详情。注意不同类型的 token 会路由到不同的专家。',
                   en: 'Click Play to watch each token route through the router one by one, or click any token to inspect its routing. Notice different token types route to different experts.' },
    stepRouter:  { zh: '下一个 Token →', en: 'Next Token →' },
    resetRouter: { zh: '↻ 重置', en: '↻ Reset' },
    s2Insight:   { zh: '<strong>发现：</strong>路由决策主要基于 token 本身的类型（如标点、名词、动词），而非上下文语义。注意 "The" 和 "the" 路由到几乎相同的专家——专家分工在训练早期就基本固定了。',
                   en: '<strong>Finding:</strong> Routing is based on token type (punctuation, noun, verb), not context. Notice "The" and "the" route to nearly the same experts — assignments are fixed early in training.' },

    s3Title:     { zh: 'Token 路由全流程对比', en: 'Token Routing Flow: Dense vs MOE' },
    s3Desc:      { zh: 'MLP 由两层矩阵乘法组成（上投影 + 下投影）。Dense 和 MOE 的总参数量相同，但 MOE 每次只激活 Top-K 个专家，大幅节省计算。',
                   en: 'The MLP consists of two matrix multiplications (up-projection + down-projection). Dense and MOE have the same total params, but MOE only activates Top-K experts per token.' },
    stepFlow:    { zh: '下一步 →', en: 'Next Step →' },
    resetFlow:   { zh: '↻ 重置', en: '↻ Reset' },
    denseFlow:   { zh: 'Dense 模型', en: 'Dense Model' },
    moeFlow:     { zh: 'MOE 模型 (Top-2 / 8 Experts)', en: 'MOE Model (Top-2 / 8 Experts)' },
    activated:   { zh: '激活', en: 'activated' },
    computeTime: { zh: '计算量', en: 'Compute' },
    expertLayer: { zh: '专家层 — ', en: 'Expert Layer — ' },
    eachExpert:  { zh: '每个专家是一个独立的 MLP', en: 'Each expert is an independent MLP' },
    upProj:      { zh: '上投影', en: 'Up-projection' },
    downProj:    { zh: '下投影', en: 'Down-projection' },
    params:      { zh: '参数', en: 'Params' },
    perExpert:   { zh: '每个专家', en: 'Per expert' },
    totalN:      { zh: '8 个专家合计', en: '8 experts total' },
    sameAsDense: { zh: '(= Dense)', en: '(= Dense)' },
    activeK:     { zh: '激活 Top-2', en: 'Active Top-2' },
    flopCompare: { zh: 'MLP 层 FLOPs 对比（相同总参数量 8d²）', en: 'MLP FLOPs Comparison (same total params 8d²)' },
    savings4x:   { zh: '(节省 75%)', en: '(75% saved)' },
    flopsExplain:{ zh: 'Dense: 一个大 MLP，d_ff = 4d → 全部 8d² 参数都计算<br>MOE: 8 个小 MLP，每个 d_ff = d/2 → 只算被选中的 2 个 = 2d²',
                   en: 'Dense: one large MLP, d_ff = 4d → all 8d² params computed<br>MOE: 8 small MLPs, each d_ff = d/2 → only 2 selected = 2d²' },
    s3Insight:   { zh: '<strong>关键：</strong>Dense 和 MOE 拥有完全相同的总参数量 (8d²)，但 MOE 把一个大 MLP 拆成 8 个小专家。每个 token 只经过 2 个专家的两层矩阵运算，<em>FLOPs 从 16d² 降到 4d²——节省 75% 计算量</em>。',
                   en: '<strong>Key:</strong> Dense and MOE have the same total params (8d²), but MOE splits one large MLP into 8 small experts. Each token only goes through 2 experts\' two-layer matrix ops — <em>FLOPs drop from 16d² to 4d² — 75% compute savings</em>.' },

    s4Title:     { zh: '信封背面的数学', en: 'Envelope Math' },
    s4Desc:      { zh: '拖动滑块调整参数，实时观察 Dense 和 MOE 在计算量、参数量和内存上的差异。',
                   en: 'Drag sliders to adjust parameters and see real-time differences in compute, params, and memory.' },
    numExperts:  { zh: '专家数量', en: 'Num Experts' },
    denseMath:   { zh: 'Dense 等效模型', en: 'Dense Equivalent' },
    denseMathSub:{ zh: '(拥有同等参数量的单一 FFN)', en: '(Single FFN with same total params)' },
    moeMath:     { zh: 'MOE 模型', en: 'MOE Model' },
    moeMathSub:  { zh: '(N 个专家，每次激活 Top-K 个)', en: '(N experts, Top-K active per token)' },
    ffnParams:   { zh: 'FFN 参数量', en: 'FFN Params' },
    totalParams: { zh: '总参数量', en: 'Total Params' },
    activeParams:{ zh: '激活参数量', en: 'Active Params' },
    flopsToken:  { zh: 'FLOPs / token', en: 'FLOPs / token' },
    memFp16:     { zh: '内存 (FP16)', en: 'Memory (FP16)' },
    computeSave: { zh: '计算节省', en: 'Compute Saved' },
    capacityGain:{ zh: '容量增益', en: 'Capacity Gain' },
    memCost:     { zh: '内存代价', en: 'Memory Cost' },
    realWorld:   { zh: '真实模型对比', en: 'Real-World Examples' },
    total:       { zh: '总参', en: 'Total' },
    active:      { zh: '激活', en: 'Active' },
    ratio:       { zh: '比例', en: 'Ratio' },
    s4Insight:   { zh: '<strong>权衡：</strong>MOE 用更多的内存（需存储所有专家）换取更低的计算量（每次只算 K 个专家）。当模型规模越大，这种 trade-off 越划算——DeepSeek-V3 用 671B 参数实现了仅 37B 激活参数的推理速度。',
                   en: '<strong>Trade-off:</strong> MOE uses more memory (all experts stored) for lower compute (only K experts computed). The larger the model, the better this trade-off — DeepSeek-V3 has 671B params but only 37B active.' },
  };

  let lang = 'zh';

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[key]) el.innerHTML = I18N[key][lang];
    });
  }

  /* ── Step management ──────────────────────────────────── */
  const STEPS = ['step1', 'step2', 'step3', 'step4'];
  const NAV_KEYS = ['step1Nav', 'step2Nav', 'step3Nav', 'step4Nav'];
  let currentStep = 0;

  const stepValue = document.getElementById('stepValue');
  const stepTitle = document.getElementById('stepTitle');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  function showStep(idx) {
    currentStep = idx;
    STEPS.forEach((id, i) => {
      document.getElementById(id).style.display = i === idx ? '' : 'none';
    });
    stepValue.textContent = idx + 1;
    stepTitle.setAttribute('data-i18n', NAV_KEYS[idx]);
    stepTitle.textContent = I18N[NAV_KEYS[idx]][lang];
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === STEPS.length - 1;

    if (idx === 1) initRouter();
    if (idx === 3) updateMath();
  }

  prevBtn.addEventListener('click', () => { if (currentStep > 0) showStep(currentStep - 1); });
  nextBtn.addEventListener('click', () => { if (currentStep < STEPS.length - 1) showStep(currentStep + 1); });
  document.getElementById('langToggle').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    applyLang();
    showStep(currentStep);
  });

  /* ── Step 2: Router visualization ────────────────────── */
  const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat', '.'];
  const TOKEN_TYPES = {
    'The': 'det', 'cat': 'noun', 'sat': 'verb', 'on': 'prep',
    'the': 'det', 'mat': 'noun', '.': 'punct'
  };
  const NUM_EXPERTS = 8;
  const EXPERT_COLORS_RAW = [
    '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
  ];
  const EXPERT_COLORS = EXPERT_COLORS_RAW.map(c => c);

  const ROUTING_TABLE = {
    'The':  [0.04, 0.08, 0.42, 0.03, 0.05, 0.02, 0.33, 0.03],
    'cat':  [0.05, 0.35, 0.04, 0.08, 0.03, 0.02, 0.06, 0.37],
    'sat':  [0.03, 0.07, 0.05, 0.38, 0.04, 0.33, 0.06, 0.04],
    'on':   [0.40, 0.05, 0.06, 0.03, 0.04, 0.02, 0.35, 0.05],
    'the':  [0.04, 0.07, 0.43, 0.03, 0.05, 0.02, 0.32, 0.04],
    'mat':  [0.06, 0.38, 0.03, 0.05, 0.04, 0.02, 0.07, 0.35],
    '.':    [0.05, 0.03, 0.04, 0.02, 0.42, 0.38, 0.03, 0.03],
  };

  function getTopK(scores, k) {
    return scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).slice(0, k);
  }

  let routerInited = false;
  let selectedToken = null;
  const visitedTokens = new Set();

  let routerStepIdx = -1;

  function initRouter() {
    if (routerInited) return;
    routerInited = true;
    renderRoutingMap();
    document.getElementById('stepRouterBtn').addEventListener('click', stepRouter);
    document.getElementById('resetRouterBtn').addEventListener('click', resetRouter);
    updateRouterCounter();
  }

  function renderRoutingMap() {
    const tokensEl = document.getElementById('rmTokens');
    const expertsEl = document.getElementById('rmExperts');
    tokensEl.innerHTML = '';
    expertsEl.innerHTML = '';

    TOKENS.forEach(t => {
      const div = document.createElement('div');
      div.className = 'rm-token';
      div.dataset.token = t;
      div.innerHTML = `<div class="rm-token__chip">${t}</div>
                        <div class="rm-token__type">${TOKEN_TYPES[t]}</div>`;
      div.addEventListener('click', () => {
        routerAbort = true;
        routerPlaying = false;
        selectToken(t);
      });
      tokensEl.appendChild(div);
    });

    for (let i = 0; i < NUM_EXPERTS; i++) {
      const div = document.createElement('div');
      div.className = 'rm-expert';
      div.innerHTML = `<div class="rm-expert__block" style="border-color:${EXPERT_COLORS[i]};color:${EXPERT_COLORS[i]};background:${EXPERT_COLORS[i]}11">E${i + 1}</div>
                        <div class="rm-expert__count" id="expertCount${i}"></div>`;
      expertsEl.appendChild(div);
    }

    renderRoutingSvg(null);
    document.getElementById('routerDetail').style.opacity = '0.3';
  }

  function renderRoutingSvg(activeToken) {
    const svg = document.getElementById('rmSvg');
    const W = svg.getBoundingClientRect().width || 700;
    const H = 120;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';

    const tGap = W / (TOKENS.length + 1);
    const eGap = W / (NUM_EXPERTS + 1);

    TOKENS.forEach((t, ti) => {
      const tx = tGap * (ti + 1);
      const top2 = getTopK(ROUTING_TABLE[t], 2);
      const isActive = t === activeToken;
      const wasVisited = visitedTokens.has(t);

      top2.forEach(expert => {
        const ex = eGap * (expert.i + 1);
        const total = top2[0].s + top2[1].s;
        const weight = expert.s / total;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cpY = H * 0.5;
        line.setAttribute('d', `M${tx} 0 C${tx} ${cpY}, ${ex} ${cpY}, ${ex} ${H}`);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', EXPERT_COLORS[expert.i]);

        if (isActive) {
          line.setAttribute('stroke-width', 3 + weight * 4);
          line.setAttribute('opacity', 0.7 + weight * 0.3);
        } else if (wasVisited) {
          line.setAttribute('stroke-width', 1.5 + weight * 2);
          line.setAttribute('opacity', '0.3');
        } else {
          line.setAttribute('stroke-width', '1');
          line.setAttribute('opacity', '0.06');
          line.setAttribute('stroke-dasharray', '4 4');
        }

        line.classList.add('rm-line');
        line.dataset.token = t;
        svg.appendChild(line);
      });
    });
  }

  function updateExpertCounts() {
    const counts = new Array(NUM_EXPERTS).fill(0);
    visitedTokens.forEach(t => {
      getTopK(ROUTING_TABLE[t], 2).forEach(e => counts[e.i]++);
    });
    for (let i = 0; i < NUM_EXPERTS; i++) {
      const el = document.getElementById(`expertCount${i}`);
      el.textContent = counts[i] > 0 ? `${counts[i]} token${counts[i] > 1 ? 's' : ''}` : '';
    }
  }

  function selectToken(token) {
    selectedToken = token;
    visitedTokens.add(token);

    document.querySelectorAll('.rm-token').forEach(el => {
      const t = el.dataset.token;
      el.classList.toggle('rm-token--active', t === token);
      if (visitedTokens.has(t) && t !== token) {
        el.querySelector('.rm-token__chip').style.borderColor = 'var(--color-text-dim)';
        el.querySelector('.rm-token__chip').style.color = 'var(--color-text-dim)';
        el.querySelector('.rm-token__chip').style.background = 'var(--color-bg-hover)';
      }
    });

    renderRoutingSvg(token);
    updateExpertCounts();

    document.getElementById('routerDetail').style.opacity = '1';
    document.getElementById('detailTokenLabel').textContent = `"${token}"`;

    const scores = ROUTING_TABLE[token];
    renderScoreBars(scores);
  }

  function resetRouter() {
    selectedToken = null;
    routerStepIdx = -1;
    visitedTokens.clear();

    document.querySelectorAll('.rm-token').forEach(el => {
      el.classList.remove('rm-token--active');
      const chip = el.querySelector('.rm-token__chip');
      chip.style.borderColor = '';
      chip.style.color = '';
      chip.style.background = '';
    });

    renderRoutingSvg(null);
    updateExpertCounts();
    updateRouterCounter();
    document.getElementById('routerDetail').style.opacity = '0.3';
    document.getElementById('scoreBars').innerHTML = '';
    document.getElementById('expertOutputRow').innerHTML = '';
    document.getElementById('detailTokenLabel').textContent = '—';
    document.getElementById('stepRouterBtn').disabled = false;
  }

  function stepRouter() {
    routerStepIdx++;
    if (routerStepIdx >= TOKENS.length) routerStepIdx = 0;
    selectToken(TOKENS[routerStepIdx]);
    updateRouterCounter();
  }

  function updateRouterCounter() {
    const el = document.getElementById('routerCounter');
    el.textContent = `${Math.max(0, routerStepIdx + 1)} / ${TOKENS.length}`;
  }

  function renderScoreBars(scores) {
    const container = document.getElementById('scoreBars');
    container.innerHTML = '';
    const maxScore = Math.max(...scores);
    const top2 = getTopK(scores, 2);
    const topK = new Set(top2.map(e => e.i));

    scores.forEach((score, i) => {
      const item = document.createElement('div');
      item.className = 'score-bar-item';
      const isActive = topK.has(i);

      const bar = document.createElement('div');
      bar.className = 'score-bar' + (isActive ? ' score-bar--active' : '');
      bar.style.height = Math.max(4, (score / maxScore) * 80) + 'px';
      bar.style.background = isActive ? EXPERT_COLORS[i] : 'var(--color-border)';
      bar.style.opacity = isActive ? '1' : '0.25';

      const label = document.createElement('div');
      label.className = 'score-bar-label';
      label.textContent = 'E' + (i + 1);
      label.style.color = isActive ? EXPERT_COLORS[i] : '';

      const val = document.createElement('div');
      val.className = 'score-bar-value';
      val.textContent = score.toFixed(2);

      item.appendChild(bar);
      item.appendChild(label);
      item.appendChild(val);
      container.appendChild(item);
    });

    renderExpertOutput(top2);
  }

  function renderExpertOutput(top2) {
    const row = document.getElementById('expertOutputRow');
    const e1 = top2[0], e2 = top2[1];
    const total = e1.s + e2.s;
    const w1 = (e1.s / total).toFixed(2), w2 = (e2.s / total).toFixed(2);

    row.innerHTML = `
      <span class="expert-chip expert-chip--selected" style="border-color:${EXPERT_COLORS[e1.i]};color:${EXPERT_COLORS[e1.i]};background:${EXPERT_COLORS[e1.i]}0a">
        E${e1.i + 1} <small>w=${w1}</small>
      </span>
      <span style="color:var(--color-text-dim)">+</span>
      <span class="expert-chip expert-chip--selected" style="border-color:${EXPERT_COLORS[e2.i]};color:${EXPERT_COLORS[e2.i]};background:${EXPERT_COLORS[e2.i]}0a">
        E${e2.i + 1} <small>w=${w2}</small>
      </span>
      <span style="color:var(--color-text-dim)">→ ${w1}·y<sub>${e1.i + 1}</sub> + ${w2}·y<sub>${e2.i + 1}</sub></span>
    `;
  }

  /* ── Step 3: Flow animation (single-step) ─────────── */
  let flowStepIdx = -1;

  document.getElementById('stepFlowBtn').addEventListener('click', stepFlow);
  document.getElementById('resetFlowBtn').addEventListener('click', resetFlow);

  function collectFlowSteps(containerId) {
    const children = document.getElementById(containerId).children;
    const steps = [];
    for (const child of children) {
      if (child.classList.contains('flow-node') || child.classList.contains('flow-connector')) {
        steps.push(child);
      }
    }
    return steps;
  }

  function resetFlow() {
    flowStepIdx = -1;
    document.querySelectorAll('#denseFlow .flow-node, #moeFlow .flow-node').forEach(el => {
      el.classList.remove('flow-node--lit', 'flow-node--current');
    });
    document.querySelectorAll('#denseFlow .flow-connector, #moeFlow .flow-connector').forEach(el => {
      el.classList.remove('flow-connector--lit');
    });
    document.getElementById('stepFlowBtn').disabled = false;
    updateFlowCounter();
  }

  function stepFlow() {
    flowStepIdx++;

    const denseAll = collectFlowSteps('denseFlow');
    const moeAll = collectFlowSteps('moeFlow');
    const maxLen = Math.max(denseAll.length, moeAll.length);

    if (flowStepIdx >= maxLen) {
      document.getElementById('stepFlowBtn').disabled = true;
      return;
    }

    denseAll.forEach(el => el.classList.remove('flow-node--current'));
    moeAll.forEach(el => el.classList.remove('flow-node--current'));

    const dEl = denseAll[flowStepIdx];
    const mEl = moeAll[flowStepIdx];

    if (dEl) {
      if (dEl.classList.contains('flow-node')) {
        dEl.classList.add('flow-node--lit', 'flow-node--current');
      } else if (dEl.classList.contains('flow-connector')) {
        dEl.classList.add('flow-connector--lit');
      }
    }
    if (mEl) {
      if (mEl.classList.contains('flow-node')) {
        mEl.classList.add('flow-node--lit', 'flow-node--current');
      } else if (mEl.classList.contains('flow-connector')) {
        mEl.classList.add('flow-connector--lit');
      }
    }

    updateFlowCounter();
  }

  function updateFlowCounter() {
    const maxLen = Math.max(
      collectFlowSteps('denseFlow').length,
      collectFlowSteps('moeFlow').length
    );
    const nodeSteps = Math.ceil(maxLen);
    const current = Math.max(0, flowStepIdx + 1);
    document.getElementById('flowCounter').textContent = `${current} / ${nodeSteps}`;
  }

  /* ── Step 4: Envelope Math ───────────────────────────── */
  const sliders = {
    dModel:   document.getElementById('dModelSlider'),
    dFf:      document.getElementById('dFfSlider'),
    nExperts: document.getElementById('nExpertsSlider'),
    topK:     document.getElementById('topKSlider'),
  };

  Object.values(sliders).forEach(s => s.addEventListener('input', updateMath));

  function fmt(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }

  function fmtBytes(bytes) {
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + ' TB';
    if (bytes >= 1e9)  return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6)  return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(1) + ' KB';
  }

  function updateMath() {
    const d = parseInt(sliders.dModel.value);
    const f = parseInt(sliders.dFf.value);
    const n = parseInt(sliders.nExperts.value);
    let k = parseInt(sliders.topK.value);
    if (k > n) { k = n; sliders.topK.value = k; }
    sliders.topK.max = n;

    document.getElementById('dModelVal').textContent = d;
    document.getElementById('dFfVal').textContent = f;
    document.getElementById('nExpertsVal').textContent = n;
    document.getElementById('topKVal').textContent = k;

    const paramsPerExpert = 2 * d * f;
    const moeTotal = n * paramsPerExpert;
    const moeActive = k * paramsPerExpert;
    const denseParams = moeTotal;
    const denseFlops = 2 * denseParams;
    const moeFlops = 2 * moeActive;

    document.getElementById('denseParams').textContent = fmt(denseParams);
    document.getElementById('denseFlops').textContent = fmt(denseFlops);
    document.getElementById('denseMem').textContent = fmtBytes(denseParams * 2);

    document.getElementById('moeParamsTotal').textContent = fmt(moeTotal);
    document.getElementById('moeParamsActive').textContent = fmt(moeActive);
    document.getElementById('moeFlops').textContent = fmt(moeFlops);
    document.getElementById('moeMem').textContent = fmtBytes(moeTotal * 2);

    const computeRatio = k / n;
    const capacityMultiplier = n / k;
    const memMultiplier = n;

    document.getElementById('computeSaving').textContent =
      `${((1 - computeRatio) * 100).toFixed(0)}% ↓  (${k}/${n})`;
    document.getElementById('capacityGain').textContent =
      `${capacityMultiplier.toFixed(1)}× (${lang === 'zh' ? '容量是单 FFN 的' : 'vs single FFN'} ${n}×)`;
    document.getElementById('memCost').textContent =
      `${n}× (${lang === 'zh' ? '需存储所有专家' : 'all experts stored'})`;

    document.getElementById('computeBar').style.width = ((1 - computeRatio) * 100) + '%';
    document.getElementById('capacityBar').style.width = Math.min(100, (capacityMultiplier / 10) * 100) + '%';
    document.getElementById('memBar').style.width = Math.min(100, (n / 64) * 100) + '%';
  }

  /* ── Init ─────────────────────────────────────────────── */
  applyLang();
  showStep(0);
})();
