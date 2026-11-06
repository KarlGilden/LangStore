# LangStore API

Initial backend scaffold: Fastify, strict TypeScript, and a public health endpoint.

## Setup

Use Node.js **24.8.0** (pinned in `.nvmrc`) and npm **10.2.5**.

```sh
npm ci
npm run dev
```

The server listens on `0.0.0.0:3000` by default. Set `HOST` and `PORT` in your
environment to override these values. No credentials or database are needed.

`GET /health` returns HTTP 200 with `{"status":"ok"}`. This is a process health
check; it does not indicate database or external-service readiness.

## Structure

```text
api/
  app.ts                    Application factory (no listening socket)
  server.ts                 Startup, configuration, and shutdown
  routes/health.ts          Public health route and response schema
core/
  services/                 Future use cases and business rules
  repositories/             Future persistence contracts
infrastructure/
  repositories/             Future repository implementations
tests/api/health.test.ts     HTTP test using Fastify inject
```

Core must remain independent of Fastify, Clerk, and Drizzle. API handlers will
call core services; infrastructure will implement core repository contracts.
The service and repository directories are placeholders for later tickets.

Fastify, Clerk's Fastify integration, multipart support, and Drizzle ORM are
installed. Development tools include TypeScript, Node type definitions, tsx,
Vitest, and Drizzle Kit. Package versions are pinned in `package.json`, with
the dependency tree recorded in `package-lock.json`.

Database wiring, driver selection, schema, migrations, service implementations,
authentication wiring, and upload routes are deferred. The OCR library is
intentionally omitted. Open product decisions remain in the specifications.

## Verification and production startup

```sh
npm test
npm run typecheck
npm run build
npm start
```

Tests run without opening a listening socket or contacting external services.
The build emits JavaScript under `dist/`; startup handles SIGINT and SIGTERM
by closing Fastify.

## Word normalization

OCR word extraction lowercases with JavaScript's locale-independent
`toLowerCase`. Unicode letters, combining marks, and numbers form token bodies.
U+0027 (`'`) and U+2019 (`’`) are preserved as distinct internal apostrophes;
U+002D (`-`), U+2010 (`‐`), and U+2011 (`‑`) are preserved as distinct internal
hyphens. A preserved apostrophe or hyphen must have a word character on each
side. Every other whitespace, punctuation, symbol, control, or separator
character is a boundary.

Normalized words are matched exactly within the authenticated owner and
collection language. Existing rows are not rewritten or case-folded. Multiple
exact stored matches produce a conflict instead of an arbitrary match.

This initial tokenizer does not extract phrases, normalize Unicode composition,
equate curly and straight apostrophes, join words hyphenated across line breaks,
or segment languages without explicit word boundaries.
