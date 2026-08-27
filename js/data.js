/* ============================================================
   DATA LAYER — StudentApp
   Models, LocalStorage CRUD, Seed Data
   ============================================================ */

const DB_KEYS = {
  SUBMISSIONS: 'sa_submissions',
  ROLE: 'sa_role',
  STUDENTS: 'sa_students',
  NOTIFICATIONS: 'sa_notifications',
  AUTH: 'sa_auth_user',
};

/* ── Helpers ────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function now() { return new Date().toISOString(); }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/* ── LocalStorage helpers ───────────────────────────────────── */
const Store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        // If quota exceeded, try removing fileData from oldest submissions
        try {
          const subs = JSON.parse(localStorage.getItem('sa_submissions') || '[]');
          // Strip fileData from oldest half to free space
          const stripped = subs.map((s, i) => i > subs.length / 2 ? { ...s, fileData: null } : s);
          localStorage.setItem('sa_submissions', JSON.stringify(stripped));
          localStorage.setItem(key, JSON.stringify(val));
        } catch {
          console.warn('localStorage quota exceeded even after cleanup');
        }
      }
    }
  },
  remove(key) { localStorage.removeItem(key); },
};

/* ── Data Models ────────────────────────────────────────────── */

/**
 * Submission {
 *   id, studentId, studentName, subject, title,
 *   description, fileName, submittedAt, deadline,
 *   status: 'pending'|'graded'|'late',
 *   score: null | 0-10,
 *   feedback: '',
 *   gradedAt: null,
 *   gradedBy: ''
 * }
 */

/**
 * Student {
 *   id, name, class, parentName
 * }
 */

/* ── Students ───────────────────────────────────────────────── */
let STUDENTS = [];

/* ── Subjects (load từ data/subjects.json) ───────────────── */
let SUBJECTS    = [];
let SUBJECT_MAP = {};


/* ── Seed Data (load từ data/submissions.json & data/notifications.json) ── */
let SEED_SUBMISSIONS  = [];
let SEED_NOTIFICATIONS = [];

/**
 * Resolve placeholder timestamp trong JSON seed:
 *   "@daysAgo:N"  → ISO string N ngày trước
 *   "@now"        → ISO string hiện tại
 */
function resolveTimestamp(val) {
  if (typeof val !== 'string') return val;
  if (val === '@now') return now();
  const m = val.match(/^@daysAgo:(\d+)$/);
  if (m) return daysAgo(parseInt(m[1], 10));
  return val;
}

/** Duyệt mỗi bản ghi, resolve các field timestamp và gán id mới */
function resolveSeedDates(records) {
  const TS_FIELDS = ['submittedAt', 'deadline', 'gradedAt', 'time'];
  return records.map(r => {
    const entry = { ...r, id: uid() };
    delete entry._id; // xóa _id placeholder, dùng id mới
    TS_FIELDS.forEach(f => { if (entry[f] !== undefined && entry[f] !== null) entry[f] = resolveTimestamp(entry[f]); });
    return entry;
  });
}

/* ── DB Initialization ──────────────────────────────────────── */
/* ── Config Loader ──────────────────────────────────────────── */
async function loadConfig() {
  try {
    const [studentsRes, subjectsRes, usersRes, submissionsRes, notificationsRes] = await Promise.all([
      fetch('data/students.json'),
      fetch('data/subjects.json'),
      fetch('data/users.json'),
      fetch('data/submissions.json'),
      fetch('data/notifications.json'),
    ]);
    STUDENTS = await studentsRes.json();
    SUBJECTS = await subjectsRes.json();
    // Lọc bỏ các entry comment-only (chỉ có field _comment, không có id)
    const raw = await usersRes.json();
    USERS    = raw.filter(u => !u._comment);
    // Rebuild SUBJECT_MAP sau khi load xong
    SUBJECT_MAP = Object.fromEntries(SUBJECTS.map(s => [s.value, s]));
    // Resolve placeholder timestamps trong seed data
    SEED_SUBMISSIONS  = resolveSeedDates(await submissionsRes.json());
    SEED_NOTIFICATIONS = resolveSeedDates(await notificationsRes.json());
  } catch (err) {
    console.error('[StudentGrade] Lỗi load config JSON:', err);
    throw err;
  }
}

