/* ============================================================
   Reusable Visualization Components
   
   Components:
     - MatrixComponent     — Renders an interactive 2D matrix
     - MatrixMultiplication — Animated matrix multiply visualization
     - StepAnimator         — Play/Pause/Step/Reset controller
     - HeatmapComponent     — Color-coded 2D heatmap with legend
     - MatrixMath           — Math utility functions
   
   Constants:
     - DEFAULT_CONTROL_LABELS — Shared i18n-able button labels
   
   All components are visualization-agnostic (not tied to
   attention/QKV). They can be reused for any pipeline
   (decoding, FFN, etc.) by passing different data & config.
   ============================================================ */

/* ---- Shared Default Labels (single source of truth) ---- */
const DEFAULT_CONTROL_LABELS = {
  play: '▶ Play', pause: '⏸ Pause', step: '⏭ Step',
  reset: '↺ Reset', done: '✓ Done', speed: 'Speed',
  startHint: 'Click "Play" to start', complete: '✓ Complete!'
};

class MatrixComponent {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} config
   * @param {number[][]} config.data - 2D array of numbers
   * @param {string} [config.label] - Matrix label (e.g. 'Q', 'K^T')
   * @param {string} [config.colorScheme] - One of: query, key, value, score, output, weight
   * @param {boolean} [config.editable=false] - Allow editing cell values
   * @param {number} [config.precision=2] - Decimal places
   * @param {string[]} [config.rowLabels] - Labels for each row
   * @param {string[]} [config.colLabels] - Labels for each column
   * @param {string} [config.annotation] - Text below the matrix
   * @param {boolean} [config.showDims=false] - Show dimensions badge
   * @param {boolean} [config.startEmpty=false] - Show '?' placeholders
   */
  constructor(container, config) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.data = config.data.map(row => [...row]);
    this.rows = this.data.length;
    this.cols = this.data[0].length;
    this.label = config.label || '';
    this.colorScheme = config.colorScheme || '';
    this.editable = config.editable || false;
    this.precision = config.precision ?? 2;
    this.rowLabels = config.rowLabels || null;
    this.colLabels = config.colLabels || null;
    this.annotation = config.annotation || '';
    this.showDims = config.showDims ?? false;
    this.startEmpty = config.startEmpty || false;

    this._onChange = null;
    this._cells = [];
    this._el = null;

    this._render();
  }

  _render() {
    const wrapper = document.createElement('div');
    wrapper.className = `mtx${this.colorScheme ? ` mtx--${this.colorScheme}` : ''}`;

    // Label
    if (this.label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'mtx-label';
      labelEl.innerHTML = this._formatLabel(this.label);
      wrapper.appendChild(labelEl);
    }

    // Dimensions badge
    if (this.showDims) {
      const dimsEl = document.createElement('div');
      dimsEl.className = 'mtx-dims';
      dimsEl.textContent = `${this.rows}×${this.cols}`;
      wrapper.appendChild(dimsEl);
    }

    // Body (brackets + grid)
    const body = document.createElement('div');
    body.className = 'mtx-body';

    // Column labels (rendered above the body/brackets)
    if (this.colLabels) {
      const colLabelsRow = document.createElement('div');
      colLabelsRow.className = 'mtx-col-labels';
      colLabelsRow.style.paddingLeft = this.rowLabels
        ? 'calc(32px + var(--space-2))'
        : `calc(var(--mtx-bracket-width) + var(--space-1))`;
      this.colLabels.forEach(lbl => {
        const el = document.createElement('div');
        el.className = 'mtx-col-label';
        el.textContent = lbl;
        colLabelsRow.appendChild(el);
      });
      wrapper.appendChild(colLabelsRow);
    }

    // Row labels
    if (this.rowLabels) {
      const rowLabelsCol = document.createElement('div');
      rowLabelsCol.className = 'mtx-row-labels';
      this.rowLabels.forEach(lbl => {
        const el = document.createElement('div');
        el.className = 'mtx-row-label';
        el.textContent = lbl;
        rowLabelsCol.appendChild(el);
      });
      body.appendChild(rowLabelsCol);
    }

    // Left bracket
    const bracketL = document.createElement('div');
    bracketL.className = 'mtx-bracket mtx-bracket--left';
    body.appendChild(bracketL);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'mtx-grid';
    grid.style.gridTemplateColumns = `repeat(${this.cols}, var(--mtx-cell-size))`;

    this._cells = [];
    for (let i = 0; i < this.rows; i++) {
      this._cells[i] = [];
      for (let j = 0; j < this.cols; j++) {
        const cell = document.createElement('div');
        cell.className = 'mtx-cell';
        cell.dataset.row = i;
        cell.dataset.col = j;

        if (this.startEmpty) {
          cell.classList.add('mtx-cell--empty');
          cell.textContent = '?';
        } else if (this.editable) {
          cell.classList.add('mtx-cell--editable');
          const input = document.createElement('input');
          input.type = 'text';
          input.value = this._format(this.data[i][j]);
          input.addEventListener('change', () => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
              this.data[i][j] = val;
              input.value = this._format(val);
              if (this._onChange) this._onChange(i, j, val, this.data);
            }
          });
          input.addEventListener('focus', () => input.select());
          cell.appendChild(input);
        } else {
          cell.textContent = this._format(this.data[i][j]);
        }

        grid.appendChild(cell);
        this._cells[i][j] = cell;
      }
    }

    body.appendChild(grid);
    this._grid = grid;

    // Right bracket
    const bracketR = document.createElement('div');
    bracketR.className = 'mtx-bracket mtx-bracket--right';
    body.appendChild(bracketR);

    wrapper.appendChild(body);

    // Annotation
    if (this.annotation) {
      const annoEl = document.createElement('div');
      annoEl.className = 'mtx-annotation';
      annoEl.textContent = this.annotation;
      wrapper.appendChild(annoEl);
    }

    this._el = wrapper;
    this.container.appendChild(wrapper);
  }

  _format(val) {
    if (val === null || val === undefined) return '?';
    return Number(val).toFixed(this.precision);
  }

  _formatLabel(label) {
    return formatNotation(label);
  }

  /* ---- Public API ---- */

  /** Set all data and re-render cell contents */
  setData(data) {
    this.data = data.map(row => [...row]);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this._updateCellDisplay(i, j);
      }
    }
  }

  /** Get current data */
  getData() {
    return this.data.map(row => [...row]);
  }

  /** Set a single cell value with optional animation */
  setCellValue(row, col, value, animate = false) {
    this.data[row][col] = value;
    const cell = this._cells[row][col];
    cell.classList.remove('mtx-cell--empty');

    if (this.editable) {
      cell.querySelector('input').value = this._format(value);
    } else {
      cell.textContent = this._format(value);
    }

    if (animate) {
      cell.classList.remove('mtx-cell--computed');
      void cell.offsetWidth; // force reflow
      cell.classList.add('mtx-cell--computed');
    }
  }

  /** Highlight an entire row */
  highlightRow(row, className = 'mtx-cell--highlight-row') {
    for (let j = 0; j < this.cols; j++) {
      this._cells[row][j].classList.add(className);
    }
  }

  /** Highlight an entire column */
  highlightCol(col, className = 'mtx-cell--highlight-col') {
    for (let i = 0; i < this.rows; i++) {
      this._cells[i][col].classList.add(className);
    }
  }

  /** Highlight a single cell */
  highlightCell(row, col, className = 'mtx-cell--active') {
    this._cells[row][col].classList.add(className);
  }

  /** Remove all highlight classes */
  clearHighlights() {
    const classes = [
      'mtx-cell--highlight-row',
      'mtx-cell--highlight-col',
      'mtx-cell--active',
      'mtx-cell--computed'
    ];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        classes.forEach(cls => this._cells[i][j].classList.remove(cls));
      }
    }
  }

  /** Apply heatmap coloring based on values */
  applyHeatmap(colorFn) {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const cell = this._cells[i][j];
        cell.classList.add('mtx-cell--heat');
        cell.style.backgroundColor = colorFn(this.data[i][j], i, j);
      }
    }
  }

  /** Clear heatmap styles */
  clearHeatmap() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this._cells[i][j].classList.remove('mtx-cell--heat');
        this._cells[i][j].style.backgroundColor = '';
      }
    }
  }

  /** Reset to empty state */
  resetToEmpty() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const cell = this._cells[i][j];
        cell.className = 'mtx-cell mtx-cell--empty';
        cell.textContent = '?';
        cell.style.backgroundColor = '';
      }
    }
  }

  /** Set editable mode */
  setEditable(editable) {
    this.editable = editable;
    // Would need full re-render, simplified here
  }

  /** Register change callback */
  onChange(fn) {
    this._onChange = fn;
  }

  /** Get the root DOM element */
  getElement() {
    return this._el;
  }

  /** Remove from DOM */
  destroy() {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
  }

  _updateCellDisplay(i, j) {
    const cell = this._cells[i][j];
    cell.classList.remove('mtx-cell--empty');
    if (this.editable) {
      const input = cell.querySelector('input');
      if (input) input.value = this._format(this.data[i][j]);
    } else {
      cell.textContent = this._format(this.data[i][j]);
    }
  }
}


