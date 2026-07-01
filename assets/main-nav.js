(() => {
  const nav = document.querySelector('[data-main-nav]');

  if (!nav) return;

  const updateShadow = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  updateShadow();
  window.addEventListener('scroll', updateShadow, { passive: true });

  const openButton = nav.querySelector('[data-search-open]');
  const closeButton = nav.querySelector('[data-search-close]');
  const overlay = nav.querySelector('[data-search-overlay]');
  const input = nav.querySelector('[data-search-input]');

  if (!openButton || !closeButton || !overlay) return;

  const setSearchState = (isOpen) => {
    overlay.classList.toggle('is-open', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    openButton.setAttribute('aria-expanded', String(isOpen));

    if (isOpen && input) {
      window.setTimeout(() => input.focus(), 80);
    }
  };

  openButton.addEventListener('click', () => setSearchState(true));
  closeButton.addEventListener('click', () => setSearchState(false));

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) setSearchState(false);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setSearchState(false);
  });
})();
