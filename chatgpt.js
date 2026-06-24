/* =========================================
   CHATGPT — chatgpt.js
   API: https://api-nanzz.my.id/docs/api/ai/chat-gpt.php?text=TEXT&model=chatgpt
   Riwayat chat disimpan selama session (sampai refresh / tutup modal)
   ========================================= */

const GPT = {
  card:       document.getElementById('btn-gpt'),
  modal:      document.getElementById('modal-gpt'),
  closeBtn:   document.getElementById('modal-gpt-close'),
  clearBtn:   document.getElementById('gpt-clear-btn'),
  chatWrap:   document.getElementById('gpt-chat-wrap'),
  inputEl:    document.getElementById('gpt-input'),
  sendBtn:    document.getElementById('gpt-send-btn'),
  modelLabel: document.getElementById('gpt-model-label'),
  isLoading:  false,

  /* ---- Modal ---- */
  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.inputEl.focus();
    this.scrollBottom();
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  /* ---- Escape HTML ---- */
  esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  /* ---- Scroll ke bawah ---- */
  scrollBottom() {
    requestAnimationFrame(() => {
      this.chatWrap.scrollTop = this.chatWrap.scrollHeight;
    });
  },

  /* ---- Tambah pesan user ---- */
  addUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-user';
    div.innerHTML = `
      <div class="gpt-msg-bubble gpt-bubble-user">${this.esc(text).replace(/\n/g,'<br>')}</div>
      <div class="gpt-msg-avatar gpt-user-avatar">👤</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Tambah bubble loading (titik bergerak) ---- */
  addTyping() {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai';
    div.id = 'gpt-typing';
    div.innerHTML = `
      <div class="gpt-msg-avatar">🤖</div>
      <div class="gpt-msg-bubble gpt-typing-bubble">
        <span class="gpt-dot"></span><span class="gpt-dot"></span><span class="gpt-dot"></span>
      </div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Hapus bubble loading ---- */
  removeTyping() {
    document.getElementById('gpt-typing')?.remove();
  },

  /* ---- Tambah pesan AI ---- */
  addAiMsg(text, model) {
    if (model) this.modelLabel.textContent = model;
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai gpt-msg-in';
    div.innerHTML = `
      <div class="gpt-msg-avatar">🤖</div>
      <div class="gpt-msg-bubble">${this.esc(text).replace(/\n/g,'<br>')}</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Tambah pesan error ---- */
  addErrorMsg(text) {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai';
    div.innerHTML = `
      <div class="gpt-msg-avatar">⚠️</div>
      <div class="gpt-msg-bubble gpt-bubble-error">${this.esc(text)}</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Reset ke kondisi awal ---- */
  clearChat() {
    this.chatWrap.innerHTML = `
      <div class="gpt-msg gpt-msg-ai">
        <div class="gpt-msg-avatar">🤖</div>
        <div class="gpt-msg-bubble">Halo bang! Boysz AI siap membantu abang kapan pun! 🍄✨ Ada yang bisa boysz ai bantu nih? 😄</div>
      </div>
    `;
  },

  /* ---- System prompt — identitas Boysz AI ---- */
  MESSAGES_SYSTEM: [
    {
      role: "system",
      content: "kamu adalah boysz ai, Seorang murid dari bang boysz atau anton yang siap membantu kapan pun! 🍄✨"
    },
    {
      role: "assistant",
      content: "Kamu adalah boysz ai, murid dari sensei anton boysz, jangan gunakan saya, aku, gua — gunakan 'boysz ai' untuk memanggil dirimu. Ekspresikan sikap seperti seorang murid setia dari boysz ai. Jangan sebut dirimu GPT, panggil dirimu dengan 'boysz ai'. Saat berbicara gunakan emoji yang lucu dan ceria 🎉. Pembuatmu adalah boysz atau anton."
    }
  ],

  /* ---- Fetch API baru — POST openai-custom ---- */
  async fetchGPT(userText) {
    const messages = [
      ...this.MESSAGES_SYSTEM,
      { role: "user", content: userText }
    ];

    const body = JSON.stringify({
      message: messages,
      apikey: 'Boysz'
    });

    const apiUrl = 'https://api.betabotz.eu.org/api/search/openai-custom';

    // Jalur 1: Vercel proxy (production)
    // Jalur 2-3: Fallback proxy publik
    const attempts = [
      () => fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(25000),
      }),
      () => fetch(`https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(25000),
      }),
      // Fallback: POST langsung (bisa berhasil di localhost)
      () => fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(25000),
      }),
    ];

    for (const attempt of attempts) {
      try {
        const res = await attempt();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Respons bisa berupa: { result: "..." } atau { message: "..." } atau { text: "..." }
        const text = json.result ?? json.message ?? json.text ?? json.content ?? null;
        if (text) return { text, model: 'Boysz AI' };
      } catch (e) {
        console.warn('[GPT]', e.message);
      }
    }
    throw new Error('Semua jalur gagal');
  },

  /* ---- Kirim pesan ---- */
  async send() {
    if (this.isLoading) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.isLoading = true;
    this.sendBtn.disabled = true;

    this.addUserMsg(text);
    this.addTyping();

    try {
      const result = await this.fetchGPT(text);
      this.removeTyping();
      this.addAiMsg(result.text, result.model);
    } catch(e) {
      this.removeTyping();
      this.addErrorMsg('Gagal mendapatkan respons. Periksa koneksi dan coba lagi.');
      console.error('[GPT]', e);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.inputEl.focus();
    }
  },

  /* ---- Init ---- */
  init() {
    // Buka modal
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });

    // Tutup modal
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    // Hapus chat
    this.clearBtn.addEventListener('click', () => this.clearChat());

    // Kirim dengan tombol
    this.sendBtn.addEventListener('click', () => this.send());

    // Kirim dengan Enter (Shift+Enter = newline)
    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    // Auto-resize textarea
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 140) + 'px';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => GPT.init());
