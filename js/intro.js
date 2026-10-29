// Homepage introduction video: starts muted on arrival (browsers only allow muted autoplay),
// "Sound on" restarts it from the beginning with sound, replay at the end.
(function () {
  const v = document.getElementById('intro-video');
  if (!v) return;
  const sound = document.getElementById('intro-sound');
  const center = document.getElementById('intro-play');
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 11-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 4v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let heard = false, userPaused = false;

  function renderSound() {
    sound.hidden = false;
    sound.innerHTML = v.muted ? ICON_OFF + '<span>Sound on</span>' : ICON_ON + '<span>Mute</span>';
    sound.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Mute');
  }
  function showCenter(kind) {
    center.hidden = false;
    center.innerHTML = (kind === 'replay' ? ICON_REPLAY : ICON_PLAY) + '<span>' + (kind === 'replay' ? 'Replay' : 'Play') + '</span>';
  }
  function start() {
    center.hidden = true; userPaused = false;
    const p = v.play();
    if (p && p.catch) p.catch(() => showCenter('play'));
  }

  sound.addEventListener('click', (e) => {
    e.stopPropagation();
    if (v.muted && !heard) { heard = true; v.currentTime = 0; v.muted = false; start(); }
    else v.muted = !v.muted;
    renderSound();
  });
  center.addEventListener('click', (e) => {
    e.stopPropagation();
    if (v.ended) v.currentTime = 0;
    start();
  });
  v.addEventListener('click', () => {
    if (v.paused) start(); else { v.pause(); userPaused = true; showCenter('play'); }
  });
  v.addEventListener('ended', () => showCenter('replay'));
  v.addEventListener('play', () => { center.hidden = true; });

  // pause a muted video that has scrolled away, resume when it returns
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((en) => {
      if (!v.muted || userPaused || v.ended) return;
      if (en.intersectionRatio < 0.25) v.pause(); else if (v.paused && v.currentTime > 0) v.play().catch(() => {});
    }), { threshold: [0, 0.25, 0.5] }).observe(v);
  }

  v.muted = true; renderSound();
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) showCenter('play'); else start();
})();
