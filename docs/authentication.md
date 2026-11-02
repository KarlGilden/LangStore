# Ticket: Implement Clerk authentication with Google sign-in

**Status:** Ready for implementation  
**Scope:** Backend authentication integration and Clerk-hosted authentication configuration  
**Product area:** Authentication and privacy  
**Delivery method:** Test-driven development

## User story

As a learner, I want to register, sign in with a valid Google email address, sign out, and call an authenticated user endpoint so that LangStore can identify me without managing credentials itself.

## Context and decisions

LangStore is currently a backend-only Fastify API. Clerk, `@clerk/fastify`, and Vitest are already selected and installed. This ticket makes the following authentication decisions for v0:

- Clerk remains the identity and session provider; LangStore must not store passwords or implement a custom login service.
- Use Clerk's hosted Account Portal for registration, sign-in, profile access, and sign-out. A custom authentication frontend is not part of this ticket.
- Enable Google as a social connection for both sign-up and sign-in. For this ticket, Google is the supported authentication method.
- A valid email means the authenticated Clerk user has a primary email address whose Clerk verification status is `verified`. Clerk handles the Google OAuth and email-verification flow; the API still checks the returned primary email before exposing authenticated application functionality.
- Add `GET /v1/user/me` as the authenticated user route.
- Accept only a Clerk user session token on this user-facing route. Machine tokens and a client-supplied user ID must not authorize it.
- Keep the API independent of any frontend framework. A future frontend may use Clerk's hosted Account Portal, Clerk components, or a custom Clerk flow without changing the API's authorization contract.

Google social sign-up and sign-in are the same Clerk flow: a first-time Google user is registered and a returning user is signed in. Google OAuth must run in a regular browser, not a WebView.

## In scope

### Clerk and Google configuration

- Create or select separate Clerk development and production instances.
- In the Clerk Dashboard, add Google as an SSO connection **for all users** and enable it for sign-up and sign-in.
- Keep Clerk's Google email-subaddress protection enabled unless a later product decision explicitly changes it.
- Use Clerk's shared OAuth credentials for development. Before production release, configure a production Google OAuth web application, authorized origins, Clerk's authorized redirect URI, custom client ID and secret, consent screen, and an **In production** publishing status.
- Record the Clerk Account Portal URLs for sign-in, sign-up, and user profile in the setup documentation. Confirm that the profile UI provides sign-out.
- Configure allowed redirect/origin values for the local and deployed application environments.

### Fastify integration

- Load and validate `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` before importing or initializing Clerk. Fail startup with a safe, actionable message if either value is missing or malformed.
- Add placeholders only to `.env.example`; never commit real Clerk or Google credentials.
- Register `clerkPlugin()` in the Fastify application before protected routes while keeping `GET /health` public.
- Protect `GET /v1/user/me` with `getAuth(request, { acceptsToken: "session_token" })` and require both `isAuthenticated` and `userId`.
- Retrieve the current user with `clerkClient.users.getUser(userId)`. The user ID must come only from the verified Clerk session.
- Keep the Clerk lookup behind a small injected boundary so ordinary `app.inject()` tests can use deterministic fakes without network access. Do not pass Clerk request or user objects into core business logic.
- Map only the approved fields into the public response; do not return the complete Clerk Backend `User` object, metadata, external accounts, phone numbers, or session/token data.
- Preserve redaction of authorization and cookie headers and do not log Clerk tokens or the returned email address.

### Frontend compatibility

- Do not add backend login, registration, logout, or token-minting endpoints for application users. Clerk owns those lifecycle operations.
- Define the API boundary as a verified Clerk session, not as a particular frontend implementation.
- Support Clerk's standard request transports:
  - For a same-origin frontend, Clerk supplies the session through its cookie and the browser includes it with the API request.
  - For a frontend on a different origin, the frontend obtains the short-lived Clerk session token and sends `Authorization: Bearer <session_token>`.
- Configure Clerk `authorizedParties` from an allowlist of known local and deployed frontend origins. Never derive this allowlist from an incoming request.
- When a separate-origin frontend is introduced, configure CORS narrowly for the same known origins and required headers; do not enable a wildcard origin with credentials.
- Keep `GET /v1/user/me` and all later learner-owned endpoints transport-neutral: authorization always resolves the same verified Clerk user ID whether the credential arrived in a Clerk cookie or Bearer header.
- Frontend sign-out must use Clerk's sign-out API/UI. Once Clerk ends the session, its old cookie or token must no longer authorize the backend.

