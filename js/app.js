/* ============================================================
   APP — StudentApp
   Entry point, global state, UI helpers
   ============================================================ */

const App = {
  currentRole: null,
  currentView: null,

  /* ── Init ─────────────────────────────────────────────────── */
  init() {
    const user = AuthDB.getCurrentUser();
    if (user) {
      this.currentRole = user.role;
      if (user.studentId) {
        if (user.role === 'student') StudentView.activeStudentId = user.studentId;
        if (user.role === 'parent')  ParentView.activeStudentId  = user.studentId;
      }
    }

    this._initTheme();
    this._initListeners();

    Router.define('/', () => {
      if (this.currentRole) {
        Router.navigate(`/${this.currentRole}`);
      } else {
        this._showHeader(false);
        this.renderView('roleSelect');
      }
    });

    Router.define('/student', () => {
      if (!AuthDB.isLoggedIn()) { this._authGuard(); return; }
      if (AuthDB.getRole() !== 'student') { this._wrongRole(); return; }
      this.setRole('student');
      this._showHeader(true);
      this.renderView('student');
    });

    Router.define('/teacher', () => {
      if (!AuthDB.isLoggedIn()) { this._authGuard(); return; }
      if (AuthDB.getRole() !== 'teacher') { this._wrongRole(); return; }
      this.setRole('teacher');
      this._showHeader(true);
      this.renderView('teacher');
    });

    Router.define('/parent', () => {
      if (!AuthDB.isLoggedIn()) { this._authGuard(); return; }
      if (AuthDB.getRole() !== 'parent') { this._wrongRole(); return; }
      this.setRole('parent');
      this._showHeader(true);
      this.renderView('parent');
    });

    Router.init();
  },

  _authGuard() {
    this._showHeader(false);
    this.renderView('roleSelect');
    this.openLoginModal();
  },

  _wrongRole() {
    this.toast('Bạn không có quyền truy cập trang này.', 'error');
    Router.navigate('/');
  },

  /* ── Theme ────────────────────────────────────────────────── */
  _initTheme() {
    const saved = localStorage.getItem('sa_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  },

  _toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sa_theme', next);
  },

  /* ── Role ─────────────────────────────────────────────────── */
  setRole(role) {
    this.currentRole = role;
    RoleDB.set(role);
    this._updateHeader();
  },

  _updateHeader() {
    const user = AuthDB.getCurrentUser();
    const role = user?.role || this.currentRole;

    const badge = document.getElementById('role-badge');
    if (badge && role) {
      const map = {
        student: { emoji: '🎒', label: 'Học sinh',  cls: 'student' },
        teacher: { emoji: '👩‍🏫', label: 'Giáo viên', cls: 'teacher' },
        parent:  { emoji: '👨‍👩‍👧', label: 'Phụ huynh', cls: 'parent'  },
      };
      const r = map[role];
      badge.innerHTML = `${r.emoji} ${r.label}`;
      badge.className = `role-badge ${r.cls}`;
      badge.hidden = false;
    }

    const userEl = document.getElementById('header-user');
    if (userEl) {
      if (user) {
        userEl.innerHTML = `
          <div style="display:flex;align-items:center;gap:var(--sp-2)">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--brand-500),var(--accent-cyan));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:var(--fs-sm);color:#fff;flex-shrink:0">
              ${user.displayName.charAt(0)}
            </div>
            <span style="font-size:var(--fs-sm);font-weight:600;color:var(--text-primary);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.displayName}</span>
          </div>
        `;
        userEl.hidden = false;
      } else {
        userEl.hidden = true;
      }
    }

    const btnLogin  = document.getElementById('btn-header-login');
    const btnLogout = document.getElementById('btn-logout');
    const isIn = AuthDB.isLoggedIn();
    if (btnLogin)  btnLogin.hidden  = isIn;
    if (btnLogout) btnLogout.hidden = !isIn;
  },

  logout() {
    AuthDB.logout();
    this.currentRole = null;

    StudentView.activeTab = 'submit';
    TeacherView.activeTab = 'submissions';
    TeacherView.filters   = { subject: '', status: '', search: '' };
    ParentView.activeTab  = 'overview';

    this._showHeader(false);
    Router.navigate('/');
    this.toast('Đã đăng xuất thành công.', 'info');
  },

  navigate(path) { Router.navigate(path); },

  /* ── Header ───────────────────────────────────────────────── */
  _showHeader(show) {
    const header = document.getElementById('app-header');
    if (header) header.hidden = !show;
  },

  /* ── Render ───────────────────────────────────────────────── */
  renderView(viewName) {
    this.currentView = viewName;
    const container = document.getElementById('page-container');
    if (!container) return;

    let html = '';
    switch (viewName) {
      case 'roleSelect': html = RoleSelectView.render(); break;
      case 'student':    html = StudentView.render();    break;
      case 'teacher':    html = TeacherView.render();    break;
      case 'parent':     html = ParentView.render();     break;
    }
    container.innerHTML = html;

    switch (viewName) {
      case 'roleSelect': RoleSelectView.mount(); break;
      case 'student':    StudentView.mount();    break;
      case 'teacher':    TeacherView.mount();    break;
      case 'parent':     ParentView.mount();     break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ── Login Modal — dùng chung cho cả 3 roles ─────────────── */
  openLoginModal() {
    // Tự động lấy từ USERS — không cần hardcode
    const roleConfig = {
      student: { icon: '🎒', label: 'Học sinh',  color: 'var(--brand-400)' },
      teacher: { icon: '👩‍🏫', label: 'Giáo viên', color: 'var(--accent-amber)' },
      parent:  { icon: '👨‍👩‍👧', label: 'Phụ huynh', color: 'var(--accent-emerald)' },
    };
    const demoGroups = ['student', 'teacher', 'parent'].map(role => ({
      ...roleConfig[role],
      accounts: USERS
        .filter(u => u.role === role)
        .map(u => ({ username: u.username, label: u.displayName })),
    }));

    this.openModal('', `
      <div class="login-modal-inner">
        <div style="text-align:center;margin-bottom:var(--sp-6)">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;
               border-radius:var(--radius-xl);margin-bottom:var(--sp-4);font-size:2rem;
               background:linear-gradient(135deg,hsla(248,80%,55%,.18),hsla(248,80%,55%,.08));
               border:1px solid hsla(248,80%,55%,.30)">🔑</div>
          <h2 style="font-size:var(--fs-2xl);font-weight:900;letter-spacing:-0.02em;margin-bottom:var(--sp-1)">Đăng nhập</h2>
          <p style="font-size:var(--fs-sm);color:var(--text-muted)">Dùng chung cho Học sinh · Giáo viên · Phụ huynh</p>
        </div>

        <div id="login-error" style="display:none;background:hsla(0,72%,55%,.12);border:1px solid hsla(0,72%,55%,.30);
             border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-4);
             font-size:var(--fs-sm);color:var(--color-error);align-items:center;gap:var(--sp-2)">
          ❌ <span id="login-error-msg"></span>
        </div>

        <form id="login-form" novalidate autocomplete="off">
          <div class="form-group">
            <label class="form-label" for="login-username">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Tên đăng nhập
            </label>
            <input class="form-control" type="text" id="login-username"
              placeholder="Nhập tên đăng nhập..." autocomplete="username" autofocus />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Mật khẩu
            </label>
            <div style="position:relative">
              <input class="form-control" type="password" id="login-password"
                placeholder="Nhập mật khẩu..." autocomplete="current-password" style="padding-right:44px" />
              <button type="button" id="btn-toggle-pw"
                style="position:absolute;right:0;top:0;height:100%;width:44px;background:none;border:none;
                       cursor:pointer;color:var(--text-muted);display:flex;align-items:center;
                       justify-content:center;transition:color var(--dur-fast)"
                aria-label="Hiện/ẩn mật khẩu">
                <svg id="pw-eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" id="btn-login-submit" class="btn btn-primary w-full btn-lg" style="margin-top:var(--sp-2)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Đăng nhập
          </button>
        </form>

        <!-- Demo accounts — tất cả roles -->
        <div style="margin-top:var(--sp-6);padding-top:var(--sp-5);border-top:1px solid var(--border-subtle)">
          <p style="font-size:var(--fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;
                    color:var(--text-muted);margin-bottom:var(--sp-4)">
            ⚡ Tài khoản demo — mật khẩu:
            <code style="background:var(--bg-overlay);padding:1px 6px;border-radius:4px;font-family:monospace;text-transform:none">123456</code>
          </p>
          <div style="display:flex;flex-direction:column;gap:var(--sp-5)">
            ${demoGroups.map(g => `
              <div>
                <div style="font-size:var(--fs-xs);font-weight:700;color:${g.color};
                            margin-bottom:var(--sp-2);display:flex;align-items:center;gap:4px">
                  ${g.icon} ${g.label}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
                  ${g.accounts.map(a => `
                    <button class="demo-fill-btn" data-username="${a.username}"
                      style="display:flex;align-items:center;justify-content:space-between;
                             padding:var(--sp-2) var(--sp-4);background:var(--bg-elevated);
                             border:1px solid var(--border-subtle);border-radius:var(--radius-md);
                             cursor:pointer;transition:all var(--dur-fast);color:var(--text-primary);
                             font-family:var(--font-sans);font-size:var(--fs-sm)">
                      <span style="font-weight:600">${a.label}</span>
                      <code style="font-size:var(--fs-xs);color:var(--text-muted);background:var(--bg-overlay);
                                   padding:2px 8px;border-radius:4px;font-family:monospace">${a.username}</code>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `);

    this._mountLoginForm();
  },

  _mountLoginForm() {
    // Toggle password visibility
    const togglePw = document.getElementById('btn-toggle-pw');
    const pwInput  = document.getElementById('login-password');
    const pwIcon   = document.getElementById('pw-eye-icon');
    if (togglePw && pwInput) {
      togglePw.addEventListener('click', () => {
        const isHidden = pwInput.type === 'password';
        pwInput.type = isHidden ? 'text' : 'password';
        pwIcon.innerHTML = isHidden
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      });
    }

    // Demo fill buttons
    document.querySelectorAll('.demo-fill-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--border-strong)'; btn.style.background = 'var(--bg-overlay)'; });
      btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--border-subtle)'; btn.style.background = 'var(--bg-elevated)'; });
      btn.addEventListener('click', () => {
        const uEl = document.getElementById('login-username');
        const pEl = document.getElementById('login-password');
        if (uEl) uEl.value = btn.dataset.username;
        if (pEl) pEl.value = '123456';
        uEl?.focus();
      });
    });

    // Error helpers
    const showError = (msg) => {
      const el = document.getElementById('login-error');
      const ms = document.getElementById('login-error-msg');
      if (el && ms) { ms.textContent = msg; el.style.display = 'flex'; }
    };
    const hideError = () => {
      const el = document.getElementById('login-error');
      if (el) el.style.display = 'none';
    };

    // Submit — login chung, tự nav theo role của account
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      hideError();

      const username = document.getElementById('login-username')?.value?.trim() || '';
      const password = document.getElementById('login-password')?.value || '';

      if (!username) { showError('Vui lòng nhập tên đăng nhập.'); return; }
      if (!password) { showError('Vui lòng nhập mật khẩu.'); return; }

      const submitBtn = document.getElementById('btn-login-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Đang đăng nhập...';
      }

      setTimeout(() => {
        const result = AuthDB.login(username, password);

        if (!result.ok) {
          showError(result.error);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Đăng nhập';
          }
          return;
        }

        // ✅ Thành công — tự điều hướng theo role của account
        const user = result.user;
        this.currentRole = user.role;
        if (user.studentId) {
          if (user.role === 'student') StudentView.activeStudentId = user.studentId;
          if (user.role === 'parent')  ParentView.activeStudentId  = user.studentId;
        }
        this.closeModal();
        this.toast('🎉 Xin chào, ' + user.displayName + '!', 'success');
        this._showHeader(true);
        this.setRole(user.role);
        App.navigate('/' + user.role);
      }, 600);
    });
  },

  /* ── Modal ────────────────────────────────────────────────── */
  openModal(title, bodyHTML) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl  = document.getElementById('modal-body');
    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML    = bodyHTML;
    overlay.hidden      = false;
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
  },

  /* ── Toast ────────────────────────────────────────────────── */
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /* ── Listeners ────────────────────────────────────────────── */
  _initListeners() {
    document.getElementById('btn-theme')?.addEventListener('click', () => this._toggleTheme());
    document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());
    document.getElementById('btn-header-login')?.addEventListener('click', () => this.openLoginModal());
    document.getElementById('btn-home')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentRole) {
        Router.navigate(`/${this.currentRole}`);
      } else {
        Router.navigate('/');
      }
    });
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeModal(); });
  },
};

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadConfig();   // fetch data/*.json
    initDB();             // seed localStorage nếu chưa có
    App.init();           // khởi động router & UI
  } catch (err) {
    // Thường xảy ra khi mở file:// trực tiếp — cần dùng local server
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100vh;gap:16px;font-family:system-ui;color:#ccc;background:#0f0f13">
        <div style="font-size:3rem">⚠️</div>
        <h2 style="color:#fff;margin:0">Không thể tải cấu hình</h2>
        <p style="margin:0;text-align:center;max-width:420px">
          App cần chạy qua <strong>HTTP server</strong> để fetch file JSON.<br>
          Mở terminal trong thư mục project và chạy:<br><br>
          <code style="background:#1e1e2e;padding:8px 16px;border-radius:8px;font-size:1rem">
            npx serve .
          </code>
        </p>
        <p style="font-size:0.75rem;color:#666">Lỗi: ${err.message}</p>
      </div>`;
  }
});
