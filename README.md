# WILDE Frontend

> "Where Creatives find their voice."

Ionic 7 + React + TypeScript mobile/web app. Standalone repo — deploy independently (e.g. Firebase Hosting, Vercel, Netlify).

## Setup

```bash
npm install
cp .env.example .env   # fill in Firebase web config + API base URL
npm run start           # local dev
npm run build            # production build -> dist/
```

## Backend

This app talks to the WILDE backend API. Set `VITE_API_BASE_URL` (see `.env.example`) to wherever that service is hosted. The backend lives in its own repo: https://github.com/abarcosltd-sudo/wilde-backend

## Firebase project config

This repo also owns the Firebase project config for the client-facing project: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Deploy with the Firebase CLI:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

### Storage CORS (required for image uploads)

Cover-image and avatar uploads are browser `XMLHttpRequest`s straight to Cloud
Storage, so the **bucket** must allow the site's origin. This is bucket
configuration in Google Cloud — it is *not* covered by `storage.rules` and is
not deployed by `firebase deploy`. Without it, uploads fail the CORS preflight:

```
Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

Apply `cors.json` once per bucket (and again whenever the origin list changes):

```bash
gcloud storage buckets update gs://wilde-2b0b5.firebasestorage.app --cors-file=cors.json
```

Verify it took effect:

```bash
gcloud storage buckets describe gs://wilde-2b0b5.firebasestorage.app --format="default(cors_config)"
```

Notes:

- **Displaying** images is unaffected — `<img src>` is not a CORS request, so
  existing covers render fine even while uploads are broken.
- Origins must match exactly, including scheme and port. Cloud Storage does not
  support wildcard subdomains, so Vercel **preview** deployments
  (`wilde-frontend-git-*.vercel.app`) need their specific domains added, or a
  stable alias pointed at them.
- The `capacitor://localhost` and `http://localhost` entries cover the native
  iOS and Android builds.

## Structure

```
src/
├── assets/          # Static assets
├── components/      # Shared UI components
│   ├── ui/          # Atomic design elements (Button, Input, Avatar …)
│   └── layout/      # App shell, tab bar, header
├── features/        # Feature modules (auth, writing, marketplace …)
│   └── [feature]/
│       ├── components/   # Feature-scoped UI
│       ├── hooks/        # Feature-scoped hooks
│       ├── services/     # API calls for this feature
│       └── store/        # Zustand slice (if heavy state)
├── firebase/        # Firebase init, helpers
├── pages/           # Route-level screens (thin wrappers)
├── routes/          # Route definitions & guards
├── store/           # Global Zustand store
├── hooks/           # App-wide custom hooks
├── services/        # Shared API service layer
├── types/           # Global TypeScript types
├── utils/           # Pure helper functions
├── constants/       # App constants & enums
└── middleware/      # Auth guards, error boundaries
```
