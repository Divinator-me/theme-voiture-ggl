(() => {
  const FALLBACK_CONFIG = {
    collections: {
      buggy: { name: 'Buggy', handle: 'buggy' },
    },
    questions: {},
    routing_table: {},
    display_hooks_by_q1: {},
    fallback_collection: 'buggy',
  };

  function parseCollectionUrls(root) {
    const raw = root.dataset.rcQuizCollectionUrls;
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function buildQuestions(config) {
    const order = ['q1', 'q2', 'q3'];
    return order
      .map((id) => config.questions?.[id])
      .filter(Boolean)
      .map((question) => ({
        id: question.id,
        question: question.text,
        options: question.options,
      }));
  }

  function resolveCollection(answers, config) {
    const terrain = answers.q2;
    const style = answers.q3;
    const collectionKey =
      config.routing_table?.[terrain]?.[style] || config.fallback_collection || 'buggy';
    const collection = config.collections?.[collectionKey] || config.collections?.buggy;
    const hook = config.display_hooks_by_q1?.[answers.q1] || '';

    return {
      key: collectionKey,
      handle: collection.handle,
      label: collection.name,
      hook,
    };
  }

  class RcQuiz {
    constructor(root, config) {
      this.root = root;
      this.config = config;
      this.questions = buildQuestions(config);
      this.collectionUrls = parseCollectionUrls(root);
      this.dialog = root.querySelector('.rc-quiz__dialog');
      this.body = root.querySelector('[data-rc-quiz-body]');
      this.optionsContainer = root.querySelector('[data-rc-quiz-options]');
      this.questionEl = root.querySelector('[data-rc-quiz-question]');
      this.stepEl = root.querySelector('[data-rc-quiz-step]');
      this.totalEl = root.querySelector('[data-rc-quiz-total]');
      this.progressEl = root.querySelector('[data-rc-quiz-progress]');
      this.progressBar = root.querySelector('.rc-quiz__progress');
      this.eyebrow = root.querySelector('[data-rc-quiz-eyebrow]');
      this.backButton = root.querySelector('[data-rc-quiz-back]');

      this.currentIndex = 0;
      this.answers = {};
      this.lastFocus = null;
      this.isOpen = false;

      if (this.totalEl) this.totalEl.textContent = String(this.questions.length);

      this.#bindGlobal();
    }

    #collectionUrl(handle) {
      return this.collectionUrls[handle] || `/collections/${handle}`;
    }

    #bindGlobal() {
      document.addEventListener('click', (event) => {
        const trigger = event.target instanceof Element ? event.target.closest('[data-rc-quiz-open]') : null;
        if (trigger) {
          event.preventDefault();
          this.open();
        }
      });

      this.root.querySelectorAll('[data-rc-quiz-close]').forEach((node) => {
        node.addEventListener('click', () => this.close());
      });

      this.backButton?.addEventListener('click', () => this.#goBack());

      document.addEventListener('keydown', (event) => {
        if (!this.isOpen) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
      });
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      this.#reset();
      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('rc-quiz-open');

      requestAnimationFrame(() => {
        this.root.classList.add('is-open');
        this.dialog?.focus({ preventScroll: true });
      });
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.root.classList.remove('is-open');
      document.body.classList.remove('rc-quiz-open');
      this.root.setAttribute('aria-hidden', 'true');

      const finish = () => {
        this.root.hidden = true;
        this.dialog?.removeEventListener('transitionend', finish);
        this.lastFocus?.focus?.();
      };
      this.dialog?.addEventListener('transitionend', finish, { once: true });
      window.setTimeout(finish, 500);
    }

    #updateChrome() {
      this.eyebrow.hidden = false;
      this.backButton.hidden = this.currentIndex === 0;
      if (this.progressBar) this.progressBar.hidden = false;
    }

    #reset() {
      this.currentIndex = 0;
      this.answers = {};
      this.#updateChrome();
      this.#renderQuestion(0, { skipAnimation: true });
    }

    #goBack() {
      if (this.currentIndex === 0) return;
      this.currentIndex -= 1;
      this.#renderQuestion(this.currentIndex);
    }

    #renderQuestion(index, { skipAnimation = false } = {}) {
      const question = this.questions[index];
      if (!question) return;

      const paint = () => {
        this.questionEl.textContent = question.question;
        this.stepEl.textContent = String(index + 1);
        this.progressEl.style.width = `${((index + 1) / this.questions.length) * 100}%`;
        this.backButton.hidden = index === 0;

        this.optionsContainer.innerHTML = '';
        for (const option of question.options) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'rc-quiz__option';
          button.setAttribute('role', 'listitem');
          button.dataset.optionId = option.id;

          if (this.answers[question.id] === option.id) {
            button.classList.add('is-selected');
          }

          const emoji = document.createElement('span');
          emoji.className = 'rc-quiz__option-emoji';
          emoji.setAttribute('aria-hidden', 'true');
          emoji.textContent = option.emoji;

          const label = document.createElement('span');
          label.className = 'rc-quiz__option-label';
          label.textContent = option.label;

          button.append(emoji, label);
          button.addEventListener('click', () => this.#handleAnswer(question.id, option.id, button));
          this.optionsContainer.append(button);
        }

        this.body.classList.remove('is-leaving');
        this.body.classList.add('is-entering');
        requestAnimationFrame(() => {
          this.body.classList.remove('is-entering');
          this.body.classList.add('is-entered');
          window.setTimeout(() => this.body.classList.remove('is-entered'), 320);
        });
      };

      if (skipAnimation) {
        paint();
        return;
      }

      this.body.classList.add('is-leaving');
      window.setTimeout(paint, 200);
    }

    #handleAnswer(questionId, optionId, button) {
      if (button.classList.contains('is-selected')) return;
      this.answers[questionId] = optionId;

      this.optionsContainer.querySelectorAll('.rc-quiz__option').forEach((node) => {
        node.classList.remove('is-selected');
      });
      button.classList.add('is-selected');

      window.setTimeout(() => {
        if (this.currentIndex < this.questions.length - 1) {
          this.currentIndex += 1;
          this.#renderQuestion(this.currentIndex);
        } else {
          this.#completeQuiz();
        }
      }, 260);
    }

    #completeQuiz() {
      const match = resolveCollection(this.answers, this.config);
      match.url = this.#collectionUrl(match.handle);

      window.RcQuiz?.dispatchResult?.(this.answers, match);
      window.location.assign(match.url);
    }
  }

  window.RcQuiz = {
    resolveCollection,
    dispatchResult: (answers, match) => {
      window.dispatchEvent(
        new CustomEvent('rc-quiz:completed', {
          detail: { answers, match },
        })
      );
    },
  };

  const boot = async () => {
    const root = document.querySelector('[data-rc-quiz]');
    if (!root) return;

    let config = FALLBACK_CONFIG;
    const configUrl = root.dataset.rcQuizConfigUrl;

    if (configUrl) {
      try {
        const response = await fetch(configUrl);
        if (response.ok) {
          config = await response.json();
        }
      } catch {
        // fallback config
      }
    }

    new RcQuiz(root, config);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
