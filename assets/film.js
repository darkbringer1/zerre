(() => {
  // The product film: chapter buttons jump to their moment; the first play is counted once.
  const video = document.getElementById('film-video');
  if (!video) return;
  function jump(seconds) {
    const go = () => {
      video.currentTime = seconds;
      video.play().catch(() => {});
    };
    // With preload="metadata" nothing may be loaded yet: seek once the duration is known.
    if (video.readyState >= 1) go();
    else {
      video.addEventListener('loadedmetadata', go, { once: true });
      video.load();
    }
  }
  document.querySelectorAll('[data-film-at]').forEach((button) => {
    button.addEventListener('click', () => jump(Number(button.dataset.filmAt)));
  });
  let counted = false;
  video.addEventListener('play', () => {
    if (counted) return;
    counted = true;
    if (window.zerreCount) window.zerreCount('click-film-play');
  });
})();
