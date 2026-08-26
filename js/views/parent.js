/* ============================================================
   VIEW: PARENT — StudentApp
   Trang phụ huynh: bảng điểm + thông báo + biểu đồ tiến bộ
   ============================================================ */

const ParentView = {
  activeStudentId: 's01',
  activeTab: 'overview',

  render() {
    // 🔒 Bảo mật: phụ huynh chỉ xem được học sinh của mình
    const user = AuthDB.getCurrentUser();
    if (user && user.studentId) {
      this.activeStudentId = user.studentId;
    }

    const student  = STUDENTS.find(s => s.id === this.activeStudentId) || STUDENTS[0];
    const subs     = SubmissionDB.getByStudent(student.id);
    const graded   = subs.filter(s => s.status === 'graded');
    const scores   = graded.map(s => s.score);
    const avg      = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—';
    const best     = scores.length ? Math.max(...scores) : null;
    const notifs   = NotifDB.getByStudent(student.id);
    const unread   = notifs.filter(n => !n.read).length;

    return `
      <div class="page-enter">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 style="font-size:var(--fs-3xl);font-weight:900;letter-spacing:-0.03em;margin-bottom:var(--sp-1)">
              Kết quả học tập <span style="background:linear-gradient(135deg,var(--accent-emerald),hsl(152,80%,65%));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">của con</span>
            </h1>
            <p style="color:var(--text-muted);font-size:var(--fs-sm)">Theo dõi tiến bộ và điểm số học tập</p>
          </div>
          <!-- Chỉ hiện tên học sinh, không cho đổi -->
          <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-4);
                      background:var(--bg-elevated);border:1px solid var(--border-subtle);
                      border-radius:var(--radius-lg)">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent-emerald),hsl(186,90%,50%));
                        display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:var(--fs-sm)">
              ${student.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight:700;font-size:var(--fs-sm)">${student.name}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">Lớp ${student.class}</div>
            </div>
          </div>
        </div>

        <!-- Student Profile Card -->
        <div class="card" style="margin-bottom:var(--sp-6);background:linear-gradient(135deg,hsla(152,70%,45%,.12),hsla(186,90%,50%,.08));border-color:hsla(152,70%,45%,.25)">
          <div style="display:flex;align-items:center;gap:var(--sp-5);flex-wrap:wrap">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--accent-emerald),hsl(186,90%,50%));display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:900;color:#fff;box-shadow:0 8px 24px hsla(152,70%,45%,.35);flex-shrink:0">
              ${student.name.charAt(0)}
            </div>
            <div style="flex:1">
              <div style="font-size:var(--fs-2xl);font-weight:900;letter-spacing:-0.02em;margin-bottom:4px">${student.name}</div>
              <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
                <span style="font-size:var(--fs-sm);color:var(--text-muted)">🏫 Lớp ${student.class}</span>
                <span style="font-size:var(--fs-sm);color:var(--text-muted)">👨‍👩‍👧 Phụ huynh: ${student.parentName}</span>
              </div>
            </div>
            <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
              ${this._miniStat(avg, 'Điểm TB', getScoreClass(avg === '—' ? null : parseFloat(avg)))}
              ${this._miniStat(best ?? '—', 'Điểm cao nhất', getScoreClass(best))}
              ${this._miniStat(graded.length, 'Bài đã chấm', 'score-na')}
              ${this._miniStat(unread > 0 ? `<span style="color:var(--color-error)">${unread}</span>` : '0', 'Thông báo mới', 'score-na')}
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn ${this.activeTab === 'overview'  ? 'active' : ''}" data-tab="overview">📊 Tổng quan</button>
          <button class="tab-btn ${this.activeTab === 'grades'    ? 'active' : ''}" data-tab="grades">📋 Bảng điểm</button>
          <button class="tab-btn ${this.activeTab === 'progress'  ? 'active' : ''}" data-tab="progress">📈 Tiến bộ</button>
          <button class="tab-btn ${this.activeTab === 'notifs'    ? 'active' : ''}" data-tab="notifs">
            🔔 Thông báo
            ${unread > 0 ? `<span style="background:var(--color-error);color:#fff;font-size:10px;padding:1px 6px;border-radius:var(--radius-full);margin-left:4px">${unread}</span>` : ''}
          </button>
        </div>

        <div id="parent-tab-content">
          ${this.activeTab === 'overview'  ? this._renderOverview(student, subs, graded, avg, best) : ''}
          ${this.activeTab === 'grades'    ? this._renderGrades(subs) : ''}
          ${this.activeTab === 'progress'  ? this._renderProgress(subs) : ''}
          ${this.activeTab === 'notifs'    ? this._renderNotifs(student.id) : ''}
        </div>
      </div>
    `;
  },

  _miniStat(val, label, cls) {
    return `
      <div style="text-align:center;padding:var(--sp-3) var(--sp-4);background:var(--bg-glass);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);backdrop-filter:blur(8px);min-width:80px">
        <div class="score-badge ${cls}" style="display:inline-flex;min-width:auto;height:auto;padding:2px var(--sp-2);border-radius:var(--radius-sm);margin-bottom:4px;font-size:var(--fs-xl);font-weight:900">${val}</div>
        <div style="font-size:var(--fs-xs);color:var(--text-muted);white-space:nowrap">${label}</div>
      </div>
    `;
  },

  _renderOverview(student, subs, graded, avg, best) {
    // Group by subject
    const bySubject = {};
    SUBJECTS.forEach(s => { bySubject[s.value] = { subj: s, subs: [], scores: [] }; });
    subs.forEach(s => {
      if (bySubject[s.subject]) {
        bySubject[s.subject].subs.push(s);
        if (s.score !== null) bySubject[s.subject].scores.push(s.score);
      }
    });

    const subjectRows = Object.values(bySubject).filter(r => r.subs.length > 0);
    subjectRows.sort((a,b) => {
      const aAvg = a.scores.length ? a.scores.reduce((x,y)=>x+y,0)/a.scores.length : -1;
      const bAvg = b.scores.length ? b.scores.reduce((x,y)=>x+y,0)/b.scores.length : -1;
      return bAvg - aAvg;
    });

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-6)">
        <!-- Subject Scores -->
        <div style="grid-column:1/-1">
          <h3 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-5)">📚 Điểm theo môn học</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--sp-4)">
            ${subjectRows.map(r => {
              const subAvg = r.scores.length
                ? (r.scores.reduce((a,b)=>a+b,0)/r.scores.length).toFixed(1)
                : null;
              const subBest = r.scores.length ? Math.max(...r.scores) : null;
              const pct = subAvg !== null ? Math.round(parseFloat(subAvg) / 10 * 100) : 0;
              return `
                <div class="card" style="background:var(--bg-glass);backdrop-filter:blur(12px)">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-4)">
                    <span style="font-size:1.4rem">${r.subj.icon}</span>
                    <div class="score-badge ${getScoreClass(subAvg ? parseFloat(subAvg) : null)}" style="min-width:44px;height:36px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                      ${subAvg ?? '—'}
                    </div>
                  </div>
                  <div style="font-weight:700;margin-bottom:var(--sp-1)">${r.subj.label}</div>
                  <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--sp-3)">${r.subs.length} bài • Cao nhất: ${subBest ?? '—'}</div>
                  <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recent Activity -->
        <div style="grid-column:1/-1;margin-top:var(--sp-4)">
          <h3 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-5)">🕐 Hoạt động gần đây</h3>
          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="data-table">
                <thead><tr><th>Môn</th><th>Bài tập</th><th>Ngày nộp</th><th>Trạng thái</th><th>Điểm</th><th>Đánh giá GV</th></tr></thead>
                <tbody>
                  ${subs.slice(0, 6).map(s => `
                    <tr>
                      <td>${getSubject(s.subject).icon} ${getSubject(s.subject).label}</td>
                      <td style="font-weight:600">${s.title}</td>
                      <td style="color:var(--text-muted);font-size:var(--fs-xs)">${formatDate(s.submittedAt)}</td>
                      <td>${statusBadge(s.status)}</td>
                      <td>
                        <div class="score-badge ${getScoreClass(s.score)}" style="min-width:36px;height:32px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                          ${s.score ?? '—'}
                        </div>
                      </td>
                      <td>
                        ${s.feedback
                          ? `<button class="btn btn-ghost btn-sm" onclick="ParentView.showFeedback('${s.id}')"
                              style="display:inline-flex;align-items:center;gap:4px;font-size:var(--fs-xs)">
                              💬 Xem nhận xét
                            </button>`
                          : `<span style="color:var(--text-muted);font-size:var(--fs-xs)">—</span>`
                        }
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderGrades(subs) {
    const gradedSubs = subs.filter(s => s.score !== null);
    if (!gradedSubs.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">Chưa có điểm nào</div>
          <div class="empty-state-desc">Các bài tập của con chưa được chấm điểm.</div>
        </div>
      `;
    }
    return `
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Môn học</th>
                <th>Bài tập</th>
                <th>Ngày nộp</th>
                <th>Điểm</th>
                <th>Xếp loại</th>
                <th>Giáo viên</th>
                <th>Nhận xét</th>
              </tr>
            </thead>
            <tbody>
              ${gradedSubs.map(s => `
                <tr>
                  <td><span style="font-weight:600">${getSubject(s.subject).icon} ${getSubject(s.subject).label}</span></td>
                  <td style="font-weight:600">${s.title}</td>
                  <td style="color:var(--text-muted);font-size:var(--fs-xs);white-space:nowrap">${formatDate(s.submittedAt)}</td>
                  <td>
                    <div class="score-badge ${getScoreClass(s.score)}" style="min-width:40px;height:34px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                      ${s.score}
                    </div>
                  </td>
                  <td><span style="font-weight:600;font-size:var(--fs-sm);color:var(--text-secondary)">${getScoreLabel(s.score)}</span></td>
                  <td style="font-size:var(--fs-sm);color:var(--text-muted)">${s.gradedBy || '—'}</td>
                  <td>
                    ${s.feedback
                      ? `<button class="btn btn-ghost btn-sm" onclick="ParentView.showFeedback('${s.id}')">💬 Xem</button>`
                      : `<span style="color:var(--text-muted);font-size:var(--fs-xs)">—</span>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderProgress(subs) {
    const gradedByMonth = {};
    subs.filter(s => s.score !== null).forEach(s => {
      const d   = new Date(s.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!gradedByMonth[key]) gradedByMonth[key] = [];
      gradedByMonth[key].push(s.score);
    });

    const months = Object.keys(gradedByMonth).sort();
    const maxScore = 10;

    // Subject breakdown donut-style via CSS
    const bySubject = {};
    subs.filter(s => s.score !== null).forEach(s => {
      if (!bySubject[s.subject]) bySubject[s.subject] = [];
      bySubject[s.subject].push(s.score);
    });

    return `
      <div style="display:grid;gap:var(--sp-6)">
        <!-- Monthly Average -->
        <div class="card card-elevated">
          <h3 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-6)">📈 Điểm trung bình theo tháng</h3>
          ${months.length === 0 ? `<p style="color:var(--text-muted)">Chưa có dữ liệu.</p>` : `
            <div style="display:flex;align-items:flex-end;gap:var(--sp-3);height:180px;padding-bottom:var(--sp-4);border-bottom:1px solid var(--border-subtle);overflow-x:auto">
              ${months.map(m => {
                const scores = gradedByMonth[m];
                const avg    = (scores.reduce((a,b)=>a+b,0)/scores.length);
                const pct    = (avg / maxScore * 100);
                const label  = m.split('-').reverse().join('/');
                return `
                  <div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);flex:1;min-width:60px">
                    <div style="font-size:var(--fs-xs);font-weight:700;color:var(--text-secondary)">${avg.toFixed(1)}</div>
                    <div style="width:40px;background:linear-gradient(to top,var(--brand-500),var(--accent-cyan));border-radius:var(--radius-md) var(--radius-md) 0 0;height:${pct}%;min-height:8px;transition:height 1s var(--ease-smooth);box-shadow:0 4px 16px hsla(248,80%,55%,.30)"></div>
                    <div style="font-size:var(--fs-xs);color:var(--text-muted);white-space:nowrap">${label}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Subject breakdown -->
        <div class="card card-elevated">
          <h3 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-6)">📚 Chi tiết theo môn</h3>
          <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
            ${Object.entries(bySubject).map(([key, scores]) => {
              const subj = getSubject(key);
              const avg  = (scores.reduce((a,b)=>a+b,0)/scores.length);
              const pct  = Math.round(avg / 10 * 100);
              return `
                <div style="display:flex;align-items:center;gap:var(--sp-4)">
                  <span style="font-size:1.2rem;width:24px;text-align:center">${subj.icon}</span>
                  <div style="flex:0 0 120px;font-size:var(--fs-sm);font-weight:600;color:var(--text-secondary)">${subj.label}</div>
                  <div style="flex:1">
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" style="width:${pct}%"></div>
                    </div>
                  </div>
                  <div class="score-badge ${getScoreClass(avg)}" style="min-width:48px;height:32px;padding:0 var(--sp-2);border-radius:var(--radius-md)">
                    ${avg.toFixed(1)}
                  </div>
                  <span style="font-size:var(--fs-xs);color:var(--text-muted);width:60px">${getScoreLabel(avg)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Nhận xét giáo viên mới nhất -->
        ${this._renderRecentFeedback(subs)}
      </div>
    `;
  },

  _renderRecentFeedback(subs) {
    const fb = subs.filter(s => s.feedback).slice(0, 4);
    if (!fb.length) return '';
    return `
      <div class="card card-elevated">
        <h3 style="font-size:var(--fs-xl);font-weight:800;margin-bottom:var(--sp-5)">💬 Nhận xét gần đây từ giáo viên</h3>
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          ${fb.map(s => `
            <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);padding:var(--sp-4) var(--sp-5);border-left:3px solid var(${getScoreClass(s.score) === 'score-a' ? '--color-success' : getScoreClass(s.score) === 'score-b' ? '--accent-cyan' : '--accent-amber'})">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2)">
                <span style="font-size:var(--fs-sm);font-weight:700">${getSubject(s.subject).icon} ${getSubject(s.subject).label} — ${s.title}</span>
                <div class="score-badge ${getScoreClass(s.score)}" style="min-width:36px;height:28px;padding:0 var(--sp-2);border-radius:var(--radius-sm)">${s.score}</div>
              </div>
              <div style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6;font-style:italic">"${s.feedback}"</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--sp-2)">— ${s.gradedBy} • ${formatDate(s.gradedAt)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderNotifs(studentId) {
    const notifs = NotifDB.getByStudent(studentId);
    if (!notifs.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔕</div>
          <div class="empty-state-title">Không có thông báo</div>
          <div class="empty-state-desc">Bạn sẽ được thông báo khi có kết quả học tập mới.</div>
        </div>
      `;
    }
    const unread = notifs.filter(n => !n.read).length;
    return `
      <div class="card card-elevated" style="max-width:680px;margin:0 auto">
        <div class="flex items-center justify-between mb-6">
          <h2 style="font-size:var(--fs-xl);font-weight:800">🔔 Thông báo</h2>
          ${unread > 0 ? `<button class="btn btn-secondary btn-sm" id="parent-mark-all">Đánh dấu tất cả đã đọc</button>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
          ${notifs.map(n => `
            <div style="display:flex;align-items:flex-start;gap:var(--sp-3);padding:var(--sp-4);border-radius:var(--radius-lg);background:${n.read ? 'transparent' : 'hsla(152,70%,45%,.06)'};border:1px solid ${n.read ? 'var(--border-subtle)' : 'hsla(152,70%,45%,.20)'}">
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
    const subj       = getSubject(sub.subject);
    const scoreClass = getScoreClass(sub.score);
    const scoreLabel = getScoreLabel(sub.score);

    App.openModal('💬 Đánh giá của giáo viên', `
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">

        <!-- Bài tập info -->
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);
                    padding:var(--sp-4) var(--sp-5);border-left:3px solid var(--brand-500)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:4px">Bài tập</div>
          <div style="font-weight:800;font-size:var(--fs-lg)">${sub.title}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-secondary);margin-top:4px">
            ${subj.icon} ${subj.label} · Nộp ${formatDate(sub.submittedAt)}
          </div>
        </div>

        <!-- Score -->
        ${sub.score !== null ? `
        <div style="display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4) var(--sp-5);
                    background:var(--bg-elevated);border-radius:var(--radius-lg);
                    border:1px solid var(--border-subtle)">
          <div class="score-badge ${scoreClass}"
               style="width:64px;height:64px;font-size:var(--fs-2xl);font-weight:900;
                      border-radius:var(--radius-lg);flex-shrink:0">
            ${sub.score}
          </div>
          <div>
            <div style="font-size:var(--fs-xl);font-weight:800">${scoreLabel}</div>
            <div style="font-size:var(--fs-sm);color:var(--text-muted)">${sub.score}/10 điểm</div>
          </div>
        </div>
        ` : `
        <div style="padding:var(--sp-4);background:hsla(38,85%,50%,.10);
                    border:1px solid hsla(38,85%,50%,.25);border-radius:var(--radius-lg);
                    text-align:center;color:var(--accent-amber);font-weight:600">
          ⏳ Bài chưa được chấm điểm
        </div>
        `}

        <!-- Feedback -->
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);
                    padding:var(--sp-5);border:1px solid var(--border-subtle)">
          <div style="font-size:var(--fs-xs);color:var(--text-muted);text-transform:uppercase;
                      letter-spacing:.08em;margin-bottom:var(--sp-3)">📝 Nhận xét</div>
          ${sub.feedback
            ? `<div style="font-size:var(--fs-md);line-height:1.8;color:var(--text-primary);
                           font-style:italic;border-left:3px solid var(--brand-400);
                           padding-left:var(--sp-4)">
                "${sub.feedback}"
               </div>`
            : `<div style="color:var(--text-muted);font-style:italic">Chưa có nhận xét.</div>`
          }
        </div>

        <!-- Teacher info -->
        ${sub.gradedBy ? `
        <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);
                    background:var(--bg-base);border-radius:var(--radius-lg);
                    border:1px solid var(--border-subtle)">
          <div style="width:36px;height:36px;border-radius:50%;
                      background:linear-gradient(135deg,var(--accent-amber),hsl(38,90%,70%));
                      display:flex;align-items:center;justify-content:center;
                      font-weight:800;color:#fff;font-size:var(--fs-sm);flex-shrink:0">
            ${sub.gradedBy.charAt(0)}
          </div>
          <div>
            <div style="font-weight:700;font-size:var(--fs-sm)">👩‍🏫 ${sub.gradedBy}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">Chấm lúc ${formatDateTime(sub.gradedAt)}</div>
          </div>
        </div>
        ` : ''}

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.closeModal()">Đóng</button>
        </div>
      </div>
    `);
  },

  mount() {
    // Không có student picker — phụ huynh chỉ xem con của mình

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        App.renderView('parent');
      });
    });

    document.getElementById('parent-mark-all')?.addEventListener('click', () => {
      NotifDB.markAllRead(this.activeStudentId);
      App.renderView('parent');
      App.toast('Đã đánh dấu tất cả là đã đọc', 'success');
    });
  }
};
