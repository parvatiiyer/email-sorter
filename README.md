# Gesture Email Classifier

Gesture-controlled inbox triage using MediaPipe Hands and Gmail API.

## Setup

```bash
npm install
npm run dev
```

## Gmail API setup

1. Go to https://console.cloud.google.com
2. Create a project and enable Gmail API
3. Configure OAuth consent screen:
	- User type: External
	- Add your Google account as a test user
4. Create OAuth credentials:
	- Credentials → Create Credentials → OAuth Client ID
	- Application type: Web application
	- Authorised JavaScript origins: `http://localhost:5175`
	- Authorised redirect URIs: `http://localhost:5175`
5. Copy Client ID into `.env`:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

6. Start the app:

```bash
npm run dev
```

7. On first load, app redirects to Google login, asks for Gmail permission, redirects back with access token, and loads inbox messages.

> Note: Implicit-flow access tokens typically expire in ~1 hour. For production, use Authorization Code + PKCE with a backend.

## Gesture reference

| Gesture | Action | How to trigger |
| --- | --- | --- |
| `SWIPE_RIGHT` | Trash email | Hold hand still briefly to arm, then swipe clearly right |
| `SWIPE_LEFT` | Archive email | Hold hand still briefly to arm, then swipe clearly left |
| `TWO_FINGER_OPEN` | Open + mark read | Hold index and middle fingers up for consecutive frames |
| `NONE` | No action | Movement/pose does not meet commit conditions |

## File pointers

- Gesture logic: `src/gesture/gestureClassifier.js`
- Overlay rendering + debug text: `src/gesture/landmarkRenderer.js`
- OAuth token handling: `src/auth/googleAuth.js`
- Gmail API wrapper: `src/auth/gmailApi.js`
- Adapter entrypoint: `src/email/emailAdapter.js`