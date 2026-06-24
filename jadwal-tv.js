/* =========================================
   JADWAL TV — jadwal-tv.js
   API: https://api-nanzz.my.id/docs/api/informasi/jadwal-tv.php?channel=CHANNEL
   ========================================= */

const JadwalTV = {
  card:        document.getElementById('btn-tv'),
  modal:       document.getElementById('modal-tv'),
  closeBtn:    document.getElementById('modal-tv-close'),
  resultEl:    document.getElementById('tv-result'),
  manualInput: document.getElementById('tv-manual-input'),
  manualBtn:   document.getElementById('tv-manual-btn'),
  chButtons:   document.querySelectorAll('.tv-ch-btn'),
  currentCh:   'sctv',

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.load(this.currentCh);
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  setActiveBtn(ch) {
    this.chButtons.forEach(b => b.classList.toggle('active', b.dataset.ch === ch));
  },

  escHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  renderSchedule(channel, items) {
    if (!items?.length) {
      this.resultEl.innerHTML = '<p class="news-error">Tidak ada jadwal tersedia untuk channel ini.</p>';
      return;
    }
    this.resultEl.innerHTML = `
      <div class="tv-channel-title">📺 ${this.escHtml(channel.toUpperCase())}</div>
      <div class="tv-schedule-list">
        ${items.map(item => `
          <div class="tv-schedule-item">
            <span class="tv-jam">${this.escHtml(item.jam||'')}</span>
            <span class="tv-acara">${this.escHtml(item.acara||'')}</span>
          </div>
        `).join('')}
      </div>
    `;
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

  async load(channel) {
    this.currentCh = channel.trim().toLowerCase();
    this.setActiveBtn(this.currentCh);
    this.resultEl.innerHTML = '<div class="news-loading"><span class="spinner news-spinner"></span><span>Memuat jadwal...</span></div>';

    const base = `https://api-nanzz.my.id/docs/api/informasi/jadwal-tv.php?channel=${encodeURIComponent(this.currentCh)}`;
    const proxies = [
      base,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
    ];

    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json.status && Array.isArray(json.result)) {
          this.renderSchedule(json.channel || this.currentCh, json.result);
          return;
        }
      } catch(e) { console.warn('[JadwalTV]', e.message); }
    }

    this.resultEl.innerHTML = '<p class="news-error">⚠️ Gagal memuat jadwal. Coba channel lain atau coba lagi nanti.</p>';
  },

  init() {
    // Buka modal dari kartu
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();this.openModal();} });

    // Tutup modal
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if(e.target===this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape'&&this.modal.classList.contains('active')) this.closeModal(); });

    // Klik tombol channel
    this.chButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.manualInput.value = '';
        this.load(btn.dataset.ch);
      });
    });

    // Input manual
    this.manualBtn.addEventListener('click', () => {
      const ch = this.manualInput.value.trim();
      if (!ch) return;
      // Nonaktifkan semua tombol channel (tidak ada yang aktif saat manual)
      this.chButtons.forEach(b => b.classList.remove('active'));
      this.load(ch);
    });
    this.manualInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.manualBtn.click();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => JadwalTV.init());
