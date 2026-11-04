# LangStore — Schema Decision Record
Updated: 4 November 2026

Records the latest schema discussion, with the current model in [langstore-schema.md](langstore-schema.md). These decisions replace earlier meaning-level entry and all-vocabulary ingestion assumptions where they conflict. Earlier planning files have not been rewritten by this document.

## Agreed decisions

| Area | Decision | Reason or consequence |
| --- | --- | --- |
| Initial content | Model collections and pages around book reading, while keeping generic names. | Online texts and other sources can fit the terminology later. |
| Membership | A page belongs to one collection only. | No multiple-collection join table is needed. |
| Collection language | A collection has one fixed language in iso. | Pages and their summaries inherit that language; multilingual collections are out of scope. |
| User preferences | Separate UserSettings contains targetLanguage and userLanguage. | Preferences can grow without adding them to the identity record; userLanguage is the user's native language. |
| Language switching | targetLanguage controls which collections, pages, and entries are displayed. | Switching does not rewrite stored iso codes, summaries, or vocabulary. |
| Page ownership | Store userId on Page as well as Collection. | Supports direct owner-scoped page queries; the two owner values must agree. Filtering pages by language still uses Collection. |
| Saved vocabulary | Store only vocabulary the user is learning. | The store is not a complete inventory of every word read. |
| Entry identity | An entry represents one form of a word or phrase, owned by one user. | Different grammatical forms are separate entries; no canonical-form grouping is required now. |
| Meaning | Translations express meaning, and one entry may have translations with different meanings. | No separate meaning entity; an encounter does not resolve which meaning applies. |
| Translation multiplicity | Keep translations in a separate table linked to Entry. | Each entry can have multiple personal translations. |
| Translation language | Translation text may be in any language; do not store iso on Translation. | The entry's iso describes the vocabulary, not the translation. Translation language is intentionally untracked. |
| Encounter grain | One encounter row per entry per page. | Multiple appearances can be aggregated rather than stored as individual rows. |
| Existing entries | Automatically count existing learning entries on newly processed pages. | Users need not select the same learning entry again. |
| New entries | Require user selection before saving a new entry. | Unselected new candidates do not become permanent learning entries. |
| Repeat uploads | Do not detect repeated photographs/pages for now; duplicate uploads are the user's responsibility. | A separately uploaded duplicate may create another page and add encounters. |
| Summaries | Generate a summary in the collection's target language, using vocabulary from the page as much as naturally possible. | Supports later review and discussion using the reading material's vocabulary. |

## Working schema details carried forward

- Add the missing User.id, Page.collectionId, and EntryEncounter.entryId relationships from the initial sketch.
- Keep User.providerId for the authentication-provider identity and email unique, as in the working model.
- Use UserSettings.userId as its primary key to allow one settings row per user.
- Include EntryEncounter.count, default 1 and positive, with a unique (entryId, pageId) pair. The user proposed the count field; it is the working design rather than a separate history of appearances.
- Use Page.createdAt for the latest uploaded page. A separate reading/rereading timestamp has not been agreed.
- Retain Collection.iso and Entry.iso; remove redundant iso fields elsewhere.

## Executable schema conventions

