(() => {
  const section = document.querySelector('[data-categories]');

  if (!section) return;

  const show = () => section.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    show();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show();
        observer.disconnect();
      });
    },
    { threshold: 0.2 }
  );

  observer.observe(section);
})();
