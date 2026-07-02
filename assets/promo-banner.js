(() => {
  const banner = document.querySelector('[data-promo-banner]');
  const pattern = document.querySelector('[data-promo-pattern]');

  if (!banner || !pattern) return;

  let ticking = false;

  const update = () => {
    const rect = banner.getBoundingClientRect();
    const offset = rect.top * -0.08;
    pattern.style.transform = `translate3d(0, ${offset}px, 0)`;
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
})();
