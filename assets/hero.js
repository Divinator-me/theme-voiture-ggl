(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const carousel = hero.querySelector('[data-hero-carousel]');
  const track = hero.querySelector('[data-hero-carousel-track]');
  const slides = track ? [...track.querySelectorAll('.rc-hero__slide')] : [];

  if (carousel && track && slides.length > 1) {
    carousel.classList.add('is-js-ready');

    let activeIndex = 0;
    const lastIndex = slides.length - 1;

    const moveTo = (index, animate = true) => {
      track.style.transition = animate ? 'transform 0.72s var(--ease-smooth)' : 'none';
      track.style.transform = `translate3d(-${index * carousel.clientWidth}px, 0, 0)`;
    };

    const switchCar = () => {
      activeIndex += 1;
      moveTo(activeIndex);

      if (activeIndex !== lastIndex) return;

      window.setTimeout(() => {
        activeIndex = 0;
        moveTo(0, false);
      }, 760);
    };

    moveTo(0, false);
    window.setInterval(switchCar, 4000);

    window.addEventListener('resize', () => {
      moveTo(activeIndex, false);
    });
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
