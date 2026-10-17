(() => {
  const playWhenReady = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    const attempt = () => {
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    };
    if (video.readyState >= 2) attempt();
    else video.addEventListener('canplay', attempt, { once: true });
    attempt();
  };

  const watchVideo = (video) => {
    if (video.dataset.rcSessionReady === 'true') return;
    video.dataset.rcSessionReady = 'true';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (typeof IntersectionObserver !== 'function') {
      playWhenReady(video);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) playWhenReady(video);
          else video.pause();
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(video);
  };

  const watchYouTube = (iframe) => {
    if (iframe.dataset.rcSessionReady === 'true') return;
    iframe.dataset.rcSessionReady = 'true';
    const source = iframe.dataset.src || iframe.getAttribute('src');
    if (!source) return;

    const start = () => {
      if (iframe.getAttribute('src') === source) return;
      iframe.setAttribute('src', source);
    };

    if (typeof IntersectionObserver !== 'function') {
      start();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          start();
          observer.disconnect();
        });
      },
      { rootMargin: '180px 0px', threshold: 0.15 }
    );
    observer.observe(iframe);
  };

  const boot = () => {
    document.querySelectorAll('.rc-session__video').forEach(watchVideo);
    document.querySelectorAll('.rc-session__yt').forEach(watchYouTube);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
