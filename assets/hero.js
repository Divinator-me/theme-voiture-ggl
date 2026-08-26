(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const carousel = hero.querySelector('[data-hero-carousel]');
  const track = hero.querySelector('[data-hero-carousel-track]');
  const slides = track
    ? [...track.querySelectorAll('.rc-hero__slide')].filter((slide) => !slide.querySelector('[data-hero-clone]'))
    : [];

  if (carousel && track && slides.length > 1) {
    carousel.classList.add('is-js-ready');

    let activeIndex = 0;

    const setActive = (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });
    };

    const switchCar = () => {
      activeIndex = (activeIndex + 1) % slides.length;
      setActive(activeIndex);
    };

    setActive(0);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.setInterval(switchCar, 4000);
    }
  }

  const reveal = () => hero.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal();
        observer.disconnect();
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(hero);
})();
