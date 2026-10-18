(() => {
  const withYouTubeAutoplay = (url) => {
    try {
      const parsed = new URL(url, window.location.origin);
      parsed.searchParams.set('autoplay', '1');
      parsed.searchParams.set('mute', '1');
      parsed.searchParams.set('playsinline', '1');
      return parsed.toString();
    } catch (error) {
      return url;
    }
  };

  const playWhenReady = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
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
    playWhenReady(video);

    if (typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) playWhenReady(video);
          else video.pause();
        });
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    );
    observer.observe(video);
  };

  const watchYouTube = (iframe) => {
    if (iframe.dataset.rcSessionReady === 'true') return;
    iframe.dataset.rcSessionReady = 'true';
    const source = withYouTubeAutoplay(iframe.dataset.src || iframe.getAttribute('src') || '');
    if (!source) return;

    const start = () => {
      if (iframe.getAttribute('src') !== source) iframe.setAttribute('src', source);
    };

    start();

    if (typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          start();
        });
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    );
    observer.observe(iframe);
  };

  const retryMutedVideos = () => {
    document.querySelectorAll('.rc-session__video, .product-media-container video, .rc-desc-section__video video').forEach((video) => {
      video.muted = true;
      video.volume = 0;
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    });
  };

  const boot = () => {
    document.querySelectorAll('.rc-session__video').forEach(watchVideo);
    document.querySelectorAll('.rc-session__yt').forEach(watchYouTube);
    window.addEventListener('pointerdown', retryMutedVideos, { once: true, passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
