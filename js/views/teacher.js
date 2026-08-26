/* ============================================================
   VIEW: TEACHER — StudentApp
   Bảng quản lý bài nộp, chấm điểm, thống kê
   ============================================================ */

const TeacherView = {
  activeTab: 'submissions',
  filters: { subject: '', status: '', search: '' },

  render() {
    const classes = AuthDB.getTeacherClasses(); // null = tất cả
    const stats   = SubmissionDB.statsByTeacher(classes);
    const classLabel = classes ? classes.join(', ') : 'Tất cả lớp';
    return `
      <div class="page-enter">
        <!-- Header -->
        <div class="section-header">
          <div>
            <h1 style="font-size:var(--fs-3xl);font-weight:900;letter-spacing:-0.03em;margin-bottom:var(--sp-1)">
              Bảng điều khiển <span style="background:linear-gradient(135deg,var(--accent-amber),hsl(38,90%,70%));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Giáo viên</span>
            </h1>
            <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap">
              <p style="color:var(--text-muted);font-size:var(--fs-sm)">Quản lý và chấm điểm bài tập học sinh</p>
              <span style="display:inline-flex;align-items:center;gap:6px;background:hsla(38,85%,50%,.15);
                           border:1px solid hsla(38,85%,50%,.35);border-radius:var(--radius-full);
                           padding:3px 10px;font-size:var(--fs-xs);font-weight:700;color:var(--accent-amber)">
                🏫 Phụ trách: ${classLabel}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stat-grid">
          ${this._stat('📋', stats.total,   'Tổng bài nộp',    'Trong lớp phụ trách',    'hsl(248,80%,55%)')}
          ${this._stat('⏳', stats.pending, 'Chờ chấm điểm',  'Cần xử lý',            'hsl(38,90%,50%)')}
          ${this._stat('✅', stats.graded,  'Đã chấm xong',   'Đã gửi phản hồi',      'hsl(152,70%,45%)')}
          ${this._stat('⭐', stats.avg,     'Điểm TB lớp',    stats.late > 0 ? `${stats.late} bài trễ hạn` : 'Tốt, không có bài trễ', 'hsl(186,90%,50%)')}
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'submissions' ? 'active' : ''}" data-tab="submissions">
            📋 Danh sách bài nộp
            ${stats.pending > 0 ? `<span style="background:var(--color-error);color:#fff;font-size:10px;padding:1px 7px;border-radius:var(--radius-full);margin-left:6px">${stats.pending}</span>` : ''}
          </button>
          <button class="tab-btn ${this.activeTab === 'bySubject' ? 'active' : ''}" data-tab="bySubject">
            📊 Thống kê theo môn
          </button>
          <button class="tab-btn ${this.activeTab === 'byStudent' ? 'active' : ''}" data-tab="byStudent">
            👨‍🎓 Thống kê theo học sinh
          </button>
        </div>

        <div id="teacher-tab-content">
          ${this.activeTab === 'submissions' ? this._renderSubmissions(classes) : ''}
          ${this.activeTab === 'bySubject'   ? this._renderBySubject(classes)   : ''}
          ${this.activeTab === 'byStudent'   ? this._renderByStudent(classes)   : ''}
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

  _renderSubmissions(classes) {
    let subs = SubmissionDB.getByTeacher(classes);
    const { subject, status, search } = this.filters;
    if (subject) subs = subs.filter(s => s.subject === subject);
    if (status)  subs = subs.filter(s => s.status  === status);
    if (search) {
      const q = search.toLowerCase();
      subs = subs.filter(s =>
        s.studentName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    }

    return `
      <div>
        <div class="filter-bar">
          <label>Lọc:</label>
          <select id="t-filter-subject" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);color:var(--text-primary);padding:var(--sp-2) var(--sp-3);font-family:var(--font-sans);font-size:var(--fs-sm);outline:none">
            <option value="">Tất cả môn</option>
            ${SUBJECTS.map(s => `<option value="${s.value}" ${s.value===subject?'selected':''}>${s.icon} ${s.label}</option>`).join('')}
          </select>
          <select id="t-filter-status" style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);color:var(--text-primary);padding:var(--sp-2) var(--sp-3);font-family:var(--font-sans);font-size:var(--fs-sm);outline:none">
            <option value="">Mọi trạng thái</option>
            <option value="pending" ${status==='pending'?'selected':''}>⏳ Chờ chấm</option>
            <option value="graded"  ${status==='graded' ?'selected':''}>✅ Đã chấm</option>
            <option value="late"    ${status==='late'   ?'selected':''}>⚠️ Trễ hạn</option>
          </select>
          <input type="text" id="t-search" class="search-input" placeholder="Tìm học sinh, bài tập..." value="${search}" style="flex:1;min-width:180px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);color:var(--text-primary);padding:var(--sp-2) var(--sp-3) var(--sp-2) 34px;font-family:var(--font-sans);font-size:var(--fs-sm);outline:none;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22%3E%3Ccircle cx=%2211%22 cy=%2211%22 r=%228%22%3E%3C/circle%3E%3Cline x1=%2221%22 y1=%2221%22 x2=%2216.65%22 y2=%2216.65%22%3E%3C/line%3E%3C/svg%3E');background-repeat:no-repeat;background-position:left 10px center">
          <span style="color:var(--text-muted);font-size:var(--fs-xs);white-space:nowrap">${subs.length} kết quả</span>
        </div>

        ${subs.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">Không tìm thấy bài nào</div>
            <div class="empty-state-desc">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</div>
          </div>
        ` : `
          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="data-table" id="teacher-table">
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Môn học</th>
                    <th>Bài tập</th>
                    <th>Ngày nộp</th>
                    <th>Hạn nộp</th>
                    <th>Trạng thái</th>
                    <th>Điểm</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody id="teacher-table-body">
                  ${this._renderRows(subs)}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;
  },

  _renderRows(subs) {
    return subs.map(s => {
      const subj = getSubject(s.subject);
      const sc   = s.score;
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:var(--sp-3)">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--brand-600),var(--accent-cyan));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs-sm);color:#fff;flex-shrink:0">${s.studentName.charAt(0)}</div>
              <div>
                <div style="font-weight:600;font-size:var(--fs-sm)">${s.studentName}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">${STUDENTS.find(st=>st.id===s.studentId)?.class || ''}</div>
              </div>
            </div>
          </td>
          <td><span style="font-weight:500">${subj.icon} ${subj.label}</span></td>
          <td>
            <div style="font-weight:600;max-width:180px">${s.title}</div>
            ${s.fileName ? `
              <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="font-size:var(--fs-xs);color:var(--text-muted)">📎 ${s.fileName}</span>
                <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:2px 8px;height:auto" onclick="TeacherView.viewFile('${s.id}')">&#128065; Xem</button>
              </div>
            ` : ''}
          </td>
          <td style="color:var(--text-secondary);white-space:nowrap;font-size:var(--fs-xs)">${formatDate(s.submittedAt)}</td>
          <td style="color:var(--text-secondary);white-space:nowrap;font-size:var(--fs-xs)">${s.deadline ? formatDate(s.deadline) : '—'}</td>
          <td>${statusBadge(s.status)}</td>
          <td>
            ${sc !== null
              ? `<div class="score-badge ${getScoreClass(sc)}" style="min-width:36px;height:34px;padding:0 var(--sp-2);border-radius:var(--radius-md)">${sc}</div>`
              : `<span style="color:var(--text-muted)">—</span>`}
          </td>
          <td>
            <div style="display:flex;gap:var(--sp-2)">
              ${s.status === 'graded'
                ? `<button class="btn btn-ghost btn-sm" onclick="TeacherView.openGradeModal('${s.id}')">✏️ Sửa</button>`
                : `<button class="btn btn-primary btn-sm" onclick="TeacherView.openGradeModal('${s.id}')">&#x2705; Chấm</button>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  _renderBySubject(classes) {
    const allSubs = SubmissionDB.getByTeacher(classes);
    const rows = SUBJECTS.map(subj => {
      const subs    = allSubs.filter(s => s.subject === subj.value);
      if (!subs.length) return null;
      const graded  = subs.filter(s => s.status === 'graded');
      const scores  = graded.map(s => s.score);
      const avg     = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
      const pct     = subs.length ? Math.round(graded.length / subs.length * 100) : 0;
      return { subj, total: subs.length, graded: graded.length, pending: subs.filter(s=>s.status==='pending').length, avg, pct };
    }).filter(Boolean);

    return `
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Tổng bài nộp</th>
                <th>Đã chấm</th>
                <th>Chờ chấm</th>
                <th>Điểm TB</th>
                <th>Tiến độ chấm</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><span style="font-weight:600">${r.subj.icon} ${r.subj.label}</span></td>
                  <td>${r.total}</td>
                  <td><span style="color:var(--color-success);font-weight:600">${r.graded}</span></td>
                  <td>
                    ${r.pending > 0
                      ? `<span style="color:var(--accent-amber);font-weight:600">${r.pending}</span>`
                      : `<span style="color:var(--text-muted)">0</span>`}
                  </td>
                  <td>
                    <div class="score-badge ${getScoreClass(r.avg === '—' ? null : parseFloat(r.avg))}" style="min-width:44px;height:34px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                      ${r.avg}
                    </div>
                  </td>
                  <td style="min-width:160px">
                    <div style="display:flex;align-items:center;gap:var(--sp-3)">
                      <div class="progress-bar-wrap" style="flex:1">
                        <div class="progress-bar-fill" style="width:${r.pct}%"></div>
                      </div>
                      <span style="font-size:var(--fs-xs);color:var(--text-muted);white-space:nowrap">${r.pct}%</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderByStudent(classes) {
    // Chỉ hiện học sinh thuộc lớp GV phụ trách
    const allowedIds = classes
      ? STUDENTS.filter(s => classes.includes(s.class)).map(s => s.id)
      : STUDENTS.map(s => s.id);
    const rows = STUDENTS.filter(s => allowedIds.includes(s.id)).map(st => {
      const subs   = SubmissionDB.getByStudent(st.id);
      if (!subs.length) return null;
      const graded = subs.filter(s => s.status === 'graded');
      const scores = graded.map(s => s.score);
      const avg    = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
      const best   = scores.length ? Math.max(...scores) : null;
      return { st, total: subs.length, graded: graded.length, pending: subs.filter(s=>s.status==='pending').length, avg, best };
    }).filter(Boolean);

    // Sort by avg desc
    rows.sort((a,b) => {
      if (a.avg === '—') return 1;
      if (b.avg === '—') return -1;
      return parseFloat(b.avg) - parseFloat(a.avg);
    });

    return `
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Học sinh</th>
                <th>Lớp</th>
                <th>Tổng bài</th>
                <th>Đã chấm</th>
                <th>Chờ chấm</th>
                <th>Điểm TB</th>
                <th>Cao nhất</th>
                <th>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td style="color:var(--text-muted);font-size:var(--fs-xs)">${i+1}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--sp-3)">
                      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--brand-600),var(--accent-cyan));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs-xs);color:#fff;flex-shrink:0">${r.st.name.charAt(0)}</div>
                      <span style="font-weight:600;font-size:var(--fs-sm)">${r.st.name}</span>
                    </div>
                  </td>
                  <td><span style="font-size:var(--fs-xs);color:var(--text-muted)">${r.st.class}</span></td>
                  <td>${r.total}</td>
                  <td style="color:var(--color-success);font-weight:600">${r.graded}</td>
                  <td>${r.pending > 0 ? `<span style="color:var(--accent-amber);font-weight:600">${r.pending}</span>` : '—'}</td>
                  <td>
                    <div class="score-badge ${getScoreClass(r.avg === '—' ? null : parseFloat(r.avg))}" style="min-width:40px;height:32px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                      ${r.avg}
                    </div>
                  </td>
                  <td style="font-weight:700;color:var(--accent-amber)">${r.best !== null ? r.best : '—'}</td>
                  <td>
                    <span style="font-size:var(--fs-xs);font-weight:600;color:var(--text-secondary)">
                      ${r.avg === '—' ? '—' : getScoreLabel(parseFloat(r.avg))}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openGradeModal(id) {
    const sub  = SubmissionDB.getById(id);
    if (!sub) return;

    // Kiểm tra quyền: GV chỉ được chấm bài trong lớp phụ trách
    const classes = AuthDB.getTeacherClasses();
    if (classes) {
      const student = STUDENTS.find(s => s.id === sub.studentId);
      if (!student || !classes.includes(student.class)) {
        App.toast('⛔ Bạn không có quyền chấm bài của lớp này!', 'error');
        return;
      }
    }

    const subj = getSubject(sub.subject);

    App.openModal(`✅ Chấm điểm bài tập`, `
      <div style="margin-bottom:var(--sp-5)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-4)">
          <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-3) var(--sp-4)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:2px">Học sinh</div>
            <div style="font-weight:700;font-size:var(--fs-sm)">${sub.studentName}</div>
          </div>
          <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-3) var(--sp-4)">
            <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:2px">Môn học</div>
            <div style="font-weight:700;font-size:var(--fs-sm)">${subj.icon} ${subj.label}</div>
          </div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-4)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:2px">Bài tập</div>
          <div style="font-weight:700">${sub.title}</div>
          ${sub.fileName ? `
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
              <span style="font-size:var(--fs-xs);color:var(--text-muted)">📎 ${sub.fileName}</span>
              <button class="btn btn-secondary btn-sm" onclick="TeacherView.viewFile('${sub.id}')" style="font-size:var(--fs-xs)">👁 Xem file</button>
            </div>
          ` : ''}
          ${sub.description ? `<div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:var(--sp-2)">${sub.description}</div>` : ''}
        </div>
      </div>

      <form id="grade-form">
        <div class="form-group">
          <label class="form-label" for="g-score">
            Điểm số (0 — 10) <span class="required">*</span>
          </label>
          <div style="display:flex;gap:var(--sp-3);align-items:center">
            <input class="form-control" type="number" id="g-score" min="0" max="10" step="0.5"
              value="${sub.score !== null ? sub.score : ''}"
              placeholder="Nhập điểm..." style="max-width:140px" />
            <div id="score-preview" style="display:flex;align-items:center;gap:var(--sp-2)"></div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="g-feedback">Nhận xét / Phản hồi</label>
          <textarea class="form-control" id="g-feedback" rows="4" placeholder="Nhập nhận xét cho học sinh...">${sub.feedback || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="g-teacher">Giáo viên chấm</label>
          <input class="form-control" type="text" id="g-teacher"
            value="${sub.gradedBy || AuthDB.getCurrentUser()?.displayName || 'Giáo viên'}"
            placeholder="Tên giáo viên" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Hủy</button>
          <button type="submit" class="btn btn-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Lưu kết quả
          </button>
        </div>
      </form>
    `);

    // Live preview score badge
    const scoreInput = document.getElementById('g-score');
    const preview    = document.getElementById('score-preview');
    const updatePreview = () => {
      const v = parseFloat(scoreInput.value);
      if (!isNaN(v)) {
        preview.innerHTML = `
          <div class="score-badge ${getScoreClass(v)}" style="min-width:44px;height:36px;padding:0 var(--sp-2);border-radius:var(--radius-md)">${v}</div>
          <span style="font-size:var(--fs-sm);font-weight:600;color:var(--text-secondary)">${getScoreLabel(v)}</span>
        `;
      } else {
        preview.innerHTML = '';
      }
    };
    scoreInput?.addEventListener('input', updatePreview);
    updatePreview();

    document.getElementById('grade-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const score    = parseFloat(document.getElementById('g-score').value);
      const feedback = document.getElementById('g-feedback').value.trim();
      const teacher  = document.getElementById('g-teacher').value.trim() || 'Giáo viên';

      if (isNaN(score) || score < 0 || score > 10) {
        App.toast('Điểm số phải từ 0 đến 10!', 'error'); return;
      }

      SubmissionDB.grade(id, { score, feedback, gradedBy: teacher });

      // Add notification to student
      NotifDB.add({
        studentId: sub.studentId,
        type: 'grade',
        message: `Bài "${sub.title}" (${getSubject(sub.subject).label}) đã được chấm: ${score}/10`,
      });

      App.closeModal();
      App.toast(`✅ Đã chấm điểm ${score}/10 cho bài "${sub.title}"`, 'success');
      App.renderView('teacher');
    });
  },

  viewFile(id) {
    FileViewer.open(id);
  },

  mount() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        App.renderView('teacher');
      });
    });

    // Filters
    document.getElementById('t-filter-subject')?.addEventListener('change', e => {
      this.filters.subject = e.target.value;
      this._refreshTable();
    });
    document.getElementById('t-filter-status')?.addEventListener('change', e => {
      this.filters.status = e.target.value;
      this._refreshTable();
    });
    document.getElementById('t-search')?.addEventListener('input', e => {
      this.filters.search = e.target.value;
      this._refreshTable();
    });
  },

  _refreshTable() {
    const classes = AuthDB.getTeacherClasses();
    let subs = SubmissionDB.getByTeacher(classes);
    const { subject, status, search } = this.filters;
    if (subject) subs = subs.filter(s => s.subject === subject);
    if (status)  subs = subs.filter(s => s.status  === status);
    if (search) {
      const q = search.toLowerCase();
      subs = subs.filter(s =>
        s.studentName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
      );
    }
    const tbody = document.getElementById('teacher-table-body');
    if (tbody) tbody.innerHTML = this._renderRows(subs);

    const counter = document.querySelector('#teacher-tab-content .filter-bar span');
    if (counter) counter.textContent = `${subs.length} kết quả`;
  },
};
