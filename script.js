// Smooth reveal on scroll for feature cards
const cards = document.querySelectorAll('.feature-card');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

cards.forEach((card) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(24px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(card);
});

// Navbar shadow on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

/* ===========================
   TYPEWRITER — nama berganti
   =========================== */
(function () {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;

  const names  = ['BOYSZ', 'ANTON', 'BOYSZ'];
  const TYPE_SPEED   = 100;  // ms per karakter saat ngetik
  const DELETE_SPEED = 60;   // ms per karakter saat hapus
  const PAUSE_AFTER  = 2000; // ms diam setelah selesai ngetik

  let nameIdx  = 0;
  let charIdx  = 0;
  let deleting = false;

  function tick() {
    const current = names[nameIdx];

    if (!deleting) {
      // Tambah karakter
      charIdx++;
      el.textContent = current.slice(0, charIdx);

      if (charIdx === current.length) {
        // Selesai ngetik → pause lalu mulai hapus
        deleting = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      // Hapus karakter
      charIdx--;
      el.textContent = current.slice(0, charIdx);

      if (charIdx === 0) {
        // Selesai hapus → pindah ke nama berikutnya
        deleting = false;
        nameIdx  = (nameIdx + 1) % names.length;
        setTimeout(tick, 400); // jeda singkat sebelum ngetik lagi
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  // Mulai setelah 1 detik
  setTimeout(tick, 1000);
})();
