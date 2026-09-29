(() => {
  // Cloudflare counts these first-party requests in HTTP Traffic when the
  // hostname is proxied. No cookies, identifiers, or external scripts.
  const events = new Set([
    'click-download',
    'click-download-section',
    'click-feedback',
    'click-releases',
    'click-privacy',
    'click-support',
    'click-meet',
    'click-how-it-works',
    'click-demo-agent',
    'click-demo-commit',
    'click-demo-focus',
    'section-hero',
    'section-meet',
    'section-how-it-works',
    'section-calm',
    'section-privacy',
    'section-download',
    'section-feedback'
  ]);

  function count(eventName) {
    if (!events.has(eventName)) return;
    fetch(`/assets/analytics/${eventName}.txt`, {
      cache: 'no-store',
      credentials: 'omit',
      keepalive: true
    }).catch(() => {});
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const moment = target.closest('[data-moment]');
    if (moment && ['agent', 'commit', 'focus'].includes(moment.dataset.moment)) {
      count(`click-demo-${moment.dataset.moment}`);
      return;
    }

    const link = target.closest('a[href]');
    if (!link) return;

    const url = new URL(link.href, window.location.href);
    if (url.hostname === 'github.com' && url.pathname.endsWith('.dmg')) {
      count('click-download');
    } else if (url.hostname === 'github.com' && url.pathname.includes('/issues')) {
      count('click-feedback');
    } else if (url.origin === window.location.origin && url.pathname === '/releases') {
      count('click-releases');
    } else if (url.origin === window.location.origin && url.pathname === '/privacy') {
      count('click-privacy');
    } else if (url.origin === window.location.origin && url.pathname === '/support') {
      count('click-support');
    } else if (url.origin === window.location.origin && url.hash === '#download') {
      count('click-download-section');
    } else if (url.origin === window.location.origin && url.hash === '#meet') {
      count('click-meet');
    } else if (url.origin === window.location.origin && url.hash === '#how-it-works') {
      count('click-how-it-works');
    }
  });

  if (!('IntersectionObserver' in window)) return;

  const seen = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
      const section = entry.target.dataset.analyticsSection;
      if (!section || seen.has(section)) continue;
      seen.add(section);
      count(`section-${section.replaceAll('_', '-')}`);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-analytics-section]').forEach((element) => {
    observer.observe(element);
  });
})();
