(() => {
  const PROMO_WEEK_ANCHOR = { year: 2026, month: 6, day: 29 };
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const pad = (value) => String(value).padStart(2, '0');

  const startOfDay = (date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  const endOfDay = (date) => {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
  };

  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const formatPromoDate = (date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;

  const getPromoWeek = () => {
    const anchor = startOfDay(new Date(PROMO_WEEK_ANCHOR.year, PROMO_WEEK_ANCHOR.month - 1, PROMO_WEEK_ANCHOR.day));
    const today = startOfDay(new Date());
    let weekStart = new Date(anchor);

    if (today < anchor) {
      return {
        weekStart: anchor,
        weekEnd: endOfDay(addDays(anchor, 6)),
      };
    }

    const weeksSinceAnchor = Math.floor((today - anchor) / WEEK_MS);
    weekStart = addDays(anchor, weeksSinceAnchor * 7);

    return {
      weekStart,
      weekEnd: endOfDay(addDays(weekStart, 6)),
    };
  };

  const updatePromoDates = () => {
    const { weekStart, weekEnd } = getPromoWeek();
    const label = `Du ${formatPromoDate(weekStart)} au ${formatPromoDate(weekEnd)}`;

    document.querySelectorAll('.promo-bar__dates').forEach((element) => {
      element.textContent = label;
    });
  };

  const getRemainingUntil = (target) => Math.max(0, target.getTime() - Date.now());

  updatePromoDates();

  const timers = document.querySelectorAll('[data-countdown]');

  timers.forEach((timer) => {
    const mode = timer.dataset.countdown;
    const duration = Number(timer.dataset.duration || 604800) * 1000;
    let endTime = Date.now() + duration;

    const parts = {
      days: timer.querySelector('[data-days]'),
      hours: timer.querySelector('[data-hours]'),
      minutes: timer.querySelector('[data-minutes]'),
      seconds: timer.querySelector('[data-seconds]'),
    };

    const render = () => {
      let remaining;

      if (mode === 'midnight') {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        remaining = getRemainingUntil(midnight);
      } else if (mode === 'week-end') {
        remaining = getRemainingUntil(getPromoWeek().weekEnd);
      } else {
        remaining = Math.max(0, endTime - Date.now());
        if (remaining <= 0) {
          endTime = Date.now() + duration;
          remaining = duration;
        }
      }

      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      if (parts.days) parts.days.textContent = pad(days);
      if (parts.hours) parts.hours.textContent = pad(hours);
      if (parts.minutes) parts.minutes.textContent = pad(minutes);
      if (parts.seconds) parts.seconds.textContent = pad(seconds);
    };

    render();
    window.setInterval(render, 1000);
  });
})();
