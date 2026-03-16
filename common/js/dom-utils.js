/* ============================================================
   DOM Utilities — Small helpers for building page-level UI.
   ============================================================ */

/**
 * Convert lightweight math markup to HTML sub/sup.
 *   x_t     → x<sub>t</sub>
 *   K^T     → K<sup>T</sup>
 *   h_t^N   → h<sub>t</sub><sup>N</sup>
 *   W_vocab → W<sub>vocab</sub>
 * Only fires when a letter / digit / accented char precedes `_`.
 */
function formatNotation(text) {
  return text
    .replace(/([A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u1E00-\u1EFF])_(\w+)/g,
             '$1<sub>$2</sub>')
    .replace(/\^(\w+)/g, '<sup>$1</sup>');
}

/**
 * Populate a container with chip / badge elements.
 * Supports sub/sup math notation via formatNotation().
 * @param {HTMLElement} container - Target container (will be cleared first)
 * @param {string[]}    values    - Text content for each chip
 * @param {string}      className - CSS class applied to every chip
 */
function createChips(container, values, className) {
  container.innerHTML = '';
  values.forEach((value) => {
    const chip = document.createElement('span');
    chip.className = className;
    chip.innerHTML = formatNotation(value);
    container.appendChild(chip);
  });
}

/**
 * Populate an ordered list element with <li> items.
 * @param {HTMLOListElement} ol     - Target <ol> (will be cleared first)
 * @param {string[]}         values - Text for each list item
 */
function createFlowList(ol, values) {
  ol.innerHTML = '';
  values.forEach((value) => {
    const item = document.createElement('li');
    item.innerHTML = formatNotation(value);
    ol.appendChild(item);
  });
}

/**
 * Create a hint paragraph commonly used above matrix demos.
 * @param {string} text - Hint text content
 * @returns {HTMLParagraphElement}
 */
function createHint(text) {
  const p = document.createElement('p');
  p.className = 'matrix-hint';
  p.innerHTML = formatNotation(text);
  return p;
}
