(() => {

  const initSlider = (root) => {

    const track = root.querySelector('[data-slider-track]');

    const previous = root.querySelector('[data-slider-prev]');

    const next = root.querySelector('[data-slider-next]');



    if (!track || !previous || !next || root.dataset.sliderBound === 'true') return;

    root.dataset.sliderBound = 'true';



    const getStep = () => {

      const card = track.querySelector('.rc-product-card');

      const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 10;

      return card ? card.getBoundingClientRect().width + gap : 320;

    };



    previous.addEventListener('click', () => {

      track.scrollBy({ left: -getStep(), behavior: 'smooth' });

    });



    next.addEventListener('click', () => {

      track.scrollBy({ left: getStep(), behavior: 'smooth' });

    });

    window.RcDragScroll?.bind(track);

  };



  const initSection = (root) => {

    initSlider(root);

  };



  class RcProductRecommendations extends HTMLElement {

  #observer = null;

  #cache = {};



  connectedCallback() {

    initSection(this);



    if (this.dataset.recommendationsPerformed === 'true') return;



    this.#observer = new IntersectionObserver(

      (entries, observer) => {

        if (!entries[0]?.isIntersecting) return;

        observer.disconnect();

        this.#load();

      },

      { rootMargin: '0px 0px 400px 0px' }

    );



    this.#observer.observe(this);

  }



  disconnectedCallback() {

    this.#observer?.disconnect();

  }



  async #load() {

    const { productId, sectionId, intent, url } = this.dataset;

    if (!productId || !sectionId || !url) return;



    const fetchUrl = `${url}&product_id=${productId}&section_id=${sectionId}&intent=${intent || 'related'}`;



    if (this.#cache[fetchUrl]) {

      this.#replace(this.#cache[fetchUrl]);

      return;

    }



    try {

      const response = await fetch(fetchUrl);

      if (!response.ok) {

        this.classList.add('is-empty');

        return;

      }



      const html = await response.text();

      if (!html.trim()) {

        this.classList.add('is-empty');

        return;

      }



      this.#cache[fetchUrl] = html;

      this.#replace(html);

    } catch {

      this.classList.add('is-empty');

    }

  }



  #replace(html) {

    const template = document.createElement('template');

    template.innerHTML = html.trim();



    const next = template.content.querySelector('rc-product-recommendations');

    if (!next) {

      this.classList.add('is-empty');

      return;

    }



    this.replaceWith(next);

    initSection(next);

  }

  }



  if (!customElements.get('rc-product-recommendations')) {

    customElements.define('rc-product-recommendations', RcProductRecommendations);

  }



  document.querySelectorAll('rc-product-recommendations').forEach(initSection);

})();

