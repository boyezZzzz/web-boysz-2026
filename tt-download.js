/* =========================================
   TIKTOK DOWNLOADER — tt-download.js
   API: https://api-nanzz.my.id/docs/api/donwloader/tiktok.php?url=URL
   ========================================= */

const TT = {
  card:       document.getElementById('btn-tt-dl'),
  modal:      document.getElementById('modal-tt'),
  closeBtn:   document.getElementById('modal-tt-close'),
  urlInput:   document.getElementById('tt-url-input'),
  confirmBtn: document.getElementById('tt-confirm-btn'),
  btnText:    document.getElementById('tt-btn-text'),
  spinner:    document.getElementById('tt-spinner'),
  errorEl:    document.getElementById('tt-error'),
  formEl:     document.getElementById('tt-form'),
  resultEl:   document.getElementById('tt-result'),
  resetBtn:   document.getElementById('tt-reset-btn'),

  /** Buka modal */
  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.urlInput.focus();
  },

  /** Tutup modal & reset */
  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetForm();
  },

  /** Toggle loading */
  setLoading(isLoading) {
    this.confirmBtn.disabled = isLoading;
    this.btnText.classList.toggle('hidden', isLoading);
    this.spinner.classList.toggle('hidden', !isLoading);
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

  /** Validasi URL TikTok */
  isValidTikTokUrl(url) {
    try {
      const u = new URL(url);
      return /tiktok\.com/i.test(u.hostname) || /vm\.tiktok\.com|vt\.tiktok\.com/i.test(u.hostname);
    } catch {
      return false;
    }
  },

  /** Render hasil */
  renderResult(data) {
    // Author
    const authorEl = document.getElementById('tt-author');
    if (data.author && data.author.trim()) {
      authorEl.textContent = `👤 ${data.author}`;
      authorEl.classList.remove('hidden');
    } else {
      authorEl.classList.add('hidden');
    }

    // Caption (potong jika terlalu panjang)
    const captionEl = document.getElementById('tt-caption');
    const raw = data.caption || '';
    captionEl.textContent = raw.length > 200 ? raw.slice(0, 200) + '…' : raw;

    // Tombol download video
    const dlVideoEl = document.getElementById('tt-dl-video');
    if (data.video_tanpa_watermark) {
      dlVideoEl.href = data.video_tanpa_watermark;
      dlVideoEl.removeAttribute('aria-disabled');
      dlVideoEl.style.opacity = '1';
      dlVideoEl.style.pointerEvents = 'auto';
    } else {
      dlVideoEl.href = '#';
      dlVideoEl.setAttribute('aria-disabled', 'true');
      dlVideoEl.style.opacity = '0.4';
      dlVideoEl.style.pointerEvents = 'none';
    }

    // Tombol download audio
    const dlAudioEl = document.getElementById('tt-dl-audio');
    if (data.audio_mp3) {
      dlAudioEl.href = data.audio_mp3;
      dlAudioEl.removeAttribute('aria-disabled');
      dlAudioEl.style.opacity = '1';
      dlAudioEl.style.pointerEvents = 'auto';
    } else {
      dlAudioEl.href = '#';
      dlAudioEl.setAttribute('aria-disabled', 'true');
      dlAudioEl.style.opacity = '0.4';
      dlAudioEl.style.pointerEvents = 'none';
    }

    // Tampilkan result
    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  /** Panggil API */
  async fetchData(url) {
    const apiUrl = `https://api-nanzz.my.id/docs/api/donwloader/tiktok.php?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  },

  /** Handle klik konfirmasi */
  async handleConfirm() {
    const url = this.urlInput.value.trim();

    if (!url) {
      this.showError('Tempel link TikTok terlebih dahulu.');
      this.urlInput.focus();
      return;
    }

    if (!this.isValidTikTokUrl(url)) {
      this.showError('Link tidak valid. Pastikan itu link dari TikTok (tiktok.com / vt.tiktok.com).');
      this.urlInput.focus();
      return;
    }

    this.clearError();
    this.setLoading(true);

    try {
      const json = await this.fetchData(url);

      if (!json.status || !json.data) {
        this.showError('Gagal memproses video. Coba link lain atau coba lagi nanti.');
        return;
      }

      this.renderResult(json.data);
    } catch (err) {
      console.error('[TT Download]', err);
      this.showError('Terjadi kesalahan. Periksa koneksi dan coba lagi.');
    } finally {
      this.setLoading(false);
    }
  },

  /** Inisialisasi event listeners */
  init() {
    // Buka modal dari kartu
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });

    // Tutup modal
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    // Konfirmasi
    this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleConfirm();
    });

    // Auto-paste saat fokus ke input (opsional UX)
    this.urlInput.addEventListener('focus', async () => {
      if (this.urlInput.value.trim()) return; // sudah ada isi
      try {
        const text = await navigator.clipboard.readText();
        if (this.isValidTikTokUrl(text.trim())) {
          this.urlInput.value = text.trim();
        }
      } catch {
        // clipboard permission denied — abaikan
      }
    });

    // Reset
    this.resetBtn.addEventListener('click', () => this.resetForm());
  }
};

document.addEventListener('DOMContentLoaded', () => TT.init());
