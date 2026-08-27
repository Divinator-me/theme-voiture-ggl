(() => {
  class RcChargerOffer extends HTMLElement {
    #bypass = false;
    #closeTimer = 0;
    #lastFocus = null;

    connectedCallback() {
      this.querySelectorAll('[data-rc-charger-dismiss]').forEach((node) => {
        node.addEventListener('click', () => this.dismiss());
      });

      this.querySelector('[data-rc-charger-accept]')?.addEventListener('click', () => this.accept());
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.dismiss();
      });
    }

    interceptAdd(cart) {
      if (this.#bypass) return false;
      if (this.classList.contains('is-open')) return true;

      const variantId = this.dataset.variantId;
      const items = cart?.items;
      if (variantId && Array.isArray(items)) {
        const already = items.some((item) => String(item.variant_id || item.variantId) === variantId);
        if (already) return false;
      }

      this.open();
      return true;
    }

    open() {
      this.#lastFocus = document.activeElement;
      this.hidden = false;
      this.classList.add('is-open');
      this.removeAttribute('hidden');
      document.body.classList.add('has-rc-charger-offer');
      this.#closeUpcart();
      this.#armUpcartGuard();
      this.querySelector('[data-rc-charger-accept]')?.focus();
    }

    dismiss() {
      this.#bypass = true;
      this.#close();
      window.RCLAB?.openCart?.();
    }

    accept() {
      const variantId = Number(this.dataset.variantId);
      const addUrl = window.Theme?.routes?.cart_add_url || '/cart/add.js';
      if (!variantId) {
        this.dismiss();
        return;
      }

      this.#bypass = true;
      this.#close();

      fetch(addUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
        }),
      })
        .catch(() => {})
        .finally(() => {
          window.RCLAB?.openCart?.();
        });
    }

    #close() {
      this.classList.remove('is-open');
      this.hidden = true;
      this.setAttribute('hidden', '');
      document.body.classList.remove('has-rc-charger-offer');
      this.#clearUpcartGuard();
      if (this.#lastFocus && typeof this.#lastFocus.focus === 'function') {
        this.#lastFocus.focus();
      }
    }

    #closeUpcart() {
      if (typeof window.upcartCloseCart === 'function') {
        window.upcartCloseCart();
      }
    }

    #armUpcartGuard() {
      this.#clearUpcartGuard();
      this.#closeTimer = window.setInterval(() => this.#closeUpcart(), 180);
      window.setTimeout(() => this.#clearUpcartGuard(), 1800);
    }

    #clearUpcartGuard() {
      if (this.#closeTimer) {
        window.clearInterval(this.#closeTimer);
        this.#closeTimer = 0;
      }
    }
  }

  if (!customElements.get('rc-charger-offer')) {
    customElements.define('rc-charger-offer', RcChargerOffer);
  }
})();
