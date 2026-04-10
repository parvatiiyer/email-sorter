const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/gmail.modify';
const REDIRECT = window.location.origin;

let _token = null;

export function getToken() {
  return _token;
}

export function startOAuthFlow() {
  if (!CLIENT_ID) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID. Add it to .env and restart dev server.');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'token',
    scope: SCOPES,
    prompt: 'consent',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function handleRedirect() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const token = hash.get('access_token');
  if (token) {
    _token = token;
    history.replaceState(null, '', window.location.pathname);
    return true;
  }

  return false;
}