(() => {
  const HEADING_TAGS = new Set(['H2', 'H3', 'H4']);
  const MEDIA_SELECTOR =
    'img, picture, video, audio, iframe, embed, object, source, table, deferred-media, shopify-video, [data-shopify-video]';

  const SECTION_CONFIG = {
    tout_savoir: { label: 'Tout Savoir', group: 'main', icon: 'toutSavoir' },
    caracteristiques: { label: 'Caractéristiques', group: 'main', icon: 'caracteristiques' },
    points_fort: { label: 'Points Fort', group: 'main', icon: 'pointsFort' },
    livraison_retours: { label: 'Livraison et retours (4 à 8 jours ouvrés)', group: 'bottom', icon: 'livraison' },
    fabrication_rigoureuse: { label: 'Fabrication hautement contrôlée', group: 'bottom', icon: 'fabrication' },
    garantie_2_ans: { label: 'Retour Gratuit et Rapide sous 30 Jours', group: 'bottom', icon: 'garantie' },
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
    'retour gratuit': 'garantie_2_ans',
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

  const isThematicPointHeading = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element.classList.contains('rc-desc-section__title')) return true;
    return element.tagName === 'H3' && resolveSectionId(getSectionTitle(element)) === undefined;
  };

  const isHighlightList = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element.classList.contains('rc-highlights-cards')) return true;
    return Boolean(element.querySelector(':scope > .rc-highlight-card'));
  };

  const hasFullPointSections = (nodes) =>
    nodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.classList.contains('rc-desc-section__title') || node.tagName === 'H3')
    );

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

  const KEYWORD_SKIP_SELECTOR =
    'h1, h2, h3, h4, h5, h6, strong, b, a, button, script, style, svg, code, .rc-desc-section__pitch, .rc-desc-section__title, .rc-desc-section__label, .rc-highlight-card__title, .rc-product-snapshot, .rc-product-snapshot *, .rc-product-expert, .rc-product-expert *';

  const keywordTerm = (term) => `(?<![A-Za-zÀ-ÿ0-9])(?:${term})(?![A-Za-zÀ-ÿ0-9])`;

  const KEYWORD_PATTERN = new RegExp(
    [
      keywordTerm("pièces d['’]origine"),
      keywordTerm('pièces détachées'),
      keywordTerm('support technique'),
      keywordTerm('transmission intégrale'),
      keywordTerm('quatre roues motrices'),
      keywordTerm('4 roues motrices'),
      keywordTerm('suspensions à long débattement'),
      keywordTerm('suspensions indépendantes'),
      keywordTerm('ready[\\s-]?to[\\s-]?run'),
      keywordTerm('2 cellules Li-?Po'),
      keywordTerm('2 cellules Lipo'),
      keywordTerm('moteur sans balais'),
      keywordTerm('moteur brushless'),
      keywordTerm('moteur brushed'),
      keywordTerm('châssis étanche'),
      keywordTerm('boîtier étanche'),
      keywordTerm('électronique étanche'),
      keywordTerm('carrosserie étanche'),
      keywordTerm('mini maxx'),
      keywordTerm('monster truck'),
      keywordTerm('trophy truck'),
      keywordTerm('rallye-raid'),
      keywordTerm('anti-wheeling'),
      '\\d+\\s*km\\/h',
      '1\\/(?:5|8|10|12|14|16|18|24)',
      '2[.,]4\\s*GHz',
      '\\d+(?:[.,]\\d+)?\\s*V(?![A-Za-zÀ-ÿ0-9])',
      '\\d+\\s*mAh',
      '\\d+\\s*kV',
      '\\d{2,3}\\s*A(?![A-Za-zÀ-ÿ0-9])',
      keywordTerm('BL-2S'),
      keywordTerm('[2-4]S'),
      '\\d+\\s*minutes',
      keywordTerm('brushless'),
      keywordTerm('brushed'),
      keywordTerm('étanchéité'),
      keywordTerm('étanche'),
      keywordTerm('Traxxas'),
      keywordTerm('Blackzon'),
      keywordTerm('Maxx'),
      keywordTerm('4x4'),
      keywordTerm('4WD'),
      keywordTerm('RTR'),
      keywordTerm('ESC'),
      keywordTerm('Li-?Po'),
      keywordTerm('Lipo'),
      keywordTerm('LED'),
    ].join('|'),
    'gi'
  );

  const enhanceKeywords = (root) => {
    if (root.dataset.rcKeywordsReady === 'true') return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest(KEYWORD_SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      KEYWORD_PATTERN.lastIndex = 0;
      if (!KEYWORD_PATTERN.test(text)) return;

      KEYWORD_PATTERN.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = KEYWORD_PATTERN.exec(text))) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const strong = document.createElement('strong');
        strong.textContent = match[0];
        fragment.appendChild(strong);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.replaceWith(fragment);
    });

    root.dataset.rcKeywordsReady = 'true';
  };

  const enhanceHighlightCards = (root) => {
    const cards = [...root.querySelectorAll('.rc-highlight-card')];

    if (root.id === 'rc-desc-panel-points_fort') {
      root.querySelectorAll('ul > li').forEach((item) => {
        if (!cards.includes(item)) cards.push(item);
      });
    }

    cards.forEach((card) => {
      card.classList.add('rc-highlight-card');
      card.closest('ul')?.classList.add('rc-highlights-cards');

      const title =
        card.querySelector(':scope > .rc-highlight-card__title') ||
        card.querySelector(':scope > strong, :scope > b');
      if (!title) return;

      title.classList.add('rc-highlight-card__title');

      let body = card.querySelector(':scope > .rc-highlight-card__body');
      if (body) return;

      body = document.createElement('span');
      body.className = 'rc-highlight-card__body';
      [...card.childNodes].forEach((node) => {
        if (node === title) return;
        body.appendChild(node);
      });
      body.textContent = body.textContent.replace(/^\s+/, '');
      if (body.textContent.trim()) card.appendChild(body);
    });
  };

  const enhanceContent = (root) => {
    enhanceMedia(root);
    enhanceHighlightCards(root);
    enhanceKeywords(root);
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
        if (isThematicPointHeading(node)) currentId = 'points_fort';
      } else if (node.nodeType === Node.ELEMENT_NODE && isThematicPointHeading(node)) {
        currentId = 'points_fort';
      }

      if (isHighlightList(node) && hasFullPointSections(buckets.get('points_fort') || [])) {
        return;
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
    if (source) {
      const parsed = parseDescriptionBuckets(source.innerHTML);
      MAIN_SECTION_IDS.forEach((sectionId) => {
        if (!hasVisibleContent(buckets.get(sectionId) || [])) {
          buckets.set(sectionId, parsed.get(sectionId) || []);
        }
      });
    }

    const snapshot = root.querySelector('[data-rc-product-snapshot]');
    if (snapshot) {
      const toutSavoirNodes = buckets.get('tout_savoir') || [];
      toutSavoirNodes.unshift(snapshot);
      buckets.set('tout_savoir', toutSavoirNodes);
    }

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

    const navTop = document.createElement('div');
    navTop.className = 'rc-product-desc__tabs-nav rc-product-desc__tabs-nav--top';
    navTop.setAttribute('role', 'tablist');

    const navBottom = document.createElement('div');
    navBottom.className = 'rc-product-desc__tabs-nav rc-product-desc__tabs-nav--bottom';
    navBottom.setAttribute('role', 'tablist');

    const panels = document.createElement('div');
    panels.className = 'rc-product-desc__tabs-panels';

    const navs = [navTop, navBottom];

    const activateTab = (index, { scrollToPanel = false } = {}) => {
      navs.forEach((navEl) => {
        [...navEl.children].forEach((tab, tabIndex) => {
          const isActive = tabIndex === index;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      });

      [...panels.children].forEach((panel, panelIndex) => {
        const isActive = panelIndex === index;
        panel.hidden = !isActive;
        panel.classList.toggle('is-active', isActive);
        if (isActive) enhanceContent(panel);
      });

      if (!scrollToPanel || !panels.children[index]) return;

      requestAnimationFrame(() => {
        panels.children[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    const createTabButton = (section, index, panelId, suffix = '') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rc-product-desc__tab${index === 0 ? ' is-active' : ''}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.setAttribute('aria-controls', panelId);
      button.id = `rc-desc-tab-${section.id}${suffix}`;
      button.textContent = section.label;
      return button;
    };

    sections.forEach((section, index) => {
      const panelId = `rc-desc-panel-${section.id}`;

      navTop.appendChild(createTabButton(section, index, panelId));
      navBottom.appendChild(createTabButton(section, index, panelId, '-bottom'));

      const panel = document.createElement('div');
      panel.className = `rc-product-desc__tab-panel rte${index === 0 ? ' is-active' : ''}`;
      panel.setAttribute('role', 'tabpanel');
      panel.id = panelId;
      panel.setAttribute('aria-labelledby', `rc-desc-tab-${section.id}`);
      panel.hidden = index !== 0;
      section.nodes.forEach((node) => panel.appendChild(node));
      if (index === 0) enhanceContent(panel);

      panels.appendChild(panel);
    });

    navTop.addEventListener('click', (event) => {
      const button = event.target.closest('.rc-product-desc__tab');
      if (!button || !navTop.contains(button)) return;
      const index = [...navTop.children].indexOf(button);
      if (index >= 0) activateTab(index);
    });

    navBottom.addEventListener('click', (event) => {
      const button = event.target.closest('.rc-product-desc__tab');
      if (!button || !navBottom.contains(button)) return;
      const index = [...navBottom.children].indexOf(button);
      if (index >= 0) activateTab(index, { scrollToPanel: true });
    });

    wrapper.append(navTop, panels, navBottom);
    return wrapper;
  };

  const createAccordionItem = (sectionId, nodes) => {
    const config = SECTION_CONFIG[sectionId];
    const details = document.createElement('details');
    details.className = 'rc-product-desc__item';

    const content = document.createElement('div');
    content.className = 'rc-product-desc__content rte';
    nodes.forEach((node) => content.appendChild(node));
    enhanceContent(content);

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
      descriptionGroup.open = true;
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
