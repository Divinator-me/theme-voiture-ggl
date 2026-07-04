<<<<<<< HEAD
(() => {
  const timers = document.querySelectorAll('[data-countdown]');

  const getRemainingUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  };

  timers.forEach((timer) => {
    const isMidnight = timer.dataset.countdown === 'midnight';
    const duration = Number(timer.dataset.duration || 604800) * 1000;
    let endTime = Date.now() + duration;

    const parts = {
      days: timer.querySelector('[data-days]'),
      hours: timer.querySelector('[data-hours]'),
      minutes: timer.querySelector('[data-minutes]'),
      seconds: timer.querySelector('[data-seconds]'),
    };

    const pad = (value) => String(value).padStart(2, '0');

    const render = () => {
      const remaining = isMidnight ? getRemainingUntilMidnight() : Math.max(0, endTime - Date.now());

      if (!isMidnight && remaining <= 0) {
        endTime = Date.now() + duration;
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
=======
(() => {
  const timers = document.querySelectorAll('[data-countdown]');

  const getRemainingUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  };

  timers.forEach((timer) => {
    const isMidnight = timer.dataset.countdown === 'midnight';
    const duration = Number(timer.dataset.duration || 604800) * 1000;
    let endTime = Date.now() + duration;

    const parts = {
      days: timer.querySelector('[data-days]'),
      hours: timer.querySelector('[data-hours]'),
      minutes: timer.querySelector('[data-minutes]'),
      seconds: timer.querySelector('[data-seconds]'),
    };

    const pad = (value) => String(value).padStart(2, '0');

    const render = () => {
      const remaining = isMidnight ? getRemainingUntilMidnight() : Math.max(0, endTime - Date.now());

      if (!isMidnight && remaining <= 0) {
        endTime = Date.now() + duration;
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
>>>>>>> 5be370d (Rebuild desktop header with promo bar, nav menu, and collection links.)
