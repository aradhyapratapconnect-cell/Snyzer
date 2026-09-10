# Snyzer — Security and Access Document

## 1. Security Architecture
Use Supabase Auth + PostgreSQL + Row-Level Security (RLS). Do not build custom password storage or custom JWT refresh infrastructure for V1.

Supabase Auth handles identity and sessions. PostgreSQL stores Snyzer data. RLS restricts user-owned records.

Never expose OpenRouter API keys or Supabase secret/service keys to the browser.

## 2. Authentication
- Account creation and login are mandatory.
- Use Supabase Auth for sessions.
- Require an authenticated session for Snyzer history and writing jobs.
- Provide logout and password reset.
- Reauthenticate when a session is invalid/expired.
- Keep secret credentials server-side.

## 3. Roles

### FREE_USER
Can:
- Create writing jobs within server-enforced limits.
- Read/delete their own history.
- Manage their own profile and preferences.

Cannot:
- Read other users' data.
- Access admin endpoints.
- Change their role.
- Use provider keys directly.
- Bypass quotas.

### PREMIUM_USER
Can do everything FREE_USER can plus premium plan entitlements.

Cannot:
- Read other users' data.
- Access admin functions.
- Directly change billing state.

### ADMIN
Can:
- Use authorized Snyzer operational/admin tools.
- Review aggregate operational data.
- Manage supported account states.
- Investigate abuse and failures according to policy.

Admin content access should be separately controlled and audited rather than automatically unrestricted.

## 4. RLS Rules
Every user-owned table must have a user ownership field.

Core policy:
- SELECT only rows owned by `auth.uid()`.
- INSERT only when the new owner matches `auth.uid()`.
- UPDATE only owned rows; security-sensitive fields are server-controlled.
- DELETE only owned rows.

Service/secret credentials can bypass RLS, so they must remain server-side.

## 5. Client-Controlled Fields
The client must not directly control:
- role
- ownership
- usage counters
- provider cost
- token counts
- audit fields
- server timestamps
- privileged status

## 6. Error Handling
**Empty/invalid input:** validate and do not call AI.

**Text too long:** reject before inference and explain the supported limit.

**401 Unauthorized:** require login without revealing internal details.

**403 Forbidden:** deny access without revealing whether another user's resource exists.

**429 Rate limited:** explain the limit and provide retry guidance.

**AI timeout:** mark the job failed and offer retry.

**AI unavailable:** show a generic service-unavailable message; never expose provider credentials or stack traces.

**Malformed AI response:** fail safely, log diagnostics server-side, and show a retryable error.

**Database failure:** log internally and show a temporary-service message.

**Usage failure:** check entitlements atomically on the server; never trust browser counters.

**Network disconnect:** preserve input where appropriate and make retries safe.

## 7. XSS / Content Safety
Treat pasted text as untrusted plain text.
- Do not inject arbitrary HTML.
- Avoid `dangerouslySetInnerHTML` for user text.
- Rich-text output must use a controlled editor and sanitized content.
- Backend validates all input.

CORS is not CSRF protection. If cookie-based authentication is used, configure Secure/SameSite behavior and appropriate Origin/CSRF protections.

## 8. Privacy
- Store only necessary data.
- Give users deletion controls.
- Do not train models on user writing without explicit separate consent.
- Define retention periods before launch.
- Avoid logging full writing content unnecessarily.
- Encrypt traffic and use managed database encryption at rest.

## 9. Launch Checklist
- Auth tested.
- RLS tested for every user-owned table.
- Service keys server-only.
- AI keys server-only.
- Backend limits enforced.
- Rate limiting enabled.
- Input/output limits enforced.
- Privileged operations audited.
- Dependencies checked.
- Production errors sanitized.
- Account deletion tested.
- Backups/recovery documented.
- Secrets stored securely.

## 10. Edge Cases
Empty input; whitespace-only input; maximum-length input; Unicode/emoji; multiple languages; rapid clicks; double submission; refresh during processing; network loss; provider timeout/outage; malformed provider response; database outage; expired session; account deletion during a job; concurrent edits; duplicate requests; quota races; RLS mistakes; cross-user resource access; malicious HTML/script content; adversarial prompts; copy failure; history deletion while loading; theme/layout persistence failure.

## 11. Core Principle
The browser is never trusted. Every permission, ownership check, quota, length limit, and privileged operation is enforced server-side.
