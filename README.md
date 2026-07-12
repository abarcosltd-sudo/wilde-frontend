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

This app talks to the WILDE backend API. Set `VITE_API_BASE_URL` (see `.env.example`) to wherever that service is hosted. The backend lives in its own repo: https://github.com/<your-org>/wilde-backend

## Firebase project config

This repo also owns the Firebase project config for the client-facing project: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Deploy with the Firebase CLI:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

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
