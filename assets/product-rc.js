(() => {
  const HEADING_TAGS = new Set(['H2', 'H3', 'H4']);
  const MEDIA_SELECTOR =
    'img, picture, video, audio, iframe, embed, object, source, table, deferred-media, shopify-video, [data-shopify-video]';

  const MAIN_SECTIONS = [
    { key: 'tout savoir', label: 'Tout Savoir' },
    { key: 'caracteristiques', label: 'Caractéristiques' },
    { key: 'points fort', label: 'Points Fort' },
  ];

  const BOTTOM_SECTIONS = [
    { key: 'livraison et retours', label: 'Livraison et retours', fallback: 'livraison' },
    { key: 'garantie 2 ans', label: 'Garantie 2 ans', fallback: 'garantie' },
  ];

  const SECTION_ALIASES = {
    'tout savoir': 'tout savoir',
    caracteristiques: 'caracteristiques',
    'points fort': 'points fort',
    'points forts': 'points fort',
    'livraison et retours': 'livraison et retours',
    'livraison et retour': 'livraison et retours',
    livraison: 'livraison et retours',
    retours: 'livraison et retours',
    'commande et livraison': 'livraison et retours',
    'commande & livraison': 'livraison et retours',
    garantie: 'garantie 2 ans',
    'garantie 2 ans': 'garantie 2 ans',
    description: null,
  };

  const normalize = (text) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const isMeaningfulNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim().length > 0;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    return node.tagName !== 'HR' && node.tagName !== 'BR';
  };

  const isSectionHeading = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (HEADING_TAGS.has(element.tagName)) return true;

    if (element.tagName !== 'P') return false;

    const strong = element.querySelector(':scope > strong, :scope > b');
    if (!strong) return false;

    const text = element.textContent.replace(/\s+/g, ' ').trim();
    const headingText = strong.textContent.replace(/\s+/g, ' ').trim();

    return text === headingText && headingText.length > 0 && headingText.length <= 80;
  };

  const getSectionTitle = (element) => {
    if (HEADING_TAGS.has(element.tagName)) {
      return element.textContent.replace(/\s+/g, ' ').trim();
    }

    const strong = element.querySelector(':scope > strong, :scope > b');
    return (strong || element).textContent.replace(/\s+/g, ' ').trim();
  };

  const resolveSectionKey = (title) => {
    const normalized = normalize(title);

    if (Object.prototype.hasOwnProperty.call(SECTION_ALIASES, normalized)) {
      return SECTION_ALIASES[normalized];
    }

    if (normalized.startsWith('points fort')) {
      return 'points fort';
    }

    return undefined;
  };

  const getParseableNodes = (body) => {
    const nodes = [...body.childNodes].filter(isMeaningfulNode);

    if (nodes.length !== 1 || nodes[0].nodeType !== Node.ELEMENT_NODE) {
      return nodes;
    }

    const wrapper = nodes[0];
    const wrapperTags = new Set(['DIV', 'ARTICLE', 'SECTION', 'MAIN']);

    if (!wrapperTags.has(wrapper.tagName)) {
      return nodes;
    }

    const nestedHeadings = wrapper.querySelector(
      ':scope > h2, :scope > h3, :scope > h4, :scope > p > strong, :scope > p > b'
    );

    if (!nestedHeadings) {
      return nodes;
    }

    return [...wrapper.childNodes].filter(isMeaningfulNode);
  };

  const hasVisibleContent = (nodes) => {
    const temp = document.createElement('div');
    nodes.forEach((node) => temp.appendChild(node.cloneNode(true)));

    if (temp.textContent.replace(/\s+/g, '').length > 0) return true;
    return Boolean(temp.querySelector(MEDIA_SELECTOR));
  };

  const enhanceMedia = (root) => {
    root.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.decoding = 'async';

      if (image.dataset.src && !image.getAttribute('src')) {
        image.setAttribute('src', image.dataset.src);
      }
    });

    root.querySelectorAll('video').forEach((video) => {
      if (video.dataset.src && !video.getAttribute('src')) {
        video.setAttribute('src', video.dataset.src);
      }

      if (!video.hasAttribute('preload')) {
        video.setAttribute('preload', 'metadata');
      }
    });

    root.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.dataset.src && !iframe.getAttribute('src')) {
        iframe.setAttribute('src', iframe.dataset.src);
      }
    });
  };

  const parseBuckets = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nodes = getParseableNodes(doc.body);
    const buckets = new Map();

    [...MAIN_SECTIONS, ...BOTTOM_SECTIONS].forEach((section) => {
      buckets.set(section.key, []);
    });

    let currentKey = 'tout savoir';

    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && isSectionHeading(node)) {
        const title = getSectionTitle(node);
        const key = resolveSectionKey(title);

        if (key === null) {
          return;
        }

        if (key) {
          currentKey = key;
          return;
        }
      }

      buckets.get(currentKey).push(node.cloneNode(true));
    });

    return buckets;
  };

  const createSummary = (title) => {
    const summary = document.createElement('summary');
    const label = document.createElement('span');
    label.textContent = title;
    const icon = document.createElement('b');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '+';
    summary.append(label, icon);
    return summary;
  };

  const nodesFromHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return [...temp.childNodes];
  };

  const getFallbackNodes = (root, fallbackKey) => {
    const template = root.querySelector(`[data-rc-fallback-${fallbackKey}]`);
    if (!template) return [];
    return nodesFromHtml(template.innerHTML);
  };

  const createAccordionItem = (title, nodes, options = {}) => {
    const details = document.createElement('details');
    details.className = options.nested
      ? 'rc-product-desc__item rc-product-desc__item--nested'
      : 'rc-product-desc__item';

    if (options.open) {
      details.open = true;
    }

    const content = document.createElement('div');
    content.className = 'rc-product-desc__content rte';
    nodes.forEach((node) => content.appendChild(node));

    enhanceMedia(content);
    details.append(createSummary(title), content);
    return details;
  };

  const bindExclusiveToggle = (container) => {
    container.addEventListener('toggle', (event) => {
      const target = event.target;

      if (!(target instanceof HTMLDetailsElement) || !target.open) return;

      container.querySelectorAll(':scope > details[open]').forEach((item) => {
        if (item !== target) item.open = false;
      });

      enhanceMedia(target);
    });
  };

  const buildAccordion = (root) => {
    if (root.dataset.rcProductDescReady === 'true') return;
    if (root.hasAttribute('data-rc-product-desc-static')) return;

    const source = root.querySelector('[data-rc-product-desc-source]');
    if (!source) return;

    const buckets = parseBuckets(source.innerHTML);
    const list = document.createElement('div');
    list.className = 'rc-product-desc__list';

    const descriptionGroup = document.createElement('details');
    descriptionGroup.className = 'rc-product-desc__group';
    descriptionGroup.open = true;
    descriptionGroup.append(createSummary('Description'));

    const inner = document.createElement('div');
    inner.className = 'rc-product-desc__group-inner';

    let hasMainContent = false;

    MAIN_SECTIONS.forEach((section, index) => {
      const nodes = buckets.get(section.key) || [];
      if (!hasVisibleContent(nodes)) return;

      hasMainContent = true;
      inner.appendChild(
        createAccordionItem(section.label, nodes, {
          nested: true,
          open: index === 0,
        })
      );
    });

    if (!hasMainContent) {
      const fallbackNodes = buckets.get('tout savoir') || [];
      if (hasVisibleContent(fallbackNodes)) {
        inner.appendChild(
          createAccordionItem('Tout Savoir', fallbackNodes, {
            nested: true,
            open: true,
          })
        );
        hasMainContent = true;
      }
    }

    if (hasMainContent) {
      descriptionGroup.append(inner);
      list.appendChild(descriptionGroup);
      bindExclusiveToggle(inner);
    }

    BOTTOM_SECTIONS.forEach((section) => {
      let nodes = buckets.get(section.key) || [];

      if (!hasVisibleContent(nodes)) {
        nodes = getFallbackNodes(root, section.fallback);
      }

      list.appendChild(createAccordionItem(section.label, nodes));
    });

    if (!list.children.length) {
      list.appendChild(
        createAccordionItem(
          'Description',
          [...source.childNodes].map((node) => node.cloneNode(true)),
          { open: true }
        )
      );
    }

    source.replaceWith(list);
    root.dataset.rcProductDescReady = 'true';
  };

  const init = () => {
    document.querySelectorAll('[data-rc-product-desc]').forEach(buildAccordion);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
