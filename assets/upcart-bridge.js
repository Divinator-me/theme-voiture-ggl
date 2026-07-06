(() => {
  const CART_OPEN_SELECTOR = '[data-rc-cart-open]';
  const CART_COUNT_SELECTOR = '[data-rc-cart-count]';
  const CART_LINES_UPDATE = 'shopify:cart:lines-update';
  const CART_ADD_PATTERN = /\/cart\/add(\.js)?/;

  const getItemCount = (cart) => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const updateCartCount = (count) => {
    document.querySelectorAll(CART_COUNT_SELECTOR).forEach((node) => {
      node.textContent = String(count);
    });
  };

  const syncCartCount = async () => {
    try {
      const response = await fetch('/cart.js', { credentials: 'same-origin' });
      if (!response.ok) return;
      const cart = await response.json();
      updateCartCount(getItemCount(cart));
    } catch (_) {
      /* ignore */
    }
  };

  const whenUpcartReady = (callback, attempts = 80) => {
    if (typeof window.upcartOpenCart === 'function') {
      callback();
      return;
    }

    if (attempts <= 0) return;
    window.setTimeout(() => whenUpcartReady(callback, attempts - 1), 150);
  };

  const notifyUpcartAfterAdd = () => {
    syncCartCount();

    whenUpcartReady(() => {
      if (typeof window.upcartRegisterAddToCart === 'function') {
        window.upcartRegisterAddToCart();
        return;
      }

      if (typeof window.upcartRefreshCart === 'function') {
        window.upcartRefreshCart();
      }

      window.upcartOpenCart();
    });
  };

  const openUpcart = () => {
    whenUpcartReady(() => {
      if (typeof window.upcartRefreshCart === 'function') {
        window.upcartRefreshCart();
      }
      window.upcartOpenCart();
    });
  };

  window.RCLAB = window.RCLAB || {};
  window.RCLAB.openCart = openUpcart;

  const patchFetchForCartAdd = () => {
    if (window.RCLAB.__upcartFetchPatched) return;
    window.RCLAB.__upcartFetchPatched = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      const request = args[0];
      const url = String(typeof request === 'string' ? request : request?.url || '');

      if (CART_ADD_PATTERN.test(url)) {
        response
          .clone()
          .json()
          .then((data) => {
            if (data && !data.status) notifyUpcartAfterAdd();
          })
          .catch(() => {});
      }

      return response;
    };
  };

  const onCartLinesUpdate = (event) => {
    if (event.action !== 'add') return;

    const promise = event.promise;
    if (!promise) {
      notifyUpcartAfterAdd();
      return;
    }

    promise
      .then((result) => {
        if (result?.detail?.didError) return;
        notifyUpcartAfterAdd();
      })
      .catch(() => {});
  };

  patchFetchForCartAdd();
  document.addEventListener(CART_LINES_UPDATE, onCartLinesUpdate, true);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(CART_OPEN_SELECTOR);
    if (!trigger) return;

    event.preventDefault();
    openUpcart();
  });

  whenUpcartReady(() => {
    if (typeof window.upcartSubscribeCartUpdated === 'function') {
      window.upcartSubscribeCartUpdated((event) => {
        updateCartCount(getItemCount(event.cart));
      });
    }

    if (typeof window.upcartSubscribeCartLoaded === 'function') {
      window.upcartSubscribeCartLoaded((event) => {
        updateCartCount(getItemCount(event.cart));
      });
    }
  });
})();
