/* =========================================
   UPLOAD FOTO KE LINK — upload-foto.js
   API: catbox.moe via Vercel /api/upload
   ========================================= */

const UploadFoto = {
  card:       document.getElementById('btn-upload'),
  modal:      document.getElementById('modal-upload'),
  closeBtn:   document.getElementById('modal-upload-close'),
  dropzone:   document.getElementById('up-dropzone'),
  fileInput:  document.getElementById('up-file-input'),
  previewImg: document.getElementById('up-preview-img'),
  dropInner:  document.getElementById('up-dropzone-inner'),
  fileInfo:   document.getElementById('up-file-info'),
  fileName:   document.getElementById('up-file-name'),
  removeBtn:  document.getElementById('up-remove-btn'),
  confirmBtn: document.getElementById('up-confirm-btn'),
  btnText:    document.getElementById('up-btn-text'),
  spinner:    document.getElementById('up-spinner'),
  errorEl:    document.getElementById('up-error'),
  formEl:     document.getElementById('upload-form'),
  resultEl:   document.getElementById('up-result'),
  resetBtn:   document.getElementById('up-reset-btn'),
  copyBtn:    document.getElementById('up-copy-btn'),
  copyMsg:    document.getElementById('up-copy-msg'),
  urlInput:   document.getElementById('up-result-url'),
  openLink:   document.getElementById('up-open-link'),
  selectedFile: null,

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetForm();
  },

  setLoading(on) {
    this.confirmBtn.disabled = on;
    this.btnText.classList.toggle('hidden', on);
    this.spinner.classList.toggle('hidden', !on);
  },

  showError(msg) {
    this.errorEl.textContent = msg;
    this.errorEl.classList.remove('hidden');
  },

  clearError() {
    this.errorEl.classList.add('hidden');
    this.errorEl.textContent = '';
  },

  resetForm() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.previewImg.src = '';
    this.previewImg.classList.add('hidden');
    this.dropInner.classList.remove('hidden');
    this.fileInfo.classList.add('hidden');
    this.fileName.textContent = '';
    this.confirmBtn.disabled = true;
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.formEl.classList.remove('hidden');
    this.dropzone.classList.remove('up-drag-over');
    this.copyMsg.classList.add('hidden');
  },

  formatSize(bytes) {
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1048576)     return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  setFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showError('File harus berupa gambar (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > 200 * 1048576) {
      this.showError('Ukuran file maksimal 200 MB.');
      return;
    }
    this.clearError();
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      this.previewImg.src = e.target.result;
      this.previewImg.classList.remove('hidden');
      this.dropInner.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    this.fileName.textContent = `${file.name} (${this.formatSize(file.size)})`;
    this.fileInfo.classList.remove('hidden');
    this.confirmBtn.disabled = false;
  },

  buildFormData() {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('userhash', '');
    fd.append('fileToUpload', this.selectedFile, this.selectedFile.name);
    return fd;
  },

  async doFetch(url, fd, ms = 60000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { method: 'POST', body: fd, signal: ctrl.signal });
      clearTimeout(t);
      return res;
    } finally {
      clearTimeout(t);
    }
  },

  parseResult(text) {
    const t = (text || '').trim();
    if (t.startsWith('https://')) return t;
    if (t.startsWith('http://'))  return t;
    return null;
  },

  async upload() {
    if (!this.selectedFile) return;
    this.clearError();
    this.setLoading(true);

    /* Jalur upload — dicoba berurutan:
       1. /api/upload  → Vercel proxy ke catbox (production)
       2. corsproxy.io → proxy publik (fallback live server)
    */
    const CATBOX = 'https://catbox.moe/user/api.php';
    const attempts = [
      { label: 'Vercel proxy', url: '/api/upload' },
      { label: 'corsproxy',    url: `https://corsproxy.io/?url=${encodeURIComponent(CATBOX)}` },
    ];

    for (const { label, url } of attempts) {
      try {
        console.log(`[Upload] Mencoba ${label}...`);
        const fd  = this.buildFormData();
        const res = await this.doFetch(url, fd);

        if (!res.ok) {
          console.warn(`[Upload] ${label} HTTP ${res.status}`);
          continue;
        }

        const text = await res.text();
        console.log(`[Upload] ${label} response:`, text);

        const resultUrl = this.parseResult(text);
        if (resultUrl) {
          this.renderResult(resultUrl);
          this.setLoading(false);
          return;
        }
        console.warn(`[Upload] ${label} respons tidak valid:`, text.slice(0, 100));
      } catch (e) {
        console.warn(`[Upload] ${label} error:`, e.message);
      }
    }

    this.showError('Upload gagal. Coba lagi atau periksa koneksi internet.');
    this.setLoading(false);
  },

  renderResult(url) {
    const img = document.getElementById('up-result-img');
    img.src = url;
    img.onerror = () => { img.style.display = 'none'; };

    document.getElementById('up-result-filename').textContent = this.selectedFile?.name || '—';
    document.getElementById('up-result-size').textContent =
      this.selectedFile ? `Ukuran: ${this.formatSize(this.selectedFile.size)}` : '';

    this.urlInput.value = url;
    this.openLink.href  = url;
    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  async copyUrl() {
    const url = this.urlInput.value;
    if (!url) return;
    try { await navigator.clipboard.writeText(url); }
    catch { this.urlInput.select(); document.execCommand('copy'); }
    this.copyMsg.classList.remove('hidden');
    setTimeout(() => this.copyMsg.classList.add('hidden'), 2500);
  },

  init() {
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    this.dropzone.addEventListener('click', () => { if (!this.selectedFile) this.fileInput.click(); });
    this.dropzone.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !this.selectedFile) { e.preventDefault(); this.fileInput.click(); }
    });
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files[0]) this.setFile(this.fileInput.files[0]);
    });

    this.dropzone.addEventListener('dragover', e => { e.preventDefault(); this.dropzone.classList.add('up-drag-over'); });
    this.dropzone.addEventListener('dragleave', () => { this.dropzone.classList.remove('up-drag-over'); });
    this.dropzone.addEventListener('drop', e => {
      e.preventDefault();
      this.dropzone.classList.remove('up-drag-over');
      if (e.dataTransfer.files[0]) this.setFile(e.dataTransfer.files[0]);
    });

    this.removeBtn.addEventListener('click', e => { e.stopPropagation(); this.resetForm(); });
    this.confirmBtn.addEventListener('click', () => this.upload());
    this.resetBtn.addEventListener('click', () => this.resetForm());
    this.copyBtn.addEventListener('click', () => this.copyUrl());
    this.urlInput.addEventListener('click', () => this.urlInput.select());
  }
};

document.addEventListener('DOMContentLoaded', () => UploadFoto.init());
