import { handleRedirect, startOAuthFlow, getToken } from '../auth/googleAuth.js';
import { listInbox, getMessage } from '../auth/gmailApi.js';

/**
 * Normalizes noisy email body text for reader-friendly display.
 *
 * @param {string} raw Raw decoded email body.
 * @returns {string} Cleaned body text.
 */
export function cleanEmailBody(raw) {
  if (!raw) return '';

  let cleaned = String(raw);

  // Normalize newlines first.
  cleaned = cleaned.replace(/\r\n?/g, '\n');

  // Remove very long base64-like blobs often found in signatures/attachments.
  cleaned = cleaned.replace(/\b[A-Za-z0-9+/=_-]{120,}\b/g, '');

  // Remove obvious tracking/click redirect links and noisy UTM links.
  cleaned = cleaned.replace(/https?:\/\/\S*(?:utm_[^\s&]+|trk=|tracking|click\.|mailchi\.mp|lnk\.gd|bit\.ly\/\S+)/gi, '');

  // Remove lone tracking pixel references.
  cleaned = cleaned.replace(/\bhttps?:\/\/\S+\.(?:gif|png|jpg)(?:\?\S*)?\b/gi, '');

  // Trim trailing spaces line-by-line and collapse repeated internal spaces.
  cleaned = cleaned
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '').replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n');

  // Preserve paragraph breaks while normalizing excessive blank lines.
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

export async function fetchEmails() {
  handleRedirect();

  if (!getToken()) {
    startOAuthFlow();
    return [];
  }

  const list = await listInbox(10);
  const emails = await Promise.all(list.map((message) => getMessage(message.id)));

  return emails.map((email) => {
    const cleanedBody = cleanEmailBody(email.body);
    const previewSource = cleanedBody.replace(/\s+/g, ' ').trim();
    const preview = previewSource.length > 120 ? `${previewSource.slice(0, 120)}…` : previewSource;

    return {
      ...email,
      body: cleanedBody,
      preview,
    };
  });
}