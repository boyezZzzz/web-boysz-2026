/* =========================================
   INSTAGRAM STALKER — ig-stalk.js
   API: https://api-nanzz.my.id/docs/api/stalker/ig-stalk.php?username=USERNAME
   ========================================= */

const IG = {
  card:       document.getElementById('btn-ig-stalk'),
  modal:      document.getElementById('modal-ig'),
  closeBtn:   document.getElementById('modal-ig-close'),
  usernameInput: document.getElementById('ig-username-input'),
  confirmBtn: document.getElementById('ig-confirm-btn'),
  btnText:    document.getElementById('ig-btn-text'),
  spinner:    document.getElementById('ig-spinner'),
  errorEl:    document.getElementById('ig-error'),
  formEl:     document.getElementById('ig-form'),
  resultEl:   document.getElementById('ig-result'),
  resetBtn:   document.getElementById('ig-reset-btn'),

  /** Buka modal */
  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.usernameInput.focus();
  },

  /** Tutup modal & reset state */
  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetForm();
  },

  /** Tampilkan / sembunyikan loading */
  setLoading(isLoading) {
    this.confirmBtn.disabled = isLoading;
    this.btnText.classList.toggle('hidden', isLoading);
    this.spinner.classList.toggle('hidden', !isLoading);
  },

  /** Tampilkan pesan error */
  showError(msg) {
    this.errorEl.textContent = msg;
    this.errorEl.classList.remove('hidden');
  },

  /** Hapus pesan error */
  clearError() {
    this.errorEl.classList.add('hidden');
    this.errorEl.textContent = '';
  },

  /** Reset ke form awal */
  resetForm() {
    this.usernameInput.value = '';
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.formEl.classList.remove('hidden');
  },

  /** Format angka ribuan */
  fmt(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('id-ID');
  },

  /** Teks aman / fallback */
  safe(v, fallback = '—') {
    return v && v !== 'Not found' && v !== '' ? v : fallback;
  },

  /** Render hasil ke DOM */
  renderResult(data) {
    const { username, full_name, bio, profile_pic, is_private, is_verified, external_url, stats } = data;

    // Avatar — gunakan proxy dari respons API langsung
    const avatarEl = document.getElementById('ig-avatar');
    if (profile_pic) {
      avatarEl.src = profile_pic;
      avatarEl.alt = `Foto profil ${username}`;
      avatarEl.onerror = () => {
        avatarEl.src = '';
        avatarEl.style.background = 'linear-gradient(135deg,#6228d7,#ee2a7b)';
      };
    } else {
      avatarEl.style.background = 'linear-gradient(135deg,#6228d7,#ee2a7b)';
    }

    // Identitas
    document.getElementById('ig-username-display').textContent = `@${username}`;
    document.getElementById('ig-fullname').textContent = this.safe(full_name, '');

    // Bio
    const bioEl = document.getElementById('ig-bio-display');
    if (bio && bio.trim()) {
      bioEl.textContent = bio;
      bioEl.classList.remove('hidden');
    } else {
      bioEl.classList.add('hidden');
    }

    // Badge verified
    const verifiedBadge = document.getElementById('ig-verified-badge');
    verifiedBadge.classList.toggle('hidden', !is_verified);

    // Badge private
    const privateBadge = document.getElementById('ig-private-badge');
    privateBadge.classList.toggle('hidden', !is_private);

    // External URL
    const extUrlEl = document.getElementById('ig-external-url');
    if (external_url && external_url !== 'null' && external_url !== null) {
      extUrlEl.href = external_url;
      extUrlEl.textContent = external_url;
      extUrlEl.classList.remove('hidden');
    } else {
      extUrlEl.classList.add('hidden');
    }

    // Stats
    document.getElementById('ig-posts').textContent     = this.fmt(stats?.posts);
    document.getElementById('ig-followers').textContent = this.fmt(stats?.followers);
    document.getElementById('ig-following').textContent = this.fmt(stats?.following);

    // Tampilkan result, sembunyikan form
    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  /** Panggil API */
  async fetchData(username) {
    const url = `https://api-nanzz.my.id/docs/api/stalker/ig-stalk.php?username=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  },

  /** Handle konfirmasi */
  async handleConfirm() {
    // Bersihkan @ di depan kalau user mengetik manual
    const raw = this.usernameInput.value.trim().replace(/^@+/, '');

    if (!raw) {
      this.showError('Masukkan username Instagram terlebih dahulu.');
      this.usernameInput.focus();
      return;
    }

    // Validasi: hanya huruf, angka, titik, underscore; maks 30 karakter
    if (!/^[\w.]{1,30}$/.test(raw)) {
      this.showError('Username tidak valid. Gunakan huruf, angka, titik, atau underscore.');
      this.usernameInput.focus();
      return;
    }

    this.clearError();
    this.setLoading(true);

    try {
      const json = await this.fetchData(raw);

      if (!json.status || !json.result) {
        this.showError('Akun tidak ditemukan atau username salah. Coba lagi.');
        return;
      }

      this.renderResult(json.result);
    } catch (err) {
      console.error('[IG Stalk]', err);
      this.showError('Gagal mengambil data. Periksa koneksi dan coba lagi.');
    } finally {
      this.setLoading(false);
    }
  },

  /** Inisialisasi event listeners */
  init() {
    // Buka modal dari kartu fitur
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
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleConfirm();
    });

    // Reset
    this.resetBtn.addEventListener('click', () => this.resetForm());
  }
};

document.addEventListener('DOMContentLoaded', () => IG.init());
