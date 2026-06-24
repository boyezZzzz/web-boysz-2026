/* =========================================
   CEK JARAK — jarak.js
   API: https://api.betabotz.eu.org/api/search/jarak?from=ASAL&to=TUJUAN&apikey=Boysz
   ========================================= */

const Jarak = {
  card:      document.getElementById('btn-jk'),
  modal:     document.getElementById('modal-jk'),
  closeBtn:  document.getElementById('modal-jk-close'),
  fromInput: document.getElementById('jk-from-input'),
  toInput:   document.getElementById('jk-to-input'),
  confirmBtn:document.getElementById('jk-confirm-btn'),
  btnText:   document.getElementById('jk-btn-text'),
  spinner:   document.getElementById('jk-spinner'),
  errorEl:   document.getElementById('jk-error'),
  resultEl:  document.getElementById('jk-result'),

  esc(s) {
    if (typeof s !== 'string') return s ?? '—';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
  },

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.fromInput.focus();
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderResult(msg) {
    const asal   = msg.asal;
    const tujuan = msg.tujuan;
    const bbm    = msg.estimasi_biaya_bbm;
    const steps  = msg.arah_penunjuk_jalan || [];

    // Maks 10 langkah awal untuk tampilan ringkas
    const stepsHtml = steps.slice(0, 10).map(s => `
      <div class="jk-step">
        <span class="jk-step-num">${s.langkah}</span>
        <div class="jk-step-body">
          <span class="jk-step-instr">${this.esc(s.instruksi)}</span>
          <span class="jk-step-dist">${this.esc(s.jarak)}</span>
        </div>
      </div>
    `).join('');

    const moreSteps = steps.length > 10
      ? `<p class="jk-more-steps">...dan ${steps.length - 10} langkah lagi</p>`
      : '';

    this.resultEl.innerHTML = `
      <div class="jk-summary-box">
        <div class="jk-summary-detail">${this.esc(msg.detail)}</div>
        <div class="jk-summary-row">
          <div class="jk-loc-box">
            <span class="jk-loc-label">📍 Asal</span>
            <span class="jk-loc-name">${this.esc(asal?.alamat || asal?.nama)}</span>
          </div>
          <div class="jk-arrow">→</div>
          <div class="jk-loc-box">
            <span class="jk-loc-label">🏁 Tujuan</span>
            <span class="jk-loc-name">${this.esc(tujuan?.alamat || tujuan?.nama)}</span>
          </div>
        </div>
        ${bbm ? `
        <div class="jk-bbm-box">
          <span>⛽ Estimasi BBM:</span>
          <span>${this.esc(bbm.total_liter)} liter &nbsp;|&nbsp; <strong>${this.esc(bbm.total_biaya)}</strong></span>
        </div>` : ''}
        ${msg.rute ? `
        <a href="${this.esc(msg.rute)}" target="_blank" rel="noopener noreferrer" class="jk-map-link">
          🗺️ Buka di OpenStreetMap
        </a>` : ''}
      </div>

      ${steps.length ? `
      <div class="jk-steps-section">
        <div class="jk-steps-title">🧭 Petunjuk Arah</div>
        ${stepsHtml}
        ${moreSteps}
      </div>` : ''}
    `;
    this.resultEl.classList.remove('hidden');
  },

  async tryFetch(url, ms = 15000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  },

  async load() {
    const from = this.fromInput.value.trim();
    const to   = this.toInput.value.trim();

    if (!from) { this.showError('Masukkan kota asal.'); this.fromInput.focus(); return; }
    if (!to)   { this.showError('Masukkan kota tujuan.'); this.toInput.focus(); return; }

    this.clearError();
    this.resultEl.classList.add('hidden');
    this.setLoading(true);

    const base = `https://api.betabotz.eu.org/api/search/jarak?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&apikey=Boysz`;
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(base)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
      `https://thingproxy.freeboard.io/fetch/${base}`,
    ];

    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url, 25000);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json && json.message?.detail) {
          this.renderResult(json.message);
          this.setLoading(false);
          return;
        }
      } catch(e) { console.warn('[Jarak]', url.substring(0,50), e.message); }
    }

    this.showError('Gagal menghitung jarak. Periksa nama kota dan coba lagi.');
    this.setLoading(false);
  },

  init() {
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();this.openModal();} });
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if(e.target===this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape'&&this.modal.classList.contains('active')) this.closeModal(); });

    this.confirmBtn.addEventListener('click', () => this.load());
    [this.fromInput, this.toInput].forEach(inp => {
      inp.addEventListener('keydown', e => { if(e.key==='Enter') this.load(); });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Jarak.init());
