import { HandTracker } from './gesture/handTracker.js';
import { fetchEmails } from './email/emailAdapter.js';
import { emailStore } from './email/emailStore.js';
import { deleteCurrentEmail, keepCurrentEmail, openEmail } from './email/emailActions.js';
import { InboxList } from './ui/InboxList.js';

/**
 * Bootstraps the gesture-controlled inbox application.
 *
 * @returns {Promise<void>} Promise that resolves after initial setup.
 */
let busy = false;
async function bootstrapApp() {
  const videoEl = /** @type {HTMLVideoElement | null} */ (document.getElementById('input-video'));
  const overlayEl = /** @type {HTMLCanvasElement | null} */ (document.getElementById('overlay'));
  const appEl = /** @type {HTMLElement | null} */ (document.getElementById('app'));

  if (!videoEl || !overlayEl || !appEl) {
    console.error('Missing required DOM nodes: input-video, overlay, or app');
    return;
  }

  const emails = await fetchEmails();
  emailStore.setEmails(emails);

  const inboxList = new InboxList(appEl);
  inboxList.render(emailStore.emails, emailStore.currentIndex, emailStore.openedEmail);

  emailStore.subscribe((store) => {
    inboxList.render(store.emails, store.currentIndex, store.openedEmail);
  });

  let busy = false;

async function onGesture(gesture) {

  if (busy) return;

  const activeEmail =
    emailStore.emails[emailStore.currentIndex];

  if (!activeEmail) return;

  try {

    switch (gesture.type) {

      case 'SWIPE_RIGHT':

        busy = true;

        showToast("📥 Keeping email");

        inboxList.animateSwipeRight(activeEmail.id);

        await keepCurrentEmail();

        closeReaderPanel();

        break;

      case 'SWIPE_LEFT':

        busy = true;

        showToast("🗑️ Deleting email");

        inboxList.animateSwipeLeft(activeEmail.id);

        await deleteCurrentEmail();

        closeReaderPanel();

        break;

      case 'TWO_FINGER_OPEN':

        openEmail(activeEmail);

        break;

      default:
        return;
    }

  } catch (err) {

    console.error("Gesture action failed:", err);

  } finally {

    busy = false;

  }

}
  const tracker = new HandTracker(videoEl, overlayEl, onGesture);
  await tracker.start();
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrapApp().catch((error) => {
    console.error('Failed to bootstrap app:', error);
  });
});