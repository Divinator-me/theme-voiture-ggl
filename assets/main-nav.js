(() => {
  let nav = null;
  let menuOverlay = null;
  let menuPanel = null;
  let searchOverlay = null;
  let searchOpen = null;
  let searchClose = null;
  let searchInput = null;
  let lockedScrollY = 0;
  let bound = false;

  const getMenuTop = () => {
    const headerSelectors = ['.announcement-marquee', '.rc-promo-bar', '[data-main-nav]', '.rc-category-nav'];
    let bottom = 0;

    headerSelectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0) {
        bottom = Math.max(bottom, rect.bottom);
      }
    });

    if (nav) {
      bottom = Math.max(bottom, nav.getBoundingClientRect().bottom);
    }

    return bottom;
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
    if (!menuOverlay) return;

    const triggers = document.querySelectorAll('[data-menu-open]');

    if (isOpen) {
      updateMenuTop();
      lockPageScroll();
    } else if (!searchOverlay?.classList.contains('is-open')) {
      unlockPageScroll();
    }

    menuOverlay.classList.toggle('is-open', isOpen);
    menuOverlay.setAttribute('aria-hidden', String(!isOpen));
    triggers.forEach((trigger) => {
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  };

  const updateSearchTop = () => {
    if (!searchOverlay || !nav) return;
    searchOverlay.style.setProperty('--rc-search-top', `${nav.getBoundingClientRect().bottom}px`);
  };

  const closeAll = () => {
    if (searchOverlay && searchOpen) {
      setOverlayState(searchOverlay, searchOpen, false);
    }
    setMenuState(false);
    unlockPageScroll();
  };

  const openMenu = () => {
    if (searchOverlay && searchOpen) {
      setOverlayState(searchOverlay, searchOpen, false);
    }
    setMenuState(true);
  };

  const mountOverlay = (overlay) => {
    if (!overlay || overlay.parentElement === document.body) return;
    document.body.appendChild(overlay);
  };

  const bindMenuLinks = () => {
    if (!menuOverlay) return;

    menuOverlay.querySelectorAll('.rc-menu-overlay__link[href], .rc-menu-overlay__sub a, .rc-menu-overlay__footer a').forEach((link) => {
      if (link.dataset.menuBound === 'true') return;
      link.dataset.menuBound = 'true';
      link.addEventListener('click', closeAll);
    });
  };

  const init = () => {
    nav = document.querySelector('[data-main-nav]');
    if (!nav) return;

    menuOverlay = nav.querySelector('[data-menu-overlay]');
    menuPanel = nav.querySelector('.rc-menu-overlay__panel');
    searchOverlay = nav.querySelector('[data-search-overlay]');
    searchOpen = nav.querySelector('[data-search-open]');
    searchClose = nav.querySelector('[data-search-close]');
    searchInput = nav.querySelector('[data-search-input]');

    mountOverlay(menuOverlay);
    mountOverlay(searchOverlay);
    bindMenuLinks();

    if (bound) return;
    bound = true;

    document.addEventListener('click', (event) => {
      const openTrigger = event.target.closest('[data-menu-open]');
      if (openTrigger) {
        event.preventDefault();
        openMenu();
        return;
      }

      const closeTrigger = event.target.closest('[data-menu-close]');
      if (closeTrigger) {
        event.preventDefault();
        closeAll();
      }
    });

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

    menuOverlay?.addEventListener('click', (event) => {
      if (event.target === menuOverlay) closeAll();
    });

    menuPanel?.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    window.addEventListener('resize', () => {
      if (menuOverlay?.classList.contains('is-open')) updateMenuTop();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAll();
    });
  };

  init();
  document.addEventListener('shopify:section:load', init);
})();
