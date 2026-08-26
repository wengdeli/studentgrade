/* ============================================================
   FILE VIEWER — StudentApp
   Xem / tải file đã upload (PDF, ảnh, text, code, v.v.)
   Hỗ trợ cả file thật (base64) và seed data (tạo demo)
   ============================================================ */

const FileViewer = {
  open(submissionId) {
    const sub = SubmissionDB.getById(submissionId);
    if (!sub || !sub.fileName) {
      App.toast('Không có file để xem.', 'error');
      return;
    }

    const { fileName, fileData } = sub;
    const ext = fileName.split('.').pop().toLowerCase();

    // --- Nếu KHÔNG có fileData (seed data / bài cũ) ---
    if (!fileData) {
      this._openNoData(sub, ext);
      return;
    }

    // --- Có fileData thật ---
    this._openWithData(sub, fileName, fileData, ext);
  },

  /** Hiển thị modal cho file CÓ nội dung thật */
  _openWithData(sub, fileName, fileData, ext) {
    const isImage = ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext);
    const isPDF   = ext === 'pdf';
    const isText  = ['txt','md','py','js','ts','html','css','json','csv','xml','yaml','yml',
                     'java','c','cpp','cs','php','rb','go','rs','sh','sql','r'].includes(ext);

    let previewHTML = '';

    if (isImage) {
      previewHTML = `
        <div style="text-align:center;padding:var(--sp-4);background:var(--bg-base);
                    border-radius:var(--radius-lg);border:1px solid var(--border-subtle)">
          <img src="${fileData}" alt="${fileName}"
            style="max-width:100%;max-height:60vh;border-radius:var(--radius-md);
                   object-fit:contain;box-shadow:0 8px 32px rgba(0,0,0,.4)" />
        </div>
      `;
    } else if (isPDF) {
      previewHTML = `
        <div style="width:100%;height:62vh;border-radius:var(--radius-lg);overflow:hidden;
                    background:#111;border:1px solid var(--border-subtle)">
          <iframe src="${fileData}" style="width:100%;height:100%;border:none" title="${fileName}"></iframe>
        </div>
      `;
    } else if (isText) {
      let textContent = '';
      try {
        const base64 = fileData.split(',')[1];
        textContent = decodeURIComponent(escape(atob(base64)));
      } catch {
        textContent = '(Không thể giải mã nội dung văn bản)';
      }
      const escaped = textContent
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      previewHTML = `
        <div style="background:var(--bg-base);border:1px solid var(--border-subtle);
                    border-radius:var(--radius-lg);overflow:hidden">
          <div style="background:var(--bg-elevated);padding:var(--sp-3) var(--sp-4);
                      border-bottom:1px solid var(--border-subtle);
                      font-size:var(--fs-xs);color:var(--text-muted);
                      display:flex;align-items:center;gap:var(--sp-2)">
            <span>${this._iconForExt(ext)}</span>
            <span style="font-family:monospace;color:var(--text-secondary)">${fileName}</span>
          </div>
          <pre style="max-height:55vh;overflow:auto;padding:var(--sp-5);
                      font-family:'Fira Code',Consolas,monospace;font-size:13px;
                      line-height:1.7;color:var(--text-primary);margin:0;
                      white-space:pre-wrap;word-break:break-word">${escaped}</pre>
        </div>
      `;
    } else {
      // Unsupported preview — offer download
      previewHTML = `
        <div style="text-align:center;padding:var(--sp-10)">
          <div style="font-size:4rem;margin-bottom:var(--sp-4)">${this._iconForExt(ext)}</div>
          <div style="font-size:var(--fs-lg);font-weight:700;margin-bottom:var(--sp-2)">${fileName}</div>
          <div style="font-size:var(--fs-sm);color:var(--text-muted);margin-bottom:var(--sp-6)">
            Định dạng <strong>.${ext}</strong> không hỗ trợ xem trực tiếp.<br>
            Nhấn <strong>Tải xuống</strong> để mở bằng ứng dụng máy tính.
          </div>
          <a href="${fileData}" download="${fileName}"
             class="btn btn-primary btn-lg"
             style="display:inline-flex;align-items:center;gap:var(--sp-3);text-decoration:none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải xuống
          </a>
        </div>
      `;
    }

    App.openModal('', `
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        ${this._fileHeader(sub, fileName, ext, fileData)}
        ${previewHTML}
        <div class="modal-footer">
          <a href="${fileData}" download="${fileName}"
             class="btn btn-secondary" style="text-decoration:none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải xuống
          </a>
          <button class="btn btn-ghost" onclick="App.closeModal()">Đóng</button>
        </div>
      </div>
    `);
  },

  /** Hiển thị modal cho file KHÔNG có nội dung (seed data) */
  _openNoData(sub, ext) {
    const { fileName } = sub;

    // Tạo demo text content để download
    const demoContent = [
      `Tên file: ${fileName}`,
      `Bài tập: ${sub.title}`,
      `Học sinh: ${sub.studentName}`,
      `Môn học: ${getSubject(sub.subject).label}`,
      `Ngày nộp: ${formatDate(sub.submittedAt)}`,
      ``,
      `--- Nội dung demo ---`,
      `File này là dữ liệu mẫu. Trong ứng dụng thực tế,`,
      `nội dung bài tập của học sinh sẽ được hiển thị tại đây.`,
    ].join('\n');

    const blob = new Blob([demoContent], { type: 'text/plain;charset=utf-8' });
    const demoUrl = URL.createObjectURL(blob);

    App.openModal('', `
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        ${this._fileHeader(sub, fileName, ext, null)}

        <!-- No data notice -->
        <div style="background:hsla(38,85%,50%,.10);border:1px solid hsla(38,85%,50%,.30);
                    border-radius:var(--radius-lg);padding:var(--sp-4);
                    display:flex;gap:var(--sp-3);align-items:flex-start">
          <span style="font-size:1.4rem;flex-shrink:0">⚠️</span>
          <div>
            <div style="font-weight:700;font-size:var(--fs-sm);margin-bottom:var(--sp-1)">
              Không thể xem trực tiếp
            </div>
            <div style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6">
              Bài nộp này là dữ liệu mẫu, không có file thực tế đính kèm.<br>
              Chỉ các bài nộp qua form upload mới có thể xem & tải file.
            </div>
          </div>
        </div>

        <!-- File info -->
        <div style="background:var(--bg-elevated);border-radius:var(--radius-lg);
                    padding:var(--sp-5);border:1px solid var(--border-subtle)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)">
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:4px">Học sinh</div>
              <div style="font-weight:700">${sub.studentName}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:4px">Môn học</div>
              <div style="font-weight:700">${getSubject(sub.subject).icon} ${getSubject(sub.subject).label}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:4px">Bài tập</div>
              <div style="font-weight:700">${sub.title}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:4px">Ngày nộp</div>
              <div style="font-weight:700">${formatDate(sub.submittedAt)}</div>
            </div>
          </div>
          ${sub.description ? `
            <div style="margin-top:var(--sp-4);padding-top:var(--sp-4);border-top:1px solid var(--border-subtle)">
              <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-bottom:var(--sp-2)">Mô tả / Ghi chú</div>
              <div style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.6">${sub.description}</div>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <a href="${demoUrl}" download="${fileName.replace(/\.[^.]+$/, '')}_demo.txt"
             class="btn btn-secondary" style="text-decoration:none"
             onclick="setTimeout(()=>URL.revokeObjectURL('${demoUrl}'),3000)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải thông tin (TXT)
          </a>
          <button class="btn btn-ghost" onclick="App.closeModal()">Đóng</button>
        </div>
      </div>
    `);
  },

  /** Header chung cho tất cả file viewer modal */
  _fileHeader(sub, fileName, ext, fileData) {
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;
                  padding:var(--sp-3) var(--sp-4);background:var(--bg-elevated);
                  border-radius:var(--radius-lg);border:1px solid var(--border-subtle)">
        <div style="display:flex;align-items:center;gap:var(--sp-3);min-width:0">
          <span style="font-size:1.6rem;flex-shrink:0">${this._iconForExt(ext)}</span>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:var(--fs-sm);
                        overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fileName}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">
              ${sub.studentName} · ${getSubject(sub.subject).label} · ${formatDate(sub.submittedAt)}
            </div>
          </div>
        </div>
        ${fileData ? `
          <a href="${fileData}" download="${fileName}"
             class="btn btn-secondary btn-sm"
             style="text-decoration:none;flex-shrink:0;gap:var(--sp-2)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Tải xuống
          </a>
        ` : ''}
      </div>
    `;
  },

  _iconForExt(ext) {
    const icons = {
      pdf: '📄', doc: '📝', docx: '📝',
      ppt: '📊', pptx: '📊', xls: '📊', xlsx: '📊',
      zip: '🗜️', rar: '🗜️', '7z': '🗜️',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
      py: '🐍', js: '📜', ts: '📜', html: '🌐', css: '🎨',
      json: '📋', xml: '📋', yaml: '📋', yml: '📋',
      txt: '📃', md: '📃', csv: '📊', sql: '🗄️',
      java: '☕', c: '⚙️', cpp: '⚙️', cs: '⚙️', go: '🔵', r: '📊',
    };
    return icons[ext] || '📎';
  },
};