| Area | Decision | Reason or consequence |
| --- | --- | --- |
| Identifier type | Keep the existing User UUID primary key and use UUID primary/foreign keys for every table. UUID primary keys default to `gen_random_uuid()`. | Avoids replacing deployed identity keys and allows application services to allocate stable IDs before retryable writes. |
| Key updates | Primary and foreign keys are immutable; foreign keys use `ON UPDATE NO ACTION`. | Identity changes create new records rather than rewriting relationship keys. |
| Username | User.username is nullable and comes only from the authenticated identity-provider profile. Do not derive it from email. | Clerk username availability is not guaranteed and username is not an authorization input. |
| Email | User.email is required and unique. Trim and lowercase it before persistence. | Makes the stored representation used by the unique constraint deterministic. |
| Required text | Collection.name, Page.name, Entry.text, and Translation.text are required and non-blank. | These fields identify or supply the useful content of their records. |
| Optional metadata | User.username, Collection.description, Collection.imgUrl, Page.description, and Page.summary are nullable. | Presentation metadata and generated summaries may be unavailable without blocking persistence. |
| Translation minimum | An Entry may initially have zero translations. Translation.text is required when a Translation exists. | Selection and persistence can complete before translation enrichment or recovery from translation failure. |
| Language codes | All `iso` and settings language fields store lowercase ISO 639-1 alpha-2 codes. PostgreSQL enforces `^[a-z]{2}$`; application validation rejects unassigned codes using the ISO 639-1 registry. v0 accepts every assigned code. | Matches the existing `iso` contract while keeping storage and filtering deterministic without blocking schema work on a narrower product allowlist. |
| Settings creation | User provisioning does not create language defaults. Create or replace UserSettings explicitly through the settings write operation. | The application must not guess native or target language. |
| Missing settings | Reading absent settings returns not found; operations requiring targetLanguage return a settings-required error. | Makes incomplete onboarding explicit. |
| Timestamps | Use `timestamp(3) with time zone NOT NULL DEFAULT now()` for every createdAt field. Store and compare instants in UTC. | Provides one database-generated, timezone-aware convention with millisecond precision. |
| Parent deletion | Deleting a User cascades to UserSettings, Collection, Page, Entry, Translation, and EntryEncounter. Deleting a Collection cascades to Page and its EntryEncounter rows. Deleting a Page cascades to EntryEncounter. Deleting an Entry cascades to Translation and EntryEncounter. | Prevents orphaned private data and retains no child data independently of its owner or parent. |
| Page ownership | Enforce Page/Collection ownership with `UNIQUE Collection(id, userId)` and a composite Page foreign key `(collectionId, userId)`. | Prevents a Page owner from differing from its Collection owner. |
| Encounter ownership and language | Verify Entry owner, Page owner, and Entry.iso/Collection.iso in the encounter write transaction. | EntryEncounter has no redundant owner or language columns; the service and repository must enforce the cross-aggregate rule atomically. |
| Page retry | Repeating Page creation with the same caller-stable UUID and the same `userId`, `collectionId`, `name`, and `description` returns the existing row; reuse with different creation fields is a conflict. `summary` and database-generated `createdAt` are excluded. A new UUID creates a new Page even for duplicate content. | Separates request retry safety from generated summary updates and duplicate-page detection. |
| Encounter retry | Write the absolute per-page count and upsert on `(entryId, pageId)` by replacing count, never incrementing it. | Replays do not inflate exposure counts and corrected extraction can replace a count. |

## Ingestion behaviour

1. Extract candidate vocabulary and its appearances from an uploaded page.
2. Compare candidates with the user's existing learning entries in that language.
3. Automatically record page encounters and counts for matching saved entries.
4. Present new candidates for user selection.
5. Save selected entries and their encounters; do not permanently save unselected new candidates as learning entries.

The extraction method, normalisation/matching rules, and temporary storage needed between extraction and selection remain open. Saving a form does not establish understanding of it.

An entry encountered three times on one page has one encounter row with count 3. The same entry on a second page has a second encounter row. Its aggregate count is the sum of those page counts.

## Intended review direction

The proposed experience is: photograph a page, select vocabulary, then start either a structured review or a conversation about the reading. Chat context would combine the page summary, learning vocabulary from that page, and behavioural/anti-reproduction instructions.

Review from a collection should retrieve the learning entries associated with its pages. Review from a page should retrieve entries linked to that page. These are intended flows; review scheduling, session history, chat storage, and assessment tables have not been designed.

## Retention direction and remaining questions

The user prefers a summary for later discussion and is considering avoiding storage of full page text because of size and copyright concerns. Permanent raw text/image retention and temporary processing retention are not yet finalised. Summarisation is a product approach, not a determination that copyright concerns are resolved.

Still open:
- What happens to the image and OCR text after extraction, selection, and summary generation? How long may temporary data survive?
- How are case, punctuation, spelling, and Unicode normalised when matching entries?
- Which extraction method identifies useful phrases and split verbs?
- How are extraction/summary failures and corrections presented?
- How will collection order and spoiler boundaries work for future chat?

## Next step

Use the agreed relationships and executable conventions as the basis for Drizzle schemas and reviewed SQL migrations. Resolve matching, retention, and failure presentation before finalising the ingestion write flow. Design review and chat persistence separately when that work begins.
