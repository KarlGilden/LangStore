# Backend engineering instructions

Applies to backend implementation and review. Read the sections relevant to the task. Product scope and terminology live in [langstore-v0.md](langstore-v0.md); the backend uses Node.js and TypeScript. Do not select an HTTP framework, OCR provider, ORM, or authentication provider without an agreed requirement.

## Architecture and dependency direction

Keep three primary application folders at the repository root:

| Folder | Responsibilities | Dependency rules |
| --- | --- | --- |
| `/core` | Domain models, business rules, application use cases, and interfaces for external capabilities. | Must not import `/api`, `/infrastructure`, HTTP framework types, database clients, or provider SDKs. |
| `/api` | Application startup, configuration, routes, HTTP methods, request validation, authentication integration, and error-to-HTTP mapping. | Handlers call core use cases. Only startup/composition code imports concrete infrastructure implementations to wire dependencies. |
| `/infrastructure` | Database repositories, OCR adapters, and other external-service implementations. | Implements interfaces owned by core; must not depend on API code. |

- Express replaceable capabilities as small, consumer-focused TypeScript interfaces in core; inject implementations through constructors or function parameters.
- Use interfaces at dependency boundaries, not mechanically for every class or pure helper. Core can depend directly on its own models and functions.
- Define provider-neutral input/output types in core. Translate SDK responses and provider errors inside infrastructure; do not leak Google OCR or database-specific types into use cases.
- For example: core defines an `OcrService` interface; infrastructure implements it with a Google adapter; API startup injects that adapter. Changing provider should not require rewriting the ingestion use case.
- Keep photo/OCR processing separate from shared vocabulary processing so future text inputs can reuse the latter. Implement only photo ingestion now; do not build speculative adapters or a plugin framework.
- Prefer explicit dependency wiring; a dependency-injection container is not required.

## TypeScript and Node.js

- Enable TypeScript `strict`; use explicit types at public boundaries and inference for obvious local values.
- Treat untrusted values as `unknown` and validate at runtime. Avoid `any`, unchecked assertions, and non-null assertions used merely to silence errors.
- Follow the repository's formatter, linter, module system, package manager, and supported Node version. Do not introduce competing tools or lockfiles.
- Keep handlers small; place business decisions in core and I/O in infrastructure.
- Await or explicitly manage promises; handle rejection and cancellation where applicable. Avoid blocking request handlers with CPU-heavy or synchronous I/O work.
- Use the simplest maintainable implementation; add abstractions only for actual boundaries or demonstrated needs.

## Validation, errors, and external calls

- Validate HTTP inputs, uploads, configuration, and external responses at their boundaries; enforce business invariants in core.
- Catch errors where recovery, cleanup, or translation is possible. Otherwise propagate to the established handler; do not add catch-and-log wrappers everywhere.
- Map known failures to consistent HTTP responses. Unexpected failures return a safe error response and produce actionable server-side diagnostics without leaking internals.
- Never swallow errors, leave promises unhandled, or report failed/partial ingestion as successful.
- Set explicit timeouts on external calls. Retry only transient failures with bounded attempts and backoff, and only when repeating the operation is safe.
- Use transactions for related database changes; keep counts correct under retries and concurrent writes.
- Do not log credentials, tokens, uploaded page content, or private vocabulary by default.

## Authentication and vocabulary data

- Derive user identity from verified authentication, not a client-supplied user ID. Enforce ownership on every read and mutation, including uploaded files and background jobs.
- Scope repository operations by the authenticated learner; keep meanings and vocabulary private to that learner.
- Use parameterised database operations and versioned migrations. Keep secrets in server-side configuration.
- Keep exposures distinct from familiarity: repeated appearances do not establish recognition, understanding, or production.
- Preserve meaning-specific entries, encountered forms, sentence context, and equal exposure weighting. Retries must not create additional exposures.
- Do not merge senses or synonyms solely because their spelling or similarity suggests a match.
- Leave unresolved product choices explicit, including meaning resolution, occurrence identity, correction behaviour, retention, and familiarity categories.

## Verification and maintenance

- Read the repository's package scripts and tooling configuration before choosing commands; do not invent successful lint, type-check, test, or build results.
- Test observable behaviour: core rules with injected fakes, infrastructure contracts/integration where needed, and API authentication and validation at HTTP boundaries.
- For relevant changes, cover cross-user access denial, repeat submissions, concurrent count updates, and external-service failures. Add regression coverage for fixes where practical.
- Keep tests proportional to the change; avoid tests that merely repeat the implementation or require live paid services by default.
- Report checks run, results, unavailable checks, and material remaining risks. Update affected documentation when agreed behaviour changes.
- Once the repository exists, document its actual setup and verification commands in its README; keep these instructions focused on durable rules.

## Rationale and primary references

These rules adapt the following guidance to LangStore; the folder layout and Git confirmation policy are project decisions, not universal requirements.

- [AGENTS.md specification and examples](https://agents.md/): a predictable Markdown home for repository-specific agent instructions. Keep always-needed rules in AGENTS.md and route detailed guidance explicitly.
- [TypeScript strict checking](https://www.typescriptlang.org/tsconfig/strict): enable the strict family of compile-time checks; runtime input validation remains a separate responsibility.
- [Microsoft: architectural principles](https://learn.microsoft.com/en-gb/dotnet/architecture/modern-web-apps-azure/architectural-principles): dependency inversion makes infrastructure depend on abstractions owned by the application. The principle applies here without adopting .NET-specific implementation patterns.
- [Node.js error documentation](https://nodejs.org/api/errors.html): error handling depends on the API, including thrown exceptions, rejected promises, and error events.
- [Git status documentation](https://git-scm.com/docs/git-status): porcelain output supports predictable detection of staged, unstaged, and untracked changes.

Research reviewed 1 November 2026.
