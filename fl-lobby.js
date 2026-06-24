/* =========================================
   FAKE LOBBY FF — fl-lobby.js
   API: https://api-nanzz.my.id/docs/api/maker/fake-lobby-ff.php?nickname=NAME&versi=N
   Versi tersedia: 1 - 10
   ========================================= */

const FL = {
  card:        document.getElementById('btn-fl'),
  modal:       document.getElementById('modal-fl'),
  closeBtn:    document.getElementById('modal-fl-close'),
  nicknameInput: document.getElementById('fl-nickname-input'),
  confirmBtn:  document.getElementById('fl-confirm-btn'),
  btnText:     document.getElementById('fl-btn-text'),
  spinner:     document.getElementById('fl-spinner'),
  errorEl:     document.getElementById('fl-error'),
  formEl:      document.getElementById('fl-form'),
  resultEl:    document.getElementById('fl-result'),
  resetBtn:    document.getElementById('fl-reset-btn'),
  versionGrid: document.getElementById('fl-version-grid'),

  selectedVersion: 1,  // default versi 1

  /** Buat tombol versi 1-10 */
  buildVersionButtons() {
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fl-ver-btn' + (i === 1 ? ' active' : '');
      btn.textContent = `v${i}`;
      btn.setAttribute('aria-label', `Versi ${i}`);
      btn.dataset.ver = i;

      btn.addEventListener('click', () => {
        // Update active state
        this.versionGrid.querySelectorAll('.fl-ver-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedVersion = i;
      });

      this.versionGrid.appendChild(btn);
    }
  },

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.nicknameInput.focus();
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
    this.nicknameInput.value = '';
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.formEl.classList.remove('hidden');
    // Reset ke versi 1
    this.selectedVersion = 1;
    this.versionGrid.querySelectorAll('.fl-ver-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
  },

  /**
   * API ini mengembalikan gambar langsung (bukan JSON),
   * jadi kita buat URL-nya dan tampilkan sebagai <img>.
   * Juga sediakan tombol download.
   */
  buildApiUrl(nickname, versi) {
    return `https://api-nanzz.my.id/docs/api/maker/fake-lobby-ff.php?nickname=${encodeURIComponent(nickname)}&versi=${versi}`;
  },

  /**
   * Verifikasi URL bisa diakses (cek header Content-Type).
   * Jika CORS block, tetap tampilkan — biarkan browser muat via <img>.
   */
  async renderResult(nickname, versi) {
    const url = this.buildApiUrl(nickname, versi);

    const imgEl = document.getElementById('fl-result-img');
    const dlBtn = document.getElementById('fl-dl-btn');
    const label = document.getElementById('fl-result-label');

    label.textContent = `🎮 Versi ${versi} — ${nickname}`;

    // Set src gambar — browser akan request langsung (img tag tidak kena CORS)
    imgEl.style.opacity = '0';
    imgEl.src = '';

    // Tampilkan result section dulu
    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');

    // Muat gambar
    imgEl.onload = () => {
      imgEl.style.transition = 'opacity 0.3s ease';
      imgEl.style.opacity = '1';
      // Set download link
      dlBtn.href = url;
      dlBtn.download = `fake-lobby-ff-v${versi}-${nickname}.jpg`;
    };

    imgEl.onerror = () => {
      imgEl.style.opacity = '1';
      // Tampilkan pesan jika gambar gagal
      imgEl.alt = '⚠️ Gambar gagal dimuat. Klik tombol download untuk membuka langsung.';
      imgEl.style.minHeight = '80px';
      dlBtn.href = url;
      dlBtn.download = `fake-lobby-ff-v${versi}-${nickname}.jpg`;
    };

    imgEl.src = url;
  },

  async handleConfirm() {
    const nickname = this.nicknameInput.value.trim();

    if (!nickname) {
      this.showError('Masukkan nickname Free Fire terlebih dahulu.');
      this.nicknameInput.focus();
      return;
    }

    if (nickname.length < 2) {
      this.showError('Nickname minimal 2 karakter.');
      this.nicknameInput.focus();
      return;
    }

    this.clearError();
    this.setLoading(true);

    try {
      await this.renderResult(nickname, this.selectedVersion);
    } catch (err) {
      console.error('[FL Lobby]', err);
      this.showError('Terjadi kesalahan. Coba lagi.');
    } finally {
      this.setLoading(false);
    }
  },

  init() {
    // Build version buttons
    this.buildVersionButtons();

    // Buka modal
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });

    // Tutup modal
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    // Konfirmasi
    this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    this.nicknameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleConfirm();
    });

    // Reset
    this.resetBtn.addEventListener('click', () => this.resetForm());
  }
};

document.addEventListener('DOMContentLoaded', () => FL.init());
