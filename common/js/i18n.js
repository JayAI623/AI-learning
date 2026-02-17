/* ============================================================
   i18n - Lightweight Internationalization Module (Reusable)
   
   Usage:
     const i18n = new I18n({ defaultLang: 'en', translations: { en: {...}, zh: {...} } });
     i18n.t('hero.title');
     i18n.switchLang('zh');

   HTML usage:
     <span data-i18n="hero.title"></span>
     <span data-i18n-html="formula.qkv"></span>  (allows HTML)
     <input data-i18n-placeholder="search.placeholder">
   ============================================================ */

class I18n {
  /**
   * @param {Object} config
   * @param {string} config.defaultLang - Default language code
   * @param {Object} config.translations - { langCode: { key: value, ... }, ... }
   * @param {string} [config.storageKey='app-lang'] - localStorage key
   */
  constructor(config) {
    this.translations = config.translations || {};
    this.storageKey = config.storageKey || 'app-lang';
    this.defaultLang = config.defaultLang || 'en';
    this._listeners = [];

    // Restore saved language or detect from browser
    const saved = localStorage.getItem(this.storageKey);
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    this.currentLang = saved || browserLang || this.defaultLang;

    // Ensure the language exists in translations
    if (!this.translations[this.currentLang]) {
      this.currentLang = this.defaultLang;
    }
  }

  /** Get translation by dot-path key */
  t(key, replacements = {}) {
    const val = this._resolve(key, this.currentLang)
      || this._resolve(key, this.defaultLang)
      || key;

    // Support simple {{placeholder}} replacements
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) => replacements[k] ?? `{{${k}}}`);
  }

  /** Resolve dot-path from translations object */
  _resolve(key, lang) {
    const parts = key.split('.');
    let obj = this.translations[lang];
    for (const part of parts) {
      if (obj === undefined || obj === null) return null;
      obj = obj[part];
    }
    return typeof obj === 'string' ? obj : null;
  }

  /** Switch language and update all [data-i18n] elements */
  switchLang(lang) {
    if (!this.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem(this.storageKey, lang);
    this.updateDOM();
    this._listeners.forEach(fn => fn(lang));
  }

  /** Toggle between available languages */
  toggle() {
    const langs = Object.keys(this.translations);
    const idx = langs.indexOf(this.currentLang);
    const next = langs[(idx + 1) % langs.length];
    this.switchLang(next);
  }

  /** Get current language code */
  getLang() {
    return this.currentLang;
  }

  /** Get all available languages */
  getLanguages() {
    return Object.keys(this.translations);
  }

  /** Register a callback when language changes */
  onChange(fn) {
    this._listeners.push(fn);
  }

  /** Remove a change listener */
  offChange(fn) {
    this._listeners = this._listeners.filter(f => f !== fn);
  }

  /** Update all DOM elements with data-i18n attributes */
  updateDOM(root = document) {
    // Text content
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // HTML content (for formatted text)
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = this.t(key);
    });

    // Placeholders
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Title attributes
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Aria labels
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', this.t(key));
    });

    // Update html lang attribute
    document.documentElement.lang = this.currentLang;
  }
}
