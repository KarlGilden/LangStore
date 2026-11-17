# LangStore web

The LangStore browser application uses React, TypeScript, and Vite.

## Requirements

- Node.js 24.8.0 (see `.nvmrc`)
- npm 10.2.5

## Setup

```sh
npm ci
```

Copy `.env.example` to `.env.local` when a feature needs browser configuration. Values beginning with `VITE_` are public at build time; never put a Clerk secret key, database URL, Google credential, or other secret in this project.

## Commands

```sh
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm test
```

`npm test` runs once and exits. The development server defaults to Vite's local address; deployment and SPA rewrite configuration are added with routing in the corresponding ticket step.
