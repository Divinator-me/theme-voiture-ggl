(() => {
  const SWIPE_MIN = 48;
  const MOBILE_MQ = '(max-width: 749px)';

  class RcProductStories extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready === 'true') return;
      this.dataset.ready = 'true';

      try {
        this.stories = JSON.parse(this.querySelector('[data-rc-stories]')?.textContent || '[]');
      } catch (error) {
        this.stories = [];
      }

      this.viewer = this.querySelector('[data-rc-story-viewer]');
      this.stage = this.querySelector('[data-rc-story-stage]');
      this.desktopVideo = this.querySelector('[data-rc-story-video]');
      this.reel = this.querySelector('[data-rc-story-reel]');
      this.peeks = this.querySelector('[data-rc-story-peeks]');
      this.index = 0;
      this.muted = false;
      this.drag = null;
      this.reelVideos = [];

      this.buildProgress();
      this.prepareThumbs();
      this.bind();
    }

    isMobile() {
      return window.matchMedia(MOBILE_MQ).matches;
    }

    currentVideo() {
      if (this.isMobile() && this.reelVideos[this.index]) return this.reelVideos[this.index];
      return this.desktopVideo;
    }

    buildProgress() {
      this.progressGroups = [...this.querySelectorAll('[data-rc-story-progress]')].map((bar) => {
        bar.innerHTML = this.stories.map(() => '<span class="rc-stories__seg"><i></i></span>').join('');
        return [...bar.querySelectorAll('.rc-stories__seg')];
      });
    }

    prepareThumbs() {
      this.querySelectorAll('[data-rc-story-thumb]').forEach((thumb, index) => {
        const story = this.stories[index];
        if (!story?.src || story.src.startsWith('STORY_URL')) return;
        thumb.appendChild(this.storyPreview(story));
      });
    }

    bind() {
      this.querySelectorAll('[data-rc-story-open]').forEach((button) => {
        button.addEventListener('click', () => this.open(Number(button.dataset.rcStoryOpen) || 0));
      });

      this.querySelectorAll('[data-rc-story-close]').forEach((button) => {
        button.addEventListener('click', () => this.close());
      });

      this.querySelectorAll('[data-rc-story-prev]').forEach((button) => {
        button.addEventListener('click', (event) => {
          if (this.ignoreClick) {
            event.preventDefault();
            return;
          }
          this.prev();
        });
      });

      this.querySelectorAll('[data-rc-story-next]').forEach((button) => {
        button.addEventListener('click', (event) => {
          if (this.ignoreClick) {
            event.preventDefault();
            return;
          }
          this.next();
        });
      });

      this.querySelectorAll('[data-rc-story-pause]').forEach((button) => {
        button.addEventListener('click', () => this.togglePause());
      });

      this.querySelectorAll('[data-rc-story-mute]').forEach((button) => {
        button.addEventListener('click', () => this.toggleMute());
      });

      this.peeks?.addEventListener('click', (event) => {
        const jump = event.target.closest('[data-rc-story-jump]');
        if (!jump) return;
        this.load(Number(jump.dataset.rcStoryJump));
      });

      this.viewer?.addEventListener('click', (event) => {
        if (this.isMobile()) return;
        if (event.target === this.viewer || event.target === this.stage) this.close();
      });

      this.desktopVideo?.addEventListener('ended', () => this.next({ fromEnd: true }));
      this.desktopVideo?.addEventListener('timeupdate', () => {
        if (!this.isMobile()) this.updateProgress();
      });
      this.desktopVideo?.addEventListener('play', () => this.syncTools());
      this.desktopVideo?.addEventListener('pause', () => this.syncTools());

      this.viewer?.addEventListener('pointerdown', (event) => this.onPointerDown(event));
      this.viewer?.addEventListener('pointerup', (event) => this.onPointerUp(event));
      this.viewer?.addEventListener('pointercancel', () => {
        this.drag = null;
      });

      this.onKey = (event) => {
        if (this.viewer?.hidden) return;
        if (event.key === 'Escape') this.close();
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') this.next();
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') this.prev();
      };
      document.addEventListener('keydown', this.onKey);
    }

    buildReel() {
      if (!this.reel || this.reel.dataset.built === 'true') return;
      this.stories.forEach((story, index) => {
        const slide = document.createElement('div');
        slide.className = 'rc-stories__slide';
        slide.dataset.rcStorySlide = String(index);

        const video = document.createElement('video');
        video.className = 'rc-stories__video';
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', '');
        video.preload = index === 0 ? 'auto' : 'metadata';
        video.src = story.src;
        video.addEventListener('ended', () => {
          if (this.index === index) this.next({ fromEnd: true });
        });
        video.addEventListener('timeupdate', () => {
          if (this.index === index) this.updateProgress();
        });
        video.addEventListener('play', () => {
          if (this.index === index) this.syncTools();
        });
        video.addEventListener('pause', () => {
          if (this.index === index) this.syncTools();
        });

        slide.appendChild(video);
        this.reel.appendChild(slide);
      });
      this.reelVideos = [...this.reel.querySelectorAll('video')];
      this.reel.dataset.built = 'true';
      this.observeReel();
    }

    observeReel() {
      if (!this.reel || typeof IntersectionObserver !== 'function') return;
      this.reelObserver?.disconnect();
      this.reelObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < 0.6) return;
            const nextIndex = Number(entry.target.dataset.rcStorySlide);
            if (Number.isNaN(nextIndex) || nextIndex === this.index) {
              this.playReel(this.index);
              return;
            }
            this.index = nextIndex;
            this.playReel(nextIndex);
            this.updateProgress(true);
            this.syncTools();
          });
        },
        { root: this.reel, threshold: 0.6 }
      );
      this.reel.querySelectorAll('[data-rc-story-slide]').forEach((slide) => {
        this.reelObserver.observe(slide);
      });
    }

    playReel(index) {
      this.reelVideos.forEach((video, videoIndex) => {
        if (videoIndex === index) {
          video.muted = this.muted;
          const play = video.play();
          if (play && typeof play.catch === 'function') {
            play.catch(() => {
              video.muted = true;
              this.muted = true;
              video.play()?.catch(() => {});
            });
          }
          return;
        }
        video.pause();
      });
    }

    scrollReel(index, behavior = 'smooth') {
      if (!this.reel) return;
      this.reel.scrollTo({
        top: index * this.reel.clientHeight,
        behavior,
      });
    }

    open(index) {
      this.index = Math.max(0, Math.min(index, this.stories.length - 1));
      document.body.appendChild(this.viewer);
      this.viewer.hidden = false;
      document.body.classList.add('is-rc-stories-open');
      document.querySelectorAll('video').forEach((video) => {
        if (video !== this.desktopVideo && !this.reel?.contains(video)) video.pause();
      });

      if (this.isMobile()) {
        this.buildReel();
        requestAnimationFrame(() => {
          this.scrollReel(this.index, 'auto');
          this.playReel(this.index);
          this.updateProgress(true);
          this.syncTools();
        });
        return;
      }

      this.load(this.index);
    }

    close() {
      this.desktopVideo?.pause();
      this.desktopVideo?.removeAttribute('src');
      this.desktopVideo?.load();
      this.reelVideos.forEach((video) => {
        video.pause();
        video.currentTime = 0;
      });
      this.viewer.hidden = true;
      this.appendChild(this.viewer);
      document.body.classList.remove('is-rc-stories-open');
    }

    load(index) {
      if (this.isMobile()) {
        this.index = index;
        this.scrollReel(index);
        this.playReel(index);
        this.updateProgress(true);
        this.syncTools();
        return;
      }

      const story = this.stories[index];
      if (!story?.src || !this.desktopVideo) return;
      this.index = index;
      this.desktopVideo.src = story.src;
      this.desktopVideo.muted = this.muted;
      const play = this.desktopVideo.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => {
          this.desktopVideo.muted = true;
          this.muted = true;
          this.desktopVideo.play()?.catch(() => {});
        });
      }
      this.updateProgress(true);
      this.syncTools();
      this.renderPeeks();
    }

    storyPreview(story) {
      if (story.poster && !String(story.poster).startsWith('STORY_POSTER')) {
        const image = document.createElement('img');
        image.src = story.poster;
        image.alt = '';
        image.decoding = 'async';
        return image;
      }
      const media = document.createElement('video');
      media.muted = true;
      media.playsInline = true;
      media.preload = 'metadata';
      media.src = story.src;
      media.addEventListener(
        'loadeddata',
        () => {
          try {
            media.currentTime = 0.15;
          } catch (error) {
            // Some browsers refuse seek before canplay.
          }
        },
        { once: true }
      );
      return media;
    }

    renderPeeks() {
      if (!this.peeks) return;
      this.peeks.innerHTML = '';
      this.stories.slice(this.index + 1, this.index + 3).forEach((story, offset) => {
        const jump = this.index + 1 + offset;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'rc-stories__peek';
        card.dataset.rcStoryJump = String(jump);
        card.setAttribute('aria-label', `Vidéo ${jump + 1}`);
        card.appendChild(this.storyPreview(story));

        const mark = document.createElement('span');
        mark.className = 'rc-stories__peek-mark';
        const dot = document.createElement('span');
        dot.className = 'rc-stories__peek-dot';
        dot.appendChild(this.storyPreview(story));
        const label = document.createElement('span');
        label.textContent = story.label || 'Vidéo';
        mark.append(dot, label);
        card.appendChild(mark);
        this.peeks.appendChild(card);
      });
    }

    prev() {
      if (this.index <= 0) {
        this.load(0);
        return;
      }
      this.load(this.index - 1);
    }

    next({ fromEnd = false } = {}) {
      if (this.index >= this.stories.length - 1) {
        if (fromEnd) this.close();
        return;
      }
      this.load(this.index + 1);
    }

    togglePause() {
      const video = this.currentVideo();
      if (!video) return;
      if (video.paused) video.play()?.catch(() => {});
      else video.pause();
    }

    toggleMute() {
      this.muted = !this.muted;
      const video = this.currentVideo();
      if (video) video.muted = this.muted;
      this.syncTools();
    }

    syncTools() {
      const video = this.currentVideo();
      const paused = Boolean(video?.paused);
      const muted = Boolean(video?.muted ?? this.muted);
      const scope = this.viewer || this;
      scope.querySelectorAll('[data-rc-story-pause]').forEach((button) => {
        button.querySelector('[data-icon="pause"]')?.toggleAttribute('hidden', paused);
        button.querySelector('[data-icon="play"]')?.toggleAttribute('hidden', !paused);
        button.setAttribute('aria-label', paused ? 'Lecture' : 'Pause');
      });
      scope.querySelectorAll('[data-rc-story-mute]').forEach((button) => {
        button.querySelector('[data-icon="sound"]')?.toggleAttribute('hidden', muted);
        button.querySelector('[data-icon="mute"]')?.toggleAttribute('hidden', !muted);
        button.setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
      });
    }

    updateProgress(reset = false) {
      const video = this.currentVideo();
      const duration = video?.duration || 0;
      const ratio = reset || !duration ? 0 : Math.min(1, video.currentTime / duration);
      this.progressGroups?.forEach((segs) => {
        segs.forEach((seg, index) => {
          const fill = seg.querySelector('i');
          seg.classList.toggle('is-done', index < this.index);
          if (!fill) return;
          if (index < this.index) fill.style.transform = 'scaleX(1)';
          else if (index > this.index) fill.style.transform = 'scaleX(0)';
          else fill.style.transform = `scaleX(${ratio})`;
        });
      });
    }

    onPointerDown(event) {
      if (this.isMobile()) return;
      if (event.target.closest('button') && !event.target.closest('[data-rc-story-frame]')) return;
      this.drag = { x: event.clientX, y: event.clientY };
    }

    onPointerUp(event) {
      if (this.isMobile() || !this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.drag = null;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
      this.ignoreClick = true;
      window.setTimeout(() => {
        this.ignoreClick = false;
      }, 250);
      if (dx < 0) this.next();
      else this.prev();
    }
  }

  if (!customElements.get('rc-product-stories')) {
    customElements.define('rc-product-stories', RcProductStories);
  }
})();