function initDB() {
  if (!Store.get(DB_KEYS.SUBMISSIONS)) {
    Store.set(DB_KEYS.SUBMISSIONS, SEED_SUBMISSIONS);
  }
  if (!Store.get(DB_KEYS.STUDENTS)) {
    Store.set(DB_KEYS.STUDENTS, STUDENTS);
  }
  if (!Store.get(DB_KEYS.NOTIFICATIONS)) {
    Store.set(DB_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  }
}


/* ── Submission CRUD ────────────────────────────────────────── */
const SubmissionDB = {
  getAll() {
    return Store.get(DB_KEYS.SUBMISSIONS, []);
  },

  getByStudent(studentId) {
    return this.getAll().filter(s => s.studentId === studentId);
  },

  getById(id) {
    return this.getAll().find(s => s.id === id) || null;
  },

  add(data) {
    const all = this.getAll();
    const sub = {
      id: uid(),
      studentId: data.studentId,
      studentName: data.studentName,
      subject: data.subject,
      title: data.title,
      description: data.description || '',
      fileName: data.fileName || '',
      fileData: data.fileData || null,   // base64 data URL
      submittedAt: now(),
      deadline: data.deadline || daysFromNow(7),
      status: 'pending',
      score: null,
      feedback: '',
      gradedAt: null,
      gradedBy: '',
    };
    all.unshift(sub);
    Store.set(DB_KEYS.SUBMISSIONS, all);
    return sub;
  },

  grade(id, { score, feedback, gradedBy }) {
    const all = this.getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    all[idx].score = parseFloat(score);
    all[idx].feedback = feedback;
    all[idx].gradedBy = gradedBy;
    all[idx].gradedAt = now();
    all[idx].status = 'graded';
    Store.set(DB_KEYS.SUBMISSIONS, all);
    return all[idx];
  },

  delete(id) {
    const all = this.getAll().filter(s => s.id !== id);
    Store.set(DB_KEYS.SUBMISSIONS, all);
  },

  stats() {
    const all = this.getAll();
    const pending = all.filter(s => s.status === 'pending').length;
    const graded = all.filter(s => s.status === 'graded').length;
    const late = all.filter(s => s.status === 'late').length;
    const scores = all.filter(s => s.score != null).map(s => s.score);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    return { total: all.length, pending, graded, late, avg };
  },

  statsByStudent(studentId) {
    const all = this.getByStudent(studentId);
    const graded = all.filter(s => s.status === 'graded');
    const scores = graded.map(s => s.score);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    const best = scores.length ? Math.max(...scores) : null;
    return { total: all.length, graded: graded.length, pending: all.filter(s => s.status === 'pending').length, avg, best };
  },

  /** Lấy bài nộp theo lớp của giáo viên (null = tất cả) */
  getByTeacher(classes) {
    const all = this.getAll();
    if (!classes || classes.length === 0) return all;
    // Lọc theo lớp của học sinh
    const allowedStudentIds = STUDENTS
      .filter(s => classes.includes(s.class))
      .map(s => s.id);
    return all.filter(s => allowedStudentIds.includes(s.studentId));
  },

  /** Stats chỉ tính trong phạm vi lớp giáo viên phụ trách */
  statsByTeacher(classes) {
    const all = this.getByTeacher(classes);
    const pending = all.filter(s => s.status === 'pending').length;
    const graded = all.filter(s => s.status === 'graded').length;
    const late = all.filter(s => s.status === 'late').length;
    const scores = all.filter(s => s.score != null).map(s => s.score);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
    return { total: all.length, pending, graded, late, avg };
  },
};

/* ── Notification DB ────────────────────────────────────────── */
const NotifDB = {
  getAll() { return Store.get(DB_KEYS.NOTIFICATIONS, []); },
  getByStudent(sId) { return this.getAll().filter(n => n.studentId === sId); },
  markRead(id) {
    const all = this.getAll();
    const n = all.find(n => n.id === id);
    if (n) { n.read = true; Store.set(DB_KEYS.NOTIFICATIONS, all); }
  },
  markAllRead(sId) {
    const all = this.getAll();
    all.forEach(n => { if (n.studentId === sId) n.read = true; });
    Store.set(DB_KEYS.NOTIFICATIONS, all);
  },
  add(data) {
    const all = this.getAll();
    const notif = { id: uid(), time: now(), read: false, ...data };
    all.unshift(notif);
    Store.set(DB_KEYS.NOTIFICATIONS, all);
  },
  unreadCount(sId) { return this.getByStudent(sId).filter(n => !n.read).length; }
};

/* ── Role helpers ───────────────────────────────────────────── */
const RoleDB = {
  get() { return Store.get(DB_KEYS.ROLE, null); },
  set(role) { Store.set(DB_KEYS.ROLE, role); },
  clear() { Store.remove(DB_KEYS.ROLE); },
};

/* ── Users (mock accounts) ──────────────────────────────────── */
let USERS = [];

/* ── Auth DB ────────────────────────────────────────────────── */
const AuthDB = {
  /** Trả về user đang đăng nhập hoặc null */
  getCurrentUser() {
    return Store.get(DB_KEYS.AUTH, null);
  },
  isLoggedIn() {
    return !!this.getCurrentUser();
  },
  /** Xác thực và lưu session. Trả về {ok, user, error} */
  login(username, password) {
    const u = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim()
        && u.password === password
    );
    if (!u) return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    // Lưu không kèm password
    const session = {
      id: u.id, username: u.username, role: u.role,
      displayName: u.displayName,
      studentId: u.studentId || null,
      classes: u.classes || null,   // teacher: danh sách lớp phụ trách
    };
    Store.set(DB_KEYS.AUTH, session);
    RoleDB.set(u.role);
    return { ok: true, user: session };
  },
  logout() {
    Store.remove(DB_KEYS.AUTH);
    RoleDB.clear();
  },
  /** Trả về role của user hiện tại hoặc null */
  getRole() {
    const u = this.getCurrentUser();
    return u ? u.role : null;
  },
  /** Trả về danh sách lớp của giáo viên đang login ([] = tất cả nếu null) */
  getTeacherClasses() {
    const u = this.getCurrentUser();
    return (u && u.role === 'teacher' && u.classes) ? u.classes : null;
  },
};

/* ── Utility ────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
}

function getSubject(val) {
  return SUBJECT_MAP[val] || { value: val, label: val, icon: '📄' };
}

function getScoreClass(score) {
  if (score === null || score === undefined) return 'score-na';
  if (score >= 9) return 'score-a';
  if (score >= 7) return 'score-b';
  if (score >= 5) return 'score-c';
  return 'score-d';
}

function getScoreLabel(score) {
  if (score === null || score === undefined) return '—';
  if (score >= 9) return 'Xuất sắc';
  if (score >= 8) return 'Giỏi';
  if (score >= 7) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

function statusBadge(status) {
  const map = {
    pending: `<span class="badge badge-pending">⏳ Chờ chấm</span>`,
    graded: `<span class="badge badge-graded">✅ Đã chấm</span>`,
    late: `<span class="badge badge-late">⚠️ Trễ hạn</span>`,
    draft: `<span class="badge badge-draft">📝 Nháp</span>`,
  };
  return map[status] || `<span class="badge badge-draft">${status}</span>`;
}

/* ── Initialize ─────────────────────────────────────────────── */
initDB();
