import { StandardEvents } from '@shopify/events';
import { QuantitySelectorUpdateEvent } from '@theme/events';

const STORAGE_PREFIX = 'rc-pack-qty:';

const packTotal = (unitCents, qty) => {
  if (qty === 2) return Math.round((unitCents * 1.75) / 50) * 50;
  if (qty === 3) return Math.round((unitCents * 2.7) / 100) * 100;
  return unitCents;
};

const formatMoney = (cents) =>
  `${(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

class RcPackPicker extends HTMLElement {
  #radios = [];
  #priceNodes = [];
  #unitCents = 0;
  #variantPrices = {};
  #variantObserver;

  connectedCallback() {
    this.#radios = Array.from(this.querySelectorAll('.rc-pack-picker__radio'));
    this.#priceNodes = Array.from(this.querySelectorAll('[data-rc-pack-price]'));
    this.#unitCents = Number(this.dataset.unitPrice) || 0;
    this.#variantPrices = this.#readVariantPrices();

    const stored = Number(sessionStorage.getItem(STORAGE_PREFIX + this.dataset.productId));
    if (stored === 2 || stored === 3) {
      const match = this.#radios.find((radio) => Number(radio.value) === stored);
      if (match) match.checked = true;
    }

    this.#radios.forEach((radio) => {
      radio.addEventListener('change', () => this.#apply(true));
    });

    this.#watchVariant();
    this.#apply(false);

    const section = this.closest('.shopify-section');
    section?.addEventListener(StandardEvents.productSelect, (event) => {
      event.promise
        ?.then(() => {
          this.#syncUnitFromVariant();
          this.#renderPrices();
        })
        .catch(() => {});
    });
  }

  disconnectedCallback() {
    this.#variantObserver?.disconnect();
  }

  #readVariantPrices() {
    const node = this.querySelector('[data-rc-pack-variants]');
    if (!node?.textContent) return {};
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return {};
    }
  }

  #selectedQty() {
    const checked = this.#radios.find((radio) => radio.checked);
    return Number(checked?.value) || 1;
  }

  #currentVariantId() {
    return document.querySelector('product-form-component input[name="id"]')?.value;
  }

  #syncUnitFromVariant() {
    const variantId = this.#currentVariantId();
    const next = Number(this.#variantPrices[variantId]);
    if (Number.isFinite(next) && next > 0) this.#unitCents = next;
  }

  #watchVariant() {
    const input = document.querySelector('product-form-component input[name="id"]');
    if (!input) return;

    this.#variantObserver = new MutationObserver(() => {
      this.#syncUnitFromVariant();
      this.#renderPrices();
    });
    this.#variantObserver.observe(input, { attributes: true, attributeFilter: ['value'] });
    input.addEventListener('change', () => {
      this.#syncUnitFromVariant();
      this.#renderPrices();
    });
  }

  #renderPrices() {
    this.#priceNodes.forEach((node) => {
      const qty = Number(node.getAttribute('data-rc-pack-price'));
      node.textContent = formatMoney(packTotal(this.#unitCents, qty));
    });
  }

  #ensureQuantityInput(qty) {
    const form = document.querySelector('product-form-component form[data-type="add-to-cart-form"]');
    if (!form) return;

    let input = form.querySelector('input[name="quantity"][data-rc-pack-qty]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'quantity';
      input.setAttribute('data-rc-pack-qty', '');
      form.appendChild(input);
    }
    input.value = String(qty);

    const selector = document.querySelector('product-form-component quantity-selector-component');
    selector?.setValue?.(String(qty));
  }

  #apply(persist) {
    const qty = this.#selectedQty();

    this.querySelectorAll('.rc-pack-picker__card').forEach((card) => {
      card.classList.toggle('is-selected', card.querySelector('.rc-pack-picker__radio')?.checked === true);
    });

    this.#syncUnitFromVariant();
    this.#renderPrices();
    this.#ensureQuantityInput(qty);

    const productForm = document.querySelector('product-form-component');
    if (productForm) productForm.dataset.quantityDefault = String(qty);

    document.dispatchEvent(new QuantitySelectorUpdateEvent(qty));

    const installment = document.querySelector('.payment-installments .price');
    if (installment) {
      const fourth = packTotal(this.#unitCents, qty) / 4 / 100;
      installment.textContent = `${fourth.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}€`;
    }

    if (persist && this.dataset.productId) {
      sessionStorage.setItem(STORAGE_PREFIX + this.dataset.productId, String(qty));
    }
  }
}

if (!customElements.get('rc-pack-picker')) {
  customElements.define('rc-pack-picker', RcPackPicker);
}
