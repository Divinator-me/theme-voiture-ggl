(() => {
  const nav = document.querySelector('[data-main-nav]');

  if (!nav) return;

  const searchOpen = nav.querySelector('[data-search-open]');
  const searchClose = nav.querySelector('[data-search-close]');
  const searchOverlay = nav.querySelector('[data-search-overlay]');
  const searchInput = nav.querySelector('[data-search-input]');
  const menuOpen = nav.querySelector('[data-menu-open]');
  const menuClose = nav.querySelector('[data-menu-close]');
  const menuOverlay = nav.querySelector('[data-menu-overlay]');

  const setOverlayState = (overlay, trigger, isOpen) => {
    if (!overlay || !trigger) return;

    overlay.classList.toggle('is-open', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    trigger.setAttribute('aria-expanded', String(isOpen));
  };

  const updateSearchTop = () => {
    if (!searchOverlay) return;
    searchOverlay.style.setProperty('--rc-search-top', `${nav.getBoundingClientRect().bottom}px`);
  };

  const closeAll = () => {
    setOverlayState(searchOverlay, searchOpen, false);
    setOverlayState(menuOverlay, menuOpen, false);
  };

  if (searchOpen && searchClose && searchOverlay) {
    searchOpen.addEventListener('click', () => {
      setOverlayState(menuOverlay, menuOpen, false);
      updateSearchTop();
      setOverlayState(searchOverlay, searchOpen, true);
      if (searchInput) window.setTimeout(() => searchInput.focus(), 80);
    });

    searchClose.addEventListener('click', closeAll);
    searchOverlay.addEventListener('click', (event) => {
      if (event.target === searchOverlay) closeAll();
    });

    window.addEventListener('resize', updateSearchTop, { passive: true });
    window.addEventListener(
      'scroll',
      () => {
        if (searchOverlay.classList.contains('is-open')) updateSearchTop();
      },
      { passive: true }
    );
  }

  if (menuOpen && menuClose && menuOverlay) {
    menuOpen.addEventListener('click', () => {
      setOverlayState(searchOverlay, searchOpen, false);
      setOverlayState(menuOverlay, menuOpen, true);
    });

    menuClose.addEventListener('click', closeAll);
    menuOverlay.addEventListener('click', (event) => {
      if (event.target === menuOverlay) closeAll();
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
