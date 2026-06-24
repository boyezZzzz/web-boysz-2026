/* =========================================
   GET CONTACT — getcontact.js
   API: https://api.betabotz.eu.org/api/tools/getcontact?nomer=NUMBER&aksesKey=AK-6FUZGwniPq
   Pakai Vercel proxy (/api/proxy) sebagai jalur utama agar jalan di production
   ========================================= */

const GetContact = {
  card:       document.getElementById('btn-gc'),
  modal:      document.getElementById('modal-gc'),
  closeBtn:   document.getElementById('modal-gc-close'),
  phoneInput: document.getElementById('gc-phone-input'),
  confirmBtn: document.getElementById('gc-confirm-btn'),
  btnText:    document.getElementById('gc-btn-text'),
  spinner:    document.getElementById('gc-spinner'),
  errorEl:    document.getElementById('gc-error'),
  formEl:     document.getElementById('gc-form'),
  resultEl:   document.getElementById('gc-result'),

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.phoneInput.focus();
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
    this.phoneInput.value = '';
    this.clearError();
    this.setLoading(false);
    this.resultEl.classList.add('hidden');
    this.resultEl.innerHTML = '';
    this.formEl.classList.remove('hidden');
  },

  esc(s) {
    if (typeof s !== 'string') return s ?? '—';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  safe(v) {
    return (v != null && v !== '' && String(v) !== 'null') ? v : null;
  },

  renderResult(profile) {
    const name    = this.safe(profile.displayName) || this.safe(profile.name) || '—';
    const phone   = this.safe(profile.displayNumber) || this.safe(profile.phoneNumber) || '—';
    const country = this.safe(profile.country) || this.safe(profile.countryCode) || '—';
    const tags    = profile.tagCount ?? 0;
    const img     = this.safe(profile.profileImage);
    const email   = this.safe(profile.email);
    const trust   = this.safe(profile.trustScore);

    this.resultEl.innerHTML = `
      <div class="gc-profile-card">
        <div class="gc-profile-top">
          ${img
            ? `<img src="${this.esc(img)}" alt="Foto profil" class="gc-avatar" onerror="this.style.display='none'" />`
            : `<div class="gc-avatar-placeholder">👤</div>`
          }
          <div class="gc-profile-text">
            <div class="gc-profile-name">${this.esc(name)}</div>
            <div class="gc-profile-phone">${this.esc(phone)}</div>
            <div class="gc-tag-count">
              <span class="gc-tag-icon">🏷️</span>
              <span>Disimpan dengan <strong>${tags}</strong> nama berbeda</span>
            </div>
          </div>
        </div>
        <div class="gc-info-rows">
          <div class="gc-info-row"><span>Negara</span><span>${this.esc(country)}</span></div>
          ${email ? `<div class="gc-info-row"><span>Email</span><span>${this.esc(email)}</span></div>` : ''}
          ${trust != null ? `<div class="gc-info-row"><span>Trust Score</span><span>${this.esc(String(trust))}</span></div>` : ''}
        </div>
      </div>
      <button class="btn-reset gc-reset-btn" id="gc-reset-btn">🔄 Cek Nomor Lain</button>
    `;

    document.getElementById('gc-reset-btn').addEventListener('click', () => this.resetForm());
    this.formEl.classList.add('hidden');
    this.resultEl.classList.remove('hidden');
  },

  async tryFetch(url, ms = 18000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally { clearTimeout(t); }
  },

  async load(rawNumber) {
    // Normalisasi nomor
    let num = rawNumber.replace(/[\s\-().+]/g, '');
    if (num.startsWith('62'))     num = num.slice(2);
    else if (num.startsWith('0')) num = num.slice(1);

    if (!num || !/^\d{8,15}$/.test(num)) {
      this.showError('Nomor tidak valid. Masukkan angka saja, contoh: 895326700138');
      this.phoneInput.focus();
      return;
    }

    const fullNum = `0${num}`;   // format: 08xxx untuk API

    this.clearError();
    this.setLoading(true);

    const base = `https://api.betabotz.eu.org/api/tools/getcontact?nomer=${encodeURIComponent(fullNum)}&aksesKey=AK-6FUZGwniPq`;
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(base)}`,          // Vercel proxy — utama
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
      `https://thingproxy.freeboard.io/fetch/${base}`,
    ];

    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json && json.status && json.profile) {
          this.renderResult(json.profile);
          this.setLoading(false);
          return;
        }
        if (json && json.status === false) {
          this.showError('Nomor tidak ditemukan di database GetContact.');
          this.setLoading(false);
          return;
        }
      } catch(e) { console.warn('[GetContact]', url.substring(0,50), e.message); }
    }

    this.showError('Gagal mengambil data. Periksa koneksi dan coba lagi.');
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

    this.confirmBtn.addEventListener('click', () => this.load(this.phoneInput.value.trim()));
    this.phoneInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.load(this.phoneInput.value.trim());
    });

    // Hanya izinkan angka
    this.phoneInput.addEventListener('input', () => {
      this.phoneInput.value = this.phoneInput.value.replace(/\D/g, '');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => GetContact.init());
