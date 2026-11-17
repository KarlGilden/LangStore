# LangStore web

The LangStore browser application uses React, TypeScript, and Vite.

## Requirements

- Node.js 24.8.0 (see `.nvmrc`)
- npm 10.2.5

## Setup

```sh
npm ci
```

Copy `.env.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY` to the publishable key from the existing Clerk application. Values beginning with `VITE_` are public at build time; never put a Clerk secret key, database URL, Google credential, or other secret in this project. `VITE_API_BASE_URL` is reserved for the API integration step.

## Commands

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm test
```

`npm test` runs once and exits. The development server defaults to Vite's local address.

## Authentication and routing

The browser app hosts Clerk sign-in at `/sign-in` and protects `/collections` behind the authenticated shell. To check the configured development integration, start the app, sign in through the existing Clerk development application, sign out, and reload `/collections` directly.

Production hosting must serve `index.html` for non-asset application paths such as `/collections` and `/sign-in/*`. Configure this as an SPA fallback or rewrite while leaving real static assets untouched; otherwise deep-link reloads will return a hosting 404 before React Router can run.