/* ============================================================
   MatrixMultiplication - Animated Matrix Multiply
   ============================================================ */

class MatrixMultiplication {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {Object} config.matA - { data, label, colorScheme }
   * @param {Object} config.matB - { data, label, colorScheme }
   * @param {Object} [config.resultConfig] - { label, colorScheme }
   * @param {number} [config.speed=400] - ms per step
   * @param {boolean} [config.showDetail=true] - Show calculation detail
   * @param {boolean} [config.autoStart=false] - Start animation automatically
   * @param {Object} [config.labels] - UI text labels for i18n
   */
  constructor(container, config) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.configA = config.matA;
    this.configB = config.matB;
    this.resultConfig = config.resultConfig || { label: 'Result', colorScheme: 'output' };
    this.speed = config.speed ?? 400;
    this.showDetail = config.showDetail ?? true;
    this.autoStart = config.autoStart ?? false;

    this.labels = { ...DEFAULT_CONTROL_LABELS, ...(config.labels || {}) };

    // Validate dimensions
    const colsA = this.configA.data[0].length;
    const rowsB = this.configB.data.length;
    if (colsA !== rowsB) {
      throw new Error(`Matrix dimensions incompatible: A is ${this.configA.data.length}×${colsA}, B is ${rowsB}×${this.configB.data[0].length}`);
    }

