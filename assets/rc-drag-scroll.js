(() => {
  const DRAG_THRESHOLD = 10;

  const bindDragScroll = (track) => {
    if (!track || track.dataset.dragScrollBound === 'true') return;
    track.dataset.dragScrollBound = 'true';

    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let isDragging = false;
    let suppressClick = false;

    const onPointerMove = (event) => {
      if (event.pointerId !== pointerId) return;

      const delta = event.clientX - startX;

      if (!isDragging) {
        if (Math.abs(delta) <= DRAG_THRESHOLD) return;
        isDragging = true;
        track.classList.add('is-drag-scroll-active');
        suppressClick = true;
        try {
          track.setPointerCapture(pointerId);
        } catch (_) {}
      }

      event.preventDefault();
      track.scrollLeft = startScroll - delta;
    };

    const endPointer = (event) => {
      if (event.pointerId !== pointerId) return;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);

      track.classList.remove('is-drag-scroll-active');

      try {
        track.releasePointerCapture(pointerId);
      } catch (_) {}

      if (isDragging) {
        suppressClick = true;
      } else {
        suppressClick = false;
      }

      pointerId = null;
      isDragging = false;
    };

    track.addEventListener('dragstart', (event) => {
      event.preventDefault();
    });

    track.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      isDragging = false;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endPointer);
      window.addEventListener('pointercancel', endPointer);
    });

    track.addEventListener(
      'click',
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  };

  const bindCategoryDots = (section) => {
    const track = section.querySelector('.rc-categories__track');
    const dotsWrap = section.querySelector('.rc-categories__dots');
    if (!track || !dotsWrap || dotsWrap.dataset.dotsBound === 'true') return;
    dotsWrap.dataset.dotsBound = 'true';

    const cards = [...track.querySelectorAll('.rc-category-card')];
    if (cards.length < 2) {
      dotsWrap.hidden = true;
      return;
    }

    const dots = cards.map((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rc-categories__dot';
      const label =
        card.querySelector('.rc-category-card__title')?.textContent?.trim() ||
        card.getAttribute('aria-label') ||
        `Collection ${index + 1}`;
      button.setAttribute('aria-label', `Aller à ${label}`);
      button.addEventListener('click', () => {
        track.scrollTo({
          left: card.offsetLeft - cards[0].offsetLeft,
          behavior: 'smooth',
        });
      });
      return button;
    });

    dotsWrap.replaceChildren(...dots);

    const update = () => {
      const origin =
        track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).paddingLeft) || 0);
      let best = 0;
      let bestDist = Infinity;

      cards.forEach((card, index) => {
        const dist = Math.abs(card.getBoundingClientRect().left - origin);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });

      dots.forEach((dot, index) => {
        const active = index === best;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    };

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  const initDragScroll = (root = document) => {
    root.querySelectorAll('.rc-best-sellers__track, .rc-categories__track').forEach(bindDragScroll);
    root.querySelectorAll('.rc-categories').forEach(bindCategoryDots);
  };

  window.RcDragScroll = {
    bind: bindDragScroll,
    init: initDragScroll,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initDragScroll());
  } else {
    initDragScroll();
  }
})();
