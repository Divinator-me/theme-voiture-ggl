(() => {
  window.RCLAB = window.RCLAB || {};

  const EXTRA_ROOT = () => document.querySelector('.rc-extra-batteries');
  const EXTRA_SELECT = () => EXTRA_ROOT()?.querySelector('select[name="rc-extra-batteries"]');

  let selectedQty = 0;
  let variantId = '';

  const readFromDom = () => {
    const root = EXTRA_ROOT();
    const select = EXTRA_SELECT();
    if (!root) return { quantity: 0, variantId: '' };

    const qty = Number(select?.value || root.getAttribute('data-qty') || 0) || 0;
    const id =
      root.getAttribute('data-variant-id') ||
      select?.getAttribute('data-variant-id') ||
      '';
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
    const qty = fromDom.quantity || selectedQty;
    const id = fromDom.variantId || variantId;
    if (qty < 1 || !id) return null;
    return { variantId: String(id), quantity: qty };
  };

  window.RCLAB.getExtraBatteryItem = extraBatteryItem;
  window.RCLAB.snapshotExtraBatteries = extraBatteryItem;

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

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
      if (!(target instanceof HTMLSelectElement) || target.name !== 'rc-extra-batteries') return;
      rememberSelection(Number(target.value) || 0, target.getAttribute('data-variant-id'));
    },
    true
  );

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
