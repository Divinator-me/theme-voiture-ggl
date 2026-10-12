(() => {
  const root = document.querySelector('[data-rc-delivery-options]');
  if (!root) return;

  const currentVariantId = () => {
    const input = document.querySelector(
      'product-form input[name="id"], form[action*="/cart/add"] input[name="id"]'
    );
    return input?.value || '';
  };

  const currentOptions = () => {
    const id = currentVariantId();
    let map = [];
    try {
      map = JSON.parse(root.querySelector('[data-rc-current-variants]')?.textContent || '[]');
    } catch {
      map = [];
    }
    const found = map.find((variant) => String(variant.id) === String(id));
    if (found?.options?.length) {
      return found.options.map((option) => String(option).trim().toLowerCase());
    }

    const color = document.querySelector(
      '.product-information variant-picker .variant-option--buttons input:checked'
    )?.value;
    const battery = document.querySelector(
      '.product-information variant-picker .variant-option--dropdowns select'
    )?.value;
    return [color, battery].filter(Boolean).map((value) => value.trim().toLowerCase());
  };

  root.addEventListener('click', (event) => {
    const link = event.target.closest('[data-rc-delivery-option]');
    if (!link || !root.contains(link)) return;
    if (link.getAttribute('aria-current') === 'page') {
      event.preventDefault();
      return;
    }

    let variants = [];
    try {
      variants = JSON.parse(link.getAttribute('data-variants') || '[]');
    } catch {
      variants = [];
    }

    const wanted = currentOptions();
    const match = variants.find((variant) => {
      const options = (variant.options || []).map((option) => String(option).trim().toLowerCase());
      return wanted.length > 0 && wanted.every((value) => options.includes(value));
    });
    if (!match?.id) return;

    event.preventDefault();
    const url = new URL(link.href, window.location.origin);
    url.searchParams.set('variant', String(match.id));
    window.location.assign(url.toString());
  });
})();
