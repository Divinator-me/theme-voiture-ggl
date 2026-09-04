import { CartLinesUpdateEvent, StandardEvents } from '@shopify/events';
import { QuantitySelectorUpdateEvent } from '@theme/events';

const packTotal = (unitCents, qty) => {
  if (qty === 2) return Math.round((unitCents * 1.75) / 50) * 50;
  if (qty === 3) return Math.round((unitCents * 2.7) / 100) * 100;
  return unitCents;
};

const TRIO_GIFT_QUANTITY = 1;

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
  #bundleResolve = null;
  #addingBundle = false;
  #pendingGift = null;
  #pendingExtras = null;

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
    this.#bindExtrasSync();
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
    const packQty = this.#selectedQty();
    const items = [];

    colors.forEach((color) => {
      const id = this.#variantIdFor(color, battery);
      if (!id) return;
      const existing = items.find((item) => item.variantId === id);
      if (existing) existing.quantity += 1;
      else items.push({ variantId: id, quantity: 1 });
    });

    if (!items.length) {
      const fallbackId = String(this.#currentVariantId() || '');
      if (fallbackId) items.push({ variantId: fallbackId, quantity: packQty });
    }

    return items;
  }

  #readExtraBatteries() {
    const fromApi = window.RCLAB?.snapshotExtraBatteries?.();
    if (fromApi?.variantId && fromApi.quantity > 0) return fromApi;

    const root = document.querySelector('.rc-extra-batteries');
    const select = root?.querySelector('select[name="rc-extra-batteries"]');
    const quantity = Number(select?.value || root?.getAttribute('data-qty') || 0) || 0;
    const variantId = String(
      root?.getAttribute('data-variant-id') ||
        select?.getAttribute('data-variant-id') ||
        this.dataset.extraBatteryVariantId ||
        ''
    );
    if (quantity < 1 || !variantId) return null;
    return { variantId, quantity };
  }

  #giftBatteryItem(packQty) {
    if (packQty !== 3) return null;
    const variantId = String(
      this.dataset.giftBatteryVariantId || this.dataset.trioGiftVariantId || ''
    ).trim();
    if (!variantId) return null;
    return { variantId, quantity: TRIO_GIFT_QUANTITY };
  }

  #mergeItems(list) {
    const map = new Map();
    list.forEach((item) => {
      const variantId = String(item?.variantId || '').trim();
      const quantity = Number(item?.quantity) || 0;
      if (!variantId || quantity < 1) return;
      map.set(variantId, (map.get(variantId) || 0) + quantity);
    });
    return Array.from(map, ([variantId, quantity]) => ({ variantId, quantity }));
  }

  #beginBundleGate() {
    window.RCLAB = window.RCLAB || {};
    window.RCLAB.cartOpenBlocked = true;

    const nextGift = this.#giftBatteryItem(this.#selectedQty());
    const nextExtras = this.#readExtraBatteries();
    if (nextGift) this.#pendingGift = nextGift;
    if (nextExtras) this.#pendingExtras = nextExtras;

    if (this.#bundleResolve) return;

    window.RCLAB.bundleReady = new Promise((resolve) => {
      let settled = false;
      this.#bundleResolve = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
    });
  }

  #finishBundleGate() {
    this.#bundleResolve?.();
    this.#bundleResolve = null;
  }

  #bindExtrasSync() {
    document.addEventListener(
      'change',
      (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) return;
        if (target.name !== 'rc-extra-batteries') return;
        const snap = this.#readExtraBatteries();
        this.#pendingExtras = snap;
      },
      true
    );
  }

  #bindCartIntercept() {
    if (this.#cartBound) return;
    this.#cartBound = true;

    const findProductForm = (button) => {
      const productForm = button.closest('product-form-component');
      if (!productForm) return null;
      if (button.closest('quick-add, .quick-add-modal')) return null;
      const form = productForm.querySelector('form[data-type="add-to-cart-form"]');
      if (!form) return null;
      return { productForm, form };
    };

    const handleAtcInterception = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest(
        'product-form-component .add-to-cart-button, product-form-component button[type="submit"]'
      );
      if (!button) return;

      const context = findProductForm(button);
      if (!context) return;

      const packQty = this.#selectedQty();
      const vehicles = this.#packCartItems();
      if (!vehicles.length) return;

      this.#beginBundleGate();

      event.preventDefault();
      event.stopImmediatePropagation();

      const offer = document.querySelector('rc-charger-offer');
      if (offer?.getAttribute('data-bypass') !== 'true' && typeof offer?.arm === 'function') {
        offer.arm();
      }

      if (typeof window.upcartCloseCart === 'function') {
        window.upcartCloseCart();
      }

      this.#addBundle(context.form, vehicles, packQty);
    };

    window.addEventListener('click', handleAtcInterception, true);
    window.addEventListener(
      'submit',
      (event) => {
        const formEl = event.target;
        if (!(formEl instanceof HTMLFormElement)) return;
        if (formEl.getAttribute('data-type') !== 'add-to-cart-form') return;
        if (!formEl.closest('product-form-component')) return;
        if (formEl.closest('quick-add, .quick-add-modal')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  #cartAddUrl() {
    return window.Theme?.routes?.cart_add_url || '/cart/add.js';
  }

  async #postBatch(items) {
    const payload = this.#mergeItems(items).map((item) => ({
      id: Number(item.variantId),
      quantity: item.quantity,
    }));
    if (!payload.length) return { items: [] };

    window.RCLAB = window.RCLAB || {};
    window.RCLAB.internalCartAdd = true;

    try {
      const response = await fetch(this.#cartAddUrl(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items: payload }),
      });
      return await response.json();
    } finally {
      window.RCLAB.internalCartAdd = false;
    }
  }

  async #addBundle(form, vehicles, packQty) {
    if (this.#addingBundle) return;
    this.#addingBundle = true;

    const freshGift = this.#giftBatteryItem(packQty);
    const freshExtras = this.#readExtraBatteries();
    const gift = freshGift || this.#pendingGift;
    const extras = freshExtras || this.#pendingExtras;

    const bundle = this.#mergeItems([...vehicles, gift, extras]);

    const deferred = CartLinesUpdateEvent.createPromise?.();
    form.dispatchEvent(
      new CartLinesUpdateEvent({
        action: 'add',
        context: 'product',
        lines: vehicles.map((item) => ({
          merchandiseId: item.variantId,
          quantity: item.quantity,
        })),
        promise: deferred?.promise,
      })
    );

    try {
      const cart = await this.#postBatch(bundle);
      if (cart?.status) {
        deferred?.reject?.(cart);
        throw cart;
      }

      this.#pendingGift = null;
      this.#pendingExtras = null;
      this.#finishBundleGate();

      deferred?.resolve?.({
        cart: CartLinesUpdateEvent.createCartFromAjaxResponse?.(cart) || cart,
        detail: { didError: false, items: cart?.items, source: 'rc-pack-picker' },
      });
      return cart;
    } catch (error) {
      this.#finishBundleGate();
      deferred?.reject?.(error);
      throw error;
    } finally {
      this.#addingBundle = false;
    }
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
