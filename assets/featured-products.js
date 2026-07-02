(() => {
  const section = document.querySelector('[data-featured-products]');

  if (!section) return;

  const track = section.querySelector('[data-slider-track]');
  const previous = section.querySelector('[data-slider-prev]');
  const next = section.querySelector('[data-slider-next]');

  if (!track || !previous || !next) return;

  const getStep = () => {
    const card = track.querySelector('.rc-product-card');
    return card ? card.getBoundingClientRect().width + 18 : 320;
  };

  previous.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });
})();
