/**
 * Horizon overrides for Shopify.actions:
 * - updateCart: emit events from the cart drawer scope.
 * - openCart: open Upcart when installed, otherwise Horizon drawer or /cart.
 */

const openStoreCart = async () => {
  if (typeof window.RCLAB?.openCart === 'function') {
    window.RCLAB.openCart();
    return;
  }

  if (typeof window.upcartOpenCart === 'function') {
    if (typeof window.upcartRefreshCart === 'function') {
      window.upcartRefreshCart();
    }
    window.upcartOpenCart();
    return;
  }

  /** @type {HTMLElement & { open?: () => void } | null} */
  const drawer = document.querySelector('theme-drawer#cart-drawer');

  if (drawer?.open) {
    drawer.open();
    return;
  }

  window.location.href = Theme.routes.cart_url || '/cart';
};

function init() {
  const actions = window.Shopify?.actions;
  if (!actions) return;

  actions.updateCart.configure({
    eventTarget: () => document.querySelector('theme-drawer#cart-drawer') ?? document,
  });

  actions.openCart.configure({
    handler: openStoreCart,
  });
}

// Run immediately if the standard-actions bundle has already attached
// `Shopify.actions`; otherwise wait for DOMContentLoaded, which fires after
// all module scripts have executed regardless of document order.
if (window.Shopify?.actions) {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init, { once: true });
}
