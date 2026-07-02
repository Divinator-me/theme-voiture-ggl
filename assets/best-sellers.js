(() => {
  const section = document.querySelector('[data-best-sellers]');

  if (!section) return;

  const track = section.querySelector('[data-slider-track]');
  const previous = section.querySelector('[data-slider-prev]');
  const next = section.querySelector('[data-slider-next]');

  if (!track || !previous || !next) return;

  const getStep = () => {
    const card = track.querySelector('.rc-best-sellers__card');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 14;
    return card ? card.getBoundingClientRect().width + gap : 320;
  };

  previous.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });
})();
