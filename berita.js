/* =========================================
   BERITA TERKINI — berita.js
   Modal fitur (bukan notif auto)
   API: https://api-nanzz.my.id/docs/api/informasi/berita.php?source=kompas
   ========================================= */

const Berita = {
  card:     document.getElementById('btn-news'),
  modal:    document.getElementById('modal-news'),
  closeBtn: document.getElementById('modal-news-close'),
  listEl:   document.getElementById('nws-list'),
  loaded:   false,

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (!this.loaded) this.load();
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  escHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  renderItems(items) {
    if (!items?.length) {
      this.listEl.innerHTML = '<p class="news-error">Tidak ada berita tersedia.</p>';
      return;
    }
    this.listEl.innerHTML = items.slice(0, 12).map(item => `
      <a class="news-item" href="${this.escHtml(item.link)}" target="_blank" rel="noopener noreferrer">
        <img class="news-item-img" src="${this.escHtml(item.image||'')}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <div class="news-item-text">
          <div class="news-item-title">${this.escHtml(item.title)}</div>
          <div class="news-item-meta">
            <span class="news-item-cat">${this.escHtml(item.category||'Berita')}</span>
            <span class="news-item-date">${this.escHtml(item.date||'')}</span>
          </div>
        </div>
      </a>
    `).join('');
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

  async load() {
    this.listEl.innerHTML = '<div class="news-loading"><span class="spinner news-spinner"></span><span>Memuat berita...</span></div>';
    const base = 'https://api-nanzz.my.id/docs/api/informasi/berita.php?source=kompas';
    const proxies = [
      base,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
    ];
    for (const url of proxies) {
      try {
        let json = await this.tryFetch(url);
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json.status && json.result?.data) {
          this.renderItems(json.result.data);
          this.loaded = true;
          return;
        }
      } catch(e) { console.warn('[Berita]', e.message); }
    }
    this.listEl.innerHTML = '<p class="news-error">⚠️ Gagal memuat berita. Coba lagi nanti.</p>';
  },

  init() {
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){e.preventDefault();this.openModal();} });
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if (e.target===this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key==='Escape' && this.modal.classList.contains('active')) this.closeModal(); });
  }
};

document.addEventListener('DOMContentLoaded', () => Berita.init());
