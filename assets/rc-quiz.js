(() => {
  const QUESTIONS = [
    {
      id: 'target',
      question: "Cette RC, c'est pour qui ?",
      options: [
        { id: 'me', emoji: '🧑', label: 'Pour moi, je suis un passionné' },
        { id: 'kid', emoji: '👦', label: 'Pour mon enfant (moins de 12 ans)' },
        { id: 'teen', emoji: '🧑‍🎓', label: 'Pour un ado (13-17 ans)' },
        { id: 'gift', emoji: '🎁', label: 'Un cadeau, je sais pas encore pour qui exactement' },
      ],
    },
    {
      id: 'terrain',
      question: 'Tu vas rouler où le plus souvent ?',
      options: [
        { id: 'forest', emoji: '🌲', label: 'Forêt, chemins accidentés, gros obstacles' },
        { id: 'dirt', emoji: '🏜️', label: 'Terre, sable, chemins rapides' },
        { id: 'road', emoji: '🛣️', label: 'Bitume, parking, piste lisse' },
        { id: 'rocks', emoji: '🪨', label: 'Rochers, pentes techniques, franchissement lent' },
      ],
    },
    {
      id: 'style',
      question: 'Ce qui te fait le plus kiffer dans une RC ?',
      options: [
        { id: 'smash', emoji: '💥', label: 'Écraser tout sur son passage, sauter fort' },
        { id: 'drift', emoji: '🌀', label: 'Glisser, driver, faire des figures' },
        { id: 'speed', emoji: '🚀', label: 'Foncer le plus vite possible' },
        { id: 'climb', emoji: '🧗', label: 'Grimper méthodiquement, franchir un obstacle par un autre' },
      ],
    },
  ];

  const LOADING_DURATION = 900;

  class RcQuiz {
    constructor(root) {
      this.root = root;
      this.dialog = root.querySelector('.rc-quiz__dialog');
      this.body = root.querySelector('[data-rc-quiz-body]');
      this.loading = root.querySelector('[data-rc-quiz-loading]');
      this.result = root.querySelector('[data-rc-quiz-result]');
      this.optionsContainer = root.querySelector('[data-rc-quiz-options]');
      this.questionEl = root.querySelector('[data-rc-quiz-question]');
      this.stepEl = root.querySelector('[data-rc-quiz-step]');
      this.totalEl = root.querySelector('[data-rc-quiz-total]');
      this.progressEl = root.querySelector('[data-rc-quiz-progress]');
      this.progressBar = root.querySelector('.rc-quiz__progress');
      this.eyebrow = root.querySelector('[data-rc-quiz-eyebrow]');
      this.backButton = root.querySelector('[data-rc-quiz-back]');
      this.cta = root.querySelector('[data-rc-quiz-cta]');
      this.panels = root.querySelectorAll('[data-rc-quiz-panel]');

      this.currentIndex = 0;
      this.answers = {};
      this.lastFocus = null;
      this.isOpen = false;

      if (this.totalEl) this.totalEl.textContent = String(QUESTIONS.length);

      this.#bindGlobal();
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

      this.cta?.addEventListener('click', () => this.#handleCtaClick());
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

    #setView(view) {
      this.panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.rcQuizPanel === view);
      });

      const isQuestion = view === 'question';
      this.eyebrow.hidden = !isQuestion;
      this.backButton.hidden = !isQuestion || this.currentIndex === 0;
      if (this.progressBar) this.progressBar.hidden = !isQuestion;
    }

    #reset() {
      this.currentIndex = 0;
      this.answers = {};
      this.result.classList.remove('is-visible');
      this.#setView('question');
      this.#renderQuestion(0, { skipAnimation: true });
    }

    #goBack() {
      if (this.currentIndex === 0) return;
      this.currentIndex -= 1;
      this.#setView('question');
      this.#renderQuestion(this.currentIndex);
    }

    #renderQuestion(index, { skipAnimation = false } = {}) {
      const question = QUESTIONS[index];
      if (!question) return;

      const paint = () => {
        this.questionEl.textContent = question.question;
        this.stepEl.textContent = String(index + 1);
        this.progressEl.style.width = `${((index + 1) / QUESTIONS.length) * 100}%`;
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
        if (this.currentIndex < QUESTIONS.length - 1) {
          this.currentIndex += 1;
          this.#renderQuestion(this.currentIndex);
        } else {
          this.#showLoading();
        }
      }, 260);
    }

    #showLoading() {
      this.#setView('loading');
      this.progressEl.style.width = '100%';
      window.setTimeout(() => this.#showResult(), LOADING_DURATION);
    }

    #showResult() {
      this.result.classList.remove('is-visible');
      this.#setView('result');
      requestAnimationFrame(() => this.result.classList.add('is-visible'));
    }

    #handleCtaClick() {
      window.RcQuiz?.dispatchResult?.(this.answers);
      this.close();

      const target = document.getElementById('top-ventes');
      if (target) {
        window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
      }
    }
  }

  window.RcQuiz = {
    dispatchResult: (answers) => {
      window.dispatchEvent(new CustomEvent('rc-quiz:completed', { detail: { answers } }));
    },
  };

  const boot = () => {
    const root = document.querySelector('[data-rc-quiz]');
    if (!root) return;
    new RcQuiz(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
