(() => {
  const timers = document.querySelectorAll('[data-countdown]');

  const getNextMidnight = () => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next.getTime();
  };

  timers.forEach((timer) => {
    const isMidnight = timer.hasAttribute('data-countdown-midnight');
    const duration = Number(timer.dataset.duration || 604800) * 1000;
    let endTime = isMidnight ? getNextMidnight() : Date.now() + duration;

    const parts = {
      days: timer.querySelector('[data-days]'),
      hours: timer.querySelector('[data-hours]'),
      minutes: timer.querySelector('[data-minutes]'),
      seconds: timer.querySelector('[data-seconds]'),
    };

    const pad = (value) => String(value).padStart(2, '0');

    const render = () => {
      let remaining = endTime - Date.now();

      if (remaining <= 0) {
        endTime = isMidnight ? getNextMidnight() : Date.now() + duration;
        remaining = endTime - Date.now();
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
