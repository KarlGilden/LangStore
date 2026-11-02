# LangStore v0 — Purpose and Features

## Purpose

LangStore turns vocabulary encountered while reading into a private, persistent store of words and phrases, organised by meaning. The learner photographs pages from a book, and the application extracts text and records the vocabulary encountered, its context, and repeated exposures.

The longer-term goal is to help learners understand and actively use this vocabulary, including speaking with vocabulary from their books. **v0 builds the ingestion and storage foundation only: photo ingestion with OCR, word/phrase storage, and authentication.** An AI learning feature is the next step for v1; its form is not yet selected.

## Core user flow

1. Sign in to a private account.
2. Upload a photo of a book page.
3. The application extracts text with optical character recognition (OCR).
4. The ingestion pipeline identifies words and phrases and records their encountered forms and surrounding sentences.
5. New vocabulary is stored; further genuine appearances update existing vocabulary's exposure information.
6. The learner can inspect their saved vocabulary and its recorded context.

OCR extracts text; identifying phrases, grouping grammatical forms, and resolving meanings are separate responsibilities. The methods used for these steps remain open.

## v0 features

### Photo ingestion with OCR

- Accept photographs of book pages as the only supported ingestion input in v0.
- Support accumulating substantial vocabulary across repeated page uploads, without requiring learners to enter each item manually.
- Extract page text and preserve surrounding sentence context for vocabulary.
- Distinguish successful processing from failed or incomplete ingestion, with a safe way to retry.
- Count genuine repeated appearances equally, including multiple appearances on the same page. Resubmitting or retrying the same appearance must not increase its count.

Photo quality requirements, upload limits, batch upload behaviour, OCR provider, and the correction experience remain undecided.

### Word and phrase storage

A **vocabulary entry** represents one word or phrase with one specific meaning, owned by one learner. Different meanings are separate entries. Grammatical variants of the same word and meaning belong together as encountered forms; synonyms remain separate entries.

The store needs to represent:

| Information | Purpose |
| --- | --- |
| Learner ownership | Keep all vocabulary and meanings private to the learner. |
| Target language and canonical form | Identify the language and name the entry using its dictionary or base form. |
| Word or phrase classification | Distinguish individual words from expressions. |
| Specific meaning | Separate senses of the same word or phrase; a meaning description is written in the target language. |
| Encountered forms | Record the actual forms found in the reading material. |
| Sentence context | Preserve evidence of how the vocabulary was used. |
| Exposure counts | Track appearances per retained form and derive the entry's total from those counts. |
| Encounter boundaries | Record the earliest and latest submitted exposures, rather than the original reading date. |
| Initial familiarity | Mark saved vocabulary as read/exposed without asserting understanding. |
| Occurrence identity | Distinguish genuine repeated appearances from duplicate submissions or retries. |

Exposure counts are source-agnostic. A complete history of books, pages, and every source is not required for v0. How much sentence context and occurrence information to retain still needs a decision.

Removing a wrongly attached form removes its exposures from the entry's total. Encounter boundaries may become unknown after a correction if the retained information cannot establish them.

Basic inspection of saved entries is in scope. Semantic topic search, review scheduling, and assessment of knowledge are not.

### Authentication and privacy

- Provide authenticated access to a learner's private store, including sign-in and sign-out.
- Use a shared database with data separated by user ID; meanings are private rather than shared across users.
- Derive ownership from the authenticated user and enforce it on every operation, including uploads and processing results. A supplied user ID alone must never grant access.
- Prevent users from reading or changing another learner's vocabulary or uploaded material.

The authentication provider, sign-in method, account creation, session management, and recovery flow remain open.

## Design boundaries

Keep the application within one project, using a Node.js and TypeScript backend and PostgreSQL database, with Render and Neon as the selected hosting services. The HTTP framework remains undecided. Hosting choices reflect the preference for low operating cost.

Keep photo handling and OCR separate from the shared vocabulary-processing and storage logic. Future inputs should be able to supply text and context to that same pipeline without changing what a vocabulary entry means. This is a design boundary, not a requirement to build a plugin system or implement additional inputs now.

The precise database schema and processing architecture remain open. pgvector, embeddings, and semantic retrieval are deferred; the earlier OpenAI embedding selection is not a v0 dependency. OCR and linguistic processing technology choices remain undecided, including whether a model is used internally.

## v1 direction — AI learning feature

The next version should introduce an AI feature that helps the learner use vocabulary from their reading. A reading-discussion companion and spoken practice are candidates, not committed features. The desired learning outcome includes speaking using vocabulary from the book.

Lesson generation, conversational interaction, speech input/output, pronunciation feedback, familiarity assessment, and smart review are outside v0. The v1 feature and its success criteria will be selected separately. Other ingestion types remain future possibilities, with no release commitment.

## Open questions before implementation

- Which language or languages will v0 support?
- How will OCR errors be surfaced and corrected before or after vocabulary is saved?
- How will the pipeline identify useful phrases, canonical forms, and context-specific meanings? What happens when a meaning cannot be resolved confidently?
- What identifies the same occurrence on a resubmitted or overlapping page photo, and how much information is retained to prevent duplicate counts?
- Will each entry retain one example sentence, several examples, or context per form? Will original photos and full extracted passages be retained, and for how long?
- What can the learner edit or remove, and how will those corrections update forms, counts, and encounter boundaries?
- Which authentication approach, upload limits, and background-processing approach fit the intended initial volume and budget?

## v0 completion criteria

A learner can sign in, submit a supported page photo, and inspect private vocabulary extracted from it with encountered forms, sentence context, exposure counts, and the initial read/exposed state. Further genuine appearances update counts; retries do not duplicate them. Failures are visible, and another user cannot access the learner's data. This flow requires neither embeddings nor an AI learning feature.
