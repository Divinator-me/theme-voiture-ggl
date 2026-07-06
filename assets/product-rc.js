(() => {
  const HEADING_TAGS = new Set(['H2', 'H3', 'H4']);
  const MEDIA_SELECTOR =
    'img, picture, video, audio, iframe, embed, object, source, table, deferred-media, shopify-video, [data-shopify-video]';

  const SECTION_CONFIG = {
    tout_savoir: { label: 'Tout Savoir', group: 'main', icon: 'toutSavoir' },
    caracteristiques: { label: 'Caractéristiques', group: 'main', icon: 'caracteristiques' },
    points_fort: { label: 'Points Fort', group: 'main', icon: 'pointsFort' },
    livraison_retours: { label: 'Livraison et retours', group: 'bottom', icon: 'livraison' },
    fabrication_rigoureuse: { label: 'Fabrication hautement contrôlée', group: 'bottom', icon: 'fabrication' },
    garantie_2_ans: { label: 'Garantie 2 ans', group: 'bottom', icon: 'garantie' },
  };

  const MAIN_SECTION_IDS = ['tout_savoir', 'caracteristiques', 'points_fort'];
  const BOTTOM_SECTION_IDS = ['livraison_retours', 'fabrication_rigoureuse', 'garantie_2_ans'];

  const SECTION_ALIASES = {
    'tout savoir': 'tout_savoir',
    caracteristiques: 'caracteristiques',
    'points fort': 'points_fort',
    'points forts': 'points_fort',
    'livraison et retours': 'livraison_retours',
    'livraison et retour': 'livraison_retours',
    livraison: 'livraison_retours',
    retours: 'livraison_retours',
    'commande et livraison': 'livraison_retours',
    'commande & livraison': 'livraison_retours',
    'fabrication hautement controlee': 'fabrication_rigoureuse',
    'fabrication rigoureuse et resistante': 'fabrication_rigoureuse',
    fabrication: 'fabrication_rigoureuse',
    garantie: 'garantie_2_ans',
    'garantie 6 mois': 'garantie_2_ans',
    'garantie 2 ans': 'garantie_2_ans',
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
    fabrication:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.25" stroke="currentColor" stroke-width="1.5"/></svg>',
    garantie:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="m8.5 12.2 2.2 2.2 5-5.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  const TOGGLE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const normalize = (text) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const createEmptyBuckets = () => {
    const buckets = new Map();
    Object.keys(SECTION_CONFIG).forEach((id) => buckets.set(id, []));
    return buckets;
  };

  const isMeaningfulNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim().length > 0;
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

  const resolveSectionId = (title) => {
    const normalized = normalize(title);
    if (Object.prototype.hasOwnProperty.call(SECTION_ALIASES, normalized)) {
      return SECTION_ALIASES[normalized];
    }
    if (normalized.startsWith('points fort')) return 'points_fort';
    return undefined;
  };

  const getParseableNodes = (body) => {
    const nodes = [...body.childNodes].filter(isMeaningfulNode);
    if (nodes.length !== 1 || nodes[0].nodeType !== Node.ELEMENT_NODE) return nodes;

    const wrapper = nodes[0];
    if (!new Set(['DIV', 'ARTICLE', 'SECTION', 'MAIN']).has(wrapper.tagName)) return nodes;
    if (!wrapper.querySelector(':scope > h2, :scope > h3, :scope > h4, :scope > p > strong, :scope > p > b')) {
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
      if (!video.hasAttribute('preload')) video.setAttribute('preload', 'metadata');
    });

    root.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.dataset.src && !iframe.getAttribute('src')) {
        iframe.setAttribute('src', iframe.dataset.src);
      }
    });
  };

  const nodesFromHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return [...temp.childNodes];
  };

  const parseDescriptionBuckets = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nodes = getParseableNodes(doc.body);
    const buckets = createEmptyBuckets();
    let currentId = 'tout_savoir';

    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && isSectionHeading(node)) {
        const sectionId = resolveSectionId(getSectionTitle(node));
        if (sectionId === null) return;
        if (sectionId) {
          currentId = sectionId;
          return;
        }
      }

      buckets.get(currentId).push(node.cloneNode(true));
    });

    return buckets;
  };

  const getSectionBuckets = (root) => {
    const buckets = createEmptyBuckets();
    const sectionsJson = root.querySelector('[data-rc-product-sections]');

    if (sectionsJson) {
      try {
        const data = JSON.parse(sectionsJson.textContent);
        Object.entries(data).forEach(([sectionId, html]) => {
          if (!SECTION_CONFIG[sectionId] || !html || typeof html !== 'string' || !html.trim()) return;
          buckets.set(sectionId, nodesFromHtml(html));
        });
      } catch (error) {
        // Invalid JSON: description parsing remains available as fallback.
      }
    }

    const source = root.querySelector('[data-rc-product-desc-source]');
    if (!source) return buckets;

    const parsed = parseDescriptionBuckets(source.innerHTML);
    MAIN_SECTION_IDS.forEach((sectionId) => {
      if (!hasVisibleContent(buckets.get(sectionId) || [])) {
        buckets.set(sectionId, parsed.get(sectionId) || []);
      }
    });

    return buckets;
  };

  const createSummary = (title, iconKey = 'description') => {
    const summary = document.createElement('summary');
    const main = document.createElement('span');
    main.className = 'rc-product-desc__summary-main';

    const icon = document.createElement('span');
    icon.className = 'rc-product-desc__icon';
    icon.innerHTML = ICONS[iconKey] || ICONS.description;

    const label = document.createElement('span');
    label.className = 'rc-product-desc__label';
    label.textContent = title;

    const toggle = document.createElement('span');
    toggle.className = 'rc-product-desc__toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.innerHTML = TOGGLE_ICON;

    main.append(icon, label);
    summary.append(main, toggle);
    return summary;
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
      const tabId = `rc-desc-tab-${section.id}`;
      const panelId = `rc-desc-panel-${section.id}`;

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
      if (index === 0) enhanceMedia(panel);

      nav.appendChild(button);
      panels.appendChild(panel);
    });

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('.rc-product-desc__tab');
      if (!button || !nav.contains(button)) return;
      const index = [...nav.children].indexOf(button);
      if (index >= 0) activateTab(index);
    });

    wrapper.append(nav, panels);
    return wrapper;
  };

  const createAccordionItem = (sectionId, nodes) => {
    const config = SECTION_CONFIG[sectionId];
    const details = document.createElement('details');
    details.className = 'rc-product-desc__item';

    const content = document.createElement('div');
    content.className = 'rc-product-desc__content rte';
    nodes.forEach((node) => content.appendChild(node));
    enhanceMedia(content);

    details.append(createSummary(config.label, config.icon), content);
    return details;
  };

  const buildProductDescription = (root) => {
    if (root.dataset.rcProductDescReady === 'true') return;

    const buckets = getSectionBuckets(root);
    const list = document.createElement('div');
    list.className = 'rc-product-desc__list';

    const tabSections = MAIN_SECTION_IDS.map((id) => ({
      id,
      label: SECTION_CONFIG[id].label,
      nodes: buckets.get(id) || [],
    })).filter((section) => hasVisibleContent(section.nodes));

    if (tabSections.length) {
      const descriptionGroup = document.createElement('details');
      descriptionGroup.className = 'rc-product-desc__group';
      descriptionGroup.append(createSummary('Description', 'description'));
      descriptionGroup.append(createTabsPanel(tabSections));
      list.appendChild(descriptionGroup);
    }

    BOTTOM_SECTION_IDS.forEach((sectionId) => {
      const nodes = buckets.get(sectionId) || [];
      if (!hasVisibleContent(nodes)) return;
      list.appendChild(createAccordionItem(sectionId, nodes));
    });

    if (!list.children.length) return;

    const mountPoint =
      root.querySelector('[data-rc-product-sections]') || root.querySelector('[data-rc-product-desc-source]');
    mountPoint.replaceWith(list);
    root.dataset.rcProductDescReady = 'true';
  };

  const init = (scope = document) => {
    scope.querySelectorAll('[data-rc-product-desc]:not([data-rc-product-desc-ready])').forEach((root) => {
      buildProductDescription(root);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => {
    init(event.target);
  });
})();
