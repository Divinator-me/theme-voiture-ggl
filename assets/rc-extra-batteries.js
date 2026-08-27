(() => {
  window.RCLAB = window.RCLAB || {};

  const CART_ADD_PATTERN = /\/cart\/add(\.js)?(\?|$)/;
  const EXTRA_ROOT = () => document.querySelector('.rc-extra-batteries');

  let selectedQty = 0;
  let variantId = '';
  let addingExtras = false;

  const readFromDom = () => {
    const root = EXTRA_ROOT();
    if (!root) return { quantity: 0, variantId: '' };

    const checked = root.querySelector('input[name="rc-extra-batteries"]:checked');
    const qty = Number(checked?.value || root.getAttribute('data-qty') || 0) || 0;
    const id = root.getAttribute('data-variant-id') || checked?.getAttribute('data-variant-id') || '';
    return { quantity: qty, variantId: String(id) };
  };

  const rememberSelection = (qty, id) => {
    if (Number.isFinite(qty)) selectedQty = qty;
    if (id) variantId = String(id);
    const root = EXTRA_ROOT();
    if (root) root.setAttribute('data-qty', String(selectedQty));
  };

  const extraBatteryItem = () => {
    const fromDom = readFromDom();
    const qty = selectedQty || fromDom.quantity;
    const id = variantId || fromDom.variantId;
    if (qty < 1 || !id) return null;
    return { variantId: String(id), quantity: qty };
  };

  const addExtraBatteries = async () => {
    const extra = extraBatteryItem();
    if (!extra || addingExtras) return null;

    addingExtras = true;

    try {
      const cart = await fetch('/cart.js', { credentials: 'same-origin' }).then((response) => response.json());
      const existing = (cart.items || []).find((item) => String(item.variant_id) === extra.variantId);
      const needed = extra.quantity - (existing?.quantity || 0);
      if (needed < 1) return cart;

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
        body: (() => {
          const body = new FormData();
          body.append('id', extra.variantId);
          body.append('quantity', String(needed));
          return body;
        })(),
      });

      const data = await response.json();
      if (typeof window.upcartRefreshCart === 'function' && !window.RCLAB.cartOpenBlocked) {
        window.upcartRefreshCart();
      }
      return data;
    } catch (error) {
      return null;
    } finally {
      addingExtras = false;
    }
  };

  window.RCLAB.getExtraBatteryItem = extraBatteryItem;
  window.RCLAB.snapshotExtraBatteries = () => extraBatteryItem();
  window.RCLAB.flushExtraBatteries = addExtraBatteries;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const extraLabel = target.closest('.rc-extra-batteries .variant-option__button-label');
      if (extraLabel) {
        const input = extraLabel.querySelector('input[name="rc-extra-batteries"]');
        if (input) {
          rememberSelection(Number(input.value) || 0, input.getAttribute('data-variant-id'));
        }
        return;
      }

      if (
        target.closest(
          'product-form-component .add-to-cart-button, product-form-component button[type="submit"]'
        )
      ) {
        const fromDom = readFromDom();
        rememberSelection(fromDom.quantity, fromDom.variantId);
      }
    },
    true
  );

  document.addEventListener(
    'change',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== 'rc-extra-batteries') return;
      rememberSelection(Number(target.value) || 0, target.getAttribute('data-variant-id'));
    },
    true
  );

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    if (addingExtras) return nativeFetch(...args);

    const response = await nativeFetch(...args);
    const request = args[0];
    const url = String(typeof request === 'string' ? request : request?.url || '');

    if (!CART_ADD_PATTERN.test(url) || extraBatteryItem() == null) return response;

    const payload = await response
      .clone()
      .json()
      .catch(() => null);

    if (!payload || payload.status) return response;

    await addExtraBatteries();
    return response;
  };

  const syncFromDom = () => {
    const fromDom = readFromDom();
    rememberSelection(fromDom.quantity, fromDom.variantId);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncFromDom, { once: true });
  } else {
    syncFromDom();
  }
})();
