/* ============================================================
   VIEW: ROLE SELECT — StudentApp
   Trang chọn vai trò (Học sinh / Giáo viên / Phụ huynh)
   ============================================================ */

const RoleSelectView = {
  render() {
    const user    = AuthDB.getCurrentUser();
    const userRole= user?.role || null;

    return `
      <div class="page-enter">
        <div class="page-hero">
          <div class="page-hero-eyebrow">
            <span>🎓</span> Nền tảng học tập thông minh
          </div>
          <h1 class="page-hero-title">
            Chào mừng đến với<br>
            <span class="gradient-text">StudentGrade</span>
          </h1>
          <p class="page-hero-sub">
            Quản lý bài tập, theo dõi điểm số và kết nối học sinh —
            giáo viên — phụ huynh trong một nền tảng thống nhất.
          </p>
        </div>

        <div class="container container-md">
          <p class="text-center text-secondary font-semibold" style="margin-bottom:var(--sp-4);letter-spacing:0.05em;text-transform:uppercase;font-size:var(--fs-xs);">
            Chọn vai trò của bạn
          </p>
          <div class="role-grid">
            ${this._renderCard({ role: 'student', emoji: '🎒', title: 'Học sinh',
              desc: 'Nộp bài tập, theo dõi điểm số và xem phản hồi từ giáo viên.',
              features: ['Nộp bài tập trực tuyến','Xem điểm số & nhận xét','Nhận thông báo chấm điểm','Theo dõi tiến bộ học tập'],
              btnLabel: 'Vào trang Học sinh',
              btnStyle: 'background:linear-gradient(135deg,var(--brand-500),var(--brand-600));color:#fff;box-shadow:0 4px 20px hsla(248,80%,55%,.40)',
              userRole,
            })}
            ${this._renderCard({ role: 'teacher', emoji: '👩‍🏫', title: 'Giáo viên',
              desc: 'Quản lý bài nộp, chấm điểm và gửi phản hồi chi tiết cho học sinh.',
              features: ['Xem danh sách bài nộp','Chấm điểm & gửi nhận xét','Thống kê điểm theo lớp','Lọc theo môn / trạng thái'],
              btnLabel: 'Vào trang Giáo viên',
              btnStyle: 'background:linear-gradient(135deg,hsl(38,85%,50%),hsl(38,75%,42%));color:#fff;box-shadow:0 4px 20px hsla(38,85%,50%,.40)',
              userRole,
            })}
            ${this._renderCard({ role: 'parent', emoji: '👨‍👩‍👧', title: 'Phụ huynh',
              desc: 'Theo dõi điểm số, bài tập và nhận thông báo về kết quả học tập của con.',
              features: ['Bảng điểm chi tiết theo môn','Theo dõi tiến bộ theo thời gian','Nhận thông báo tức thì','Xem nhận xét của giáo viên'],
              btnLabel: 'Vào trang Phụ huynh',
              btnStyle: 'background:linear-gradient(135deg,hsl(152,65%,42%),hsl(152,70%,36%));color:#fff;box-shadow:0 4px 20px hsla(152,70%,42%,.40)',
              userRole,
            })}
          </div>

          <!-- Nút đăng nhập chung — chỉ hiện khi chưa login -->
          ${!userRole ? `
            <div style="text-align:center;margin-top:var(--sp-8)">
              <button class="btn btn-primary btn-lg" id="btn-login-main"
                style="padding:var(--sp-4) var(--sp-10);font-size:var(--fs-lg);gap:var(--sp-3);box-shadow:0 8px 32px hsla(248,80%,55%,.45)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Đăng nhập
              </button>
              <p style="margin-top:var(--sp-3);font-size:var(--fs-xs);color:var(--text-muted)">
                Đăng nhập để truy cập trang dành cho vai trò của bạn
              </p>
            </div>
          ` : ''}

          <!-- Stats row -->
          <div class="flex items-center justify-center gap-6 mt-8" style="flex-wrap:wrap">
            ${this._quickStat('📋', SubmissionDB.getAll().length, 'Bài đã nộp')}
            ${this._quickStat('✅', SubmissionDB.stats().graded, 'Bài đã chấm')}
            ${this._quickStat('👨‍🎓', STUDENTS.length, 'Học sinh')}
            ${this._quickStat('📚', SUBJECTS.length, 'Môn học')}
          </div>
        </div>
      </div>
    `;
  },

  /** Render một role card — KHÔNG có nút login bên trong card */
  _renderCard({ role, emoji, title, desc, features, btnLabel, btnStyle, userRole }) {
    const hasAccess   = userRole === role;
    const isOtherRole = !!userRole && !hasAccess;

    // Nút chỉ hiện khi đã đăng nhập ĐÚNG role
    const actionBtn = hasAccess ? `
      <button class="btn btn-lg w-full" id="btn-enter-${role}" data-role="${role}"
        style="${btnStyle};margin-top:var(--sp-2)">
        ${btnLabel}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    ` : '';

    // Lock overlay khi sai role
    const lockOverlay = isOtherRole ? `
      <div style="position:absolute;inset:0;background:rgba(0,0,0,.50);border-radius:inherit;
           display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);z-index:2">
        <div style="text-align:center">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-2)">🔒</div>
          <div style="font-size:var(--fs-sm);color:rgba(255,255,255,.75);font-weight:600">Không có quyền</div>
        </div>
      </div>
    ` : '';

    return `
      <div class="role-card ${role} ripple-container"
           data-role="${role}"
           tabindex="${isOtherRole ? '-1' : '0'}"
           role="button" aria-label="${title}"
           style="${isOtherRole ? 'pointer-events:none;opacity:.7;' : ''}">
        ${lockOverlay}
        <span class="role-card-icon">${emoji}</span>
        <h2 class="role-card-title">${title}</h2>
        <p class="role-card-desc">${desc}</p>
        <div class="role-features">
          ${features.map(f => `
            <div class="role-feature">
              <div class="role-feature-dot"></div>
              <span>${f}</span>
            </div>
          `).join('')}
        </div>
        ${actionBtn}
      </div>
    `;
  },

  _quickStat(icon, val, label) {
    return `
      <div class="flex flex-col items-center gap-2"
        style="text-align:center;padding:var(--sp-4) var(--sp-6);background:var(--bg-glass);
               border:1px solid var(--border-subtle);border-radius:var(--radius-xl);
               backdrop-filter:blur(12px);min-width:100px">
        <span style="font-size:1.5rem">${icon}</span>
        <span style="font-size:var(--fs-2xl);font-weight:900;letter-spacing:-0.03em;color:var(--text-primary)">${val}</span>
        <span style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:500">${label}</span>
      </div>
    `;
  },

  mount() {
    // Nút đăng nhập chung bên dưới grid
    document.getElementById('btn-login-main')?.addEventListener('click', () => {
      App.openLoginModal('student');
    });

    // Nút "Vào trang" (chỉ xuất hiện khi đã login đúng role)
    document.querySelectorAll('[id^="btn-enter-"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        App.setRole(btn.dataset.role);
        App.navigate(`/${btn.dataset.role}`);
      });
    });

    // Ripple + keyboard trên card
    document.querySelectorAll('.role-card:not([style*="pointer-events:none"])').forEach(card => {
      card.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const rect = card.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top  = (e.clientY - rect.top)  + 'px';
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  }
};
