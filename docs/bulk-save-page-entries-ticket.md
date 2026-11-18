# Ticket: Save selected page entries in bulk

Status: implemented; awaiting project-owner testing.

## Outcome

Add one authenticated endpoint that accepts the words a learner selected after page processing, creates the learner's entries in bulk, and records each selected entry's absolute occurrence count for that page.

Unselected suggestions remain transient and must not be persisted. The operation must follow the repository's current Fastify route, core service, repository interface, Drizzle adapter, shared contract, error-mapping, and composition patterns.

## Context and confirmed behaviour

- Page ingestion returns unsaved suggestions containing normalized word text, a page occurrence count, and an editable translation.
- A learner chooses which suggestions become permanent entries.
- Entry ownership comes only from the authenticated request; a request body must never supply or override a user ID.
- The URL language and page must belong to that learner. A page outside that scope is reported as not found.
- A selected word becomes an `Entry`; its nonblank translations become `Translation` rows; its page count becomes one `EntryEncounter` row.
- Entry text is unique per user and language. A repeated or concurrent duplicate save is rejected instead of creating another entry.
- The client-held suggestions are not authoritative OCR evidence. For this MVP, accept structurally valid submitted selections without adding persistent suggestion drafts or signed suggestion tokens.

## API contract

Add `POST /api/:iso/page/:id/entries` under the existing protected page route prefix.

The JSON body contains an `entries` array. Each item contains:

- `text`: one nonblank, normalized, single-word suggestion;
- `count`: a positive safe integer representing appearances on this page;
- `translations`: an optional array using the existing `{ "text": string }` translation input shape.

Example request:

```json
{
  "entries": [
    {
      "text": "haus",
      "count": 3,
      "translations": [{ "text": "house" }, { "text": "home" }]
    },
    {
      "text": "ging",
      "count": 1,
      "translations": []
    }
  ]
}
```

Return `200` with an array of the existing entry response view model, in request order. Treat an empty `entries` array as a successful no-op returning `[]`.

Reject the complete request with no writes when an item has blank or non-normalized text, contains more than one word, has a non-positive or non-integer count, repeats the same normalized text within the request, contains an invalid translation, or exceeds the documented payload bounds. Use the existing error envelope and middleware conventions.

## Required implementation shape

### Shared contracts and route

- Define and export the request/response JSON schema from `packages/contracts/src/api`, reusing the existing entry and common schemas where possible.
- Add the handler beside the protected page routes, or in a narrowly named protected page-entry route module registered with the existing `/:iso/page` prefix.
- Read `request.currentUserId`, `request.params.iso`, and `request.params.id`; do not accept ownership or language fields in the body.
- Pass typed input to a new method on the existing `EntryService` and map its returned entries with the existing entry mapper. The route must not query Drizzle directly.

### Existing entry service

- Add a `savePageEntries` method to the service returned by `createEntryService` in `server/src/core/services/entry.service.ts`; do not introduce a separate service.
- Keep the existing single-entry method intact. The new batch method must implement the batch use case directly rather than repeatedly calling the single-entry method.
- Validate the full batch before persistence.
- Verify the page exists for the authenticated user and URL language.
- Apply the same normalization rule used by page extraction and entry matching. Do not create a second, subtly different normalization policy.
- Delegate the all-or-nothing write to one purpose-specific repository operation.
- Return scoped not-found and validation errors through the current core error hierarchy.

### Repository and Drizzle adapter

- Define the repository contract in `server/src/core/repositories` and implement it in `server/src/infrastructure/repositories`.
- In one short database transaction, recheck page ownership/language, create every selected entry, add its nonblank translations, and create its entry/page encounter count.
- Roll back every entry, translation, and encounter write if any item fails.
- Enforce `UNIQUE(userId, iso, text)` in PostgreSQL. Translate a duplicate insert into the API's `409 ENTRY_ALREADY_EXISTS` conflict without exposing database details.
- Inspect existing entry collisions before applying the uniqueness migration. Do not silently merge existing data; allow the migration to stop for an explicit data decision if collisions exist.

### Composition

- Construct the Drizzle adapter in the existing application composition root and inject it into `createEntryService` with the existing entry-service dependencies.
- Pass the existing `EntryService` instance through protected route registration; do not add a second service dependency for this endpoint.
- Keep Fastify and Drizzle types out of the core service and repository contract.

## Plain-English targeted tests

1. Given an owned German page and two selected suggestions, saving them creates exactly those two user-owned German entries, keeps only nonblank translations, records the submitted absolute counts on that page, and returns both entry view models in request order.
2. Given the same valid request twice, the second request returns `409 ENTRY_ALREADY_EXISTS`, creates no duplicate records, and leaves the first request's entries and counts unchanged.
3. Given two concurrent requests containing the same normalized entry text for one user and language, one succeeds and the other returns the duplicate-entry conflict; the database contains one entry.
4. Given a page owned by another user or belonging to another language, the endpoint returns the repository's scoped not-found response and writes no entry, translation, or encounter data.
5. Given any invalid item, or a forced persistence failure partway through a valid batch, the whole request fails and the database contains none of that batch's partial writes.

## Definition of done

- The route, contract, new `EntryService` method, repository interface, Drizzle adapter, error mapping, and application composition follow the current repository layout and naming conventions.
- Selected words are stored and linked to the processed page; discarded suggestions remain absent.
- Ownership and language isolation are enforced again inside the write transaction.
- Batch writes are atomic, and database uniqueness rejects repeated or concurrent duplicate submissions.
- The targeted route, entry-service batch-method, and real-PostgreSQL repository tests pass, along with the repository's existing typecheck and test commands.
- No OCR, page-upload, frontend selection UI, suggestion persistence, phrase extraction, or unrelated refactor is included in this ticket.
