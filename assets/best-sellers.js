(() => {
  const section = document.querySelector('[data-best-sellers]');

  if (!section) return;

  const track = section.querySelector('[data-slider-track]');
  const previous = section.querySelector('[data-slider-prev]');
  const next = section.querySelector('[data-slider-next]');
  const wishlistKey = 'rc-wishlist';

  const getWishlist = () => {
    try {
      return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
    } catch {
      return [];
    }
  };

  const saveWishlist = (items) => {
    localStorage.setItem(wishlistKey, JSON.stringify(items));
  };

  const syncWishlistButtons = () => {
    const wishlist = getWishlist();

    section.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
      const productId = button.dataset.productId;
      const isActive = wishlist.includes(productId);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  section.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const productId = button.dataset.productId;
      if (!productId) return;

      const wishlist = getWishlist();
      const isActive = wishlist.includes(productId);
      const nextWishlist = isActive
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId];

      saveWishlist(nextWishlist);
      button.classList.toggle('is-active', !isActive);
      button.setAttribute('aria-pressed', String(!isActive));
    });
  });

  syncWishlistButtons();

  if (!track || !previous || !next) return;

  const getStep = () => {
    const card = track.querySelector('.rc-best-sellers__card');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 10;
    return card ? card.getBoundingClientRect().width + gap : 320;
  };

  previous.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });
})();
