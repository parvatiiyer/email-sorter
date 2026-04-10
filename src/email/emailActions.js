import { emailStore } from './emailStore.js';
import {
  trashMessage,
  archiveMessage,
  markRead
} from '../auth/gmailApi.js';

/**
 * Global action lock to prevent duplicate gesture actions.
 */
let busy = false;

/**
 * Shows a bottom-center floating toast message.
 *
 * @param {string} message Notification text.
 * @returns {void}
 */
export function showToast(message) {
  let toast = document.getElementById('toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(12, 16, 22, 0.94);
      color: #f3f6ff;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      font-size: 0.92rem;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      opacity: 0;
      pointer-events: none;
      z-index: 10000;
      transition: opacity 180ms ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';

  if (toast.dataset.fadeTimer) {
    clearTimeout(Number(toast.dataset.fadeTimer));
  }

  const timerId = window.setTimeout(() => {
    toast.style.opacity = '0';
  }, 1200);

  toast.dataset.fadeTimer = String(timerId);
}

/**
 * Removes the reader panel from the DOM if it exists.
 *
 * @returns {void}
 */
export function closeReaderPanel() {
  const reader = document.getElementById('email-reader');
  if (reader) {
    reader.remove();
  }
}

/**
 * Wraps an async action in a global lock.
 *
 * @template T
 * @param {() => Promise<T>} action Async action callback.
 * @returns {Promise<T|undefined>} Action result or undefined when locked/failed.
 */
async function withActionLock(action) {
  if (busy) return undefined;

  busy = true;
  try {
    return await action();
  } finally {
    busy = false;
  }
}

/**
 * Deletes (trashes) the currently focused email.
 * Gmail state is updated first, then local UI state.
 */
export async function deleteCurrentEmail() {
  return withActionLock(async () => {
    if (!emailStore.emails.length) return;

    const index = emailStore.currentIndex;
    const email = emailStore.emails[index];

    if (!email?.id) {
      console.warn('No email ID to delete');
      return;
    }

    try {
      await trashMessage(String(email.id));
    } catch (error) {
      console.error('Failed to trash Gmail message:', error);
      showToast('⚠️ Could not delete email');
      return;
    }

    const updatedEmails = emailStore.emails.filter((_, i) => i !== index);
    const nextIndex = Math.min(index, Math.max(updatedEmails.length - 1, 0));

    emailStore.emails = updatedEmails;
    emailStore.currentIndex = nextIndex;
    emailStore.openedEmail = null;
    closeReaderPanel();
    emailStore.notify();
    showToast('🗑️ Email deleted');
  });
}

/**
 * Keeps email by archiving it and moving to the next focused item.
 * Gmail state is updated first, then local UI state.
 */
export async function keepCurrentEmail() {
  return withActionLock(async () => {
    if (!emailStore.emails.length) return;

    const index = emailStore.currentIndex;
    const email = emailStore.emails[index];

    if (!email?.id) {
      console.warn('No email ID to archive');
      return;
    }

    try {
      await archiveMessage(String(email.id));
    } catch (error) {
      console.error('Failed to archive Gmail message:', error);
      showToast('⚠️ Could not keep email');
      return;
    }

    const updatedEmails = emailStore.emails.filter((_, i) => i !== index);
    const nextIndex = Math.min(index, Math.max(updatedEmails.length - 1, 0));

    emailStore.emails = updatedEmails;
    emailStore.currentIndex = nextIndex;
    emailStore.openedEmail = null;
    closeReaderPanel();
    emailStore.notify();
    showToast('📥 Email kept');
  });
}

/**
 * Opens email in reader panel and marks it as read.
 *
 * @param {Object} email Email object
 */
export function openEmail(email) {
  if (!email) return;

  emailStore.setOpenedEmail(email);

  if (email?.id) {
    markRead(String(email.id)).catch((error) => {
      console.error('Failed to mark as read:', error);
    });
  }

  renderReaderPanel(email);
}

/**
 * Renders the right-side email reader panel UI.
 *
 * @param {Object} email Email object
 */
function renderReaderPanel(email) {
  closeReaderPanel();

  const reader = document.createElement('aside');
  reader.id = 'email-reader';
  reader.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 50%;
      height: 100vh;
      background: #1a1a1a;
      color: #eee;
      padding: 2rem;
      box-sizing: border-box;
      overflow-y: auto;
      border-left: 1px solid #333;
      z-index: 100;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
    `;
  
  const safeFrom = String(email.from ?? '');
  const safeSubject = String(email.subject ?? '');
  const safeBody = String(email.body ?? '');

  reader.innerHTML = `
    <button type="button" aria-label="Close email reader" style="
      float:right;
      background:transparent;
      border:1px solid #555;
      color:#aaa;
      padding:6px 12px;
      border-radius:8px;
      cursor:pointer;
    ">
      Close
    </button>

    <h3 style="margin: 0.75rem 0 0.35rem; font-size: 0.92rem; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.72;">From</h3>
    <p style="margin: 0 0 1rem;">${safeFrom}</p>

    <h3 style="margin: 0 0 0.35rem; font-size: 0.92rem; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.72;">Subject</h3>
    <p style="margin: 0 0 1.2rem; font-size: 1.15rem; font-weight: 600; color: #f5f7ff;">${safeSubject}</p>

    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.12); margin: 0 0 1.2rem;" />

    <p style="
      margin: 0;
      white-space: pre-wrap;
      line-height:1.6;
      color:#ccc;
    ">
      ${safeBody}
    </p>
  `;

  const closeButton = reader.querySelector('button');
  closeButton?.addEventListener('click', () => {
    closeReaderPanel();
    emailStore.setOpenedEmail(null);
  });

  document.body.appendChild(reader);
}

// Backward compatibility for existing gesture wiring that references globals.
if (typeof globalThis.showToast !== 'function') {
  globalThis.showToast = showToast;
}

if (typeof globalThis.closeReaderPanel !== 'function') {
  globalThis.closeReaderPanel = closeReaderPanel;
}