(() => {
  const desktop = document.getElementById('desktop-demo');
  if (!desktop) return;

  const moments = {
    agent: {
      command: 'codex finished a task',
      output: 'Done. Zerre noticed.',
      message: 'Your agent is done!',
      detail: 'Ready when you are.'
    },
    commit: {
      command: 'git commit completed',
      output: 'A little thing shipped.',
      message: 'You shipped it!',
      detail: 'That deserves a tiny celebration.'
    },
    focus: {
      command: 'focus block complete',
      output: 'Time well spent.',
      message: 'Focus time, done.',
      detail: 'A little progress, noticed.'
    }
  };

  const command = document.getElementById('demo-command');
  const output = document.getElementById('demo-output');
  const message = document.getElementById('demo-message');
  const detail = document.getElementById('demo-detail');
  const buttons = [...desktop.querySelectorAll('[data-moment]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reactionTimer;

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const selected = moments[button.dataset.moment];
      if (!selected) return;

      command.textContent = selected.command;
      output.textContent = selected.output;
      message.textContent = selected.message;
      detail.textContent = selected.detail;

      for (const item of buttons) {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      }

      clearTimeout(reactionTimer);
      desktop.classList.remove('is-reacting');
      if (!reducedMotion.matches) {
        void desktop.offsetWidth;
        desktop.classList.add('is-reacting');
        reactionTimer = setTimeout(() => desktop.classList.remove('is-reacting'), 650);
      }
    });
  }
})();