    this._resultData = this._computeResult();
    this._currentStep = -1;
    this._totalSteps = this.configA.data.length * this.configB.data[0].length;
    this._playing = false;
    this._animationTimer = null;
    this._onStep = null;
    this._onComplete = null;

    this._render();

    if (this.autoStart) {
      setTimeout(() => this.play(), 500);
    }
  }

  _computeResult() {
    return MatrixMath.multiply(this.configA.data, this.configB.data);
  }

  _render() {
    // Clear container
    this.container.innerHTML = '';

    // Multiply layout
    const layout = document.createElement('div');
    layout.className = 'mtx-multiply';

    // Matrix A
    const aContainer = document.createElement('div');
    this.matA = new MatrixComponent(aContainer, {
      ...this.configA,
      precision: this.configA.precision ?? 2
    });
    layout.appendChild(aContainer);

    // Operator ×
    const timesOp = document.createElement('div');
    timesOp.className = 'mtx-multiply__op';
    timesOp.textContent = '×';
    layout.appendChild(timesOp);

    // Matrix B
    const bContainer = document.createElement('div');
    this.matB = new MatrixComponent(bContainer, {
      ...this.configB,
      precision: this.configB.precision ?? 2
    });
    layout.appendChild(bContainer);

    // Operator =
    const equalsOp = document.createElement('div');
    equalsOp.className = 'mtx-multiply__op';
    equalsOp.textContent = '=';
    layout.appendChild(equalsOp);

    // Result Matrix (starts empty)
    const resultRows = this.configA.data.length;
    const resultCols = this.configB.data[0].length;
    const emptyData = Array.from({ length: resultRows }, () => Array(resultCols).fill(0));
    const cContainer = document.createElement('div');
    this.matC = new MatrixComponent(cContainer, {
      data: emptyData,
      label: this.resultConfig.label,
      colorScheme: this.resultConfig.colorScheme,
      precision: this.resultConfig.precision ?? 2,
      startEmpty: true,
      rowLabels: this.configA.rowLabels,
      colLabels: this.configB.colLabels
    });
    layout.appendChild(cContainer);

    this.container.appendChild(layout);

    // Detail panel
    if (this.showDetail) {
      this._detailEl = document.createElement('div');
      this._detailEl.className = 'mtx-detail';
      this._detailEl.innerHTML = `<span class="mtx-detail__hint">${this.labels.startHint}</span>`;
      this.container.appendChild(this._detailEl);
    }

    // Unified controller via StepAnimator
    const ctrlContainer = document.createElement('div');
    this.container.appendChild(ctrlContainer);

    this._animator = new StepAnimator(ctrlContainer, {
      totalSteps: this._totalSteps,
      speed: this.speed,
      labels: this.labels,
      onStep: (idx) => this._executeStep(idx),
      onComplete: () => this._complete(),
      onReset: () => {
        this.matA.clearHighlights();
        this.matB.clearHighlights();
        this.matC.resetToEmpty();
        if (this._detailEl) {
          this._detailEl.innerHTML = `<span class="mtx-detail__hint">${this.labels.startHint}</span>`;
        }
      }
    });
  }

  _getStepCoords(stepIndex) {
    const cols = this.configB.data[0].length;
    return {
      row: Math.floor(stepIndex / cols),
      col: stepIndex % cols
    };
  }

  async _executeStep(stepIndex) {
    const { row, col } = this._getStepCoords(stepIndex);
    const A = this.configA.data;
    const B = this.configB.data;
    const k = A[0].length;

    // Clear previous highlights
    this.matA.clearHighlights();
    this.matB.clearHighlights();

    // Highlight current row of A and column of B
    this.matA.highlightRow(row);
    this.matB.highlightCol(col);

    // Build detail calculation
    if (this.showDetail && this._detailEl) {
      const terms = document.createElement('div');
      terms.className = 'mtx-detail__terms';

      let sum = 0;
      for (let t = 0; t < k; t++) {
        if (t > 0) {
          const plus = document.createElement('span');
          plus.className = 'mtx-detail__plus';
          plus.textContent = '+';
          terms.appendChild(plus);
        }

        const term = document.createElement('span');
        term.className = 'mtx-detail__term';
        term.style.animationDelay = `${t * 80}ms`;

        const aVal = document.createElement('span');
        aVal.className = 'mtx-detail__term--a mtx-detail__term-val';
        aVal.textContent = A[row][t].toFixed(2);

        const times = document.createElement('span');
        times.className = 'mtx-detail__plus';
        times.textContent = '·';

        const bVal = document.createElement('span');
        bVal.className = 'mtx-detail__term--b mtx-detail__term-val';
        bVal.textContent = B[t][col].toFixed(2);

        term.appendChild(aVal);
        term.appendChild(times);
        term.appendChild(bVal);
        terms.appendChild(term);

        sum += A[row][t] * B[t][col];
      }

      const eq = document.createElement('span');
      eq.className = 'mtx-detail__equals';
      eq.textContent = '=';
      terms.appendChild(eq);

      const result = document.createElement('span');
      result.className = 'mtx-detail__term mtx-detail__term--result';
      result.style.animationDelay = `${k * 80 + 100}ms`;
      result.textContent = sum.toFixed(2);
      terms.appendChild(result);

      this._detailEl.innerHTML = '';
      this._detailEl.appendChild(terms);
    }

    // Set result cell
    this.matC.setCellValue(row, col, this._resultData[row][col], true);
    this.matC.highlightCell(row, col);

    // Callback
    if (this._onStep) this._onStep(stepIndex, row, col, this._resultData[row][col]);
  }

  _complete() {
    this.matA.clearHighlights();
    this.matB.clearHighlights();
    if (this._detailEl) {
      this._detailEl.innerHTML = `<span class="mtx-detail__complete">${this.labels.complete}</span>`;
    }
    if (this._onComplete) this._onComplete(this._resultData);
  }

  /* ---- Public API ---- */

  /** Register step callback */
  onStep(fn) { this._onStep = fn; }

  /** Register completion callback */
  onComplete(fn) { this._onComplete = fn; }

  /** Get the computed result */
  getResult() { return this._resultData.map(row => [...row]); }

  /** Destroy and clean up */
  destroy() {
    if (this._animator) this._animator.destroy();
    this.container.innerHTML = '';
  }
}


