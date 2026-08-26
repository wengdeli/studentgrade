/* ============================================================
   VIEW: STUDENT — StudentApp
   Trang học sinh: nộp bài + danh sách bài đã nộp
   ============================================================ */

const StudentView = {
  activeStudentId: 's01',
  activeTab: 'submit',

  render() {
    const student = STUDENTS.find(s => s.id === this.activeStudentId) || STUDENTS[0];
    const stats   = SubmissionDB.statsByStudent(student.id);
    const notifs  = NotifDB.getByStudent(student.id);
    const unread  = notifs.filter(n => !n.read).length;

    return `
      <div class="page-enter">
        <!-- Student Picker -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--brand-500),var(--accent-cyan));display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;color:#fff;box-shadow:0 4px 16px hsla(248,80%,55%,.35)">
              ${student.name.charAt(0)}
            </div>
            <div>
              <div style="font-size:var(--fs-xl);font-weight:800;letter-spacing:-0.02em">${student.name}</div>
              <div style="font-size:var(--fs-sm);color:var(--text-muted)">Lớp ${student.class}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <select id="student-picker" class="form-control" style="width:auto;min-width:200px" aria-label="Chọn học sinh">
              ${STUDENTS.map(s => `<option value="${s.id}" ${s.id === this.activeStudentId ? 'selected' : ''}>${s.name} — ${s.class}</option>`).join('')}
            </select>
            ${unread > 0 ? `
            <button class="btn btn-secondary btn-sm" id="btn-notifs" style="position:relative">
              🔔 Thông báo
              <span style="position:absolute;top:-6px;right:-6px;background:var(--color-error);color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg-base)">${unread}</span>
            </button>` : `<button class="btn btn-ghost btn-sm" id="btn-notifs">🔔 Thông báo</button>`}
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stat-grid">
          ${this._stat('📋', stats.total, 'Tổng bài nộp', 'Bài tập đã gửi', 'hsl(248,80%,55%)')}
          ${this._stat('✅', stats.graded, 'Đã được chấm', 'Có kết quả', 'hsl(152,70%,45%)')}
          ${this._stat('⏳', stats.pending, 'Đang chờ', 'Chưa chấm điểm', 'hsl(38,90%,50%)')}
          ${this._stat('⭐', stats.avg, 'Điểm trung bình', stats.best != null ? `Cao nhất: ${stats.best}` : 'Chưa có điểm', 'hsl(186,90%,50%)')}
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'submit' ? 'active' : ''}" id="tab-submit" data-tab="submit">
            📤 Nộp bài mới
          </button>
          <button class="tab-btn ${this.activeTab === 'list' ? 'active' : ''}" id="tab-list" data-tab="list">
            📋 Danh sách bài đã nộp
          </button>
          <button class="tab-btn ${this.activeTab === 'notifs' ? 'active' : ''}" id="tab-notifs" data-tab="notifs">
            🔔 Thông báo ${unread > 0 ? `<span style="background:var(--color-error);color:#fff;font-size:10px;padding:1px 6px;border-radius:var(--radius-full);margin-left:4px">${unread}</span>` : ''}
          </button>
        </div>

        <!-- Tab Content -->
        <div id="student-tab-content">
          ${this.activeTab === 'submit'  ? this._renderSubmitForm(student) : ''}
          ${this.activeTab === 'list'    ? this._renderList(student.id) : ''}
          ${this.activeTab === 'notifs'  ? this._renderNotifs(student.id) : ''}
        </div>
      </div>
    `;
  },

  _stat(icon, val, label, sub, color) {
    return `
      <div class="stat-card">
        <div class="stat-card-accent" style="background:${color}"></div>
        <div class="stat-card-label">${label}</div>
        <div class="stat-card-value" style="color:${color}">${val}</div>
        <div class="stat-card-sub">${sub}</div>
      </div>
    `;
  },

  _renderSubmitForm(student) {
    return `
      <div class="card card-elevated" style="max-width:680px;margin:0 auto">
        <div style="margin-bottom:var(--sp-6)">
          <h2 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-2)">📤 Nộp bài tập mới</h2>
          <p style="color:var(--text-muted);font-size:var(--fs-sm)">Điền thông tin và tải lên file bài tập của bạn</p>
        </div>
        <form id="submit-form" novalidate>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="f-subject">
                Môn học <span class="required">*</span>
              </label>
              <select class="form-control" id="f-subject" required>
                <option value="">— Chọn môn học —</option>
                ${SUBJECTS.map(s => `<option value="${s.value}">${s.icon} ${s.label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="f-title">
                Tên bài tập <span class="required">*</span>
              </label>
              <input class="form-control" type="text" id="f-title" placeholder="VD: Bài tập chương 3 — Hàm số" required maxlength="100" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="f-desc">Mô tả / Ghi chú</label>
              <textarea class="form-control" id="f-desc" placeholder="Mô tả thêm về bài tập hoặc ghi chú cho giáo viên..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-deadline">Hạn nộp</label>
              <input class="form-control" type="date" id="f-deadline" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">File bài tập <span class="required">*</span></label>
            <div class="file-upload-area" id="file-drop-zone">
              <span class="file-upload-icon">📁</span>
              <div class="file-upload-text">Kéo thả file vào đây hoặc <strong style="color:var(--brand-400)">click để chọn</strong></div>
              <div class="file-upload-hint">Hỗ trợ: PDF, DOCX, PPTX, ZIP, PY, JS — Tối đa 50MB</div>
              <input type="file" id="f-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.py,.js,.txt" />
              <div class="file-name-display" id="file-name-display"></div>
            </div>
          </div>
          <div style="display:flex;gap:var(--sp-3);justify-content:flex-end;margin-top:var(--sp-6)">
            <button type="button" class="btn btn-ghost" id="btn-reset-form">Xóa form</button>
            <button type="submit" class="btn btn-primary btn-lg" id="btn-submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Nộp bài
            </button>
          </div>
        </form>
      </div>
    `;
  },

  _renderList(studentId) {
    const subs = SubmissionDB.getByStudent(studentId);
    if (!subs.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">Chưa có bài nộp nào</div>
          <div class="empty-state-desc">Bắt đầu bằng cách nộp bài tập đầu tiên của bạn nhé!</div>
          <button class="btn btn-primary" id="btn-go-submit">📤 Nộp bài ngay</button>
        </div>
      `;
    }

    return `
      <div>
        <div class="filter-bar">
          <label>Lọc:</label>
          <select id="filter-subject-s" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);color:var(--text-primary);padding:var(--sp-2) var(--sp-3);font-family:var(--font-sans);font-size:var(--fs-sm);outline:none">
            <option value="">Tất cả môn</option>
            ${SUBJECTS.map(s => `<option value="${s.value}">${s.icon} ${s.label}</option>`).join('')}
          </select>
          <select id="filter-status-s" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);color:var(--text-primary);padding:var(--sp-2) var(--sp-3);font-family:var(--font-sans);font-size:var(--fs-sm);outline:none">
            <option value="">Mọi trạng thái</option>
            <option value="pending">⏳ Chờ chấm</option>
            <option value="graded">✅ Đã chấm</option>
            <option value="late">⚠️ Trễ hạn</option>
          </select>
        </div>

        <div class="table-wrapper">
          <div class="table-scroll">
            <table class="data-table" id="student-table">
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th>Tên bài tập</th>
                  <th>Ngày nộp</th>
                  <th>Hạn nộp</th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th>Nhận xét</th>
                </tr>
              </thead>
              <tbody id="student-table-body">
                ${this._renderRows(subs)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  _renderRows(subs) {
    return subs.map(s => {
      const subj  = getSubject(s.subject);
      const sc    = s.score !== null ? s.score : null;
      const scCls = getScoreClass(sc);
      return `
        <tr>
          <td>
            <span style="display:inline-flex;align-items:center;gap:6px;font-weight:600">
              <span>${subj.icon}</span> ${subj.label}
            </span>
          </td>
          <td>
            <div style="font-weight:600;max-width:200px">${s.title}</div>
            ${s.fileName ? `
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <span style="font-size:var(--fs-xs);color:var(--text-muted)">📎 ${s.fileName}</span>
                <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 8px;height:auto" onclick="StudentView.viewFile('${s.id}')">&#128065; Xem</button>
              </div>
            ` : ''}
          </td>
          <td style="color:var(--text-secondary);white-space:nowrap">${formatDate(s.submittedAt)}</td>
          <td style="color:var(--text-secondary);white-space:nowrap">${s.deadline ? formatDate(s.deadline) : '—'}</td>
          <td>${statusBadge(s.status)}</td>
          <td>
            <div class="score-badge ${scCls}" style="min-width:44px;height:36px;padding:0 var(--sp-3);border-radius:var(--radius-md)">
              ${sc !== null ? sc : '—'}
            </div>
          </td>
          <td>
            ${s.feedback
              ? `<button class="btn btn-ghost btn-sm" onclick="StudentView.showFeedback('${s.id}')">💬 Xem</button>`
              : `<span style="color:var(--text-muted);font-size:var(--fs-xs)">—</span>`}
          </td>
        </tr>
      `;
    }).join('');
  },

  _renderNotifs(studentId) {
    const notifs = NotifDB.getByStudent(studentId);
    if (!notifs.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔕</div>
          <div class="empty-state-title">Không có thông báo</div>
          <div class="empty-state-desc">Bạn sẽ nhận được thông báo khi bài tập được chấm điểm.</div>
        </div>
      `;
    }
    const unread = notifs.filter(n => !n.read).length;
    return `
      <div class="card card-elevated" style="max-width:680px;margin:0 auto">
        <div class="flex items-center justify-between mb-6">
          <h2 style="font-size:var(--fs-xl);font-weight:800">🔔 Thông báo</h2>
          ${unread > 0 ? `<button class="btn btn-secondary btn-sm" id="btn-mark-all">Đánh dấu tất cả đã đọc</button>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          ${notifs.map(n => `
            <div style="display:flex;align-items:flex-start;gap:var(--sp-3);padding:var(--sp-4);border-radius:var(--radius-lg);background:${n.read ? 'transparent' : 'hsla(248,80%,55%,.06)'};border:1px solid ${n.read ? 'var(--border-subtle)' : 'hsla(248,80%,55%,.20)'}">
              <span style="font-size:1.4rem;flex-shrink:0">${n.type === 'grade' ? '✅' : n.type === 'deadline' ? '⚠️' : '📢'}</span>
              <div style="flex:1">
                <div style="font-size:var(--fs-sm);font-weight:${n.read ? '400' : '600'};color:var(--text-primary)">${n.message}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:4px">${timeAgo(n.time)}</div>
              </div>
              ${!n.read ? `<div class="notif-dot" style="margin-top:4px"></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  showFeedback(id) {
    const sub  = SubmissionDB.getById(id);
    if (!sub) return;
    const subj = getSubject(sub.subject);
    const sc   = sub.score;
    App.openModal(`💬 Nhận xét của giáo viên`, `
      <div style="display:flex;flex-direction:column;gap:var(--sp-5)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-4)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Môn học</div>
            <div style="font-weight:700">${subj.icon} ${subj.label}</div>
          </div>
          <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-4)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Điểm số</div>
            <div class="score-badge ${getScoreClass(sc)}" style="display:inline-flex;padding:2px var(--sp-3);border-radius:var(--radius-md);height:auto">
              ${sc !== null ? `${sc}/10 — ${getScoreLabel(sc)}` : 'Chưa chấm'}
            </div>
          </div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-5)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-3)">Nhận xét</div>
          <div style="font-size:var(--fs-md);line-height:1.7;color:var(--text-primary)">${sub.feedback || 'Chưa có nhận xét.'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted)">
          <span>👩‍🏫 Chấm bởi: <strong style="color:var(--text-secondary)">${sub.gradedBy || '—'}</strong></span>
          <span>•</span>
          <span>${formatDateTime(sub.gradedAt)}</span>
        </div>
      </div>
      <div class="modal-footer">
        ${sub.fileName ? `<button class="btn btn-secondary" onclick="StudentView.viewFile('${sub.id}')">📎 Xem file bài nộp</button>` : ''}
        <button class="btn btn-secondary" onclick="App.closeModal()">Đóng</button>
      </div>
    `);
  },

  viewFile(id) {
    FileViewer.open(id);
  },

  mount() {
    // Student picker
    const picker = document.getElementById('student-picker');
    if (picker) {
      picker.addEventListener('change', (e) => {
        this.activeStudentId = e.target.value;
        App.renderView('student');
      });
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        App.renderView('student');
      });
    });

    // Quick notif btn
    const btnNotifs = document.getElementById('btn-notifs');
    if (btnNotifs) {
      btnNotifs.addEventListener('click', () => {
        this.activeTab = 'notifs';
        App.renderView('student');
      });
    }

    // Go submit btn
    const btnGoSubmit = document.getElementById('btn-go-submit');
    if (btnGoSubmit) {
      btnGoSubmit.addEventListener('click', () => {
        this.activeTab = 'submit';
        App.renderView('student');
      });
    }

    // Mark all read
    const btnMarkAll = document.getElementById('btn-mark-all');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        NotifDB.markAllRead(this.activeStudentId);
        App.renderView('student');
        App.toast('Đã đánh dấu tất cả là đã đọc', 'success');
      });
    }

    // Submit form
    this._mountForm();

    // Filters
    this._mountFilters();

    // File drag-drop
    this._mountFileDrop();

    // Set default deadline to 7 days from now
    const deadlineInput = document.getElementById('f-deadline');
    if (deadlineInput) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      deadlineInput.value = d.toISOString().split('T')[0];
      deadlineInput.min   = new Date().toISOString().split('T')[0];
    }
  },

  _mountForm() {
    const form = document.getElementById('submit-form');
    if (!form) return;

    document.getElementById('btn-reset-form')?.addEventListener('click', () => {
      form.reset();
      const dd = document.getElementById('f-deadline');
      if (dd) {
        const d = new Date(); d.setDate(d.getDate() + 7);
        dd.value = d.toISOString().split('T')[0];
      }
      const fn = document.getElementById('file-name-display');
      if (fn) { fn.style.display = 'none'; fn.textContent = ''; }
      this._pendingFileData = null;
      this._pendingFileName = null;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject  = document.getElementById('f-subject').value;
      const title    = document.getElementById('f-title').value.trim();
      const desc     = document.getElementById('f-desc').value.trim();
      const deadline = document.getElementById('f-deadline').value;

      if (!subject) { App.toast('Vui lòng chọn môn học!', 'error'); return; }
      if (!title)   { App.toast('Vui lòng nhập tên bài tập!', 'error'); return; }
      if (!this._pendingFileData) { App.toast('Vui lòng chọn file bài tập!', 'error'); return; }

      const student = STUDENTS.find(s => s.id === this.activeStudentId);
      SubmissionDB.add({
        studentId:   this.activeStudentId,
        studentName: student.name,
        subject, title, description: desc,
        fileName:    this._pendingFileName,
        fileData:    this._pendingFileData,  // base64
        deadline:    deadline ? new Date(deadline).toISOString() : null,
      });

      NotifDB.add({
        studentId: this.activeStudentId,
        type: 'submit',
        message: `Bài "${title}" (${getSubject(subject).label}) đã được nộp thành công!`,
      });

      this._pendingFileData = null;
      this._pendingFileName = null;
      App.toast(`✅ Nộp bài "${title}" thành công!`, 'success');
      this.activeTab = 'list';
      App.renderView('student');
    });
  },

  _mountFileDrop() {
    const zone    = document.getElementById('file-drop-zone');
    const input   = document.getElementById('f-file');
    const display = document.getElementById('file-name-display');
    if (!zone || !input) return;

    const readFile = (file) => {
      if (!file) return;

      // Giới hạn 4MB (localStorage ~5MB total)
      const MAX_MB = 4;
      if (file.size > MAX_MB * 1024 * 1024) {
        App.toast(`File quá lớn! Tối đa ${MAX_MB}MB. File của bạn: ${(file.size/1024/1024).toFixed(1)}MB`, 'error');
        return;
      }

      // Show name immediately
      if (display) {
        display.innerHTML = `<span style="color:var(--brand-400)">📎 ${file.name}</span> <span style="font-size:10px;color:var(--text-muted)">(${(file.size/1024).toFixed(1)} KB) <span style="color:var(--accent-amber)">⏳ Đang đọc...</span></span>`;
        display.style.display = 'block';
      }
      // Read as base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        this._pendingFileData = ev.target.result; // data:...;base64,...
        this._pendingFileName = file.name;
        if (display) {
          display.innerHTML = `<span style="color:var(--accent-emerald)">✅ ${file.name}</span> <span style="font-size:10px;color:var(--text-muted)">(${(file.size/1024).toFixed(1)} KB) — Sẵn sàng nộp</span>`;
        }
      };
      reader.onerror = () => {
        App.toast('Không thể đọc file. Thử lại!', 'error');
        this._pendingFileData = null;
        this._pendingFileName = null;
      };
      reader.readAsDataURL(file);
    };

    ['dragenter','dragover'].forEach(ev => {
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); });
    });
    ['dragleave','drop'].forEach(ev => {
      zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); });
    });
    zone.addEventListener('drop', e => {
      const f = e.dataTransfer.files[0];
      readFile(f);
    });
    input.addEventListener('change', () => readFile(input.files[0]));
    zone.addEventListener('click', () => input.click());
  },

  _mountFilters() {
    const subjFilter   = document.getElementById('filter-subject-s');
    const statusFilter = document.getElementById('filter-status-s');
    if (!subjFilter && !statusFilter) return;

    const applyFilter = () => {
      const subj   = subjFilter?.value   || '';
      const status = statusFilter?.value || '';
      let subs = SubmissionDB.getByStudent(this.activeStudentId);
      if (subj)   subs = subs.filter(s => s.subject === subj);
      if (status) subs = subs.filter(s => s.status  === status);
      const tbody = document.getElementById('student-table-body');
      if (tbody) tbody.innerHTML = this._renderRows(subs);
    };

    subjFilter?.addEventListener('change', applyFilter);
    statusFilter?.addEventListener('change', applyFilter);
  }
};
