(() => {
  const SPEED_BUCKETS = [
    { key: '0-15', min: 0, max: 15 },
    { key: '16-30', min: 16, max: 30 },
    { key: '31-50', min: 31, max: 50 },
    { key: '51-70', min: 51, max: 70 },
    { key: '71-90', min: 71, max: 90 },
    { key: '91-999', min: 91, max: 999 },
  ];

  const parseProduct = (raw) => {
    const title = raw.title || '';
    const scaleMatch = title.match(/1\s*[/:]\s*(\d{1,2})/) || title.match(/\b1-(\d{1,2})\b/);
    const speedMatch = title.match(/(\d{1,3})\s*km/i);
    const ages = [];

    for (const tag of raw.tags || []) {
      if (/3\s*ans/i.test(tag)) ages.push('3');
      else if (/d[eè]s\s*5|5\s*ans/i.test(tag)) ages.push('5');
      else if (/7\s*ans/i.test(tag)) ages.push('7');
      else if (/10\s*ans/i.test(tag)) ages.push('10');
      else if (/d[eè]s\s*12|12\s*ans/i.test(tag)) ages.push('12');
    }

    return {
      handle: raw.handle,
      price: Number(raw.price) / 100,
      scale: scaleMatch ? scaleMatch[1] : null,
      speed: speedMatch ? Number(speedMatch[1]) : null,
      ages: [...new Set(ages)],
    };
  };

  const speedBucket = (speed) => {
    if (speed == null) return null;
    return SPEED_BUCKETS.find((bucket) => speed >= bucket.min && speed <= bucket.max)?.key || null;
  };

  const selectedValues = (form, name) =>
    [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);

  const bind = (root) => {
    const form = root.querySelector('[data-rc-filters]');
    const catalogNode = root.querySelector('[data-rc-filter-catalog]');
    if (!form || !catalogNode) return;

    let catalog = [];
    try {
      catalog = JSON.parse(catalogNode.textContent).map(parseProduct);
    } catch (_) {
      return;
    }

    if (!catalog.length) return;

    const minInput = form.querySelector('[data-rc-price-min]');
    const maxInput = form.querySelector('[data-rc-price-max]');
    const priceOutput = form.querySelector('[data-rc-price-output]');
    const track = form.querySelector('[data-rc-price-track]');
    const applyButton = form.querySelector('[data-rc-apply]');
    const grid = document.querySelector('.rc-collection .product-grid');
    if (!minInput || !maxInput || !grid) return;

    const prices = catalog.map((item) => item.price).filter((price) => Number.isFinite(price));
    const floor = Math.floor(Math.min(...prices, Number(minInput.min)) / 10) * 10;
    const ceil = Math.ceil(Math.max(...prices, Number(minInput.max)) / 10) * 10;
    minInput.min = String(floor);
    maxInput.min = String(floor);
    minInput.max = String(ceil);
    maxInput.max = String(ceil);
    minInput.value = String(floor);
    maxInput.value = String(ceil);

    let emptyNode = grid.querySelector('.rc-filters-empty');
    if (!emptyNode) {
      emptyNode = document.createElement('p');
      emptyNode.className = 'rc-filters-empty';
      emptyNode.textContent = 'Aucun modèle ne correspond à ces filtres.';
      grid.prepend(emptyNode);
    }

    const readState = () => ({
      min: Number(minInput.value),
      max: Number(maxInput.value),
      scales: selectedValues(form, 'echelle'),
      speeds: selectedValues(form, 'vitesse'),
      ages: selectedValues(form, 'age'),
    });

    const matches = (product, state) => {
      if (product.price < state.min || product.price > state.max) return false;
      if (state.scales.length && (!product.scale || !state.scales.includes(product.scale))) return false;
      if (state.speeds.length) {
        const bucket = speedBucket(product.speed);
        if (!bucket || !state.speeds.includes(bucket)) return false;
      }
      if (state.ages.length && !state.ages.some((age) => product.ages.includes(age))) return false;
      return true;
    };

    const matchingHandles = (state) =>
      new Set(catalog.filter((product) => matches(product, state)).map((product) => product.handle));

    const updateTrack = () => {
      let min = Number(minInput.value);
      let max = Number(maxInput.value);
      if (min > max) {
        const swap = min;
        min = max;
        max = swap;
        minInput.value = String(min);
        maxInput.value = String(max);
      }

      const span = ceil - floor || 1;
      const start = ((min - floor) / span) * 100;
      const end = ((max - floor) / span) * 100;
      if (track) {
        track.style.setProperty('--rc-price-start', `${start}%`);
        track.style.setProperty('--rc-price-span', `${end - start}%`);
      }
      if (priceOutput) {
        priceOutput.textContent = `${min} € - ${max} €`;
      }
    };

    const updateCounts = (state) => {
      const countFor = (patch) =>
        catalog.filter((product) => matches(product, { ...state, ...patch })).length;

      form.querySelectorAll('[data-rc-count]').forEach((node) => {
        const key = node.getAttribute('data-rc-count') || '';
        let count = 0;

        if (key.startsWith('scale-')) {
          const value = key.slice(6);
          count = countFor({ scales: [value] });
          const option = node.closest('.rc-filters__option');
          if (option) option.hidden = catalog.every((product) => product.scale !== value);
        } else if (key.startsWith('speed-')) {
          const value = key.slice(6);
          count = countFor({ speeds: [value] });
          const option = node.closest('.rc-filters__option');
          if (option) {
            option.hidden = catalog.every((product) => speedBucket(product.speed) !== value);
          }
        } else if (key.startsWith('age-')) {
          const value = key.slice(4);
          count = countFor({ ages: [value] });
          const option = node.closest('.rc-filters__option');
          if (option) option.hidden = catalog.every((product) => !product.ages.includes(value));
        }

        node.textContent = count ? `(${count})` : '';
      });

      const total = matchingHandles(state).size;
      if (applyButton) {
        if (total === 0) applyButton.textContent = 'Aucun résultat';
        else if (total === 1) applyButton.textContent = 'Voir 1 résultat';
        else applyButton.textContent = `Voir ${total} résultats`;
      }
    };

    const apply = (pushUrl = true) => {
      const state = readState();
      const handles = matchingHandles(state);
      const items = grid.querySelectorAll('.product-grid__item');
      let visible = 0;

      items.forEach((item) => {
        if (item.classList.contains('rc-collection-video')) {
          item.classList.toggle('is-rc-filtered-out', handles.size !== catalog.length);
          return;
        }

        const handle = item.getAttribute('data-product-handle');
        const show = handle ? handles.has(handle) : true;
        item.classList.toggle('is-rc-filtered-out', !show);
        if (show) visible += 1;
      });

      emptyNode.classList.toggle('is-visible', visible === 0);

      if (pushUrl) {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        ['rc_prix', 'rc_echelle', 'rc_vitesse', 'rc_age'].forEach((key) => params.delete(key));

        if (state.min !== floor || state.max !== ceil) {
          params.set('rc_prix', `${state.min}-${state.max}`);
        }
        if (state.scales.length) params.set('rc_echelle', state.scales.join(','));
        if (state.speeds.length) params.set('rc_vitesse', state.speeds.join(','));
        if (state.ages.length) params.set('rc_age', state.ages.join(','));

        const next = `${url.pathname}${params.toString() ? `?${params}` : ''}${url.hash}`;
        window.history.replaceState({}, '', next);
      }
    };

    const restoreFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const prix = params.get('rc_prix');
      if (prix) {
        const [min, max] = prix.split('-').map(Number);
        if (Number.isFinite(min)) minInput.value = String(Math.max(floor, min));
        if (Number.isFinite(max)) maxInput.value = String(Math.min(ceil, max));
      }

      const restoreChecks = (name, values) => {
        const selected = new Set((values || '').split(',').filter(Boolean));
        form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
          input.checked = selected.has(input.value);
        });
      };

      restoreChecks('echelle', params.get('rc_echelle'));
      restoreChecks('vitesse', params.get('rc_vitesse'));
      restoreChecks('age', params.get('rc_age'));
    };

    const sync = () => {
      updateTrack();
      updateCounts(readState());
    };

    minInput.addEventListener('input', sync);
    maxInput.addEventListener('input', sync);
    form.addEventListener('change', sync);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      apply(true);
    });

    form.addEventListener('reset', () => {
      requestAnimationFrame(() => {
        minInput.value = String(floor);
        maxInput.value = String(ceil);
        sync();
        apply(true);
      });
    });

    const observer = new MutationObserver(() => apply(false));
    observer.observe(grid, { childList: true });

    restoreFromUrl();
    sync();
    apply(false);
  };

  const init = () => {
    document.querySelectorAll('.rc-collection-filters').forEach(bind);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
