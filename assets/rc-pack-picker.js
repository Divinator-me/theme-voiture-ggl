import { CartLinesUpdateEvent, StandardEvents } from '@shopify/events';
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
  #variantMap = [];
  #variantObserver;
  #cartBound = false;

  connectedCallback() {
    this.#radios = Array.from(this.querySelectorAll('.rc-pack-picker__radio'));
    this.#priceNodes = Array.from(this.querySelectorAll('[data-rc-pack-price]'));
    this.#unitCents = Number(this.dataset.unitPrice) || 0;
    this.#variantPrices = this.#readJson('[data-rc-pack-variants]', {});
    this.#variantMap = this.#readJson('[data-rc-pack-variant-map]', []);

    this.#radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        this.#apply();
        this.#syncColorSteps();
        this.#scrollToNextStep();
      });
    });

    this.#watchVariant();
    this.#bindCartIntercept();
    this.#apply();
    this.#syncColorSteps();

    const section = this.closest('.shopify-section');
    section?.addEventListener(StandardEvents.productSelect, (event) => {
      event.promise
        ?.then(() => {
          queueMicrotask(() => {
            this.#apply();
            this.#syncColorSteps();
          });
        })
        .catch(() => {});
    });
  }

  disconnectedCallback() {
    this.#variantObserver?.disconnect();
  }

  #readJson(selector, fallback) {
    const node = this.querySelector(selector);
    if (!node?.textContent) return fallback;
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return fallback;
    }
  }

  #hasPackChoice() {
    return this.#radios.some((radio) => radio.checked);
  }

  #selectedQty() {
    if (!this.#hasPackChoice()) return 1;
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

    this.#variantObserver = new MutationObserver(() => this.#apply());
    this.#variantObserver.observe(input, { attributes: true, attributeFilter: ['value'] });
    input.addEventListener('change', () => this.#apply());
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

  #colorMaster() {
    return document.querySelector('.product-information variant-picker .variant-option--buttons');
  }

  #colorHost(master) {
    const picker = master.closest('variant-picker');
    if (!picker) return null;

    let host = picker.nextElementSibling;
    if (host?.classList.contains('rc-color-clones')) return host;

    host = document.createElement('div');
    host.className = 'rc-color-clones';
    picker.after(host);
    return host;
  }

  #syncColorSteps() {
    const master = this.#colorMaster();
    if (!master) return;

    const needed = this.#selectedQty() - 1;
    const picker = master.closest('variant-picker');
    const existingHost = picker?.nextElementSibling?.classList.contains('rc-color-clones')
      ? picker.nextElementSibling
      : null;

    if (needed <= 0) {
      existingHost?.remove();
      return;
    }

    const host = this.#colorHost(master);
    if (!host) return;

    const existing = Array.from(host.querySelectorAll('.rc-color-clone'));
    existing.slice(needed).forEach((clone) => clone.remove());

    const masterChecked = master.querySelector('input:checked');
    for (let index = existing.length; index < needed; index += 1) {
      const clone = master.cloneNode(true);
      clone.classList.add('rc-color-clone');
      clone.removeAttribute('ref');
      clone.querySelectorAll('[ref]').forEach((node) => node.removeAttribute('ref'));

      const legend = clone.querySelector('legend');
      if (legend) {
        const vehicle = index + 2;
        legend.textContent = `Choisissez votre couleur !`;
        legend.setAttribute('data-rc-color-index', String(vehicle));
      }

      clone.querySelectorAll('input').forEach((input) => {
        input.name = `${input.name}-rc-${index + 2}`;
        input.checked = masterChecked ? input.value === masterChecked.value : input.checked;
        input.removeAttribute('data-current-checked');
      });

      host.appendChild(clone);
    }
  }

  #batteryValue() {
    const select = document.querySelector(
      '.product-information variant-picker .variant-option--dropdowns select'
    );
    return select?.value?.trim() || '';
  }

  #extraBatteryItem() {
    const extra = document.querySelector('.rc-extra-batteries');
    if (!extra) return null;

    const qty = Number(extra.querySelector('select')?.value) || 0;
    const variantId = extra.dataset.variantId;
    if (qty < 1 || !variantId) return null;

    return { variantId: String(variantId), quantity: qty };
  }

  #colorValues() {
    const qty = this.#selectedQty();
    const master = this.#colorMaster();
    const masterColor = master?.querySelector('input:checked')?.value?.trim() || '';
    const extras = Array.from(document.querySelectorAll('.rc-color-clone input:checked')).map((input) =>
      input.value.trim()
    );
    const colors = [masterColor, ...extras].filter(Boolean).slice(0, qty);
    while (colors.length < qty && masterColor) colors.push(masterColor);
    return colors;
  }

  #variantIdFor(color, battery) {
    const colorNorm = color.toLowerCase();
    const batteryNorm = battery.toLowerCase();
    const match = this.#variantMap.find((variant) => {
      const options = (variant.options || []).map((option) => String(option).trim().toLowerCase());
      const hasColor = options.includes(colorNorm);
      const hasBattery = !batteryNorm || options.includes(batteryNorm);
      return hasColor && hasBattery;
    });
    return match?.id ? String(match.id) : '';
  }

  #packCartItems() {
    const battery = this.#batteryValue();
    const colors = this.#colorValues();
    const items = [];

    colors.forEach((color) => {
      const id = this.#variantIdFor(color, battery);
      if (!id) return;
      const existing = items.find((item) => item.variantId === id);
      if (existing) existing.quantity += 1;
      else items.push({ variantId: id, quantity: 1 });
    });

    return items;
  }

  #bindCartIntercept() {
    if (this.#cartBound) return;
    const form = document.querySelector('product-form-component');
    if (!form) {
      queueMicrotask(() => this.#bindCartIntercept());
      return;
    }

    this.#cartBound = true;
    form.addEventListener(
      'submit',
      (event) => {
        const extra = this.#extraBatteryItem();
        const items = this.#packCartItems();
        if (items.length < 2 && !extra) return;

        const payload = items.length
          ? items.map((item) => ({ ...item }))
          : [
              {
                variantId: String(this.#currentVariantId() || ''),
                quantity: this.#selectedQty(),
              },
            ].filter((item) => item.variantId);

        if (extra) payload.push(extra);
        if (!payload.length) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        this.#addPackItems(form, payload);
      },
      true
    );
  }

  #addPackItems(form, items) {
    const sections = [];
    document.querySelectorAll('cart-items-component').forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) sections.push(item.dataset.sectionId);
    });

    const deferred = CartLinesUpdateEvent.createPromise?.();
    form.dispatchEvent(
      new CartLinesUpdateEvent({
        action: 'add',
        context: 'product',
        lines: items.map((item) => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        })),
        promise: deferred?.promise,
      })
    );

    fetch(Theme.routes.cart_add_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: Number(item.variantId),
          quantity: item.quantity,
        })),
        sections: sections.join(','),
      }),
    })
      .then((response) => response.json())
      .then((cart) => {
        deferred?.resolve?.({
          cart: CartLinesUpdateEvent.createCartFromAjaxResponse?.(cart) || cart,
          detail: { didError: false, items: cart.items, source: 'rc-pack-picker' },
        });
      })
      .catch((error) => deferred?.reject?.(error));
  }

  #apply() {
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
  }

  #scrollToNextStep() {
    const scope = this.closest('.product-information') || document;
    const colorStep =
      scope.querySelector('.variant-option--buttons') ||
      [...scope.querySelectorAll('.variant-option')].find((option) => /couleur/i.test(option.textContent || ''));

    if (!colorStep) return;

    const header = document.querySelector('.rc-main-nav');
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const rect = colorStep.getBoundingClientRect();
    const targetOffset = Math.max(headerHeight + 16, window.innerHeight * 0.4);
    if (Math.abs(rect.top - targetOffset) < 24) return;

    const top = rect.top + window.scrollY - targetOffset;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  }
}

if (!customElements.get('rc-pack-picker')) {
  customElements.define('rc-pack-picker', RcPackPicker);
}
