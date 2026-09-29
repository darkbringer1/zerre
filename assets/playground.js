(() => {
  setUpInstall();

  const desktop = document.getElementById('desktop-demo');
  if (!desktop) return;

  const moments = {
    agent: {
      command: 'codex finished a task',
      output: 'Done. Zerre noticed.',
      message: 'Your agent is done!',
      detail: 'Ready when you are.',
      pose: 'zerre-agent',
      alt: 'Zerre holding up a sticky note with a check mark'
    },
    commit: {
      command: 'git commit completed',
      output: 'A little thing shipped.',
      message: 'You shipped it!',
      detail: 'That deserves a tiny celebration.',
      pose: 'zerre-commit',
      alt: 'Zerre hopping with a big grin as confetti flies'
    },
    focus: {
      command: 'focus block complete',
      output: 'Time well spent.',
      message: 'Focus time, done.',
      detail: 'A little progress, noticed.',
      pose: 'zerre-focus',
      blink: 'zerre-focus-blink',
      alt: 'Zerre typing on its own tiny laptop'
    }
  };

  const command = document.getElementById('demo-command');
  const output = document.getElementById('demo-output');
  const message = document.getElementById('demo-message');
  const detail = document.getElementById('demo-detail');
  const pose = document.getElementById('demo-pose');
  const blink = document.getElementById('demo-blink');
  const sprite = (name) => `/assets/sprites/${name}.png`;

  // Preload every pose so a click swaps instantly.
  for (const moment of Object.values(moments)) {
    for (const name of [moment.pose, moment.blink]) {
      if (name) new Image().src = sprite(name);
    }
  }
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
      if (pose) {
        pose.src = sprite(selected.pose);
        pose.alt = selected.alt;
      }
      if (blink) {
        if (selected.blink) blink.src = sprite(selected.blink);
        blink.hidden = !selected.blink;
      }

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

// "Or install from Terminal": Homebrew or the one-line script, with a copy button.
function setUpInstall() {
  const box = document.getElementById('install');
  if (!box) return;

  const methods = {
    brew: {
      command: 'brew install --cask darkbringer1/tap/zerre',
      note: 'Installs the app and the <code>zerrectl</code> command. Zerre keeps itself up to date.'
    },
    script: {
      command: 'curl -fsSL https://zerre.dogukaan.dev/install.sh | sh',
      note: 'Checks the download\u2019s checksum and signature, installs to Applications and links <code>zerrectl</code>. No password needed. <a href="/install.sh">Read the script</a>.'
    }
  };
  const tabs = [...box.querySelectorAll('[data-install]')];
  const panel = document.getElementById('install-panel');
  const code = document.getElementById('install-code');
  const note = document.getElementById('install-note');
  const copy = document.getElementById('install-copy');
  let current = 'brew';

  function select(tab, focus) {
    current = tab.dataset.install;
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', tab.id);
    code.textContent = methods[current].command;
    note.innerHTML = methods[current].note;
    copy.textContent = 'Copy';
    if (focus) tab.focus();
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const step = event.key === 'ArrowRight' ? 1 : -1;
      select(tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length], true);
    });
  }

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(methods[current].command);
      copy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copy.textContent = 'Press \u2318C';
    }
    window.zerreCount?.(`click-copy-${current}`);
  });
}
