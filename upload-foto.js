/* =========================================
   UPLOAD FOTO KE LINK — upload-foto.js
   Strategy:
   1. /api/upload  → Vercel proxy ke catbox (production Vercel)
   2. freeimage.host API (base64, CORS friendly, no key needed)
   3. imgbb.com anonymous (base64)
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
    if (bytes < 1024)    return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  setFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showError('File harus berupa gambar (JPG, PNG, GIF, WEBP).');
      return;
    }
    if (file.size > 32 * 1048576) {
      this.showError('Ukuran file maksimal 32 MB.');
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

  /** Baca file sebagai base64 (tanpa prefix data:...) */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const base64 = e.target.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /** Upload ke freeimage.host via base64 */
  async uploadFreeimage(base64) {
    const fd = new FormData();
    fd.append('key', '6d207e02198a847aa98d0a2a901485a5'); // public demo key
    fd.append('action', 'upload');
    fd.append('source', base64);
    fd.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`freeimage HTTP ${res.status}`);
    const json = await res.json();
    if (json.status_code === 200 && json.image?.url) return json.image.url;
    throw new Error(`freeimage: ${json.error?.message || 'gagal'}`);
  },

  /** Upload ke imgbb via base64 (anonymous key) */
  async uploadImgBB(base64) {
    const fd = new FormData();
    fd.append('key', '442a59b6d2b4d0d8082099aa68ed4301');
    fd.append('image', base64);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`imgbb HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data?.url) {
      // Fix domain: i.ibb.co → i.ibb.com
      const url = json.data.url.replace('i.ibb.co/', 'i.ibb.com/');
      return url;
    }
    throw new Error('imgbb: gagal');
  },

  /** Upload ke Vercel proxy → catbox */
  async uploadVercel(file) {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('userhash', '');
    fd.append('fileToUpload', file, file.name);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`vercel HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (text.startsWith('http')) return text;
    throw new Error(`vercel: ${text.slice(0, 80)}`);
  },

  async upload() {
    if (!this.selectedFile) return;
    this.clearError();
    this.setLoading(true);

    try {
      const base64 = await this.fileToBase64(this.selectedFile);

      // Jalankan semua jalur, ambil yang pertama berhasil
      const result = await Promise.any([
        this.uploadVercel(this.selectedFile)
          .then(url => { console.log('[Upload] ✅ Vercel/catbox'); return url; })
          .catch(e  => { console.warn('[Upload] Vercel:', e.message); throw e; }),

        this.uploadFreeimage(base64)
          .then(url => { console.log('[Upload] ✅ freeimage.host'); return url; })
          .catch(e  => { console.warn('[Upload] freeimage:', e.message); throw e; }),

        this.uploadImgBB(base64)
          .then(url => { console.log('[Upload] ✅ imgbb'); return url; })
          .catch(e  => { console.warn('[Upload] imgbb:', e.message); throw e; }),
      ]);

      this.renderResult(result);
    } catch (e) {
      console.error('[Upload] Semua jalur gagal');
      this.showError('Upload gagal di semua jalur. Coba lagi atau periksa koneksi.');
    }

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
