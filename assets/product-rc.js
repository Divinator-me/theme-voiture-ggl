(() => {
  const HEADING_TAGS = new Set(['H2', 'H3', 'H4']);
  const MEDIA_SELECTOR =
    'img, picture, video, audio, iframe, embed, object, source, table, deferred-media, shopify-video, [data-shopify-video]';

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

    const nestedHeadings = wrapper.querySelector(':scope > h2, :scope > h3, :scope > h4');
    if (!nestedHeadings) {
      return nodes;
    }

    return [...wrapper.childNodes].filter(isMeaningfulNode);
  };

  const hasVisibleContent = (element) => {
    if (element.textContent.replace(/\s+/g, '').length > 0) return true;
    return Boolean(element.querySelector(MEDIA_SELECTOR));
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

      if (video.hasAttribute('preload') === false) {
        video.setAttribute('preload', 'metadata');
      }
    });

    root.querySelectorAll('iframe').forEach((iframe) => {
      if (iframe.dataset.src && !iframe.getAttribute('src')) {
        iframe.setAttribute('src', iframe.dataset.src);
      }
    });
  };

  const parseSections = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nodes = getParseableNodes(doc.body);

    const sections = [];
    let current = { title: '', nodes: [] };

    const pushCurrent = () => {
      if (!current.title && current.nodes.length === 0) return;
      sections.push(current);
      current = { title: '', nodes: [] };
    };

    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && isSectionHeading(node)) {
        pushCurrent();
        current.title = getSectionTitle(node);
        return;
      }

      current.nodes.push(node.cloneNode(true));
    });

    pushCurrent();

    if (sections.length === 0) {
      return [{ title: 'Description', nodes, open: true }];
    }

    if (!sections[0].title && sections[0].nodes.length > 0) {
      sections[0].title = 'Présentation';
    }

    return sections.filter((section) => section.title || section.nodes.length > 0);
  };

  const buildAccordion = (root) => {
    if (root.dataset.rcProductDescReady === 'true') return;

    const sourceContent = root.querySelector('[data-rc-product-desc-raw] .rc-product-desc__content');
    const sourceList = root.querySelector('[data-rc-product-desc-source]');
    if (!sourceContent || !sourceList) return;

    const sections = parseSections(sourceContent.innerHTML);

    if (sections.length <= 1 && sections[0]?.title === 'Description') {
      enhanceMedia(sourceContent);
      root.dataset.rcProductDescReady = 'true';
      return;
    }

    const list = document.createElement('div');
    list.className = 'rc-product-desc__list';

    sections.forEach((section, index) => {
      const details = document.createElement('details');
      details.className = 'rc-product-desc__item';
      if (index === 0 || section.open) {
        details.open = true;
      }

      const summary = document.createElement('summary');
      const title = document.createElement('span');
      title.textContent = section.title || 'Description';
      const icon = document.createElement('b');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '+';
      summary.append(title, icon);

      const content = document.createElement('div');
      content.className = 'rc-product-desc__content rte';
      section.nodes.forEach((node) => content.appendChild(node));

      if (!hasVisibleContent(content)) return;

      enhanceMedia(content);
      details.append(summary, content);
      list.appendChild(details);
    });

    if (!list.children.length) {
      enhanceMedia(sourceContent);
      root.dataset.rcProductDescReady = 'true';
      return;
    }

    list.addEventListener('toggle', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLDetailsElement) || !target.open) return;

      list.querySelectorAll('details[open]').forEach((item) => {
        if (item !== target) item.open = false;
      });

      enhanceMedia(target);
    });

    sourceList.replaceWith(list);
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
