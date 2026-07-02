(() => {
  const hero = document.querySelector('[data-hero]');

  if (!hero) return;

  const carousel = hero.querySelector('[data-hero-carousel]');
  const cars = carousel ? [...carousel.querySelectorAll('.rc-hero__image')] : [];
  let activeIndex = cars.findIndex((car) => car.classList.contains('is-active'));

  if (cars.length > 1) {
    activeIndex = activeIndex >= 0 ? activeIndex : 0;
    cars[activeIndex].classList.add('is-active');

    const switchCar = () => {
      const current = cars[activeIndex];
      activeIndex = (activeIndex + 1) % cars.length;
      const next = cars[activeIndex];

      next.classList.remove('is-exiting');
      current.classList.add('is-exiting');
      current.classList.remove('is-active');

      requestAnimationFrame(() => {
        next.classList.add('is-active');
      });

      window.setTimeout(() => {
        current.classList.remove('is-exiting');
      }, 700);
    };

    window.setInterval(switchCar, 4000);
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
