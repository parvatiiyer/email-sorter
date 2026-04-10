/**
 * Inbox list view scaffold.
 */
export class InboxList {
  /**
   * @param {HTMLElement} container Container element for rendering email cards.
   */
  constructor(container) {
    this.container = container;
    this.container.style.fontFamily = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    this.container.style.background = '#0d1117';
    this.container.style.borderLeft = '1px solid rgba(255, 255, 255, 0.08)';
  }

  /**
   * Renders email cards and highlights the active card.
   *
   * @param {Array<{id:string|number,from:string,subject:string,preview:string,body:string}>} emails Email list to display.
   * @param {number} currentIndex Active email index.
   * @returns {HTMLElement|null} The root container used for render.
   */
  render(emails, currentIndex, openedEmail = null) {
    this.container.innerHTML = '';
    this.container.style.display = 'block';
    this.container.style.minHeight = '';

    if (openedEmail) {
      const openPanel = document.createElement('section');
      openPanel.style.padding = '1rem';
      openPanel.style.marginBottom = '1rem';
      openPanel.style.border = '1px solid rgba(74, 174, 255, 0.45)';
      openPanel.style.borderRadius = '12px';
      openPanel.style.background = 'rgba(74, 174, 255, 0.12)';

      const heading = document.createElement('h3');
      heading.textContent = openedEmail.subject;
      heading.style.margin = '0 0 0.5rem 0';

      const sender = document.createElement('div');
      sender.textContent = `From: ${openedEmail.from}`;
      sender.style.opacity = '0.85';
      sender.style.marginBottom = '0.75rem';

      const body = document.createElement('p');
      body.textContent = openedEmail.body;
      body.style.margin = '0';
      body.style.lineHeight = '1.5';
      body.style.whiteSpace = 'pre-wrap';

      openPanel.append(heading, sender, body);
      this.container.appendChild(openPanel);
    }

    if (!emails.length) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No emails left 🎉';
      emptyState.style.opacity = '0.85';
      emptyState.style.textAlign = 'center';
      emptyState.style.margin = '0';
      emptyState.style.fontSize = '1.1rem';
      this.container.style.display = 'flex';
      this.container.style.alignItems = 'center';
      this.container.style.justifyContent = 'center';
      this.container.style.minHeight = '60vh';
      this.container.appendChild(emptyState);
      return this.container;
    }

    emails.forEach((email, index) => {
      const card = document.createElement('div');
      card.dataset.emailId = String(email.id);
      card.className = 'email-card';
      card.style.padding = '1rem';
      card.style.marginBottom = '0.75rem';
      card.style.border = '1px solid rgba(255,255,255,0.12)';
      card.style.borderRadius = '12px';
      card.style.background = index === currentIndex ? 'rgba(53, 162, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)';
  card.style.transition = 'transform 220ms ease, opacity 220ms ease';

      if (index === currentIndex) {
        card.classList.add('active');
        card.style.borderColor = 'rgba(80, 185, 255, 0.7)';
      }

      const from = document.createElement('div');
      from.textContent = email.from;
      from.style.fontWeight = '600';

      const subject = document.createElement('div');
      subject.textContent = email.subject;
      subject.style.marginTop = '0.4rem';
      subject.style.fontSize = '1rem';

      const preview = document.createElement('div');
      const trimmedPreview = email.preview.length > 100 ? `${email.preview.slice(0, 100)}…` : email.preview;
      preview.textContent = trimmedPreview;
      preview.style.marginTop = '0.45rem';
      preview.style.opacity = '0.8';
      preview.style.fontSize = '0.92rem';

      card.append(from, subject, preview);
      this.container.appendChild(card);
    });

    return this.container;
  }

  /**
   * Animates a card swiping to the right.
   *
   * @param {string|number} emailId Target email identifier.
   * @returns {boolean} Whether the animation was started.
   */
  animateSwipeRight(emailId) {
    const card = this.container.querySelector(`[data-email-id="${String(emailId)}"]`);
    if (!card) return false;

    card.style.willChange = 'transform, opacity';
    requestAnimationFrame(() => {
      card.style.transform = 'translateX(100%)';
      card.style.opacity = '0';
    });

    this.#removeAfterSwipe(card);
    return true;
  }

  /**
   * Animates a card swiping to the left.
   *
   * @param {string|number} emailId Target email identifier.
   * @returns {boolean} Whether the animation was started.
   */
  animateSwipeLeft(emailId) {
    const card = this.container.querySelector(`[data-email-id="${String(emailId)}"]`);
    if (!card) return false;

    card.style.willChange = 'transform, opacity';
    requestAnimationFrame(() => {
      card.style.transform = 'translateX(-100%)';
      card.style.opacity = '0';
    });

    this.#removeAfterSwipe(card);
    return true;
  }

  /**
   * Removes a swiped card after its transition completes.
   *
   * @param {HTMLElement} card Card element to remove.
   */
  #removeAfterSwipe(card) {
    let removed = false;

    const remove = () => {
      if (removed) return;
      removed = true;
      card.remove();
    };

    card.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 260);
  }
}