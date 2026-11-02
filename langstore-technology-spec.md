# LangStore — Backend Technology Specification

Date: 2 November 2026  
Status: Technology decisions confirmed; implementation design proposed below. No code or deployment is included.

## 1. Purpose and scope

Build a backend-only API that accepts photographs of book pages, extracts text using OCR, and supports a private store of encountered words and phrases.

v0 covers authentication, photo ingestion, vocabulary persistence, and basic retrieval. No frontend is included. Semantic search, vector storage, embeddings, lesson generation, speech practice, and AI learning features are deferred.

Use [langstore-v0.md](langstore-v0.md) for product requirements and [ENGINEERING.md](ENGINEERING.md) for development rules. This specification settles their previously open HTTP framework, authentication provider, OCR provider, ORM, and test-runner choices. It does not settle the vocabulary-extraction method.

## 2. Selected technologies

| Area | Technology | Responsibility |
| --- | --- | --- |
| Runtime | Node.js | Run the backend service. |
| Language | TypeScript | Typed application code with strict checking. |
| HTTP API | Fastify | Routing, lifecycle hooks, validation, response serialization, and logging. |
| Authentication | Clerk | Managed identity and session authentication. |
| OCR | Google OCR | Extract text from uploaded page images. Use Google Cloud Vision Document Text Detection as the concrete integration proposed in this spec. |
| Database | PostgreSQL | Store private learner data, ingestion records, vocabulary, forms, and counts. |
| Data access | Drizzle ORM | Typed PostgreSQL schema and database queries. |
| Migrations | Drizzle Kit | Generate and apply reviewed SQL migrations alongside Drizzle ORM. |
| Tests | Vitest | Unit, API, and database integration tests. |

Render API hosting and Neon PostgreSQL hosting remain the prior hosting selections. Plans, limits, and exact deployment settings must be checked at deployment time; this spec makes no pricing commitment.

Pin a mutually compatible supported Node.js release and package versions during project setup, commit the lockfile, and document the runtime. Exact versions and the package manager are not selected here.

## 3. Application architecture

Keep one application and three primary folders at the repository root.

| Folder | Contents | Dependencies |
| --- | --- | --- |
| `/core` | Domain types, ingestion use cases, vocabulary rules, and interfaces for OCR, extraction, and persistence. | No Fastify, Clerk, Google, or Drizzle imports. |
| `/api` | Application factory, startup, configuration, routes, authentication hooks, request schemas, and error mapping. | Calls core use cases; startup wires infrastructure adapters. |
| `/infrastructure` | Google OCR adapter, Drizzle schema, repositories, database connection management, migrations, and future external adapters. | Implements core interfaces. Does not import API code. |

The API composition root constructs concrete adapters and passes them into core use cases. Route handlers do not query Drizzle or call Google directly.

Suggested interfaces are `OcrService`, `VocabularyExtractor`, and purpose-specific repository contracts. Define provider-neutral results in core; translate provider responses and errors inside adapters. Use interfaces for replaceable boundaries without introducing an interface for every helper.

Expose a `buildApp(dependencies)` factory separately from the function that opens the HTTP listening socket. This supports API tests without starting a network server.

## 4. Authentication and ownership

Use `@clerk/fastify` and register `clerkPlugin()`. Explicitly protect ingestion and vocabulary routes using verified authentication obtained through `getAuth()`; registering the plugin alone is not the authorization policy.

For this user-facing API, accept Clerk user-session authentication. Pass a small internal actor value, containing the verified Clerk user ID, into core. Do not pass Clerk request objects into business logic.

Every learner-owned operation must be scoped by that identity, including ingestion status and vocabulary lookup. Never trust a submitted owner ID. Clerk authenticates the caller; application repositories enforce ownership.

Proposed API convention: return 401 for unauthenticated calls and 404 for records absent from the caller's own scope. Public health endpoints expose no private data.

