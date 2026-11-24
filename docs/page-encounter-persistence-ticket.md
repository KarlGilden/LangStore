# Ticket: Persist page encounters across ingestion and vocabulary selection

Status: ready for implementation.

## Outcome

Complete the two-phase page workflow so every vocabulary entry that is saved at the relevant persistence point receives an encounter for the page:

1. During page ingestion, save the page and encounters for words that already exist in the learner's vocabulary.
2. After the learner selects suggested words, save any new entries and encounters for every selected word in one transaction.

Suggestions remain transient. If the learner closes or abandons the selection screen, the page and encounters created during ingestion remain saved, while the unselected suggestions are lost.

## Confirmed behaviour

- Extract and count every normalized word before separating saved words from unknown words.
- A word is considered already saved during ingestion if a matching entry exists at the ingestion persistence transaction's snapshot point.
- Save the page and all encounters for matching existing entries atomically.
- Return only unmatched words to the client as suggestions, including each word's absolute occurrence count on the page.
- The client returns only the suggestions selected by the learner.
- In the selection-save transaction, check again whether each selected word now exists. Reuse entries created between the ingestion and selection requests.
- Create translations only for entries newly created by the selection request. Do not replace or append to the translations of a reused entry.
- Save one encounter row per entry and page. Its `count` is the absolute occurrence count on that page, not an increment.
- Upsert an encounter by replacing its count so retries cannot inflate exposure totals.
- An empty selection is a successful no-op returning an empty array.
- If an unselected suggestion becomes a saved entry after ingestion, it does not receive an encounter from this workflow. It was neither saved at the ingestion snapshot nor selected in the second phase.
- The submitted selection text and count remain client-held, structurally validated values under the current MVP trust model. Persisted suggestion drafts or signed suggestion tokens are out of scope.
- Duplicate-photo detection and transport-level page-upload idempotency remain out of scope. Re-uploading the same page as a new page may produce separate encounters.

## Failure semantics

| Failure or interruption | Required result |
| --- | --- |
| OCR or word extraction fails | Save neither the page nor encounters. |
| Initial page/encounter transaction fails | Roll back the page and every encounter from that transaction. Do not return suggestions for a page that was not saved. |
| Initial transaction commits but its HTTP response is lost | Keep the committed page and existing-entry encounters. A repeated upload may create a separate page under the current non-idempotent upload contract. |
| Learner sends no selections or abandons the screen | Keep the page and existing-entry encounters. Persist none of the transient suggestions. |
| Selection validation fails | Write no entries, translations, or encounters from that request. |
| Selection transaction fails | Roll back every entry, translation, and encounter created or changed by that request. |
| Selection transaction commits but its HTTP response is lost | An identical retry reuses the entries, preserves their translations, and replaces the same absolute encounter counts without duplication. |
| Another request saves a selected word before or during selection persistence | Reuse the matching entry and create or update its encounter instead of returning an entry-conflict error. |

## Scope

### Included

- Word extraction output needed to retain counts for both saved and unknown words.
- Atomic page and existing-entry encounter persistence.
- Rechecking selected words inside the selection transaction.
- Repeat-safe and concurrency-safe entry reuse and encounter upserts.
- Ownership and language enforcement at both persistence boundaries.
- Targeted service, route, and PostgreSQL repository tests.

### Excluded

- Persisting or resuming suggestion drafts.
- Reprocessing abandoned suggestions.
- Proving submitted suggestions came from OCR.
- Phrase extraction, meaning resolution, or context-aware translation.
- Duplicate-page detection or upload idempotency.
- Unrelated changes to the review UI or aggregate encounter queries.

## Implementation steps

### 1. Preserve all extracted word counts

Update `WordExtractionService` so extraction returns every unique normalized word and its positive absolute count. It must no longer remove words that match existing entries.

- Keep normalization and tokenization independent of persistence.
- Continue using the existing normalization policy for extraction, lookup, and selection validation.
- Return one result per normalized word, even when it appears several times.
- Do not query all entries and filter tokens with repeated array scans. Perform a purpose-specific, owner- and language-scoped batch lookup after extraction.

The page-ingestion coordinator should work from one complete collection of extracted counts and partition it using existing entries. Do not independently tokenize the OCR text for saved and unknown words.

### 2. Add an ingestion persistence boundary

Add a purpose-specific core repository contract for saving a page with encounters for entries that already exist. Keep Drizzle types out of the core contract.

The input must contain:

- authenticated `userId`;
- URL/collection `iso`;
- page identity and creation fields;
- all extracted normalized words and their absolute counts, or an equivalent representation that allows the transaction to re-resolve matching entries.

The operation must return the saved page and enough information to identify which extracted words were matched at the transaction snapshot. The coordinator uses that result to produce only unmatched suggestions.

### 3. Save the page and existing encounters atomically

Implement the ingestion persistence contract in the Drizzle infrastructure layer using one short database transaction.

Inside the transaction:

1. Recheck that the collection belongs to the authenticated user and matches the requested language.
2. Resolve existing entries by normalized text, authenticated user, and language using a batch query.
3. Create the page.
4. Upsert one encounter for every matched entry using its extracted absolute count.
5. Return the page and the normalized texts matched by the transaction.

