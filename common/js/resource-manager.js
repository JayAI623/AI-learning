/* ============================================================
   ResourceManager — Lifecycle management for destroyable components.
   Tracks registered resources and cleans them up in bulk.
   ============================================================ */

class ResourceManager {
  constructor() {
    this._resources = [];
  }

  /**
   * Register a resource that has a destroy() method.
   * @param {object} resource - Any object with a .destroy() method
   * @returns {object} The same resource (for chaining)
   */
  register(resource) {
    if (resource && typeof resource.destroy === 'function') {
      this._resources.push(resource);
    }
    return resource;
  }

  /**
   * Destroy all registered resources and reset the list.
   */
  clear() {
    this._resources.forEach((r) => {
      if (r && typeof r.destroy === 'function') {
        r.destroy();
      }
    });
    this._resources = [];
  }

  /** Number of tracked resources. */
  get size() {
    return this._resources.length;
  }
}
