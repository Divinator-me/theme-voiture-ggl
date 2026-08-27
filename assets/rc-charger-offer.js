(() => {
  class RcChargerOffer extends HTMLElement {
    #bypass = false;
    #closeTimer = 0;
    #guardTimeout = 0;
    #lastFocus = null;

    connectedCallback() {
      this.querySelectorAll('[data-rc-charger-dismiss]').forEach((node) => {
        node.addEventListener('click', () => this.dismiss());
      });

      this.querySelector('[data-rc-charger-accept]')?.addEventListener('click', () => this.accept());
    }

    interceptAdd(cart) {
      if (this.#bypass || this.getAttribute('data-bypass') === 'true') return false;
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

    arm() {
      if (this.#bypass || this.getAttribute('data-bypass') === 'true') return false;
      window.RCLAB = window.RCLAB || {};
      window.RCLAB.cartOpenBlocked = true;
      this.open();
      return true;
    }

    open() {
      this.#lastFocus = document.activeElement;
      this.hidden = false;
      this.classList.add('is-open');
      this.removeAttribute('hidden');
      document.documentElement.classList.add('has-rc-charger-offer');
      document.body.classList.add('has-rc-charger-offer');
      window.RCLAB = window.RCLAB || {};
      window.RCLAB.cartOpenBlocked = true;
      this.#closeUpcart();
      this.#armUpcartGuard();
      this.querySelector('[data-rc-charger-accept]')?.focus();
    }

    dismiss() {
      this.#close();
      const finish = () => {
        this.#release();
        window.RCLAB?.openCart?.();
      };
      const ready = window.RCLAB?.bundleReady;
      if (!ready) {
        finish();
        return;
      }
      Promise.race([
        ready.catch(() => {}),
        new Promise((resolve) => window.setTimeout(resolve, 12000)),
      ]).then(finish);
    }

    accept() {
      const variantId = Number(this.dataset.variantId);
      if (!variantId) {
        this.dismiss();
        return;
      }

      this.#bypass = true;
      this.setAttribute('data-bypass', 'true');
      this.#close();

      const addCharger = () => {
        const formData = new FormData();
        formData.append('id', String(variantId));
        formData.append('quantity', '1');

        return fetch('/cart/add.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          body: formData,
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || data?.status) {
              return fetch('/cart/add.js', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({
                  items: [{ id: variantId, quantity: 1 }],
                }),
              }).then((response) => response.json());
            }
            return data;
          });
      };

      const waitForBundle = () => {
        const ready = window.RCLAB?.bundleReady;
        if (!ready) return Promise.resolve();
        return Promise.race([
          ready.catch(() => {}),
          new Promise((resolve) => window.setTimeout(resolve, 12000)),
        ]);
      };

      waitForBundle()
        .then(() => addCharger())
        .catch(() => {})
        .finally(() => {
          window.RCLAB = window.RCLAB || {};
          window.RCLAB.cartOpenBlocked = false;
          this.#clearUpcartGuard();
          if (typeof window.upcartRefreshCart === 'function') {
            window.upcartRefreshCart();
          }
          window.RCLAB.openCart?.();
        });
    }

    #release() {
      this.#bypass = true;
      this.setAttribute('data-bypass', 'true');
      window.RCLAB = window.RCLAB || {};
      window.RCLAB.cartOpenBlocked = false;
      this.#clearUpcartGuard();
    }

    #close() {
      this.classList.remove('is-open');
      this.hidden = true;
      this.setAttribute('hidden', '');
      document.documentElement.classList.remove('has-rc-charger-offer');
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
      this.#closeTimer = window.setInterval(() => this.#closeUpcart(), 80);
      this.#guardTimeout = window.setTimeout(() => this.#clearUpcartGuard(), 4000);
    }

    #clearUpcartGuard() {
      if (this.#closeTimer) {
        window.clearInterval(this.#closeTimer);
        this.#closeTimer = 0;
      }
      if (this.#guardTimeout) {
        window.clearTimeout(this.#guardTimeout);
        this.#guardTimeout = 0;
      }
    }
  }

  if (!customElements.get('rc-charger-offer')) {
    customElements.define('rc-charger-offer', RcChargerOffer);
  }

  const ADD_TRIGGER =
    'product-form-component .add-to-cart-button, product-form-component button[type="submit"]';

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(ADD_TRIGGER)) return;

      const offer = document.querySelector('rc-charger-offer');
      if (!offer || typeof offer.arm !== 'function') return;
      offer.arm();
    },
    true
  );

  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (!(form instanceof Element)) return;
      if (!form.closest('product-form-component')) return;

      const offer = document.querySelector('rc-charger-offer');
      if (!offer || typeof offer.arm !== 'function') return;
      offer.arm();
    },
    true
  );
})();
