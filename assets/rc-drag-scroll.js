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

  const initDragScroll = (root = document) => {
    root.querySelectorAll('.rc-best-sellers__track, .rc-categories__track').forEach(bindDragScroll);
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