## HTTP contract

### `GET /v1/user/me`

An authenticated request with a verified primary email returns HTTP 200:

```json
{
  "user": {
    "id": "user_123",
    "email": "learner@example.com",
    "emailVerified": true,
    "firstName": "Ada",
    "lastName": "Lovelace",
    "imageUrl": "https://img.clerk.com/..."
  }
}
```

`firstName` and `lastName` may be `null`. `id`, `email`, `emailVerified`, and `imageUrl` are required in a successful response. Define a Fastify response schema so additional Clerk fields cannot leak accidentally.

Errors use the repository's agreed error envelope:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication is required."
  },
  "requestId": "req-123"
}
```

| Condition | Status | Code | Required behaviour |
| --- | ---: | --- | --- |
| Missing, invalid, expired, or non-session credential | 401 | `UNAUTHENTICATED` | Do not call Clerk's user API. |
| Clerk user has no verified primary email | 403 | `VERIFIED_EMAIL_REQUIRED` | Return no user data. |
| Clerk user lookup is unavailable or fails unexpectedly | 502 | `IDENTITY_PROVIDER_UNAVAILABLE` | Return a safe message; log only safe diagnostic context. |

Do not accept a user ID in path, query, headers, or body for this endpoint.

## TDD specification

Implementation must proceed in red-green-refactor increments. Write the relevant failing test before each production change, make the smallest change that passes it, then refactor while the suite remains green.

### 1. API authentication and route tests (default test suite)

Add Fastify `app.inject()` tests using injected authentication and Clerk-user-reader fakes. These tests must not contact Clerk:

1. `GET /health` remains public when Clerk authentication is registered.
2. `GET /v1/user/me` without a session returns 401 with the standard `UNAUTHENTICATED` envelope.
3. An invalid, expired, or machine credential is treated as unauthenticated and returns the same 401 contract.
4. The user reader is not called for an unauthenticated request.
5. An authenticated session calls the user reader exactly once with the `userId` obtained from the verified session.
6. A request cannot choose another user by supplying IDs in query parameters, headers, or a body; the session user ID remains authoritative.
7. A Clerk user with a verified primary email returns 200 and exactly the documented response shape.
8. Nullable names are serialized as `null` without failing the response schema.
9. Extra Clerk fields such as private/public/unsafe metadata, external accounts, and phone numbers are absent from the response.
10. A missing primary email, mismatched primary-email ID, null verification, or a verification status other than `verified` returns 403 with `VERIFIED_EMAIL_REQUIRED` and no user data.
11. A rejected Clerk user lookup returns 502 with `IDENTITY_PROVIDER_UNAVAILABLE`; provider details and secrets do not appear in the response.
12. Authorization and cookie values do not appear in captured request/error logs.

### 2. Configuration tests (default test suite)

Write tests for configuration parsing before wiring it into startup:

1. Missing `CLERK_PUBLISHABLE_KEY` fails validation.
2. Missing `CLERK_SECRET_KEY` fails validation.
3. Placeholder or malformed keys fail validation without echoing the secret.
4. Valid test values produce the Clerk configuration used by the composition root.
5. Tests restore environment state and do not depend on a developer's local `.env` file.

### 3. Clerk adapter tests (default test suite)

Test the provider-to-public-model mapper with synthetic Clerk responses:

1. It selects the email whose ID matches `primaryEmailAddressId`, not merely the first address.
2. It accepts only a primary email whose verification status is `verified`.
3. It maps the approved ID, email, name, and image fields and drops all other provider data.
4. It translates provider failures to the typed application error consumed by the HTTP error mapper.

### 4. Opt-in live Clerk integration test

Add a separately invoked integration test against a Clerk **development** instance. It must never run as part of the default offline test command or use production users:

1. Create or reuse a dedicated test user in the Clerk development instance.
2. Use Clerk's Backend API to create a session for that test user.
3. Use the returned session ID to mint a real, short-lived Clerk session token immediately before the request. Clerk session tokens normally expire after about 60 seconds.
4. Call `GET /v1/user/me` with `Authorization: Bearer <session_token>` and assert 200, the expected Clerk user ID, and a verified primary email.
5. Call the endpoint with a tampered or expired token and assert 401.
6. Revoke the created session during cleanup. If the test creates its own user, delete that user as well.
7. Document the opt-in command and required development-only secrets. Never print a token, secret, or test-user email.

Clerk Testing Tokens bypass bot protection in frontend flows; they are not a substitute for a valid session token when testing this API.

This integration flow requires no LangStore frontend and does not bypass Clerk verification. The default test suite still uses fakes for speed and determinism; this opt-in test proves that the production Clerk plugin accepts an actual Clerk-signed session.

### 5. Hosted-flow acceptance check

Because Google OAuth and Account Portal are third-party hosted browser flows, verify them in a Clerk development instance after the deterministic tests pass:

1. A new user opens the Account Portal sign-up page, chooses Google, completes Google authentication with a valid email, and is registered with an active Clerk session.
2. After signing out from the Account Portal profile, the same user can open sign-in, choose Google, and sign in again.
3. After sign-out, the old browser session can no longer authorize `GET /v1/user/me` and the endpoint returns 401.
4. After sign-in, the browser/session credential authorizes `GET /v1/user/me` and the response contains the signed-in user's Clerk ID and verified primary email.
5. A cancelled or failed Google flow does not create an authenticated LangStore session.

Record the date, Clerk environment, browser, and result of this check in the pull request. Do not record the user's email, token, or other personal data.

## Acceptance criteria

- A new user can register through Clerk's hosted flow using Google and a verified email address.
- A registered user can sign in with Google and sign out through Clerk's hosted UI.
- `GET /health` remains public.
- `GET /v1/user/me` returns 401 without a valid Clerk user-session credential.
- With a valid session, `GET /v1/user/me` fetches the session user's data from Clerk and returns only the documented safe fields.
- A client cannot select or impersonate another user by supplying a user ID.
- Users without a verified primary email cannot access the successful user response.
- Default tests are deterministic, run offline, and are written before their production changes.
- The opt-in Clerk integration test and hosted Google-flow check pass in a development instance.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- README/setup documentation describes local keys, Account Portal URLs, Google development and production configuration, the opt-in integration command, and secret-handling rules.

## Out of scope

- A custom frontend, custom OAuth flow, or custom login/register/logout API endpoints.
- Password, email-code, phone, passkey, organization, or machine-to-machine authentication.
- Persisting a local user profile or synchronizing Clerk users through webhooks.
- Account deletion, recovery, role/permission management, and production deployment.
- Accessing Google APIs or storing Google's OAuth access token.

## Implementation notes and constraints

- This ticket resolves Google as the v0 sign-in method and Clerk Account Portal as the initial authentication UI. Account deletion handling remains open.
- Do not treat registration or authentication as proof that a learner understands vocabulary.
- Do not add a database user table merely to support this route; use the verified Clerk user ID as the actor identity for later owner-scoped operations.
- If Clerk's current installed SDK API differs from the examples, follow the pinned package's types while preserving this observable contract and the official security model.
- Production Google configuration is an operational prerequisite, not something application tests can create automatically.
- A future frontend should call the same protected API with Clerk's normal cookie or Bearer-token transport. It must not depend on a test-only session-creation utility; Backend API session creation is restricted to opt-in development integration tests.

## Official Clerk references

Reviewed 2 November 2026:

- [Fastify quickstart](https://clerk.com/docs/fastify/getting-started/quickstart)
- [`clerkPlugin()` reference](https://clerk.com/docs/reference/fastify/clerk-plugin)
- [`getAuth()` reference](https://clerk.com/docs/reference/fastify/get-auth)
- [`getUser()` reference](https://clerk.com/docs/reference/backend/user/get-user)
- [Backend `User` object](https://clerk.com/docs/reference/backend/types/backend-user)
- [Backend `EmailAddress` object](https://clerk.com/docs/reference/backend/types/backend-email-address)
- [Add Google as a social connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [Social connections overview](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/overview)
- [Account Portal setup](https://clerk.com/docs/guides/account-portal/getting-started)
- [Account Portal overview](https://clerk.com/docs/guides/account-portal/overview)
- [Clerk testing overview](https://clerk.com/docs/guides/development/testing/overview)
- [Making authenticated requests](https://clerk.com/docs/guides/development/making-requests)
- [`authenticateRequest()` and `authorizedParties`](https://clerk.com/docs/reference/backend/authenticate-request)
- [`getToken()` for a session](https://clerk.com/docs/reference/backend/sessions/get-token)
