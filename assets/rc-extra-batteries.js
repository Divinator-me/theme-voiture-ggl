(() => {
  window.RCLAB = window.RCLAB || {};

  const extraBatteryItem = () => {
    const root = document.querySelector('.product-information .rc-extra-batteries');
    if (!root) return null;

    const checked = root.querySelector('input[name="rc-extra-batteries"]:checked');
    const qty = Number(checked?.value || root.getAttribute('data-qty')) || 0;
    const variantId = root.getAttribute('data-variant-id') || checked?.getAttribute('data-variant-id');
    if (qty < 1 || !variantId) return null;

    return { variantId: String(variantId), quantity: qty };
  };

  let flushing = false;

  const snapshotExtraBatteries = () => {
    window.RCLAB.pendingExtraBatteries = extraBatteryItem();
    return window.RCLAB.pendingExtraBatteries;
  };

  const flushExtraBatteries = () => {
    if (window.RCLAB.extraBatteriesBundled) return Promise.resolve(null);

    const extra = window.RCLAB.pendingExtraBatteries || extraBatteryItem();
    if (!extra || flushing) return Promise.resolve(null);

    flushing = true;

    return fetch('/cart.js', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((cart) => {
        const existing = (cart.items || []).find((item) => String(item.variant_id) === extra.variantId);
        const needed = extra.quantity - (existing?.quantity || 0);
        if (needed < 1) return cart;

        return fetch('/cart/add.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            items: [{ id: Number(extra.variantId), quantity: needed }],
          }),
        }).then((response) => response.json());
      })
      .then((result) => {
        if (result?.status) return result;
        if (typeof window.upcartRefreshCart === 'function' && !window.RCLAB.cartOpenBlocked) {
          window.upcartRefreshCart();
        }
        return result;
      })
      .catch(() => null)
      .finally(() => {
        flushing = false;
        window.RCLAB.pendingExtraBatteries = null;
      });
  };

  window.RCLAB.getExtraBatteryItem = extraBatteryItem;
  window.RCLAB.snapshotExtraBatteries = snapshotExtraBatteries;
  window.RCLAB.flushExtraBatteries = flushExtraBatteries;

  const ADD_TRIGGER =
    'product-form-component .add-to-cart-button, product-form-component button[type="submit"]';

  document.addEventListener(
    'change',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== 'rc-extra-batteries') return;
      const root = target.closest('.rc-extra-batteries');
      if (root) root.setAttribute('data-qty', target.value);
      snapshotExtraBatteries();
    },
    true
  );

  window.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(ADD_TRIGGER)) return;
      snapshotExtraBatteries();
    },
    true
  );

  document.addEventListener('shopify:cart:lines-update', (event) => {
    if (window.RCLAB.extraBatteriesBundled) return;
    if (!window.RCLAB.pendingExtraBatteries) return;

    const promise = event.promise || event.detail?.promise;
    const run = () => flushExtraBatteries();

    if (promise && typeof promise.then === 'function') {
      promise.then(run).catch(run);
      return;
    }

    window.setTimeout(run, 450);
  });
})();
