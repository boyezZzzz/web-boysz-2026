/* =========================================
   YOUTUBE DOWNLOADER — yt-download.js
   API: https://api.betabotz.eu.org/api/download/ytmp4?url=URL&apikey=Boysz
   ========================================= */

const YTDl = {
  card:       document.getElementById('btn-yt-dl'),
  modal:      document.getElementById('modal-yt'),
  closeBtn:   document.getElementById('modal-yt-close'),
  urlInput:   document.getElementById('yt-url-input'),
  confirmBtn: document.getElementById('yt-confirm-btn'),
  btnText:    document.getElementById('yt-btn-text'),
  spinner:    document.getElementById('yt-spinner'),
  errorEl:    document.getElementById('yt-error'),
  formEl:     document.getElementById('yt-form'),
  resultEl:   document.getElementById('yt-result'),
  resetBtn:   document.getElementById('yt-reset-btn'),

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.urlInput.focus();
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
    this.urlInput.value = '';
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.formEl.classList.remove('hidden');
  },

  isValidYtUrl(url) {
    try {
      const u = new URL(url);
      return /youtube\.com|youtu\.be/i.test(u.hostname);
    } catch { return false; }
  },

  fmtDuration(sec) {
    const s = parseInt(sec, 10);
    if (isNaN(s)) return sec;
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${String(ss).padStart(2, '0')}`;
  },

  renderResult(data) {
    // Thumbnail
    const thumbEl = document.getElementById('yt-thumb');
    if (data.thumb) {
      thumbEl.src = data.thumb;
      thumbEl.onerror = () => { thumbEl.style.display = 'none'; };
    } else {
      thumbEl.style.display = 'none';
    }

    // Title & duration
    document.getElementById('yt-title').textContent    = data.title || '—';
    document.getElementById('yt-duration').textContent = data.duration
      ? `⏱️ ${this.fmtDuration(data.duration)}`
      : '';

    // MP4 button
    const mp4El = document.getElementById('yt-dl-mp4');
    if (data.mp4) {
      mp4El.href = data.mp4;
      mp4El.style.opacity = '1';
      mp4El.style.pointerEvents = 'auto';
      mp4El.removeAttribute('aria-disabled');
    } else {
      mp4El.href = '#';
      mp4El.style.opacity = '0.4';
      mp4El.style.pointerEvents = 'none';
      mp4El.setAttribute('aria-disabled', 'true');
    }

    // MP3 button
    const mp3El = document.getElementById('yt-dl-mp3');
    if (data.mp3) {
      mp3El.href = data.mp3;
      mp3El.style.opacity = '1';
      mp3El.style.pointerEvents = 'auto';
      mp3El.removeAttribute('aria-disabled');
    } else {
      mp3El.href = '#';
      mp3El.style.opacity = '0.4';
      mp3El.style.pointerEvents = 'none';
      mp3El.setAttribute('aria-disabled', 'true');
    }

    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  async tryFetch(url, ms = 20000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally { clearTimeout(t); }
  },

  async load() {
    const raw = this.urlInput.value.trim();

    if (!raw) {
      this.showError('Tempel link YouTube terlebih dahulu.');
      this.urlInput.focus();
      return;
    }
    if (!this.isValidYtUrl(raw)) {
      this.showError('Link tidak valid. Pastikan itu link YouTube (youtube.com / youtu.be).');
      this.urlInput.focus();
      return;
    }

    this.clearError();
    this.setLoading(true);

    const base = `https://api.betabotz.eu.org/api/download/ytmp4?url=${encodeURIComponent(raw)}&apikey=Boysz`;
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(base)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
      `https://thingproxy.freeboard.io/fetch/${base}`,
    ];

    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url, 30000);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json && json.status && json.result) {
          this.renderResult(json.result);
          this.setLoading(false);
          return;
        }
        if (json?.result?.error) {
          this.showError(`Gagal: ${json.result.error}`);
          this.setLoading(false);
          return;
        }
      } catch(e) { console.warn('[YTDl]', url.substring(0,50), e.message); }
    }

    this.showError('Gagal memproses video. Pastikan link valid dan coba lagi.');
    this.setLoading(false);
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

    this.confirmBtn.addEventListener('click', () => this.load());
    this.urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') this.load(); });

    // Auto-paste dari clipboard saat fokus ke input
    this.urlInput.addEventListener('focus', async () => {
      if (this.urlInput.value.trim()) return;
      try {
        const text = await navigator.clipboard.readText();
        if (this.isValidYtUrl(text.trim())) this.urlInput.value = text.trim();
      } catch { /* clipboard permission denied */ }
    });

    this.resetBtn.addEventListener('click', () => this.resetForm());
  }
};

document.addEventListener('DOMContentLoaded', () => YTDl.init());
