(() => {
  const PROMO_END_ISO = '2026-07-12T23:59:59+02:00';

  const initPromoCountdown = () => {
    const countdown = document.querySelector('[data-promo-countdown]');
    if (!countdown) return;

    const parts = {
      days: countdown.querySelector('[data-days]'),
      hours: countdown.querySelector('[data-hours]'),
      minutes: countdown.querySelector('[data-minutes]'),
      seconds: countdown.querySelector('[data-seconds]'),
    };

    const endTimestamp = Number(countdown.dataset.promoCountdownEnd || 0) * 1000
      || new Date(PROMO_END_ISO).getTime();

    const pad = (value) => String(value).padStart(2, '0');

    const getRemaining = () => Math.max(0, endTimestamp - Date.now());

    const render = () => {
      const remaining = getRemaining();
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      if (parts.days) parts.days.textContent = pad(days);
      if (parts.hours) parts.hours.textContent = pad(hours);
      if (parts.minutes) parts.minutes.textContent = pad(minutes);
      if (parts.seconds) parts.seconds.textContent = pad(seconds);

      return remaining;
    };

    render();

    const timerId = window.setInterval(() => {
      if (render() === 0) window.clearInterval(timerId);
    }, 1000);
  };

  initPromoCountdown();
  document.addEventListener('shopify:section:load', initPromoCountdown);
})();
