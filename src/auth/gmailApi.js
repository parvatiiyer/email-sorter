import { getToken } from './googleAuth.js';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('Missing OAuth token. Authenticate with Google first.');
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Gmail API ${res.status}: ${path}`);
  }

  return res.json();
}

export async function listInbox(maxResults = 10) {
  const data = await apiFetch(`/messages?labelIds=INBOX&maxResults=${maxResults}`);
  return data.messages ?? [];
}

function decodeBase64Url(data) {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function findPlainTextPart(payload) {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return payload.body.data;
  }

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const nested = findPlainTextPart(part);
      if (nested) return nested;
    }
  }

  return payload.body?.data ?? '';
}

export async function getMessage(id) {
  const msg = await apiFetch(`/messages/${id}?format=full`);
  const headers = msg.payload?.headers ?? [];
  const getHeader = (name) => headers.find((h) => h.name === name)?.value ?? '';

  const bodyData = findPlainTextPart(msg.payload);
  const decodedBody = bodyData ? decodeBase64Url(bodyData) : '(no plain-text body)';

  return {
    id: msg.id,
    from: getHeader('From'),
    subject: getHeader('Subject'),
    preview: decodedBody.slice(0, 80),
    body: decodedBody,
  };
}

export async function trashMessage(id) {
  return apiFetch(`/messages/${id}/trash`, { method: 'POST' });
}

export async function archiveMessage(id) {
  return apiFetch(`/messages/${id}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
  });
}

export async function markRead(id) {
  return apiFetch(`/messages/${id}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
}