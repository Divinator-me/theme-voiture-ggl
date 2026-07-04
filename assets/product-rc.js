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
    { key: 'livraison et retours', label: 'Livraison et retours' },
    { key: 'garantie 2 ans', label: 'Garantie 2 ans' },
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

  const ICONS = {
    description:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 4v4h4M8 11h8M8 15h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    toutSavoir:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 11v5M12 8.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    caracteristiques:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    pointsFort:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.5 14.2 9l4.8.7-3.5 3.4.8 4.8L12 15.8 7.5 17.9l.8-4.8L4.8 9.7 9.6 9 12 4.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    livraison:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7.5h12v9H3v-9Z" stroke="currentColor" stroke-width="1.5"/><path d="M15 10.5h3.2L21 14v2.5h-3M6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    garantie:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="m8.5 12.2 2.2 2.2 5-5.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };


  const ICON_MAP = {
    Description: 'description',
    'Tout Savoir': 'toutSavoir',
    Caractéristiques: 'caracteristiques',
    'Points Fort': 'pointsFort',
    'Livraison et retours': 'livraison',
    'Garantie 2 ans': 'garantie',
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

  const createSummary = (title, options = {}) => {
    const summary = document.createElement('summary');
    const main = document.createElement('span');
    main.className = 'rc-product-desc__summary-main';

    const icon = document.createElement('span');
    icon.className = 'rc-product-desc__icon';
    const iconKey = options.icon || ICON_MAP[title] || 'description';
    icon.innerHTML = ICONS[iconKey] || ICONS.description;

    const label = document.createElement('span');
    label.className = 'rc-product-desc__label';
    label.textContent = title;

    main.append(icon, label);

    const toggle = document.createElement('span');
    toggle.className = 'rc-product-desc__toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    summary.append(main, toggle);
    return summary;
  };

  const nodesFromHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return [...temp.childNodes];
  };

  const getSectionBuckets = (root) => {
    const buckets = new Map();

    [...MAIN_SECTIONS, ...BOTTOM_SECTIONS].forEach((section) => {
      buckets.set(section.key, []);
    });

    const sectionsJson = root.querySelector('[data-rc-product-sections]');

    if (sectionsJson) {
      try {
        const data = JSON.parse(sectionsJson.textContent);
        const keyMap = {
          tout_savoir: 'tout savoir',
          caracteristiques: 'caracteristiques',
          points_fort: 'points fort',
          livraison_retours: 'livraison et retours',
          garantie_2_ans: 'garantie 2 ans',
        };

        Object.entries(data).forEach(([jsonKey, html]) => {
          if (!html || typeof html !== 'string' || !html.trim()) return;

          const key = keyMap[jsonKey];
          if (!key) return;

          buckets.set(key, nodesFromHtml(html));
        });
      } catch (error) {
        // Ignore invalid JSON and fall back to description parsing.
      }
    }

    const source = root.querySelector('[data-rc-product-desc-source]');

    if (source) {
      const parsed = parseBuckets(source.innerHTML);

      [...MAIN_SECTIONS, ...BOTTOM_SECTIONS].forEach((section) => {
        if (!hasVisibleContent(buckets.get(section.key) || [])) {
          buckets.set(section.key, parsed.get(section.key) || []);
        }
      });
    }

    return buckets;
  };

  const createTabsPanel = (sections) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'rc-product-desc__tabs';

    const nav = document.createElement('div');
    nav.className = 'rc-product-desc__tabs-nav';
    nav.setAttribute('role', 'tablist');

    const panels = document.createElement('div');
    panels.className = 'rc-product-desc__tabs-panels';

    const activateTab = (index) => {
      [...nav.children].forEach((tab, tabIndex) => {
        const isActive = tabIndex === index;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      [...panels.children].forEach((panel, panelIndex) => {
        const isActive = panelIndex === index;
        panel.hidden = !isActive;
        panel.classList.toggle('is-active', isActive);
        if (isActive) enhanceMedia(panel);
      });
    };

    sections.forEach((section, index) => {
      const slug = section.key.replace(/\s+/g, '-');
      const tabId = `rc-desc-tab-${slug}`;
      const panelId = `rc-desc-panel-${slug}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rc-product-desc__tab${index === 0 ? ' is-active' : ''}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.setAttribute('aria-controls', panelId);
      button.id = tabId;
      button.textContent = section.label;

      const panel = document.createElement('div');
      panel.className = `rc-product-desc__tab-panel rte${index === 0 ? ' is-active' : ''}`;
      panel.setAttribute('role', 'tabpanel');
      panel.id = panelId;
      panel.setAttribute('aria-labelledby', tabId);
      panel.hidden = index !== 0;
      section.nodes.forEach((node) => panel.appendChild(node));

      if (index === 0) {
        enhanceMedia(panel);
      }

      nav.appendChild(button);
      panels.appendChild(panel);
    });

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('.rc-product-desc__tab');
      if (!button || !nav.contains(button)) return;

      const index = [...nav.children].indexOf(button);
      if (index < 0) return;

      activateTab(index);
    });

    wrapper.append(nav, panels);
    return wrapper;
  };

  const createAccordionItem = (title, nodes, options = {}) => {
    const details = document.createElement('details');
    details.className = 'rc-product-desc__item';

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

  const buildAccordion = (root) => {
    if (root.dataset.rcProductDescReady === 'true') return;
    if (root.hasAttribute('data-rc-product-desc-static')) return;

    const buckets = getSectionBuckets(root);
    const list = document.createElement('div');
    list.className = 'rc-product-desc__list';

    const descriptionGroup = document.createElement('details');
    descriptionGroup.className = 'rc-product-desc__group';
    descriptionGroup.append(createSummary('Description'));

    const tabSections = [];

    MAIN_SECTIONS.forEach((section) => {
      const nodes = buckets.get(section.key) || [];
      if (!hasVisibleContent(nodes)) return;

      tabSections.push({ ...section, nodes });
    });

    if (!tabSections.length) {
      const fallbackNodes = buckets.get('tout savoir') || [];
      if (hasVisibleContent(fallbackNodes)) {
        tabSections.push({
          key: 'tout savoir',
          label: 'Tout Savoir',
          nodes: fallbackNodes,
        });
      }
    }

    if (tabSections.length) {
      descriptionGroup.append(createTabsPanel(tabSections));
      list.appendChild(descriptionGroup);
    }

    BOTTOM_SECTIONS.forEach((section) => {
      const nodes = buckets.get(section.key) || [];
      if (!hasVisibleContent(nodes)) return;

      list.appendChild(createAccordionItem(section.label, nodes));
    });

    if (!list.children.length) {
      return;
    }

    const mountPoint = root.querySelector('[data-rc-product-sections]') || root.querySelector('[data-rc-product-desc-source]');
    if (mountPoint) {
      mountPoint.replaceWith(list);
    } else {
      root.appendChild(list);
    }

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