Clerk manages sign-in, credentials, and sessions. The backend does not implement password storage or a custom login service. Development requires a documented way to obtain a real Clerk test session without building a production frontend. Sign-in options and account-deletion handling remain open.

## 5. Photo ingestion and OCR

Proposed initial request format: one image per multipart upload. Use a compatible multipart integration such as `@fastify/multipart`; validate actual file content, supported media type, byte size, and image dimensions. Exact limits and accepted formats must be set before implementation.

Authenticate before invoking a paid OCR operation. Apply per-user request limits and bounded processing concurrency. Do not accept arbitrary remote image URLs in the initial endpoint.

The Google adapter uses `@google-cloud/vision` and `DOCUMENT_TEXT_DETECTION`, intended for dense document text. Map `fullTextAnnotation` into a neutral OCR result containing the extracted text and any layout or language information the application actually needs. Do not treat OCR confidence as confidence in vocabulary meaning.

Preserve punctuation and casing in the original OCR text. Perform matching normalisation on a separate representation after establishing sentence boundaries. OCR does not identify useful vocabulary expressions or reliably resolve meanings; these are later processing responsibilities.

Proposed pipeline:

1. Verify identity and validate the upload.
2. Reserve a user-scoped ingestion identifier and idempotency key.
3. Extract page text through the OCR interface.
4. Run the selected vocabulary-extraction implementation on the original text.
5. Batch lookup existing forms for that user and language.
6. Persist accepted vocabulary changes and counts atomically, then mark ingestion complete.
7. Return the result or a truthful failure/partial-processing status.

Do not hold a database transaction open while waiting for OCR or other external services.

Start by evaluating request-bound processing for a single page. This is a proposed simplification, not an agreed latency guarantee. If processing exceeds request timeouts, choose durable job execution and durable input storage before returning 202. Do not rely on an untracked in-memory background task surviving a restart.

## 6. Vocabulary extraction boundary

The extraction algorithm remains undecided. Current experiments include sentence-bounded n-grams of up to 20 words, linguistic parsing for expressions and split verbs, and possible model-assisted extraction.

An n-gram is a candidate, not automatically a meaningful vocabulary entry. Matching saved spelling is also not proof of matching meaning or learner understanding.

The extractor contract should support:
- Original text and language information as input.
- Candidate words/phrases, encountered forms, and sentence context.
- Occurrence locations; allow multiple token positions for discontinuous expressions.
- A distinction between an extracted candidate and a resolved meaning.

Counting can aggregate repeated candidates for display, but must retain enough occurrence/context information during processing to avoid merging different meanings blindly. Do not remove saved individual words before phrase extraction.

Whether unresolved candidates are persisted, held for confirmation, or rejected remains a product decision. Do not silently replace meaning-specific vocabulary entries with spelling-only records.

## 7. Persistence design

The following is a conceptual design, not a final migration.

| Entity | Information |
| --- | --- |
| Ingestion | ID, owner, input kind, processing state, submitted timestamp, idempotency key, payload fingerprint, safe failure details, and result reference. |
| Vocabulary entry | ID, owner, language, word/phrase kind, canonical form, specific meaning description, initial read/exposed state. |
| Encountered form | Entry relationship, actual form, matching representation, exposure count, and encounter boundaries where known. |
| Context / occurrence evidence | Sentence and occurrence identity needed for counting, corrections, and retries; retention and physical layout remain open. |

Keep meanings private to each learner. Distinct meanings of the same form are separate entries. Do not impose uniqueness on owner + canonical spelling alone. Use owner-scoped indexes and constraints; enforce ownership consistency in relationships as well as repository filters.

Exposure totals derive from retained forms. Keep updates atomic and correct under concurrent requests. A saved entry is evidence of exposure, not proof that the learner knows it.

Use a unique constraint on owner + idempotency key and compare request fingerprints. Repeating the same request must not increment counts; reusing a key with different content should return a conflict. Handle in-progress records and interrupted attempts explicitly.