If any step fails, roll back the page and all encounter writes. Do not hold this transaction open during OCR, translation, or any other external call.

The transaction is the definition point for whether an entry was already saved during ingestion. A word created after the transaction commits remains a suggestion unless it is later selected.

### 4. Update the ingestion coordinator

Change `PageIngestionService` to perform the workflow in this order:

1. Validate the language and page fields.
2. Verify collection access before invoking paid external providers.
3. Run OCR and reject empty recognized text.
4. Extract every normalized word and count.
5. Call the atomic ingestion persistence operation.
6. Remove the transaction-matched words from the suggestion result.
7. Return the committed page and unmatched suggestions with their counts and current translation fallback.

Do not return suggestions if page persistence fails. If no words are unmatched, return an empty suggestions array; the page and its existing-entry encounters are still a successful ingestion result.

### 5. Make selected-entry persistence reuse existing entries

Change the existing `EntryRepository.savePageEntries` operation and its Drizzle implementation so it does not blindly insert every selected word.

Inside one transaction:

1. Recheck that the page belongs to the authenticated user and its collection matches the requested language.
2. Resolve matching entries for all selected normalized texts under the authenticated user and language.
3. Insert only missing entries.
4. Handle concurrent unique conflicts on `(userId, iso, text)` by resolving and reusing the entry that won the race.
5. Insert submitted nonblank translations only for entries created by this transaction.
6. Preserve translations on every reused entry.
7. Upsert one encounter for every selected word on the page, replacing `count` with the submitted absolute count.
8. Return entries in the same order as the submitted selections.

The whole batch must be all-or-nothing. A mixed batch of new and reused entries must not leave partial entries, translations, or encounters when any write fails.

Do not implement the concurrency check as an unprotected query followed by unconditional inserts outside the transaction. Database uniqueness remains the final authority for concurrent requests.

### 6. Keep service and route responsibilities narrow

- Keep complete structural validation in `EntryService.savePageEntries` before persistence.
- Continue deriving ownership from `request.currentUserId` and language/page identity from the route.
- Do not accept a user ID or language override in the request body.
- Keep the existing selected-only client request shape.
- Keep an empty `entries` array as a successful `[]` response.
- Map repository ownership or language failures to the existing scoped page-not-found response.
- Remove the current behaviour that turns a reusable selection-time entry collision into `ENTRY_ALREADY_EXISTS` for this batch operation. The single-entry creation endpoint may retain its existing conflict behaviour.

### 7. Verify read behaviour

Confirm that existing page-vocabulary and review queries require no schema changes:

- page vocabulary returns the entry and its absolute count on that page;
- total encounter count remains the sum of per-page counts;
- encounter page count remains the number of unique entry/page rows;
- translations do not multiply either aggregate.

No migration should be necessary because the existing unique `(entryId, pageId)` constraint and positive `count` field support these semantics.

## Targeted tests

### Word extraction

1. Extraction returns saved and unknown normalized words together with correct counts.
2. Repeated occurrences produce one extracted item with the absolute count.
3. Normalization remains identical for extraction and selection validation.

### Initial ingestion

1. Given OCR text containing saved and unknown words, ingestion creates the page, records encounters only for entries saved at the transaction snapshot, and returns only unknown words as suggestions.
2. A saved word appearing several times creates one encounter row with the correct count.
3. When every extracted word is already saved, ingestion returns no suggestions but records all encounters.
4. Another user's entry or an entry in another language is neither matched nor linked.
5. A forced encounter failure rolls back the page and all other encounter writes.
6. A collection deleted or changed before persistence produces no page or encounters.

### Selected suggestions

1. Selected missing words create entries, nonblank translations, and page encounters in one transaction.
2. Unselected suggestions create neither entries nor encounters.
3. A word saved between ingestion and selection is reused, its translations remain unchanged, and its encounter is recorded.
4. Concurrent selection requests for the same word result in one entry and one entry/page encounter.
5. Repeating an identical successful request creates no duplicate entries or translations and does not inflate encounter counts.
6. A later corrected absolute count replaces the previous count.
7. A mixed batch of reused and new entries is returned in request order.
8. A forced entry, translation, or encounter failure rolls back the complete batch.
9. Another user's page or a page in another language produces the scoped not-found response and no writes.
10. An empty selection returns `[]` and changes nothing.

Use real PostgreSQL repository tests for transaction rollback, uniqueness, and concurrency guarantees. Service fakes alone are insufficient for those behaviours.

## Definition of done

- The page and encounters for vocabulary already saved at the ingestion transaction snapshot are persisted atomically.
- Only unmatched words are returned as transient suggestions.
- Selected words are re-resolved inside one transaction, with missing entries created and existing entries reused.
- Selection retries and concurrent saves neither duplicate entries/translations nor inflate encounter totals.
- Abandoning selection leaves the saved page and its existing-entry encounters intact.
- Ownership, language isolation, normalization, and absolute-count semantics are enforced at both persistence boundaries.
- Relevant typechecks and tests pass, including real-database transaction and concurrency coverage.
