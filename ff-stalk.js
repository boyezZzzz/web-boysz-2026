/* =========================================
   FREE FIRE STALKER — ff-stalk.js
   API: https://api-nanzz.my.id/docs/api/stalker/ff-stalk.php?uid=UID
   ========================================= */

const FF = {
  card:       document.getElementById('btn-ff-stalk'),
  modal:      document.getElementById('modal-ff'),
  closeBtn:   document.getElementById('modal-ff-close'),
  uidInput:   document.getElementById('ff-uid-input'),
  confirmBtn: document.getElementById('ff-confirm-btn'),
  btnText:    document.getElementById('ff-btn-text'),
  spinner:    document.getElementById('ff-spinner'),
  errorEl:    document.getElementById('ff-error'),
  formEl:     document.getElementById('ff-form'),
  resultEl:   document.getElementById('ff-result'),
  resetBtn:   document.getElementById('ff-reset-btn'),

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.uidInput.focus();
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
    this.uidInput.value = '';
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.formEl.classList.remove('hidden');
  },

  fmt(n) {
    if (n == null || n === 'Not found') return '—';
    return Number(n).toLocaleString('id-ID');
  },

  safe(v) {
    return (v != null && v !== '' && v !== 'Not found') ? v : '—';
  },

  /**
   * Coba fetch dari satu URL, kembalikan JSON atau throw.
   * Pakai AbortController agar bisa di-cancel.
   */
  async tryFetch(url, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Ambil data FF — coba langsung, lalu beberapa proxy CORS secara berurutan.
   */
  async fetchData(uid) {
    const target = `https://api-nanzz.my.id/docs/api/stalker/ff-stalk.php?uid=${encodeURIComponent(uid)}`;

    const proxies = [
      target,                                                                      // Langsung
      `https://corsproxy.io/?url=${encodeURIComponent(target)}`,                  // Proxy 1
      `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,         // Proxy 2
      `https://thingproxy.freeboard.io/fetch/${target}`,                          // Proxy 3
    ];

    let lastErr = null;

    for (const url of proxies) {
      try {
        const json = await this.tryFetch(url, 15000);

        // allorigins membungkus respons di dalam { contents: "..." }
        if (url.includes('allorigins') && json.contents) {
          return JSON.parse(json.contents);
        }

        // Pastikan JSON punya field status
        if (typeof json === 'object' && 'status' in json) {
          return json;
        }
      } catch (err) {
        console.warn(`[FF Stalk] gagal via ${url.substring(0, 60)}…`, err.message);
        lastErr = err;
      }
    }

    throw lastErr || new Error('Semua jalur gagal');
  },

  renderResult(data) {
    const { basic, activity, social, overview, guild, misc } = data;

    // Avatar
    const avatarEl = document.getElementById('ff-avatar');
    avatarEl.style.display = '';
    if (misc?.profile_image) {
      avatarEl.src = misc.profile_image;
      avatarEl.onerror = () => { avatarEl.style.display = 'none'; };
    } else {
      avatarEl.style.display = 'none';
    }

    // Profil
    document.getElementById('ff-name').textContent          = this.safe(basic.name);
    document.getElementById('ff-title-badge').textContent   = this.safe(basic.title);
    document.getElementById('ff-uid-display').textContent   = this.safe(basic.uid);
    document.getElementById('ff-bio').textContent           = this.safe(basic.bio);

    // Stats
    document.getElementById('ff-level').textContent    = this.safe(basic.level);
    document.getElementById('ff-exp').textContent      = this.fmt(basic.exp);
    document.getElementById('ff-likes').textContent    = this.fmt(basic.likes);
    document.getElementById('ff-honor').textContent    = this.safe(basic.honor_score);
    document.getElementById('ff-br-rank').textContent  = this.fmt(activity?.br_rank);
    document.getElementById('ff-cs-rank').textContent  = this.fmt(activity?.cs_rank);

    // Info rows
    document.getElementById('ff-region').textContent      = this.safe(basic.region);
    document.getElementById('ff-language').textContent    = this.safe(social?.language);
    document.getElementById('ff-elite').textContent       = basic.has_elite_pass ? '✅ Aktif' : '❌ Tidak';
    document.getElementById('ff-created').textContent     = this.safe(activity?.created_at);
    document.getElementById('ff-lastlogin').textContent   = this.safe(activity?.last_login);
    document.getElementById('ff-avatar-name').textContent = this.safe(overview?.avatar);

    // Guild
    if (guild?.name && guild.name !== 'Not found') {
      document.getElementById('ff-guild-name').textContent    = this.safe(guild.name);
      document.getElementById('ff-guild-id').textContent      = this.safe(guild.id);
      document.getElementById('ff-guild-level').textContent   = this.safe(guild.level);
      document.getElementById('ff-guild-members').textContent = this.safe(guild.members);
      document.getElementById('ff-guild-box').classList.remove('hidden');
    } else {
      document.getElementById('ff-guild-box').classList.add('hidden');
    }

    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  async handleConfirm() {
    const uid = this.uidInput.value.trim();

    if (!uid) {
      this.showError('Masukkan UID Free Fire terlebih dahulu.');
      this.uidInput.focus();
      return;
    }
    if (!/^\d{5,20}$/.test(uid)) {
      this.showError('UID hanya boleh berisi angka (5–20 digit).');
      this.uidInput.focus();
      return;
    }

    this.clearError();
    this.setLoading(true);

    try {
      const json = await this.fetchData(uid);

      if (!json.status) {
        this.showError('Akun tidak ditemukan. Periksa kembali UID Anda.');
        return;
      }
      if (!json.data) {
        this.showError('Data tidak tersedia untuk UID ini.');
        return;
      }

      this.renderResult(json.data);
    } catch (err) {
      console.error('[FF Stalk]', err);
      this.showError('Tidak dapat terhubung ke server. Pastikan koneksi internet aktif, lalu coba lagi.');
    } finally {
      this.setLoading(false);
    }
  },

  init() {
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });

    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => {
      if (e.target === this.modal) this.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    this.uidInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleConfirm();
    });

    this.resetBtn.addEventListener('click', () => this.resetForm());
  }
};

document.addEventListener('DOMContentLoaded', () => FF.init());
