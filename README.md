# QR Code Studio

A React + Vite single-page app for generating customizable QR codes (URL, Wi-Fi, and email), with saved history, AI-assisted content safety checks, scan tracking, and an admin dashboard — backed by Firebase Firestore.

## Features implemented

- **QR generation** for three content types:
  - **URL** links
  - **Wi-Fi** network credentials (`WIFI:` payload, including hidden networks and open/WEP/WPA encryption)
  - **Email** (`mailto:` with optional subject/body)
- **Customization**: foreground/background colors (with contrast warnings) and an optional center logo overlay
- **PNG download** of the generated QR code (400x400)
- **Content safety checks** before a QR code can be generated:
  - Local moderation (profanity filter, URL validation, domain blacklist, link-shortener detection)
  - Optional AI-assisted check via the Gemini API (fails open if not configured)
  - Blocked attempts are logged for the admin dashboard
- **Saved history**: generated QR codes are stored in Firestore and listed with delete support
- **Scan tracking**: downloaded URL-type QR codes encode a tracking redirect (`/s/:id`) that logs each scan (timestamp + device type) to Firestore, increments a per-code scan counter, and forwards the visitor to the real destination
- **Admin dashboard** (`/admin`):
  - Overview stats: total/active QR codes, blocked attempts, total scans, last scan time, most-scanned QR
  - Charts: QR creation by day, QR type distribution
  - Recent activity feed (created + blocked)

## Tech stack

- [React 18](https://react.dev/) + [React Router 7](https://reactrouter.com/)
- [Vite 5](https://vitejs.dev/) (build tooling)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) (data storage)
- [recharts](https://recharts.org/) (dashboard charts)
- [qrcode](https://www.npmjs.com/package/qrcode) (QR rendering)
- Google [Gemini API](https://ai.google.dev/) (optional AI content safety check)

## Installation

Requires Node.js 18+.

```bash
npm install
```

## Development

1. Copy `.env.example` to `.env.local` and fill in your Firebase project credentials (and optionally a Gemini API key):

   ```bash
   cp .env.example .env.local
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the printed local URL (default `http://localhost:5173`).

### Available scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR    |
| `npm run build`   | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Deployment

This is a static SPA and deploys cleanly to [Vercel](https://vercel.com/).

1. Push the repository to GitHub.
2. Import the project into Vercel (Framework Preset: **Vite**).
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add the environment variables listed below in the Vercel project settings (Production, Preview, and Development as needed).
4. Deploy. A `vercel.json` with a SPA rewrite (`/(.*) -> /index.html`) is included so client-side routes (`/admin`, `/s/:id`) work on full page loads/refreshes.

## Environment variables

All variables are loaded via Vite's `import.meta.env` and must be prefixed with `VITE_`. Copy `.env.example` to `.env.local` for local development, and configure the same values in your deployment platform.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_GEMINI` | No | Google Gemini API key used for the optional AI content-safety check. If unset, this check is skipped and content is treated as "unchecked" (local moderation still applies). |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain (`<project>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |

If the Firebase variables are not set, `isFirebaseConfigured` is `false` and any feature requiring Firestore (saved history, blocked-attempt logging, scan tracking, admin dashboard) will surface a "Firebase is not configured" error instead of crashing the app.

### Firestore collections used

- `qrCodes` — saved QR records (`type`, `content`, `status`, `scans`, `createdAt`)
- `blockedAttempts` — logged content-safety rejections (`type`, `content`, `reason`, `source`, `createdAt`)
- `qr_scans` — scan events (`qrId`, `scannedAt`, `device`)