Request idempotency does not detect two different photos of the same page or overlapping images. Cross-upload occurrence matching remains open and must not be claimed as solved by hashing image bytes.

Keep Drizzle schema and SQL migrations in infrastructure. Generate migrations with Drizzle Kit, review and commit the SQL, and apply migrations as a controlled deployment step. Do not use unreviewed schema push as the production migration process.

The PostgreSQL driver, connection-pool settings, image storage, and retention policy remain to be selected. Original images must not be assumed durable on the API host's local filesystem.

## 8. Proposed HTTP surface

Paths and response shapes are proposed contracts to refine before implementation.

| Method and path | Behaviour |
| --- | --- |
| `GET /health` | Public process health with minimal response. |
| `POST /v1/ingestions/photos` | Authenticated single-photo upload with an idempotency key. |
| `GET /v1/ingestions/:id` | Return the caller's ingestion state and available result. |
| `GET /v1/vocabulary` | Paginated caller-owned vocabulary; basic language/text filters. |
| `GET /v1/vocabulary/:id` | Return one caller-owned entry with forms and retained context. |

Use Fastify JSON Schemas for JSON bodies, parameters, query strings, and responses. Multipart content requires its own file and field validation; TypeScript types do not validate uploaded data.

Use a consistent error envelope such as `{ error: { code, message }, requestId }`. Distinguish malformed input, unauthenticated calls, missing records, idempotency conflicts, upload-limit violations, rate limits, and upstream failures.

Keep the input kind explicit internally so future text or lesson ingestion can feed shared vocabulary processing without pretending to be a photo. Those endpoints are outside v0.

## 9. Testing and operations

Use Vitest for:
- Core tests with injected OCR/extractor/repository fakes.
- Fastify API tests through `app.inject()`, including unauthenticated access, ownership isolation, validation, upload limits, and consistent errors.
- Drizzle repository tests against an isolated real PostgreSQL test database, covering migrations, uniqueness, transactions, concurrent updates, and retry behaviour.
- OCR adapter contract tests using recorded/synthetic provider responses, including empty text and provider errors.

Mocked identity tests do not prove Clerk token verification works. Add a controlled integration check with a Clerk development instance. Keep live Clerk and Google tests opt-in; ordinary tests must not consume paid OCR or production data.

Run TypeScript checking separately, for example `tsc --noEmit`, in addition to `vitest run`. Define actual package scripts during setup. No checks have been executed against an application because the repository is not implemented yet.

Validate configuration at startup. Use managed secrets for database credentials, Clerk keys, and Google credentials; grant only required permissions. Use Google Application Default Credentials with a deployment-appropriate credential source.

Log request IDs, stage durations, safe error codes, and ingestion states; redact tokens and page/vocabulary content. Bound external-call timeouts and retries. Close database connections gracefully on shutdown.

## 10. Remaining decisions

1. Initial language coverage and vocabulary/phrase extraction method.
2. Meaning resolution and handling of unresolved candidates.
3. Normalisation, split-verb representation, and occurrence matching across uploads.
4. OCR correction and vocabulary editing workflows.
5. Upload limits, supported image formats, and processing-time target.
6. Request-bound processing versus durable jobs; image/text/context retention.
7. Database driver, exact schema, deletion lifecycle, and migration environment.
8. Clerk sign-in configuration and backend-only development authentication workflow.

## Official references

Reviewed 2 November 2026. Integration guidance informed this specification; no package versions or pricing are guaranteed.

- [Fastify validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Fastify testing](https://github.com/fastify/fastify/blob/main/docs/Guides/Testing.md)
- [Clerk Fastify quickstart](https://clerk.com/docs/fastify/getting-started/quickstart)
- [Clerk getAuth](https://clerk.com/docs/reference/fastify/get-auth)
- [Google Cloud Vision document text detection](https://docs.cloud.google.com/vision/docs/fulltext-annotations)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Vitest type checking](https://vitest.dev/guide/testing-types)