/* ============================================================
   StepAnimator - Reusable Play/Step/Reset/Speed controller
   
   Usage:
     const anim = new StepAnimator(container, {
       totalSteps: 12,
       speed: 80,
       labels: { play, pause, step, reset, done, speed, startHint, complete },
       onStep: (idx) => { ... },
       onComplete: () => { ... },
       onReset: () => { ... }
     });
   ============================================================ */

class StepAnimator {
  constructor(container, config) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.totalSteps = config.totalSteps || 1;
    this.speed = config.speed ?? 80;
    this._onStepFn = config.onStep || (() => {});
    this._onCompleteFn = config.onComplete || (() => {});
    this._onResetFn = config.onReset || (() => {});

    this.labels = { ...DEFAULT_CONTROL_LABELS, ...(config.labels || {}) };

    this._currentStep = -1;
    this._playing = false;
    this._timer = null;
    this._render();
  }

  _render() {
    // Progress bar
    const prog = document.createElement('div');
    prog.className = 'mtx-progress';
    this._bar = document.createElement('div');
    this._bar.className = 'mtx-progress__bar';
    this._bar.style.width = '0%';
    prog.appendChild(this._bar);
    this.container.appendChild(prog);

    // Controls row
    const ctrls = document.createElement('div');
    ctrls.className = 'mtx-controls';

    this._playBtn = this._btn(this.labels.play, 'mtx-btn mtx-btn--primary', () => this.play());
    this._pauseBtn = this._btn(this.labels.pause, 'mtx-btn', () => this.pause());
    this._stepBtn = this._btn(this.labels.step, 'mtx-btn', () => this.step());
    this._resetBtn = this._btn(this.labels.reset, 'mtx-btn', () => this.reset());
    this._pauseBtn.style.display = 'none';

    ctrls.appendChild(this._playBtn);
    ctrls.appendChild(this._pauseBtn);
    ctrls.appendChild(this._stepBtn);
    ctrls.appendChild(this._resetBtn);

    // Speed slider
    const spd = document.createElement('div');
    spd.className = 'mtx-speed';
    spd.innerHTML = `<span>${this.labels.speed}</span>`;
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '30'; slider.max = '300';
    slider.value = String(330 - this.speed);
    slider.addEventListener('input', () => { this.speed = 330 - parseInt(slider.value); });
    spd.appendChild(slider);
    ctrls.appendChild(spd);

    this.container.appendChild(ctrls);
  }

  _btn(text, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.textContent = text;
    b.addEventListener('click', fn); return b;
  }

  _advance() {
    if (!this._playing) return;
    this._currentStep++;
    if (this._currentStep >= this.totalSteps) { this._finish(); return; }
    this._exec();
    this._timer = setTimeout(() => this._advance(), this.speed);
  }

  _exec() {
    this._onStepFn(this._currentStep);
    this._bar.style.width = `${((this._currentStep + 1) / this.totalSteps) * 100}%`;
  }

  _finish() {
    this._playing = false;
    this._playBtn.style.display = '';
    this._playBtn.textContent = this.labels.done;
    this._playBtn.disabled = true;
    this._pauseBtn.style.display = 'none';
    this._stepBtn.disabled = true;
    this._onCompleteFn();
  }

  play() {
    if (this._playing) return;
    this._playing = true;
    this._playBtn.style.display = 'none';
    this._pauseBtn.style.display = '';
    this._stepBtn.disabled = true;
    this._advance();
  }

  pause() {
    this._playing = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._playBtn.style.display = '';
    this._pauseBtn.style.display = 'none';
    this._stepBtn.disabled = false;
  }

  step() {
    if (this._playing) return;
    this._currentStep++;
    if (this._currentStep >= this.totalSteps) { this._finish(); return; }
    this._exec();
  }

  reset() {
    this.pause();
    this._currentStep = -1;
    this._bar.style.width = '0%';
    this._playBtn.style.display = '';
    this._playBtn.textContent = this.labels.play;
    this._playBtn.disabled = false;
    this._pauseBtn.style.display = 'none';
    this._stepBtn.disabled = false;
    this._onResetFn();
  }

  destroy() {
    this.pause();
  }
}


