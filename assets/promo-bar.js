(() => {
  const initPromoCountdown = () => {
    const countdown = document.querySelector('[data-promo-countdown]');
    if (!countdown) return;

    const parts = {
      days: countdown.querySelector('[data-days]'),
      hours: countdown.querySelector('[data-hours]'),
      minutes: countdown.querySelector('[data-minutes]'),
      seconds: countdown.querySelector('[data-seconds]'),
    };

    const pad = (value) => String(value).padStart(2, '0');

    const getRemainingUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return Math.max(0, midnight.getTime() - now.getTime());
    };

    const render = () => {
      const remaining = getRemainingUntilMidnight();
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
  };

  initPromoCountdown();
  document.addEventListener('shopify:section:load', initPromoCountdown);
})();
