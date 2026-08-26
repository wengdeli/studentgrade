/* ============================================================
   ROUTER — StudentApp
   Hash-based SPA router
   ============================================================ */

const Router = {
  routes: {},

  define(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  init() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  },

  _resolve() {
    const hash = window.location.hash.replace('#', '') || '/';
    const path = hash.split('?')[0];

    // Exact match
    if (this.routes[path]) {
      this.routes[path]();
      return;
    }

    // Prefix match (e.g. /student -> /student)
    const matched = Object.keys(this.routes).find(r => path.startsWith(r) && r !== '/');
    if (matched) {
      this.routes[matched]();
      return;
    }

    // Fallback
    if (this.routes['/']) {
      this.routes['/']();
    }
  },
};