/* ============================================================
   MatrixMath - Utility functions
   ============================================================ */

const MatrixMath = {
  /** Matrix multiply */
  multiply(A, B) {
    const m = A.length, p = A[0].length, n = B[0].length;
    const C = Array.from({ length: m }, () => Array(n).fill(0));
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < p; k++)
          C[i][j] += A[i][k] * B[k][j];
    return C;
  },

  /** Transpose */
  transpose(M) {
    const rows = M.length, cols = M[0].length;
    return Array.from({ length: cols }, (_, j) =>
      Array.from({ length: rows }, (_, i) => M[i][j])
    );
  },

  /** Scale matrix by scalar */
  scale(M, s) {
    return M.map(row => row.map(v => v * s));
  },

  /** Row-wise softmax */
  softmax(M) {
    return M.map(row => {
      const max = Math.max(...row);
      const exps = row.map(v => Math.exp(v - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    });
  },

  /** Find max element in 2D matrix → { row, col, val } */
  max(data) {
    let best = { row: 0, col: 0, val: -Infinity };
    for (let i = 0; i < data.length; i++)
      for (let j = 0; j < data[0].length; j++)
        if (data[i][j] > best.val) best = { row: i, col: j, val: data[i][j] };
    return best;
  },

  /** Find min element in 2D matrix → { row, col, val } */
  min(data) {
    let best = { row: 0, col: 0, val: Infinity };
    for (let i = 0; i < data.length; i++)
      for (let j = 0; j < data[0].length; j++)
        if (data[i][j] < best.val) best = { row: i, col: j, val: data[i][j] };
    return best;
  },

  /** Format value as percentage string */
  pct(v) {
    return (v * 100).toFixed(1) + '%';
  },

  /**
   * Linearly interpolate between two RGB colors.
   * @param {number[]} colorLow  - [r, g, b] for t=0
   * @param {number[]} colorHigh - [r, g, b] for t=1
   * @param {number} t - 0..1
   * @returns {{ r: number, g: number, b: number, css: string }}
   */
  interpolateColor(colorLow, colorHigh, t) {
    const r = Math.round(colorLow[0] + (colorHigh[0] - colorLow[0]) * t);
    const g = Math.round(colorLow[1] + (colorHigh[1] - colorLow[1]) * t);
    const b = Math.round(colorLow[2] + (colorHigh[2] - colorLow[2]) * t);
    return { r, g, b, css: `rgb(${r},${g},${b})` };
  },

  /** Create random matrix */
  random(rows, cols, min = 0, max = 1, seed = null) {
    const rng = seed !== null ? MatrixMath._seededRandom(seed) : Math.random;
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () =>
        +(min + rng() * (max - min)).toFixed(3)
      )
    );
  },

  /** Simple seeded PRNG */
  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  },

  /** Pretty print matrix to console */
  print(M, label = '') {
    if (label) console.log(`${label}:`);
    console.table(M.map(row => row.map(v => +v.toFixed(4))));
  }
};


