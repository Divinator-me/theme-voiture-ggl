(() => {
  const SWIPE_MIN = 48;

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
      this.video = this.querySelector('[data-rc-story-video]');
      this.progress = this.querySelector('[data-rc-story-progress]');
      this.peeks = this.querySelector('[data-rc-story-peeks]');
      this.pauseBtn = this.querySelector('[data-rc-story-pause]');
      this.muteBtn = this.querySelector('[data-rc-story-mute]');
      this.index = 0;
      this.raf = 0;
      this.drag = null;

      this.buildProgress();
      this.prepareThumbs();
      this.bind();
    }

    buildProgress() {
      if (!this.progress) return;
      this.progress.innerHTML = this.stories
        .map(() => '<span class="rc-stories__seg"><i></i></span>')
        .join('');
      this.segs = [...this.progress.querySelectorAll('.rc-stories__seg')];
    }

    prepareThumbs() {
      this.querySelectorAll('[data-rc-story-thumb]').forEach((thumb, index) => {
        const story = this.stories[index];
        if (!story?.src || story.src.startsWith('STORY_URL')) return;
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
        thumb.appendChild(media);
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

      this.pauseBtn?.addEventListener('click', () => this.togglePause());
      this.muteBtn?.addEventListener('click', () => this.toggleMute());

      this.peeks?.addEventListener('click', (event) => {
        const jump = event.target.closest('[data-rc-story-jump]');
        if (!jump) return;
        this.load(Number(jump.dataset.rcStoryJump));
      });

      this.viewer?.addEventListener('click', (event) => {
        if (event.target === this.viewer || event.target === this.stage) this.close();
      });

      this.video?.addEventListener('ended', () => this.next({ fromEnd: true }));
      this.video?.addEventListener('timeupdate', () => this.updateProgress());
      this.video?.addEventListener('play', () => this.syncTools());
      this.video?.addEventListener('pause', () => this.syncTools());

      this.viewer?.addEventListener('pointerdown', (event) => this.onPointerDown(event));
      this.viewer?.addEventListener('pointerup', (event) => this.onPointerUp(event));
      this.viewer?.addEventListener('pointercancel', () => {
        this.drag = null;
      });

      this.onKey = (event) => {
        if (this.viewer?.hidden) return;
        if (event.key === 'Escape') this.close();
        if (event.key === 'ArrowRight') this.next();
        if (event.key === 'ArrowLeft') this.prev();
      };
      document.addEventListener('keydown', this.onKey);
    }

    open(index) {
      this.index = Math.max(0, Math.min(index, this.stories.length - 1));
      document.body.appendChild(this.viewer);
      this.viewer.hidden = false;
      document.body.classList.add('is-rc-stories-open');
      document.querySelectorAll('video').forEach((video) => {
        if (video !== this.video) video.pause();
      });
      this.load(this.index);
    }

    close() {
      this.video?.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.viewer.hidden = true;
      this.appendChild(this.viewer);
      document.body.classList.remove('is-rc-stories-open');
    }

    load(index) {
      const story = this.stories[index];
      if (!story?.src) return;
      this.index = index;
      this.video.src = story.src;
      this.video.muted = false;
      const play = this.video.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => {
          this.video.muted = true;
          this.video.play()?.catch(() => {});
        });
      }
      this.updateProgress(true);
      this.syncTools();
      this.renderPeeks();
    }

    mediaThumb(src) {
      const media = document.createElement('video');
      media.muted = true;
      media.playsInline = true;
      media.preload = 'metadata';
      media.src = src;
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
        card.appendChild(this.mediaThumb(story.src));

        const mark = document.createElement('span');
        mark.className = 'rc-stories__peek-mark';
        const dot = document.createElement('span');
        dot.className = 'rc-stories__peek-dot';
        dot.appendChild(this.mediaThumb(story.src));
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
      if (this.video.paused) this.video.play()?.catch(() => {});
      else this.video.pause();
    }

    toggleMute() {
      this.video.muted = !this.video.muted;
      this.syncTools();
    }

    syncTools() {
      const paused = Boolean(this.video?.paused);
      const muted = Boolean(this.video?.muted);
      this.pauseBtn?.querySelector('[data-icon="pause"]')?.toggleAttribute('hidden', paused);
      this.pauseBtn?.querySelector('[data-icon="play"]')?.toggleAttribute('hidden', !paused);
      this.pauseBtn?.setAttribute('aria-label', paused ? 'Lecture' : 'Pause');
      this.muteBtn?.querySelector('[data-icon="sound"]')?.toggleAttribute('hidden', muted);
      this.muteBtn?.querySelector('[data-icon="mute"]')?.toggleAttribute('hidden', !muted);
      this.muteBtn?.setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
    }

    updateProgress(reset = false) {
      const duration = this.video?.duration || 0;
      const ratio = reset || !duration ? 0 : Math.min(1, this.video.currentTime / duration);
      this.segs?.forEach((seg, index) => {
        const fill = seg.querySelector('i');
        seg.classList.toggle('is-done', index < this.index);
        if (!fill) return;
        if (index < this.index) fill.style.transform = 'scaleX(1)';
        else if (index > this.index) fill.style.transform = 'scaleX(0)';
        else fill.style.transform = `scaleX(${ratio})`;
      });
    }

    onPointerDown(event) {
      if (event.target.closest('button') && !event.target.closest('[data-rc-story-frame]')) return;
      this.drag = { x: event.clientX, y: event.clientY };
    }

    onPointerUp(event) {
      if (!this.drag) return;
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
