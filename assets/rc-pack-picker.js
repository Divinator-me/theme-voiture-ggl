import { StandardEvents } from '@shopify/events';
import { QuantitySelectorUpdateEvent } from '@theme/events';

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

    this.#radios.forEach((radio) => {
      radio.addEventListener('change', () => this.#apply(true));
    });

    this.#watchVariant();
    this.#apply(false);

    const section = this.closest('.shopify-section');
    section?.addEventListener(StandardEvents.productSelect, (event) => {
      event.promise
        ?.then(() => {
          queueMicrotask(() => this.#apply(false));
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

    this.#variantObserver = new MutationObserver(() => this.#apply(false));
    this.#variantObserver.observe(input, { attributes: true, attributeFilter: ['value'] });
    input.addEventListener('change', () => this.#apply(false));
  }

  #renderPrices() {
    this.#priceNodes.forEach((node) => {
      const qty = Number(node.getAttribute('data-rc-pack-price'));
      node.textContent = formatMoney(packTotal(this.#unitCents, qty));
    });
  }

  #formatLike(sample, cents) {
    const number = (cents / 100).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const text = (sample || '').trim();
    if (/^€/.test(text)) return `€${number}`;
    if (/^EUR\s?/i.test(text)) return `EUR ${number}`;
    return `${number} €`;
  }

  #updateProductPrice(totalCents) {
    const priceNodes = document.querySelectorAll(
      '.product-information .product-details product-price .price:not(.compare-at-price), .product-information .product-details product-price .price-item--sale'
    );
    const sample = priceNodes[0]?.textContent || '';
    const formatted = this.#formatLike(sample, totalCents);

    priceNodes.forEach((node) => {
      node.textContent = formatted;
    });

    const sticky = document.querySelector('.sticky-add-to-cart__price-current');
    if (sticky) sticky.textContent = this.#formatLike(sticky.textContent, totalCents);
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
    this.#syncUnitFromVariant();

    const qty = this.#selectedQty();
    const totalCents = packTotal(this.#unitCents, qty);

    this.querySelectorAll('.rc-pack-picker__card').forEach((card) => {
      card.classList.toggle('is-selected', card.querySelector('.rc-pack-picker__radio')?.checked === true);
    });

    this.#renderPrices();
    this.#ensureQuantityInput(qty);
    this.#updateProductPrice(totalCents);

    const productForm = document.querySelector('product-form-component');
    if (productForm) productForm.dataset.quantityDefault = String(qty);

    document.dispatchEvent(new QuantitySelectorUpdateEvent(qty));

    const installment = document.querySelector('.payment-installments .price');
    if (installment) {
      const fourth = totalCents / 4 / 100;
      installment.textContent = `${fourth.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}€`;
    }

    if (persist && this.dataset.productId) {
      const checked = this.#radios.find((radio) => radio.checked);
      if (checked) {
        sessionStorage.setItem(STORAGE_PREFIX + this.dataset.productId, checked.value);
      }
    }
  }
}

if (!customElements.get('rc-pack-picker')) {
  customElements.define('rc-pack-picker', RcPackPicker);
}
