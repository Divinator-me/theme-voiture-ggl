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
  const menuPanel = nav.querySelector('.rc-menu-overlay__panel');

  let lockedScrollY = 0;

  const getMenuTop = () => {
    const headerSelectors = ['.announcement-marquee', '.rc-promo-bar', '[data-main-nav]'];
    let bottom = 0;

    headerSelectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0) {
        bottom = Math.max(bottom, rect.bottom);
      }
    });

    return Math.max(bottom, nav.getBoundingClientRect().bottom);
  };

  const updateMenuTop = () => {
    if (!menuOverlay) return;
    menuOverlay.style.setProperty('--rc-menu-top', `${getMenuTop()}px`);
  };

  const lockPageScroll = () => {
    lockedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  };

  const unlockPageScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, lockedScrollY);
  };

  const setOverlayState = (overlay, trigger, isOpen) => {
    if (!overlay || !trigger) return;

    overlay.classList.toggle('is-open', isOpen);
    overlay.setAttribute('aria-hidden', String(!isOpen));
    trigger.setAttribute('aria-expanded', String(isOpen));
  };

  const setMenuState = (isOpen) => {
    if (!menuOverlay || !menuOpen) return;

    if (isOpen) {
      updateMenuTop();
      lockPageScroll();
    } else if (!searchOverlay?.classList.contains('is-open')) {
      unlockPageScroll();
    }

    setOverlayState(menuOverlay, menuOpen, isOpen);
  };

  const updateSearchTop = () => {
    if (!searchOverlay) return;
    searchOverlay.style.setProperty('--rc-search-top', `${nav.getBoundingClientRect().bottom}px`);
  };

  const closeAll = () => {
    setOverlayState(searchOverlay, searchOpen, false);
    setMenuState(false);
    unlockPageScroll();
  };

  if (searchOpen && searchClose && searchOverlay) {
    searchOpen.addEventListener('click', () => {
      setMenuState(false);
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
      setMenuState(true);
    });

    menuClose.addEventListener('click', closeAll);
    menuOverlay.addEventListener('click', (event) => {
      if (event.target === menuOverlay) closeAll();
    });

    menuPanel?.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    window.addEventListener('resize', () => {
      if (menuOverlay.classList.contains('is-open')) updateMenuTop();
    });

    menuOverlay.querySelectorAll('.rc-menu-overlay__link[href], .rc-menu-overlay__sub a, .rc-menu-overlay__footer a').forEach((link) => {
      link.addEventListener('click', closeAll);
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