/* ============================================================
   HeatmapComponent — Reusable 2D color-coded heatmap
   
   Usage:
     new HeatmapComponent(container, {
       data: [[0.1, 0.9], [0.5, 0.5]],
       rowLabels: ['A', 'B'],
       colLabels: ['X', 'Y'],
       title: 'My Heatmap',
       precision: 2,
       colorLow: [8, 14, 40],
       colorHigh: [232, 168, 56],
       rowAxis: 'Row',
       colAxis: 'Column',
       lowLabel: 'Low',
       highLabel: 'High'
     });
   ============================================================ */

class HeatmapComponent {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} config
   * @param {number[][]} config.data - 2D matrix
   * @param {string[]} config.rowLabels
   * @param {string[]} config.colLabels
   * @param {string} [config.title='']
   * @param {number} [config.precision=2]
   * @param {number[]} [config.colorLow=[8,14,40]] - RGB for min value
   * @param {number[]} [config.colorHigh=[232,168,56]] - RGB for max value
   * @param {string} [config.rowAxis='Row']
   * @param {string} [config.colAxis='Column']
   * @param {string} [config.lowLabel='Low']
   * @param {string} [config.highLabel='High']
   */
  constructor(container, config) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.data = config.data;
    this.rowLabels = config.rowLabels;
    this.colLabels = config.colLabels;
    this.title = config.title || '';
    this.precision = config.precision ?? 2;
    this.colorLow = config.colorLow || [8, 14, 40];
    this.colorHigh = config.colorHigh || [232, 168, 56];
    this.rowAxis = config.rowAxis || 'Row';
    this.colAxis = config.colAxis || 'Column';
    this.lowLabel = config.lowLabel || 'Low';
    this.highLabel = config.highLabel || 'High';

    this._el = null;
    this._render();
  }

  /**
   * White-to-color mapping: low value → white, high value → deep color.
   * t ∈ [0,1], uses power curve to amplify mid-range differences.
   */
  _color(t) {
    const [hr, hg, hb] = this.colorHigh;
    const p = Math.pow(t, 0.8); // amplify differences
    // Blend from white [255,255,255] → colorHigh
    const r = Math.round(255 - (255 - hr) * p);
    const g = Math.round(255 - (255 - hg) * p);
    const bl = Math.round(255 - (255 - hb) * p);
    return { r, g, b: bl, css: `rgb(${r},${g},${bl})` };
  }

  _render() {
    const { data, rowLabels, colLabels } = this;
    const rows = data.length;
    const cols = data[0].length;

    const { val: minVal } = MatrixMath.min(data);
    const { val: maxVal } = MatrixMath.max(data);
    const range = maxVal - minVal || 1;

    const wrap = document.createElement('div');
    wrap.className = 'heatmap';

    if (this.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'heatmap__title';
      titleEl.textContent = this.title;
      wrap.appendChild(titleEl);
    }

    // Axis label (column)
    const colAxisEl = document.createElement('div');
    colAxisEl.className = 'heatmap__axis-label';
    colAxisEl.textContent = `← ${this.colAxis} →`;
    wrap.appendChild(colAxisEl);

    // Build as <table> for reliable grid layout
    const table = document.createElement('table');
    table.className = 'heatmap__table';

    // Header row: corner + column labels
    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    const corner = document.createElement('th');
    corner.className = 'heatmap__corner';
    htr.appendChild(corner);
    colLabels.forEach(l => {
      const th = document.createElement('th');
      th.textContent = l;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    // Body: row label + cells
    const tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      const rowTh = document.createElement('th');
      rowTh.className = 'heatmap__row-th';
      rowTh.textContent = rowLabels[i];
      tr.appendChild(rowTh);

      for (let j = 0; j < cols; j++) {
        const val = data[i][j];
        const t = (val - minVal) / range;
        const color = this._color(t);
        // Brighter text for dark cells, dark text for bright
        const lum = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
        const textColor = lum > 120 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';

        const td = document.createElement('td');
        td.className = 'heatmap__cell';
        td.textContent = val.toFixed(this.precision);
        td.style.backgroundColor = color.css;
        td.style.color = textColor;
        td.style.setProperty('--cell-index', i * cols + j);
        td.setAttribute('data-tooltip', `${rowLabels[i]} → ${colLabels[j]}: ${val.toFixed(4)}`);

        if (t > 0.6) {
          td.style.boxShadow = `0 0 ${Math.round(t * 18)}px rgba(${this.colorHigh.join(',')}, ${t * 0.35})`;
          td.style.borderColor = `rgba(${this.colorHigh.join(',')}, 0.4)`;
        }

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);

    // Row axis label
    const rowAxisEl = document.createElement('div');
    rowAxisEl.className = 'heatmap__axis-label';
    rowAxisEl.textContent = `↑ ${this.rowAxis}`;
    wrap.appendChild(rowAxisEl);

    // Legend with multi-stop gradient
    const legend = document.createElement('div');
    legend.className = 'heatmap__legend';
    const lowSpan = document.createElement('span');
    lowSpan.textContent = `${this.lowLabel} (${minVal.toFixed(this.precision)})`;
    legend.appendChild(lowSpan);
    const bar = document.createElement('div');
    bar.className = 'heatmap__legend-bar';
    const c0 = this._color(0).css;
    const c5 = this._color(0.5).css;
    const c1 = this._color(1).css;
    bar.style.background = `linear-gradient(90deg, ${c0}, ${c5}, ${c1})`;
    legend.appendChild(bar);
    const highSpan = document.createElement('span');
    highSpan.textContent = `${this.highLabel} (${maxVal.toFixed(this.precision)})`;
    legend.appendChild(highSpan);
    wrap.appendChild(legend);

    this._el = wrap;
    this.container.appendChild(wrap);
  }

  /** Get the root DOM element */
  getElement() { return this._el; }

  /** Remove from DOM */
  destroy() {
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
  }
}
