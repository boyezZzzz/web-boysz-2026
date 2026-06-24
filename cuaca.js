/* =========================================
   CEK CUACA — cuaca.js
   API: https://api.betabotz.eu.org/api/tools/cuaca?query=KOTA&apikey=Boysz
   ========================================= */

const Cuaca = {
  card:      document.getElementById('btn-wx'),
  modal:     document.getElementById('modal-wx'),
  closeBtn:  document.getElementById('modal-wx-close'),
  form:      document.getElementById('wx-form'),
  input:     document.getElementById('wx-city-input'),
  searchBtn: document.getElementById('wx-search-btn'),
  btnText:   document.getElementById('wx-btn-text'),
  spinner:   document.getElementById('wx-spinner'),
  errorEl:   document.getElementById('wx-error'),
  resultEl:  document.getElementById('wx-result'),
  cityBtns:  document.querySelectorAll('.wx-city-btn'),

  /* Ikon cuaca berdasarkan deskripsi */
  weatherIcon(desc) {
    const d = (desc || '').toLowerCase();
    if (d.includes('thunder'))                    return '⛈️';
    if (d.includes('drizzle'))                    return '🌦️';
    if (d.includes('rain') || d.includes('hujan'))return '🌧️';
    if (d.includes('snow') || d.includes('salju'))return '❄️';
    if (d.includes('fog')  || d.includes('mist')) return '🌫️';
    if (d.includes('cloud')|| d.includes('awan')) return '☁️';
    if (d.includes('clear')|| d.includes('cerah'))return '☀️';
    if (d.includes('wind') || d.includes('angin'))return '💨';
    return '🌡️';
  },

  esc(s) {
    if (typeof s !== 'string') return s ?? '—';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  setLoading(on) {
    this.searchBtn.disabled = on;
    this.btnText.textContent = on ? '' : '🔍';
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
    this.input.focus();
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderResult(r) {
    const icon = this.weatherIcon(r.weather);
    this.resultEl.innerHTML = `
      <div class="wx-card">
        <div class="wx-main">
          <div class="wx-icon-big">${icon}</div>
          <div class="wx-temp-big">${this.esc(r.currentTemp)}</div>
        </div>
        <div class="wx-location">📍 ${this.esc(r.location)}${r.country ? `, ${this.esc(r.country)}` : ''}</div>
        <div class="wx-desc">${this.esc(r.weather)}</div>
        <div class="wx-stats-grid">
          <div class="wx-stat"><span class="wx-stat-label">Maks</span><span class="wx-stat-val">${this.esc(r.maxTemp)}</span></div>
          <div class="wx-stat"><span class="wx-stat-label">Min</span><span class="wx-stat-val">${this.esc(r.minTemp)}</span></div>
          <div class="wx-stat"><span class="wx-stat-label">Kelembaban</span><span class="wx-stat-val">${this.esc(r.humidity)}</span></div>
          <div class="wx-stat"><span class="wx-stat-label">Angin</span><span class="wx-stat-val">${this.esc(r.windSpeed)}</span></div>
        </div>
      </div>
    `;
    this.resultEl.classList.remove('hidden');
  },

  async tryFetch(url, ms = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  },

  async load(city) {
    if (!city.trim()) { this.showError('Masukkan nama kota terlebih dahulu.'); return; }
    this.clearError();
    this.resultEl.classList.add('hidden');
    this.setLoading(true);

    const base = `https://api.betabotz.eu.org/api/tools/cuaca?query=${encodeURIComponent(city)}&apikey=Boysz`;

    // Jalur 1: Proxy Vercel sendiri (paling reliable di production)
    // Jalur 2-4: Proxy publik sebagai fallback
    const proxies = [
      `/api/proxy?url=${encodeURIComponent(base)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
      `https://thingproxy.freeboard.io/fetch/${base}`,
    ];

    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url, 20000);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json && json.status && json.result) {
          this.renderResult(json.result);
          this.setLoading(false);
          return;
        }
      } catch(e) { console.warn('[Cuaca]', url.substring(0,50), e.message); }
    }

    this.showError('Gagal memuat data cuaca. Coba lagi beberapa saat.');
    this.setLoading(false);
  },

  init() {
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();this.openModal();} });
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if(e.target===this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape'&&this.modal.classList.contains('active')) this.closeModal(); });

    this.searchBtn.addEventListener('click', () => this.load(this.input.value));
    this.input.addEventListener('keydown', e => { if(e.key==='Enter') this.load(this.input.value); });

    this.cityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.input.value = btn.dataset.city;
        this.load(btn.dataset.city);
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Cuaca.init());
