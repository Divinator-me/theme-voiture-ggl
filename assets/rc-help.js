const root = document.querySelector('[data-rc-help]');

if (root) {
  const buttons = root.querySelectorAll('[data-rc-help-open]');

  const closeAll = () => {
    buttons.forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
      const panel = document.getElementById(button.getAttribute('aria-controls') || '');
      if (panel) panel.hidden = true;
    });
  };

  const open = (name) => {
    closeAll();
    const button = root.querySelector(`[data-rc-help-open="${name}"]`);
    const panel = document.getElementById(button?.getAttribute('aria-controls') || '');
    if (!button || !panel) return;
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.getAttribute('data-rc-help-open');
      if (button.getAttribute('aria-expanded') === 'true') closeAll();
      else open(name);
    });
  });

  root.querySelectorAll('[data-rc-help-close]').forEach((button) => {
    button.addEventListener('click', closeAll);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
}
