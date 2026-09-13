***EPIC 1 — Project Foundation & Repository Setup**
*SNZ-001* — Initialize Monorepo and Package Structure
Epic: Project Foundation & Repository Setup

Priority: MUST-HAVE

Type: Infrastructure

Description

Establish the initial repository folder structure for Snyzer, creating clear workspace boundaries for frontend, backend, and shared modules. This provides a unified TypeScript environment and shared schemas across the entire stack.

Scope

Root package setup with npm/pnpm/yarn workspaces.

Creation of frontend/, backend/, shared/, and docs/ workspace folders.

Root configuration files for TypeScript, ESLint, Prettier, and .gitignore.

Requirements

Configure TypeScript strict mode across all workspaces.

Configure path aliases (e.g., @/ for frontend and backend).

Shared package must export TypeScript types and validation schemas accessible by both frontend and backend.

User / System Behavior

System: Developers can run build, lint, and typecheck commands across all workspaces from the project root.

Acceptance Criteria

[ ] npm run build cleanly builds shared, backend, and frontend without errors.

[ ] TypeScript strict mode is enabled in all workspace tsconfig.json files.

[ ] Imports from shared compile cleanly in both frontend and backend.

Success Metric

Workspace compiles cleanly using npm run typecheck and npm run build across all sub-packages.

Dependencies: None

Technical Notes

Structure according to Section 4 of TECHNICAL_ARCHITECTURE.md.

Ensure .gitignore covers build outputs, node_modules, and .env files.

Testing Requirements

Workspace build script integration tests.

AI Coding Agent Instructions

Inspect the root structure. Create workspace configuration (pnpm-workspace.yaml or npm workspaces in package.json). Do not add unnecessary third-party packages. Ensure TypeScript is strictly configured.

*SNZ-002* — Backend Service Initialization
Epic: Project Foundation & Repository Setup

Priority: MUST-HAVE

Type: Backend

Description

Initialize the backend Express application using TypeScript, configuring standard production middleware, global error handling, environment variable loading, and structured JSON parsing.

Scope

Node.js + Express setup in backend/.

Global error middleware, request JSON parser, and request ID assignment.

Basic health check route (GET /api/v1/health).

Requirements

Must bind port from environment variable PORT (default 5000).

Handle payload limit parsing for large text inputs.

Return standardized health status JSON without exposing system secrets.

User / System Behavior

Loading: N/A

Success: GET /api/v1/health returns HTTP 200 { "status": "ok", "timestamp": "..." }.

Error: Unhandled backend exceptions return sanitized HTTP 500 JSON response without stack traces in production.

Acceptance Criteria

[ ] Express server starts successfully with TypeScript.

[ ] GET /api/v1/health returns 200 OK with status and timestamp.

[ ] Unhandled routes return standard 404 Not Found JSON error.

Success Metric

Backend server builds and serves HTTP requests with predictable status codes.

Dependencies: *SNZ-001*

Technical Notes

Refer to TECHNICAL_ARCHITECTURE.md section 6 for API conventions.

Testing Requirements

Supertest integration test for /api/v1/health endpoint.

AI Coding Agent Instructions

Create the Express server entrypoint in backend/src/server.ts and backend/src/app.ts. Implement global error middleware that suppresses stack traces when NODE_ENV === 'production'.

*SNZ-003* — Frontend Application Setup
Epic: Project Foundation & Repository Setup

Priority: MUST-HAVE

Type: Frontend

Description

Initialize the React single-page application using Vite and TypeScript in frontend/, establishing the base router, Tailwind CSS integration, and global application providers.

Scope

React + Vite setup.

Tailwind CSS configuration with Snyzer color tokens.

Base router setup and root error boundary.

Requirements

Include Inter / sans-serif fallback font stack.

Implement custom color tokens matching FRONTEND_SPECIFICATION.md section 2.

Set up standard root layout container.

User / System Behavior

Success: Frontend renders dark/light container canvas cleanly without layout shifts or raw styling artifacts.

Acceptance Criteria

[ ] Vite dev server starts and builds without errors.

[ ] Tailwind CSS utility classes render expected hex colors (#F8FAFC, #0B1120, etc.).

[ ] Root React error boundary catches unhandled frontend rendering exceptions gracefully.

Success Metric

Frontend bundle compiles cleanly with vite build without TypeScript errors.

Dependencies: *SNZ-001*

Technical Notes

Configure Tailwind colors for light/dark mode according to design specs.

Testing Requirements

React component mount test for root layout container.

AI Coding Agent Instructions

Configure tailwind.config.js with exact Snyzer color variables from FRONTEND_SPECIFICATION.md. Avoid adding unneeded UI framework dependencies at this stage.

*SNZ-004* — Environment Variable Validation & Configuration Manager
Epic: Project Foundation & Repository Setup

Priority: MUST-HAVE

Type: Security

Description

Implement strong runtime schema validation for environment variables on both frontend and backend using Zod to prevent startup with missing secrets or invalid configurations.

Scope

Backend environment validation (backend/src/config/env.ts).

Frontend environment validation (frontend/src/lib/env.ts).

Requirements

Validate required backend vars: DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY, OPENROUTER_API_KEY, MAX_TEXT_LENGTH, etc.

Validate frontend vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY.

Fail process startup immediately with clear error messages if required vars are missing or invalid.

User / System Behavior

Error: Server/Vite build halts execution with a detailed terminal output specifying missing required environment keys.

Acceptance Criteria

[ ] Backend crashes on startup if OPENROUTER_API_KEY or DATABASE_URL is omitted.

[ ] Frontend warns/fails build if VITE_SUPABASE_URL is missing.

[ ] Sensitive secrets are excluded from client bundle validations.

Success Metric

Application reliably halts initialization when required context secrets are absent.

Dependencies: *SNZ-001*, *SNZ-002*, *SNZ-003*

Technical Notes

Follow TECHNICAL_ARCHITECTURE.md section 8. Never prefix backend secrets with VITE_.

Testing Requirements

Unit tests for config validator with mock process environments.

AI Coding Agent Instructions

Use Zod schemas to parse and export typed env configuration objects. Do not hardcode defaults for secrets.

*SNZ-005* — Database Client & ORM/Migration Setup
Epic: Project Foundation & Repository Setup

Priority: MUST-HAVE

Type: Database

Description

Configure the database client (Prisma or Supabase client) and database connection pooling in the backend service, providing migration management and connection lifecycle handling.

Scope

Database connection manager in backend/src/config/database.ts.

Migration scripts folder and database initialization scripts.

Requirements

Support direct and pooled connections to Supabase PostgreSQL.

Implement graceful database disconnection on server shutdown (SIGTERM/SIGINT).

User / System Behavior

System: Server attempts connection on startup and logs failure gracefully without exposing connection string credentials.

Acceptance Criteria

[ ] Backend connects to local/remote PostgreSQL instance successfully.

[ ] Connection pool handles graceful shutdown during process restart.

[ ] Database credentials are read exclusively from validated environment variables.

Success Metric

Database connection test query succeeds during server startup.

Dependencies: *SNZ-002*, *SNZ-004*

Technical Notes

Ensure database connection details are never printed to raw stdout/stderr logs.

Testing Requirements

Database client connection health check unit test.

AI Coding Agent Instructions

Initialize database connection layer. Sanitize output logs to prevent credential leakage.

***EPIC 2 — Database Architecture &** Row-Level Security
*SNZ-006* — Users & Profiles Database Table
Epic: Database Architecture & Row-Level Security

Priority: MUST-HAVE

Type: Database

Description

Create the PostgreSQL database table and trigger for user profiles linked to Supabase Auth auth.users records.

Scope

Migration file for profiles table.

Database trigger auto-creating profile row upon new user registration.

Requirements

Table columns: id (UUID PK, FK to auth.users.id), display_name (TEXT), role (TEXT, default 'FREE_USER'), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

Foreign key constraint with cascading delete on auth.users.

User / System Behavior

System: When a record is inserted into auth.users, a corresponding profiles row is created automatically.

Acceptance Criteria

[ ] Schema migration creates profiles table with correct constraints and defaults.

[ ] Trigger automatically provisions a profiles entry upon user signup.

[ ] Primary key strictly references auth.users.id.

Success Metric

Profile row is created cleanly when a new authentication user is provisioned.

Dependencies: *SNZ-005*

Technical Notes

Default role must strictly be set to 'FREE_USER'.

Testing Requirements

Database migration execution test and profile creation trigger test.

AI Coding Agent Instructions

Write clean SQL migration file for profiles table and on_auth_user_created trigger function.

*SNZ-007* — User Preferences Database Table
Epic: Database Architecture & Row-Level Security

Priority: MUST-HAVE

Type: Database

Description

Create the PostgreSQL table for storing persistent user preferences such as theme, layout, editor mode, and default writing tone.

Scope

Migration for user_preferences table.

Requirements

Columns: user_id (UUID PK, FK to profiles.id), theme (TEXT, default 'system'), workspace_layout (TEXT, default 'side_by_side'), editor_mode (TEXT, default 'plain'), default_tone (TEXT, default 'professional'), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ).

Restrict allowed values using database enum or check constraints (theme IN ('light', 'dark', 'system'), workspace_layout IN ('side_by_side', 'input_first'), editor_mode IN ('plain', 'rich')).

User / System Behavior

System: Stores preference flags attached to a specific user_id.

Acceptance Criteria

[ ] user_preferences table created with correct check constraints.

[ ] Inserting invalid enum strings (e.g. theme = 'blue') fails with check constraint violation.

[ ] Trigger updates updated_at on updates.

Success Metric

Preferences records pass schema validation and enforce domain values at the database layer.

Dependencies: *SNZ-006*

Technical Notes

Refer to TECHNICAL_ARCHITECTURE.md section 5 for exact schema column names.

Testing Requirements

SQL integration test validating table constraints and enum rules.

AI Coding Agent Instructions

Create SQL migration for user_preferences with strong check constraints on enum fields.

*SNZ-008* — Writing Jobs Database Table
Epic: Database Architecture & Row-Level Security

Priority: MUST-HAVE

Type: Database

Description

Create the PostgreSQL database table for tracking user writing jobs, including inputs, outputs, settings, analysis metrics, token usage, and status.

Scope

Migration for writing_jobs table.

Indexes on user_id and created_at.

Requirements

Columns: id (UUID PK), user_id (UUID FK to profiles.id), input_text (TEXT), output_text (TEXT nullable), mode (TEXT), tone (TEXT), settings (JSONB), analysis (JSONB nullable), model (TEXT nullable), input_tokens (INTEGER nullable), output_tokens (INTEGER nullable), total_tokens (INTEGER nullable), processing_ms (INTEGER nullable), status (TEXT), error_code (TEXT nullable), created_at (TIMESTAMPTZ), completed_at (TIMESTAMPTZ nullable).

Check constraint on status: status IN ('queued', 'processing', 'completed', 'failed').

User / System Behavior

System: Records every job execution lifecycle, storing inputs and AI responses securely attached to user_id.

Acceptance Criteria

[ ] Migration creates writing_jobs table with appropriate indexes.

[ ] Index on (user_id, created_at DESC) ensures fast user history queries.

[ ] Check constraints prevent invalid job states.

Success Metric

Writing jobs can be queried efficiently filtered by user_id sorted by creation timestamp.

Dependencies: *SNZ-006*

Technical Notes

Ensure JSONB columns default to '{}'::jsonb where applicable.

Testing Requirements

Migration execution and index verification test.

AI Coding Agent Instructions

Write SQL migration script creating writing_jobs table and composite index idx_writing_jobs_user_created.

*SNZ-009* — Usage Events and Audit Database Tables
Epic: Database Architecture & Row-Level Security

Priority: MUST-HAVE

Type: Database

Description

Create PostgreSQL tables for logging backend usage statistics and security audit events without storing sensitive prompt texts.

Scope

Migration for usage_events table.

Migration for audit_events table.

Requirements

usage_events columns: id (UUID PK), user_id (UUID FK), job_id (UUID FK nullable), provider (TEXT), model (TEXT), input_tokens (INT), output_tokens (INT), total_tokens (INT), estimated_cost (NUMERIC nullable), status (TEXT), created_at (TIMESTAMPTZ).

audit_events columns: id (UUID PK), actor_user_id (UUID nullable), event_type (TEXT), target_type (TEXT nullable), target_id (UUID nullable), metadata (JSONB), created_at (TIMESTAMPTZ).

User / System Behavior

System: Appends event tracking and operational logs without recording full sensitive raw text.

Acceptance Criteria

[ ] Both tables are created with proper relationships and defaults.

[ ] audit_events stores metadata cleanly as queryable JSONB.

[ ] Indexes exist on usage_events.user_id and audit_events.actor_user_id.

Success Metric

System captures accounting and security records cleanly without database bottlenecks.

Dependencies: *SNZ-008*

Technical Notes

Ensure raw writing content is strictly excluded from audit_events.metadata.

Testing Requirements

Migration execution tests for usage and audit logging tables.

AI Coding Agent Instructions

Write SQL migration creating usage_events and audit_events tables with proper indexes.

*SNZ-010* — Row-Level Security (RLS) Rules Implementation
Epic: Database Architecture & Row-Level Security

Priority: MUST-HAVE

Type: Security

Description

Enable Row-Level Security (RLS) on all user-owned PostgreSQL tables and establish strict isolation policies preventing cross-user data exposure.

Scope

Enable RLS on profiles, user_preferences, writing_jobs, and usage_events.

Construct SELECT, INSERT, UPDATE, DELETE policies bound to auth.uid().

Requirements

Users can SELECT, INSERT, UPDATE, DELETE only rows where user_id = auth.uid() (or id = auth.uid() for profiles).

Deny direct client-side UPDATE access to privileged fields like role, input_tokens, estimated_cost.

Ensure service role bypasses RLS safely for backend operations.

User / System Behavior

Unauthorized: Querying another user's job_id or user_id returns an empty result set or access denial.

Acceptance Criteria

[ ] RLS is explicitly enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY) on all core tables.

[ ] SQL test confirms User A cannot read or write User B's rows in writing_jobs or user_preferences.

[ ] Client JWT with auth.uid() cannot overwrite its own role in profiles.

Success Metric

Zero cross-tenant data leakage possible via direct database queries.

Dependencies: *SNZ-006*, *SNZ-007*, *SNZ-008*, *SNZ-009*

Technical Notes

Follow SECURITY_AND_ACCESS.md section 4. Service role key must remain server-side only.

Testing Requirements

Automated database tests executing queries under different user contexts via Supabase Auth client.

AI Coding Agent Instructions

Draft comprehensive RLS migration script. Apply strict equality checks on auth.uid().

***EPIC 3 — Authentication & Session Manag**ement
*SNZ-011* — Supabase Auth Client Integration
Epic: Authentication & Session Management

Priority: MUST-HAVE

Type: Authentication

Description

Integrate the Supabase Auth client into the frontend application to handle session lifecycle, token refreshing, and auth state persistence.

Scope

Supabase client initialization in frontend/src/lib/supabase.ts.

Auth Zustand store (frontend/src/stores/useAuthStore.ts) tracking current user and auth status.

Requirements

Initialize Supabase client using public keys (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).

Listen for auth changes (onAuthStateChange) to keep active access tokens in memory.

Provide auth state flags: isInitialized, isAuthenticated, user, session.

User / System Behavior

Loading: App shows lightweight top bar loader while checking active local session.

Success: Valid token populates user object in Zustand auth store.

Acceptance Criteria

[ ] Auth client initializes without throwing errors on application start.

[ ] onAuthStateChange handler correctly updates Zustand store upon login and logout.

[ ] Client never exposes internal service key credentials.

Success Metric

Frontend accurately reflects active authentication state and updates automatically on session events.

Dependencies: *SNZ-003*, *SNZ-004*

Technical Notes

Use only public keys in frontend code.

Testing Requirements

Unit test for auth store state transitions using mocked Supabase Auth responses.

AI Coding Agent Instructions

Implement Supabase auth wrapper client and Zustand store hook in the frontend.

*SNZ-012* — Backend Authentication Middleware
Epic: Authentication & Session Management

Priority: MUST-HAVE

Type: Security

Description

Construct Express middleware to intercept incoming backend API requests, verify Supabase JWT access tokens, and populate authenticated user context on request objects.

Scope

Authentication middleware in backend/src/middleware/auth.ts.

TypeScript declaration merging to extend Express Request interface with authenticated user metadata.

Requirements

Extract Bearer token from Authorization HTTP header.

Verify JWT against Supabase Auth service.

Attach decoded user_id, email, and role to req.user.

Return HTTP 401 Unauthorized for missing, expired, or malformed tokens without revealing system internals.

User / System Behavior

Unauthorized: Requests without valid Authorization: Bearer <token> return 401 Unauthorized { "error": { "code": "UNAUTHORIZED", "message": "Authentication required." } }.

Acceptance Criteria

[ ] Valid JWT attaches req.user context correctly.

[ ] Expired or forged JWT returns HTTP 401.

[ ] Backend routes wrapped with auth middleware block unauthenticated requests.

Success Metric

Unauthenticated calls are reliably blocked before reaching controller code.

Dependencies: *SNZ-002*, *SNZ-004*, *SNZ-006*

Technical Notes

Refer to SECURITY_AND_ACCESS.md section 6 for error response standards.

Testing Requirements

Middleware unit tests with valid, expired, and garbage JWT inputs.

AI Coding Agent Instructions

Implement Express JWT authentication middleware. Ensure header formatting checks are robust against malformed input.

*SNZ-013* — User Registration & Login UI
Epic: Authentication & Session Management

Priority: MUST-HAVE

Type: Frontend

Description

Create user interface components and forms for email/password user registration and login with input validation, accessible error display, and loading feedback.

Scope

Registration modal/page (frontend/src/features/auth/RegisterForm.tsx).

Login modal/page (frontend/src/features/auth/LoginForm.tsx).

Requirements

Email and password inputs with client validation (valid email format, min 8-char password).

Accessible form controls using visible labels and aria-invalid states.

Clear display of authentication errors (e.g., "Invalid email or password").

User / System Behavior

Loading: Submit button displays inline spinner and disables during request.

Success: User is redirected to writing workspace upon successful authentication.

Error: Displays user-friendly error message without leaking security details.

Acceptance Criteria

[ ] Form submission handles success and error paths cleanly.

[ ] Keyboard navigation (Tab, Enter) works across form inputs and submit actions.

[ ] Password field supports visibility toggle.

Success Metric

Users can sign up and sign in seamlessly with actionable validation feedback.

Dependencies: *SNZ-003*, *SNZ-011*

Technical Notes

Use shadcn/ui button and input primitives for UI compliance.

Testing Requirements

Component tests for login and registration form states (idle, submit, error).

AI Coding Agent Instructions

Build clean React forms using React Hook Form and Zod validation schemas. Do not use placeholders as labels.

*SNZ-014* — Password Reset & Session Management
Epic: Authentication & Session Management

Priority: MUST-HAVE

Type: Frontend

Description

Provide password reset request UI, password update flow, and explicit sign-out functionality in the frontend workspace header.

Scope

Password reset request component (frontend/src/features/auth/ResetPasswordForm.tsx).

User header dropdown with sign-out trigger.

Requirements

Sign-out clears local session state and redirects to landing/login screen.

Password reset sends email reset link via Supabase Auth API.

Handle session expiration gracefully by prompting re-authentication.

User / System Behavior

Success: Clicking sign-out purges cached user tokens and resets workspace state.

Acceptance Criteria

[ ] Sign-out invalidates user session cleanly.

[ ] Password reset form submits reset request and displays confirmation text.

[ ] Expired session tokens redirect user safely to login screen.

Success Metric

Sessions terminate cleanly and password recovery requests execute reliably.

Dependencies: *SNZ-011*, *SNZ-013*

Technical Notes

Clear Zustand stores on sign-out to prevent lingering sensitive workspace data.

Testing Requirements

End-to-end integration test for user logout and session cleanup.

AI Coding Agent Instructions

Implement password reset triggers and user header session dropdown menu.

*SNZ-015* — Protected Route Guard Components
Epic: Authentication & Session Management

Priority: MUST-HAVE

Type: Frontend

Description

Implement router guard components that restrict access to application routes (workspace, history, settings) to authenticated users only.

Scope

Route guard wrapper component (frontend/src/features/auth/ProtectedRoute.tsx).

Requirements

Redirect unauthenticated users attempting to access protected routes to login view.

Preserve attempted redirect URL to return user to target page after authenticating.

Render accessible loading indicator while initial auth check is in flight.

User / System Behavior

Loading: Renders subtle full-page loading spinner during auth hydration.

Unauthorized: Redirects instantly to /login if unauthenticated.

Acceptance Criteria

[ ] Direct URL navigation to /workspace when logged out redirects to /login.

[ ] Successfully logging in redirects back to the initially requested route.

[ ] Protected route wrapper renders children cleanly when authenticated.

Success Metric

Protected application routes are strictly inaccessible without an active auth session.

Dependencies: *SNZ-011*, *SNZ-013*

Technical Notes

Use React Router navigation context.

Testing Requirements

Unit tests for ProtectedRoute under authenticated and unauthenticated states.

AI Coding Agent Instructions

Create route wrapper component inspecting Zustand auth state.

***EPIC 4 — Backend Infrastructure & Shared** Schemas
*SNZ-016* — Shared Zod Schemas & Validation Rules
Epic: Backend Infrastructure & Shared Schemas

Priority: MUST-HAVE

Type: Feature

Description

Define centralized Zod schemas in the shared module for writing requests, user preferences, API payloads, and analytical data formats.

Scope

Schema files in shared/schemas/ (writing.ts, preferences.ts, auth.ts).

Inferred TypeScript types derived from Zod schemas.

Requirements

WritingJobRequestSchema: inputText (string, max 10,000 chars), mode (enum: 'natural', 'clarity', 'formal', 'concise'), tone (enum: 'professional', 'casual', 'academic', 'direct'), editorMode ('plain' | 'rich'), preferences (object with numerical targets).

Export types: WritingJobRequest, WritingJobResponse, ApiErrorResponse.

User / System Behavior

System: Provides runtime input validation and shared type definitions across frontend and backend.

Acceptance Criteria

[ ] Zod schema rejects empty strings, whitespace-only strings, or text exceeding maximum character length.

[ ] Inferred types compile without errors in both frontend and backend scripts.

[ ] Validation errors produce structured issues array.

Success Metric

Unified validation rules executed seamlessly across client and server workspaces.

Dependencies: *SNZ-001*

Technical Notes

Max text length limit should be configurable via shared constants.

Testing Requirements

Unit tests for schema parsing against valid and invalid request payloads.

AI Coding Agent Instructions

Write clean, exportable Zod schemas in shared/src/schemas. Do not import backend-only or frontend-only dependencies.

*SNZ-017* — Request Validation Middleware
Epic: Backend Infrastructure & Shared Schemas

Priority: MUST-HAVE

Type: Security

Description

Create reusable backend middleware to validate incoming HTTP request body, query parameters, and route parameters against Zod schemas.

Scope

Validation middleware (backend/src/middleware/validate.ts).

Requirements

Intercept requests and parse body/query using passed Zod schema.

On validation failure, halt request and return HTTP 400 Bad Request with formatted validation details.

Prevent invalid or malicious data structures from hitting downstream controller code.

User / System Behavior

Error: Invalid request body returns 400 Bad Request { "error": { "code": "INVALID_INPUT", "message": "Validation error", "details": [...] } }.

Acceptance Criteria

[ ] Rejects malformed payload prior to controller invocation.

[ ] Sanitizes input and strips undeclared schema properties.

[ ] Returns explicit, readable validation error messages.

Success Metric

All invalid payload variations are blocked cleanly at the network edge.

Dependencies: *SNZ-002*, *SNZ-016*

Technical Notes

Ensure details array does not expose system paths or stack traces.

Testing Requirements

Express integration tests testing payload schema validation failures.

AI Coding Agent Instructions

Construct middleware factory accepting Zod schemas for body, query, and params.

*SNZ-018* — Global Error Handling & Standardized Responses
Epic: Backend Infrastructure & Shared Schemas

Priority: MUST-HAVE

Type: Backend

Description

Establish a standard error handling hierarchy and response payload schema across all backend API controllers.

Scope

Custom error classes (AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, RateLimitError).

Global Express error middleware in backend/src/middleware/errorHandler.ts.

Requirements

All API error responses must adhere strictly to the JSON format: { "error": { "code": string, "message": string, "details"?: any } }.

Map specific error instances to appropriate HTTP status codes (400, 401, 403, 404, 413, 429, 500, 502, 503).

Log detailed internal error information server-side without exposing trace information to HTTP clients.

User / System Behavior

Error: Uncaught server exceptions return generic message: "An unexpected error occurred. Please try again later."

Acceptance Criteria

[ ] Every API endpoint outputs uniform error envelope structure on error.

[ ] Stack traces are hidden when NODE_ENV === 'production'.

[ ] Error handler logs stack traces and request IDs internally for diagnostic purposes.

Success Metric

100% of API error responses conform to Snyzer client contract schema.

Dependencies: *SNZ-002*, *SNZ-016*

Technical Notes

Follow section 17 of FRONTEND_SPECIFICATION.md for error format payload.

Testing Requirements

Unit tests for custom error class instantiation and middleware serialization.

AI Coding Agent Instructions

Implement custom error hierarchy extending native JavaScript Error. Catch all async route errors safely.

*SNZ-019* — Structured Operational Logger
Epic: Backend Infrastructure & Shared Schemas

Priority: MUST-HAVE

Type: Infrastructure

Description

Implement a structured JSON operational logger (e.g. using Pino or Winston) for server logs, enabling privacy-safe observability.

Scope

Logger utility in backend/src/utils/logger.ts.

Redaction rules for sensitive attributes.

Requirements

Output structured JSON log entries containing timestamp, log level, request ID, and message.

Meticulously redact or exclude full user writing text, access tokens, API keys, and connection strings from output logs.

Support configurable log levels (info, warn, error, debug).

User / System Behavior

System: Outputs operational metrics and traces to stdout in structured JSON format without printing user text content.

Acceptance Criteria

[ ] Log outputs are formatted valid JSON strings in non-development environments.

[ ] Verification test proves raw inputText and outputText are excluded/redacted from log statements.

[ ] API key strings are automatically masked if present in error context.

Success Metric

Zero sensitive credentials or raw writing passages present in operational stdout streams.

Dependencies: *SNZ-002*, *SNZ-004*

Technical Notes

Comply with section 8 of SECURITY_AND_ACCESS.md regarding user text logging.

Testing Requirements

Unit test validating automatic key masking and text suppression in log formatter.

AI Coding Agent Instructions

Configure Pino or custom JSON logger with explicit path redactions for inputText, outputText, and sensitive header fields.

*SNZ-020* — Frontend API Client Architecture
Epic: Backend Infrastructure & Shared Schemas

Priority: MUST-HAVE

Type: Frontend

Description

Construct a unified API HTTP client abstraction layer on the frontend using fetch or axios for calling Snyzer backend endpoints.

Scope

API client base class/instance (frontend/src/lib/apiClient.ts).

Automatic authorization header attachment and error normalization.

Requirements

Route all requests through backend endpoint URL (/api/v1). Never call third-party services like OpenRouter directly.

Automatically attach Bearer token from Supabase session to request headers.

Intercept HTTP errors and transform them into typed frontend domain errors.

User / System Behavior

Error: Network failures or non-2xx responses reject promise with normalized domain error object.

Acceptance Criteria

[ ] Client attaches Authorization header automatically when session exists.

[ ] Standardizes non-JSON backend error responses into typed application error models.

[ ] Supports cancellation tokens for in-flight requests on component unmount.

Success Metric

Clean, typed API calls across all frontend services with predictable error handling.

Dependencies: *SNZ-003*, *SNZ-011*, *SNZ-016*, *SNZ-018*

Technical Notes

Enforce calling ONLY Snyzer backend paths per section 16 of FRONTEND_SPECIFICATION.md.

Testing Requirements

Unit tests for API client response interceptors and header injection using mocked fetch response.

AI Coding Agent Instructions

Create HTTP client abstraction handling auth headers and error serialization cleanly.


***EPIC 5 — AI Provider Integration & Abstraction**
*SNZ-021* — AI Provider Interface & Abstraction Layer
Epic: AI Provider Integration & Abstraction

Priority: MUST-HAVE

Type: Backend

Description

Design a provider-agnostic backend service interface for writing revisions and analytical evaluation, decoupling Snyzer from specific AI vendor implementations.

Scope

AI Provider Interface definitions in backend/src/services/ai/types.ts.

Base abstraction layer in backend/src/services/ai/AIProvider.ts.

Requirements

Interface method: generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse>.

Support input parameter models: raw text, mode, tone, target metrics, prompt instructions.

Output model: revised text, breakdown metrics (readability, clarity, sentence variety, formality, vocabulary complexity, repetition), token usage statistics, processing time.

User / System Behavior

System: Decouples writing business logic from underlying API providers (OpenRouter, OpenAI, Anthropic).

Acceptance Criteria

[ ] Interface defined cleanly using TypeScript interfaces without OpenRouter-specific types.

[ ] Mock AI Provider implementation passes test suite cleanly.

[ ] Allows swapping AI backends without altering controller code.

Success Metric

Backend controllers consume AI generation logic via interface contract without vendor coupling.

Dependencies: *SNZ-002*, *SNZ-016*

Technical Notes

Follow TECHNICAL_ARCHITECTURE.md section 7.

Testing Requirements

Unit test verifying contract behavior with mock provider class.

AI Coding Agent Instructions

Define standard TypeScript interfaces for AI providers in backend/src/services/ai/.

*SNZ-022* — OpenRouter AI Provider Implementation
Epic: AI Provider Integration & Abstraction

Priority: MUST-HAVE

Type: Backend

Description

Implement the OpenRouter integration provider fulfilling the AIProvider contract, managing server-to-server API calls to OpenRouter endpoints.

Scope

Provider implementation in backend/src/services/ai/OpenRouterProvider.ts.

Requirements

Make HTTPS requests to OpenRouter chat completions API using OPENROUTER_API_KEY.

Set optional headers HTTP-Referer (OPENROUTER_SITE_URL) and X-Title (OPENROUTER_APP_NAME).

Format AI prompt strictly for writing quality improvement, tone execution, and structural metrics calculation.

Never expose OpenRouter API keys to browser clients.

User / System Behavior

System: Formats user inputs into LLM prompts, sends request to OpenRouter, and returns provider response.

Acceptance Criteria

[ ] Correctly builds OpenRouter API request payload with structured output constraints.

[ ] Extract and return token usage statistics (input_tokens, output_tokens) from provider metadata.

[ ] API keys are strictly loaded from process environment variables.

Success Metric

Successful round-trip generation calls executed through OpenRouter endpoint.

Dependencies: *SNZ-004*, *SNZ-021*

Technical Notes

Do not assume a permanently free default model. Make model selection configurable.

Testing Requirements

Integration test for OpenRouterProvider class using mocked HTTP responses.

AI Coding Agent Instructions

Implement OpenRouterProvider adhering to AIProvider interface. Use fetch or standard HTTP client.

*SNZ-023* — AI Prompt Engineering & System Prompts
Epic: AI Provider Integration & Abstraction

Priority: MUST-HAVE

Type: Backend

Description

Construct robust system prompts and prompt templates for writing revision and text quality analysis, emphasizing intent preservation and tone targeting.

Scope

Prompt templates module (backend/src/services/ai/prompts.ts).

Requirements

Instruct model to prioritize meaning and intent preservation above all else.

Target core attributes: clarity, naturalness, readability, sentence variety, vocabulary, repetition, and requested tone.

Require model to output response in strictly structured JSON matching analysis schema.

Explicitly forbid prompt injection leakage and disallow generating content outside writing analysis/revision scope.

User / System Behavior

System: Converts user preferences into deterministic prompts directing LLM behavior and structured output.

Acceptance Criteria

[ ] System prompt enforces JSON response structure containing revised text and calculated metrics.

[ ] Prompt explicitly instructs model NEVER to change factual meaning or user intent.

[ ] Prompt avoids marketing language or false claims like "undetectable AI".

Success Metric

AI responses reliably adhere to JSON formatting constraints and respect semantic intent.

Dependencies: *SNZ-016*, *SNZ-021*

Technical Notes

Position tool as writing improvement, not AI-detector bypass per PRD section 1.

Testing Requirements

Unit tests verifying template string construction with various parameter combinations.

AI Coding Agent Instructions

Draft system prompt templates enforcing structured JSON output. Instruct model strictly regarding safety and intent preservation.

*SNZ-024* — AI Provider Error Handling, Timeouts & Backoff
Epic: AI Provider Integration & Abstraction

Priority: MUST-HAVE

Type: Backend

Description

Implement robust error handling, timeout handling, and exponential backoff retry mechanisms for AI provider API calls.

Scope

Resilient API wrapper (backend/src/services/ai/aiCallWithRetry.ts).

Requirements

Configure HTTP request timeout (e.g. 15–30 seconds maximum execution time).

Implement exponential backoff retries for transient errors (HTTP 429 rate limit, 502/503/504 gateway errors).

Max retries constrained (e.g. 2 retries max).

Map failure cases into domain exceptions (AIProviderUnavailableError, AITimeoutError, AIMalformedResponseError).

User / System Behavior

Error: Gateway timeout triggers short backoff retry before failing safely with service unavailable domain error.

Acceptance Criteria

[ ] AI call aborts and throws timeout error if model fails to respond within target deadline.

[ ] Transient 503 errors trigger exponential backoff retry up to configured retry ceiling.

[ ] Provider secrets are never leaked in exception stack traces or error messages.

Success Metric

System recovers gracefully from transient AI provider outages without hanging backend worker threads.

Dependencies: *SNZ-018*, *SNZ-022*

Technical Notes

Use AbortController for handling request timeouts cleanly.

Testing Requirements

Mocked network failure unit tests verifying retry counts, delay intervals, and timeout aborts.

AI Coding Agent Instructions

Wrap AI network calls with AbortController timeout logic and retry loops.

*SNZ-025* — AI Output Sanity Validation & Fallback Handling
Epic: AI Provider Integration & Abstraction

Priority: MUST-HAVE

Type: Backend

Description

Validate raw JSON outputs returned by AI models to guarantee compliance with expected response schemas prior to saving or returning results.

Scope

Validation module in backend/src/services/ai/aiResponseValidator.ts.

Requirements

Parse AI response string with Zod analysis schema.

Verify outputText is present, non-empty, and within expected length bounds.

Clamp analysis metrics (readability, clarity, formality, etc.) between numeric ranges [0, 100].

On validation failure, attempt single recovery or fail safely with AIMalformedResponseError.

User / System Behavior

Error: Unparseable LLM output triggers internal diagnostic log and returns standard user retry error message.

Acceptance Criteria

[ ] Validates AI JSON payload structure against Zod schema.

[ ] Metric values outside 0–100 range are safely normalized/clamped.

[ ] Malformed JSON responses do not crash server process.

Success Metric

100% of responses passed to controllers are validated, bounded JSON objects.

Dependencies: *SNZ-016*, *SNZ-022*

Technical Notes

Never trust unvalidated LLM output strings.

Testing Requirements

Unit tests with valid, partial, malformed, and out-of-range AI output strings.

AI Coding Agent Instructions

Implement response parser with Zod validation and safe metric clamping.

***EPIC 6 — Core Writing & Analysis Backend Servi**ces
*SNZ-026* — Writing Job Processing Controller & Endpoint
Epic: Core Writing & Analysis Backend Services

Priority: MUST-HAVE

Type: Backend

Description

Create the main API route POST /api/v1/writing/jobs to accept writing requests, validate user entitlement, execute revision workflow, and return results.

Scope

Route definition and controller in backend/src/controllers/writingController.ts.

Writing service coordinator (backend/src/services/writing/writingService.ts).

Requirements

Auth required middleware.

Enforce input text character length checks server-side against configuration maximum.

Persist initial job record (status = 'processing'), execute AI service call, update record (status = 'completed' or 'failed'), and record usage tracking event.

Return job response envelope matching API specification.

User / System Behavior

Loading: Client receives HTTP response upon job completion containing job ID and revised text.

Error: Exceeding text limit returns 413 Payload Too Large { "error": { "code": "TEXT_TOO_LONG", "message": "Text exceeds supported maximum length." } }.

Acceptance Criteria

[ ] POST /api/v1/writing/jobs handles end-to-end request lifecycle cleanly.

[ ] Job status and analysis metrics are correctly recorded in writing_jobs table.

[ ] Usage tokens and metrics are logged atomically.

Success Metric

End-to-end execution of writing revision request under 5 seconds median processing time.

Dependencies: *SNZ-008*, *SNZ-012*, *SNZ-016*, *SNZ-017*, *SNZ-022*, *SNZ-025*

Technical Notes

Follow FRONTEND_SPECIFICATION.md section 17 for contract payloads.

Testing Requirements

Integration test for POST /api/v1/writing/jobs using mocked AI provider.

AI Coding Agent Instructions

Implement controller route with authentication, validation, processing state persistence, and error handling.

*SNZ-027* — Writing History List Endpoint
Epic: Core Writing & Analysis Backend Services

Priority: MUST-HAVE

Type: Backend

Description

Implement GET /api/v1/writing/jobs endpoint to allow users to retrieve their paginated historical writing jobs.

Scope

Route and controller handler in backend/src/controllers/historyController.ts.

Requirements

Auth required middleware.

Query writing_jobs table strictly filtered by user_id = req.user.id.

Support query parameters: limit (default 20, max 50), offset (default 0).

Order results descending by created_at.

Include summary fields (id, truncated input, truncated output, mode, tone, status, created_at).

User / System Behavior

Success: Returns JSON payload containing array of user's past writing jobs and total count.

Acceptance Criteria

[ ] Returns only jobs belonging to the requesting user.

[ ] Respects limit and offset pagination parameters.

[ ] Query executes efficiently using composite index (user_id, created_at).

Success Metric

History query returns in < 50ms for users with hundreds of historical items.

Dependencies: *SNZ-008*, *SNZ-010*, *SNZ-012*

Technical Notes

RLS enforced at database layer; controller must also query with user ID explicit filter.

Testing Requirements

Integration test verifying user isolation and pagination parameters.

AI Coding Agent Instructions

Implement paginated history endpoint. Validate query limit and offset parameters.

*SNZ-028* — Single Writing Job Retrieval Endpoint
Epic: Core Writing & Analysis Backend Services

Priority: MUST-HAVE

Type: Backend

Description

Implement GET /api/v1/writing/jobs/:id endpoint to retrieve full details, analysis metrics, and text content for a specific past job.

Scope

Controller handler for single job lookup.

Requirements

Auth required middleware.

Fetch writing_jobs record by ID where user_id = req.user.id.

Return HTTP 404 Not Found if job does not exist or belongs to another user (prevent resource existence enumeration).

User / System Behavior

Success: Returns full single job JSON object including untruncated text and complete analysis metrics.

Forbidden/NotFound: Returns 404 Not Found for unowned or missing job IDs.

Acceptance Criteria

[ ] Returns job record if user is the true owner.

[ ] Returns 404 for nonexistent job ID or job belonging to a different user.

[ ] Never exposes internal database stack traces on invalid UUID format.

Success Metric

Job details fetched cleanly without authorization leakage.

Dependencies: *SNZ-008*, *SNZ-010*, *SNZ-012*

Technical Notes

Comply with SECURITY_AND_ACCESS.md section 6 regarding 403/404 handling.

Testing Requirements

API test requesting owned job vs unowned job ID.

AI Coding Agent Instructions

Implement single job fetch handler. Handle invalid UUID formats gracefully.

*SNZ-029* — Writing Job Deletion Endpoint
Epic: Core Writing & Analysis Backend Services

Priority: MUST-HAVE

Type: Backend

Description

Implement DELETE /api/v1/writing/jobs/:id endpoint allowing users to delete a specific writing job from their history.

Scope

Controller handler for single job deletion.

Requirements

Auth required middleware.

Delete record from writing_jobs where id = :id AND user_id = req.user.id.

Return HTTP 200/204 on successful deletion.

Return HTTP 404 if record is not found or owned by another user.

User / System Behavior

Success: Job record removed permanently from database; returns confirmation.

Acceptance Criteria

[ ] Deletes target job record cleanly from database.

[ ] Attempting to delete another user's job returns 404 without altering record.

[ ] Audit event logged for deletion action (event_type = 'JOB_DELETED').

Success Metric

Target record deleted permanently while maintaining tenant isolation.

Dependencies: *SNZ-008*, *SNZ-009*, *SNZ-010*, *SNZ-012*

Technical Notes

Log audit event using audit_events table without raw writing text.

Testing Requirements

API tests verifying deletion execution and cross-tenant deletion rejection.

AI Coding Agent Instructions

Implement deletion route with user authorization verification and audit logging.

*SNZ-030* — Atomic Quota Tracking & Usage Accounting
Epic: Core Writing & Analysis Backend Services

Priority: MUST-HAVE

Type: Backend

Description

Implement backend usage and token tracking service ensuring atomic usage accounting per job invocation.

Scope

Usage service (backend/src/services/usage/usageService.ts).

Requirements

Calculate token counts and log usage events into usage_events table upon job completion.

Perform quota check server-side prior to invoking AI provider.

Block requests if user has exceeded daily/monthly usage allowance with HTTP 429 Rate Limited.

User / System Behavior

Rate Limited: Exceeding entitlement quota blocks request before contacting AI provider, returning 429 Too Many Requests.

Acceptance Criteria

[ ] Usage checks enforced strictly server-side (never trust client usage state).

[ ] usage_events table updated atomically upon job execution.

[ ] Users exceeding limit receive clear guidance message.

Success Metric

Usage limits enforced reliably without concurrency race conditions bypassing quotas.

Dependencies: *SNZ-009*, *SNZ-012*, *SNZ-026*

Technical Notes

Follow SECURITY_AND_ACCESS.md section 5 & 6.

Testing Requirements

Concurrent request unit tests validating quota enforcement.

AI Coding Agent Instructions

Build server-side usage verification logic. Ensure checks happen before AI execution.

***EPIC 7 — User Preferences & Account Man**agement
*SNZ-031* — Preferences Retrieval & Update API
Epic: User Preferences & Account Management

Priority: MUST-HAVE

Type: Backend

Description

Implement GET /api/v1/preferences and PATCH /api/v1/preferences API endpoints to manage user workspace configurations.

Scope

Preferences controller (backend/src/controllers/preferencesController.ts).

Preferences repository manager.

Requirements

Auth required middleware.

GET: Return user preferences record or auto-create default row if none exists.

PATCH: Update supported fields (theme, workspace_layout, editor_mode, default_tone). Validate payload fields strictly against Zod schema.

User / System Behavior

Success: Returns updated user preferences JSON object.

Acceptance Criteria

[ ] GET /api/v1/preferences returns user's stored workspace settings.

[ ] PATCH updates allowed preferences fields and rejects invalid enum strings.

[ ] Database record created automatically for new users on first query.

Success Metric

User workspace settings persisted and retrieved with < 30ms latency.

Dependencies: *SNZ-007*, *SNZ-010*, *SNZ-012*, *SNZ-016*

Technical Notes

Follow TECHNICAL_ARCHITECTURE.md section 6 API specs.

Testing Requirements

API integration tests for GET and PATCH preference endpoints.

AI Coding Agent Instructions

Implement GET and PATCH preference controllers with Zod schema validation.

*SNZ-032* — Frontend Preferences Zustand Store & Persistence
Epic: User Preferences & Account Management

Priority: MUST-HAVE

Type: Frontend

Description

Create a Zustand preferences store in the frontend application that synchronizes local UI settings with the backend API.

Scope

Preferences store (frontend/src/stores/usePreferencesStore.ts).

Requirements

Maintain preferences state: theme ('light' | 'dark' | 'system'), workspaceLayout ('side_by_side' | 'input_first'), editorMode ('plain' | 'rich'), defaultTone ('professional' | 'casual' | etc.).

Fetch preferences from backend upon login.

Optimistically update UI state and dispatch async PATCH request to server.

User / System Behavior

Success: Changing layout or theme updates UI instantly and persists selection to server.

Acceptance Criteria

[ ] Preferences Zustand store initializes automatically when user logs in.

[ ] UI layout and theme state reflect active store values.

[ ] Server sync failures roll back optimistic state cleanly and show toast error.

Success Metric

Instant UI response on preference changes with resilient background persistence.

Dependencies: *SNZ-011*, *SNZ-020*, *SNZ-031*

Technical Notes

Avoid duplicate server source-of-truth in client state per frontend spec.

Testing Requirements

Store unit test verifying optimistic updates and rollback mechanisms.

AI Coding Agent Instructions

Implement Zustand store for user preferences with API sync handlers.

*SNZ-033* — Theme Switcher Component & System Theme Provider
Epic: User Preferences & Account Management

Priority: MUST-HAVE

Type: Frontend

Description

Build accessible theme provider and toggle components supporting light mode, dark mode, and system preference detection.

Scope

Theme provider wrapper (frontend/src/components/theme-provider.tsx).

Theme switcher dropdown component (frontend/src/components/settings/ThemeToggle.tsx).

Requirements

Add/remove dark class on root <html> element based on active theme setting.

Listen to OS media query (prefers-color-scheme: dark) when set to system.

Support keyboard focus and accessible ARIA attributes.

User / System Behavior

Success: Toggling theme changes document root CSS class and applies correct Snyzer color tokens without page refresh.

Acceptance Criteria

[ ] UI theme updates immediately upon selecting Light, Dark, or System mode.

[ ] System mode accurately reflects OS dark mode toggles via media query listener.

[ ] Visual appearance conforms to hex values defined in FRONTEND_SPECIFICATION.md section 2.

Success Metric

Theme transition executes cleanly across all application surfaces without unstyled flickering.

Dependencies: *SNZ-003*, *SNZ-032*

Technical Notes

Ensure high contrast ratios are preserved in both light and dark variants.

Testing Requirements

Component unit tests checking root DOM class manipulation on theme state changes.

AI Coding Agent Instructions

Create theme provider hook and UI toggle component adjusting HTML element classes.

*SNZ-034* — User Account Profile & Data Deletion UI
Epic: User Preferences & Account Management

Priority: MUST-HAVE

Type: Frontend

Description

Build the user settings view for managing account details, viewing current plan tier, and requesting complete account data deletion.

Scope

Settings page view (frontend/src/app/settings/page.tsx).

Account deletion confirmation modal (frontend/src/components/settings/DeleteAccountModal.tsx).

Requirements

Display user email, display name, and plan tier (FREE_USER / PREMIUM_USER).

Destructive modal for triggering permanent account and writing history deletion.

Require user to type explicit confirmation string (e.g. "DELETE") prior to executing account deletion.

User / System Behavior

Success: Confirming deletion purges user data, clears session, and redirects to home page with success toast.

Acceptance Criteria

[ ] Account deletion modal uses destructive styling (red buttons) and requires explicit text match.

[ ] Submitting deletion executes backend cascade delete and purges active session.

[ ] Modal supports Escape key dismissal and focus trapping.

Success Metric

Users can safely purge their entire account and history per privacy standards.

Dependencies: *SNZ-011*, *SNZ-014*, *SNZ-029*, *SNZ-032*

Technical Notes

Complies with PRD section 5 and SECURITY_AND_ACCESS.md section 8.

Testing Requirements

Component tests for delete confirmation modal form logic and trigger events.

AI Coding Agent Instructions

Create settings UI and confirmation modal with focus trap and explicit confirmation input.

***EPIC 8 — Design System & Frontend Applic**ation Shell
*SNZ-035* — Design System & UI Component Foundation
Epic: Design System & Frontend Application Shell

Priority: MUST-HAVE

Type: Frontend

Description

Set up the base UI component library using shadcn/ui primitives styled according to Snyzer's minimal modern SaaS visual identity.

Scope

Installation and configuration of core shadcn/ui components in frontend/src/components/ui/ (Button, Input, Card, Dialog, Select, Badge, DropdownMenu, Skeleton).

Requirements

Apply 4px base Tailwind spacing and modest card border radius (8–14px).

Ensure visual styling mirrors Grammarly/Linear minimal SaaS direction.

Provide distinct hover, focus-visible, active, and disabled states across all primitives.

User / System Behavior

Success: UI elements render with uniform borders, fonts, colors, and interactive focus rings.

Acceptance Criteria

[ ] shadcn/ui primitives configured using Snyzer Tailwind color tokens.

[ ] Components pass accessibility contrast checks.

[ ] Interactive controls display visible focus ring on keyboard navigation (focus-visible).

Success Metric

Consistent design language enforced across all interactive UI controls.

Dependencies: *SNZ-003*

Technical Notes

Follow FRONTEND_SPECIFICATION.md sections 1–5.

Testing Requirements

Storybook or component render sanity tests for button and input variants.

AI Coding Agent Instructions

Import shadcn primitives into frontend/src/components/ui/. Apply project styling rules.

*SNZ-036* — Main Workspace Navigation Shell
Epic: Design System & Frontend Application Shell

Priority: MUST-HAVE

Type: Frontend

Description

Build the main application header and navigation bar housing application logo, section links, and user account menu.

Scope

App header component (frontend/src/components/layout/Header.tsx).

Main layout wrapper (frontend/src/components/layout/AppLayout.tsx).

Requirements

Navigation items: Workspace, History, Settings.

Display user avatar/initials dropdown with links to Settings and Logout.

Responsive drawer/sheet for mobile screen viewports.

User / System Behavior

Success: Navigation links reflect active route; mobile navigation collapses into accessible sheet drawer.

Acceptance Criteria

[ ] Active route is visually indicated with subtle highlight link style.

[ ] Account menu opens on click/keyboard Enter and provides logout action.

[ ] Mobile navigation trigger opens mobile overlay on screens < 768px wide.

Success Metric

Distraction-free top navigation allowing fast switching between core application views.

Dependencies: *SNZ-014*, *SNZ-035*

Technical Notes

Keep navigation minimal and compact per section 8 of FRONTEND_SPECIFICATION.md.

Testing Requirements

Component navigation rendering tests across desktop and mobile viewports.

AI Coding Agent Instructions

Build app header layout component using shadcn DropdownMenu and Sheet primitives.

*SNZ-037* — Application Layout System & Workspace Switcher
Epic: Design System & Frontend Application Shell

Priority: MUST-HAVE

Type: Frontend

Description

Implement flexible container layouts for the main writing workspace, supporting user-selected Side-by-side and Input-first modes.

Scope

Workspace layout container (frontend/src/features/writing/WorkspaceLayout.tsx).

Requirements

Side-by-side mode: Two equal-width grid columns (Original left, Improved right) on desktop.

Input-first mode: Vertical stack layout (Input controls top, Results/Analysis bottom).

Mobile view (< 768px): Force stacked Input-first layout automatically regardless of preference setting to prevent horizontal overflow.

User / System Behavior

Success: Layout rearranges instantly when user updates layout preference or resizes window.

Acceptance Criteria

[ ] Desktop displays side-by-side or stacked layout according to preference state.

[ ] Mobile screen viewports automatically force stacked input-first layout.

[ ] Layout switches smoothly without text field content loss.

Success Metric

Zero horizontal page overflow across screen sizes down to 320px width.

Dependencies: *SNZ-032*, *SNZ-035*, *SNZ-036*

Technical Notes

Follow FRONTEND_SPECIFICATION.md sections 7 and 11.

Testing Requirements

Visual viewport tests verifying stacked layout enforcement on mobile resolution.

AI Coding Agent Instructions

Implement responsive workspace container switching layout according to Zustand preferences state.

*SNZ-038* — Framer Motion Transitions & Reduced Motion Setup
Epic: Design System & Frontend Application Shell

Priority: SHOULD-HAVE

Type: Frontend

Description

Incorporate subtle Framer Motion transitions for panel displays and result rendering while respecting operating system reduced motion accessibility settings.

Scope

Motion wrapper components (frontend/src/components/ui/AnimatedPanel.tsx).

Requirements

Animate panel slide-ins and result card expansions subtly (opacity and vertical shift).

Disable Framer Motion layout animations when prefers-reduced-motion: reduce is detected.

Do NOT apply distracting typing or character-by-character animations inside active text editors.

User / System Behavior

System: Suppresses panel transition animations when user operating system has reduced motion enabled.

Acceptance Criteria

[ ] Result panel enters with smooth opacity fade on desktop.

[ ] Reduced motion preference query disables entry animations completely.

[ ] Text typing inside active text editor triggers zero layout shift animations.

Success Metric

Smooth visual feedback without performance lag or accessibility violations.

Dependencies: *SNZ-035*, *SNZ-037*

Technical Notes

Refer to FRONTEND_SPECIFICATION.md section 13 for animation rules.

Testing Requirements

Motion hook unit test verifying reduced motion media query handling.

AI Coding Agent Instructions

Integrate Framer Motion conditionally based on useReducedMotion hook.

*SNZ-039* — Global Toast & Notification System
Epic: Design System & Frontend Application Shell

Priority: MUST-HAVE

Type: Frontend

Description

Set up toast notification provider to display transient system status alerts (success actions, network errors, copy triggers).

Scope

Toast provider setup (frontend/src/components/ui/use-toast.ts).

Requirements

Provide toast trigger variants: default, success, destructive.

Auto-dismiss toasts after 4000ms.

Include accessible screen reader notification regions (role="status" / role="alert").

User / System Behavior

Success: Copying text triggers subtle success toast in screen corner: "Copied to clipboard."

Acceptance Criteria

[ ] Toast notification appears cleanly in top/bottom screen corner.

[ ] Destructive errors stay visible until manually dismissed or auto-dismiss timeout elapsed.

[ ] Screen readers announce toast message contents upon appearance.

Success Metric

Transient status updates delivered reliably without blocking user workflow.

Dependencies: *SNZ-035*

Technical Notes

Use shadcn/ui toast or Sonner component.

Testing Requirements

Component unit test checking toast rendering and auto-dismiss timing.

AI Coding Agent Instructions

Integrate toast provider into root application layout.

*SNZ-040* — Screen Reader & Accessibility Live Region Hooks
Epic: Design System & Frontend Application Shell

Priority: MUST-HAVE

Type: Frontend

Description

Implement accessibility live region hooks and components to announce async state changes (job starting, job completed, error encountered) to assistive technologies.

Scope

Accessibility announcer hook (frontend/src/hooks/useAnnouncer.ts).

Live region DOM container (frontend/src/components/layout/A11yAnnouncer.tsx).

Requirements

Provide dynamic announcement trigger for async processes.

Use aria-live="polite" for non-urgent completion updates and aria-live="assertive" for critical error notices.

User / System Behavior

System: When AI job finishes, live region updates text to "Writing revision completed," triggering screen reader voice summary.

Acceptance Criteria

[ ] Live region element present in DOM with proper ARIA attributes.

[ ] Submitting a writing job triggers polite live region message: "Improving text, please wait."

[ ] Completion triggers announcement: "Revision complete. Results updated."

Success Metric

Assistive technologies receive accurate, non-intrusive operational status updates.

Dependencies: *SNZ-035*, *SNZ-036*

Technical Notes

Follow FRONTEND_SPECIFICATION.md section 12. Never rely on visual color changes alone.

Testing Requirements

DOM accessibility test checking aria-live attribute updates on state triggers.

AI Coding Agent Instructions

Create custom React hook and live region DOM element for accessibility announcements.

***EPIC 9 — Writing Workspace Editors & Co**ntrols
*SNZ-041* — Plain Text Input Editor Component
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Build the plain textarea editor component for inputting text to be improved, including character/word counters and placeholder guidance.

Scope

Plain text editor component (frontend/src/components/editor/PlainEditor.tsx).

Requirements

Auto-resizing or styled scrollable textarea control.

Display dynamic word and character counts in footer metadata bar.

Show visual character counter warning when approaching character limit.

Prevent submission when input is empty or whitespace-only.

User / System Behavior

Loading: Editor displays read-only state during active job execution.

Empty: Displays helpful placeholder hint ("Paste or type your draft text here...").

Acceptance Criteria

[ ] Text input updates word and character count metadata instantly on keypress.

[ ] Exceeding character limit turns character counter counter text red and disables submit button.

[ ] Pressing clear button resets text content and metadata counters cleanly.

Success Metric

Responsive, zero-latency plain text input workspace.

Dependencies: *SNZ-035*

Technical Notes

Refer to FRONTEND_SPECIFICATION.md section 6 and 9.

Testing Requirements

Unit tests for word/character counting utility with various text inputs and whitespace.

AI Coding Agent Instructions

Build plain textarea input component with live character/word count calculators.

*SNZ-042* — Controlled Rich Text Input Editor Component
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Build a controlled rich text editor component (using Tiptap or Slate) that sanitizes inputs and restricts styling to safe document elements.

Scope

Rich text editor component (frontend/src/components/editor/RichEditor.tsx).

Requirements

Controlled data model with safe internal representation.

Supported formatting controls: Bold, Italic, Bullet List, Numbered List, Heading styles.

Explicitly sanitize content to prevent insertion of unsafe HTML tags (<script>, <iframe>, style, inline event handlers).

Synchronize content state with parent workspace store.

User / System Behavior

Success: User can apply basic text formatting while editor maintains clean, sanitized internal document model.

Acceptance Criteria

[ ] Rich text editor renders formatting toolbar with working bold/italic/list toggles.

[ ] Pasting arbitrary HTML with inline script tags strips scripts cleanly prior to rendering.

[ ] Exported HTML/json matches expected safe document structure.

Success Metric

Rich formatting support without security vulnerability exposure or raw HTML injection risks.

Dependencies: *SNZ-035*, *SNZ-041*

Technical Notes

Follow SECURITY_AND_ACCESS.md section 7. Never use dangerouslySetInnerHTML directly.

Testing Requirements

HTML sanitization unit tests pasting malicious script payloads into rich text editor model.

AI Coding Agent Instructions

Integrate Tiptap or safe rich editor with strict HTML sanitization schema.

*SNZ-043* — Workspace Editor Mode Switcher
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Build control tab bar allowing users to switch dynamically between Plain Text and Rich Text editor modes while preserving input text.

Scope

Editor mode toggle component (frontend/src/components/editor/EditorModeToggle.tsx).

Requirements

Toggle tabs: Plain Text vs Rich Text.

Preserve textual content when switching between modes (strip HTML formatting gracefully when converting Rich → Plain).

Persist preferred editor mode in user preferences Zustand store.

User / System Behavior

Success: Switching modes retains draft user text without loss of content.

Acceptance Criteria

[ ] Switching Plain → Rich retains original draft string.

[ ] Switching Rich → Plain converts formatted document to clean plain text.

[ ] Selected editor mode updates user preferences store.

Success Metric

Seamless mode conversion without text loss or editor crashes.

Dependencies: *SNZ-032*, *SNZ-041*, *SNZ-042*

Technical Notes

Ensure plain text transformation removes tags safely.

Testing Requirements

Unit tests verifying bidirectional text conversion between plain string and rich content structures.

AI Coding Agent Instructions

Implement mode switcher component with plain string conversion transformers.

*SNZ-044* — Writing Controls Panel (Mode & Tone Selectors)
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Build the toolbar containing controls for selecting improvement mode, target tone, and writing metrics adjustment sliders.

Scope

Controls panel component (frontend/src/features/writing/WritingControls.tsx).

Requirements

Mode selector dropdown/segmented control: Natural, Clarity, Formal, Concise.

Tone selector dropdown: Professional, Casual, Academic, Direct.

Preference sliders: Target clarity level, sentence variety balance.

Bind control values to active workspace Zustand store.

User / System Behavior

Success: Changing controls updates workspace store state for next job dispatch.

Acceptance Criteria

[ ] Mode and tone selectors render accessible select/button controls with visible labels.

[ ] Default selection defaults to user's saved preferences (defaultTone).

[ ] Keyboard navigation allows cycling through modes and tones.

Success Metric

Intuitive control selection with instant visual feedback.

Dependencies: *SNZ-032*, *SNZ-035*

Technical Notes

Refer to FRONTEND_SPECIFICATION.md section 9.

Testing Requirements

Component interaction tests verifying selection state updates in Zustand store.

AI Coding Agent Instructions

Build controls toolbar using shadcn Select and Slider primitives.

*SNZ-045* — Primary Action Button & Processing State UI
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Build the primary "Improve Writing" action button, managing disable states, double-submission prevention, and loading spinners.

Scope

Primary action button component (frontend/src/features/writing/ImproveButton.tsx).

Requirements

Disable button when input is empty, whitespace-only, over character limit, or when job is currently in flight.

Render inline spinner and explicit text ("Improving writing...") during processing state.

Block repeated clicks to prevent duplicate job submissions.

User / System Behavior

Loading: Button disables and shows spinner during backend API fetch.

Success: Button re-enables when job finishes.

Error: Button re-enables on job failure, allowing user to retry action.

Acceptance Criteria

[ ] Rapid double clicking triggers exactly one API request.

[ ] Button displays clear loading spinner while job request is pending.

[ ] Button is visually and functionally disabled when textarea contains no text.

Success Metric

Zero duplicate submission requests dispatched to backend APIs.

Dependencies: *SNZ-020*, *SNZ-035*, *SNZ-041*

Technical Notes

Enforce client-side debounce/disable prevention in addition to store state flags.

Testing Requirements

Component unit tests verifying disabled state and double click handling.

AI Coding Agent Instructions

Implement primary action button with click debouncing and loading state overlays.

*SNZ-046* — Workspace Local State Management (Zustand)
Epic: Writing Workspace Editors & Controls

Priority: MUST-HAVE

Type: Frontend

Description

Construct the workspace Zustand store (frontend/src/stores/useWorkspaceStore.ts) managing draft text, current controls, active job state, and revision results.

Scope

Workspace Zustand store implementation.

Requirements

State variables: inputText, editorMode, selectedMode, selectedTone, isProcessing, currentResult, analysisMetrics, activeError.

Actions: setInputText, setControls, submitWritingJob, resetWorkspace, clearError.

Handle job execution lifecycle (idle -> loading -> success / error).

User / System Behavior

System: Orchestrates UI components through job submission workflow, updating results and error states predictably.

Acceptance Criteria

[ ] Store manages transient writing state independently from permanent server history.

[ ] submitWritingJob action dispatches API call via apiClient and handles success/failure.

[ ] Input draft text is strictly preserved in store when job encounters an error.

Success Metric

Predictable state transitions across workspace UI components during job executions.

Dependencies: *SNZ-020*, *SNZ-032*, *SNZ-041*, *SNZ-044*, *SNZ-045*

Technical Notes

Follow FRONTEND_SPECIFICATION.md section 15 for state architecture.

Testing Requirements

Unit tests for store actions testing job submission, success update, and error preservation paths.

AI Coding Agent Instructions

Implement useWorkspaceStore Zustand hook handling job submission async actions cleanly.

***EPIC 10 — Writing Results, Analysis & Hi**story UI
*SNZ-047* — Revised Text Output Display Component
Epic: Writing Results, Analysis & History UI

Priority: MUST-HAVE

Type: Frontend

Description

Build the result editor/display container for rendering AI-generated revised text with quick actions (Copy, Edit, Rerun).

Scope

Result container component (frontend/src/features/writing/ResultDisplay.tsx).

Requirements

Render improved output text cleanly in matching editor mode.

Provide quick action toolbar: Copy to Clipboard, Use as Input (Edit), Rerun Revision.

Copy action triggers toast confirmation and feedback icon swap.

User / System Behavior

Success: Clicking Copy places revised text onto system clipboard and displays success toast.

Empty: Displays helpful empty state placeholder prior to first job execution.

Acceptance Criteria

[ ] Copy button writes exact revised text string to clipboard.

[ ] "Use as Input" button populates main input editor with revised text for iterative editing.

[ ] Displays copy confirmation toast upon success.

Success Metric

High copy/use interaction conversion rate for completed writing jobs.

Dependencies: *SNZ-035*, *SNZ-039*, *SNZ-046*

Technical Notes

Handle clipboard API write failures gracefully (e.g. fallback for insecure contexts).

Testing Requirements

Component unit tests for clipboard action buttons and text transfer logic.

AI Coding Agent Instructions

Build result display panel with copy and transfer action handlers.

*SNZ-048* — Writing Quality Metrics Analysis Panel
Epic: Writing Results, Analysis & History UI

Priority: MUST-HAVE

Type: Frontend

Description

Build the writing analysis panel displaying calculated metrics: readability, clarity, repetition, sentence variety, vocabulary complexity, and formality.

Scope

Analysis panel component (frontend/src/components/analysis/AnalysisPanel.tsx).

Metric progress bar indicators (frontend/src/components/analysis/MetricBar.tsx).

Requirements

Render score metrics (0–100 scale) with visual indicators and qualitative descriptions (e.g. "72 — Clear and accessible").

Include tooltip explanations for each metric explaining what the metric represents.

Do NOT display "AI detector bypass" or "human probability" scores.

User / System Behavior

Success: Analysis panel updates with metrics breakdown upon successful job completion.

Acceptance Criteria

[ ] Displays all six core metrics cleanly with corresponding score labels.

[ ] Tooltip overlays provide actionable explanations for metric terms.

[ ] Explicitly excludes any detector evasion or human score wording.

Success Metric

Clear visual presentation of writing metrics without presenting false precision or misleading labels.

Dependencies: *SNZ-035*, *SNZ-046*

Technical Notes

Follow FRONTEND_SPECIFICATION.md section 10 and PRD section 1.

Testing Requirements

Component render tests checking score label mapping and tooltip popovers.

AI Coding Agent Instructions

Implement analysis metrics panel using shadcn Progress and Tooltip components.

*SNZ-049* — Recoverable Error & Retry Overlay UI
Epic: Writing Results, Analysis & History UI

Priority: MUST-HAVE

Type: Frontend

Description

Build error display state overlays for the writing workspace handling rate limits, timeouts, network loss, and invalid input errors cleanly.

Scope

Error banner component (frontend/src/features/writing/WorkspaceErrorOverlay.tsx).

Requirements

Render error card specifying what happened, confirming input text was preserved, and offering single-click retry action.

Differentiate recoverable errors (retryable timeout, 503) from terminal errors (text too long, invalid input).

Include clear guidance for rate limit errors (429) with retry-after recommendation.

User / System Behavior

Error: Network loss during job execution displays inline warning: "Network connection lost. Your text is saved. Click Retry when reconnected."

Acceptance Criteria

[ ] Error banner preserves user draft text in input area without clearing content.

[ ] Retry button re-dispatches failed job execution seamlessly.

[ ] Displays readable error message mapped from backend error code.

Success Metric

100% of failed job attempts preserve input draft text without data loss.

Dependencies: *SNZ-020*, *SNZ-039*, *SNZ-046*

Technical Notes

Comply with FRONTEND_SPECIFICATION.md section 18.

Testing Requirements

Component unit tests verifying input text preservation on error state triggers.

AI Coding Agent Instructions

Build workspace error component with retry handler and input preservation checks.

*SNZ-050* — Writing History List View & Card Items
Epic: Writing Results, Analysis & History UI

Priority: MUST-HAVE

Type: Frontend

Description

Build the Writing History page displaying paginated past writing jobs with filtering, preview snippets, and detail view triggers.

Scope

History page view (frontend/src/app/history/page.tsx).

History item card (frontend/src/components/history/HistoryCard.tsx).

Requirements

Fetch paginated history jobs via apiClient.

Display job cards showing creation date, mode tag, tone badge, and truncated text preview.

Empty state component displayed when user has zero historical jobs ("No writing history yet").

Skeleton loader placeholders displayed during async history fetches.

User / System Behavior

Loading: Renders skeleton cards while loading history API data.

Empty: Displays friendly illustration and call-to-action button: "Start Writing".

Acceptance Criteria

[ ] History page loads and displays user's past writing jobs.

[ ] Pagination controls ("Next", "Previous") fetch target offsets cleanly.

[ ] Empty state renders when history list returns zero items.

Success Metric

Fast history browsing with clear pagination state controls.

Dependencies: *SNZ-020*, *SNZ-027*, *SNZ-035*

Technical Notes

Follow FRONTEND_SPECIFICATION.md for empty and loading state specs.

Testing Requirements

Component tests for history page under loading, empty, and populated data states.

AI Coding Agent Instructions

Build history view with skeleton loaders, card lists, and pagination actions.

*SNZ-051* — Single History Entry Detail View & Delete Trigger
Epic: Writing Results, Analysis & History UI

Priority: MUST-HAVE

Type: Frontend

Description

Build modal/page view for inspecting full details, metrics, and complete input/output texts of a historical writing job, with deletion trigger.

Scope

History item detail dialog (frontend/src/components/history/HistoryDetailModal.tsx).

Requirements

Display complete untruncated input and output texts side-by-side or stacked.

Show full quality analysis metrics breakdown.

Provide "Load into Workspace" button to copy job text back to main editor.

Destructive "Delete from History" button triggering job deletion API call.

User / System Behavior

Success: Deleting job removes card from history view instantly and shows confirmation toast.

Acceptance Criteria

[ ] Detail modal displays full job input, output, and metrics cleanly.

[ ] Deleting job invokes DELETE /api/v1/writing/jobs/:id and updates parent history list.

[ ] Focus trap and Escape key dismissal function properly inside dialog.

Success Metric

Complete control over inspecting and removing past writing entries.

Dependencies: *SNZ-028*, *SNZ-029*, *SNZ-035*, *SNZ-050*

Technical Notes

Ensure deletion updates local state without requiring full page refresh.

Testing Requirements

Modal interaction test checking deletion workflow and list state update.

AI Coding Agent Instructions

Build detail inspection dialog with delete trigger and workspace reload action.

***EPIC 11 — Security, Rate Limiting & Privacy **Controls
*SNZ-052* — Backend HTTP Rate Limiting & Abuse Prevention
Epic: Security, Rate Limiting & Privacy Controls

Priority: MUST-HAVE

Type: Security

Description

Implement HTTP rate limiting middleware on Express API routes using express-rate-limit to block automated abuse and brute force attempts.

Scope

Rate limiter middleware in backend/src/middleware/rateLimiter.ts.

Requirements

Auth routes (login/register): Limit to 10 requests per 15 minutes per IP.

Writing job endpoint (/api/v1/writing/jobs): Limit based on user ID / IP (e.g. 20 requests per minute).

Return HTTP 429 Too Many Requests with standard JSON error body and Retry-After header when limit exceeded.

User / System Behavior

Rate Limited: Excessive rapid API requests return 429 Too Many Requests with retry guidance header.

Acceptance Criteria

[ ] Exceeding endpoint request threshold blocks subsequent requests with HTTP 429 status.

[ ] Rate limit error payload matches standardized Snyzer error schema.

[ ] Retry-After HTTP header indicates remaining backoff seconds.

Success Metric

Effective prevention of automated endpoint flooding and denial-of-service abuse.

Dependencies: *SNZ-002*, *SNZ-004*, *SNZ-018*

Technical Notes

Configure window and max requests using environment variables RATE_LIMIT_WINDOW_SECONDS and RATE_LIMIT_MAX_REQUESTS.

Testing Requirements

API unit test simulating burst traffic exceeding rate limit threshold.

AI Coding Agent Instructions

Implement Express rate limiting middleware with route-specific window policies.

*SNZ-053* — Security Headers, CORS Policy & CSRF Protection
Epic: Security, Rate Limiting & Privacy Controls

Priority: MUST-HAVE

Type: Security

Description

Configure standard security headers (via Helmet), strict CORS origin policies, and CSRF protection mechanisms across backend API routes.

Scope

Security configuration in backend/src/security/headers.ts.

Requirements

Apply Helmet middleware: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (DENY), X-Content-Type-Options (nosniff).

Restrict CORS origin strictly to explicitly whitelisted frontend application domain.

Ensure CORS policy is NOT relied upon as the sole defense against CSRF; enforce strict Content-Type and Authorization checks.

User / System Behavior

Unauthorized: Requests originating from unapproved browser domains are rejected by CORS headers.

Acceptance Criteria

[ ] HTTP responses include HSTS, CSP, and X-Frame-Options headers.

[ ] Unauthorized cross-origin browser requests are rejected.

[ ] Server headers do not expose X-Powered-By: Express.

Success Metric

Clean A+ rating on security header analysis checks without breaking frontend functionality.

Dependencies: *SNZ-002*, *SNZ-004*

Technical Notes

Comply with SECURITY_AND_ACCESS.md section 7. Never use wildcards (*) for CORS origin in production.

Testing Requirements

HTTP header inspection tests checking response header presence.

AI Coding Agent Instructions

Configure Helmet and CORS middleware using whitelist domains from environment settings.

*SNZ-054* — Input Sanitization & XSS Prevention Filter
Epic: Security, Rate Limiting & Privacy Controls

Priority: MUST-HAVE

Type: Security

Description

Implement input sanitization filters and strict XSS defense mechanisms across backend and frontend boundaries.

Scope

Input sanitizer utility (backend/src/security/sanitizer.ts).

Requirements

Treat all user draft text strictly as plain text data.

Strip embedded control characters and null bytes from incoming request strings.

Escape or sanitize strings displayed outside controlled rich text frameworks on the frontend.

Strictly prevent execution of inline script tags (<script>) or injected HTML event handlers (onload=, onerror=).

User / System Behavior

System: Strips dangerous executable script tags and null characters from inputs prior to processing.

Acceptance Criteria

[ ] Submitting input containing <script>alert('xss')</script> renders text harmlessly as raw string without execution.

[ ] Backend input sanitizer strips null bytes (\0) and invalid control characters.

[ ] Output response JSON sets explicit Content-Type: application/json; charset=utf-8.

Success Metric

Zero executable script or code injection vectors across text submission workflows.

Dependencies: *SNZ-016*, *SNZ-017*

Technical Notes

Refer to SECURITY_AND_ACCESS.md section 7.

Testing Requirements

Security unit tests with comprehensive XSS vectors (polyglots, event handlers, script tags).

AI Coding Agent Instructions

Implement string sanitization utility stripping dangerous control sequences and HTML scripts.

*SNZ-055* — Privacy Retention & Data Purge Service
Epic: Security, Rate Limiting & Privacy Controls

Priority: SHOULD-HAVE

Type: Backend

Description

Implement backend scheduled worker/service for enforcing privacy retention policies and executing complete user account data purges.

Scope

Data retention service in backend/src/services/privacy/dataRetentionService.ts.

Requirements

Purge failed or orphaned writing job records older than configured retention period (e.g. 30 days).

Execute complete cascade deletion when user triggers account deletion (delete profile, user preferences, writing jobs, and usage events).

Log deletion audit event without retaining sensitive deleted text context.

User / System Behavior

System: Cleanly removes user's database records upon account deletion request.

Acceptance Criteria

[ ] Account deletion cleanly purges user rows across profiles, user_preferences, writing_jobs, and usage_events.

[ ] Job records exceeding retention policy boundary are purged automatically.

[ ] Verification check confirms zero orphaned foreign key records remain post-purge.

Success Metric

Complete user data erasure compliance with zero leftover database records.

Dependencies: *SNZ-006*, *SNZ-007*, *SNZ-008*, *SNZ-009*, *SNZ-034*

Technical Notes

Follow SECURITY_AND_ACCESS.md section 8.

Testing Requirements

Database purge integration tests verifying complete foreign key cascade deletion.

AI Coding Agent Instructions

Build cascade delete handler and automated data retention cleanup queries.

*SNZ-056* — Security & Vulnerability Audit Checklist Suite
Epic: Security, Rate Limiting & Privacy Controls

Priority: MUST-HAVE

Type: Security

Description

Construct automated security check scripts and integration tests validating launch security requirements.

Scope

Security audit script (backend/scripts/security-audit.ts).

Requirements

Validate that OPENROUTER_API_KEY and SUPABASE_SECRET_KEY are not present in frontend assets or public bundles.

Verify RLS is enabled on 100% of public database schema tables.

Verify production error responses suppress stack traces and SQL query strings.

Test that unauthenticated calls to protected routes fail with HTTP 401.

User / System Behavior

System: Security audit script executes during build phase, halting release if vulnerabilities exist.

Acceptance Criteria

[ ] Audit script passes without warnings in production configuration.

[ ] Automated check fails if a backend secret key string is found in frontend build output files.

[ ] Database assertion confirms RLS is active on every table.

Success Metric

100% compliance with Security Launch Checklist (SECURITY_AND_ACCESS.md section 9).

Dependencies: *SNZ-004*, *SNZ-010*, *SNZ-012*, *SNZ-053*

Technical Notes

Integrate check into project build and CI pipeline.

Testing Requirements

Security audit execution test validating asset bundle scanning.

AI Coding Agent Instructions

Write security audit runner script scanning frontend static bundles for secret keys and checking RLS status.

***EPIC 12 — Testing, Observability & Deployment**
*SNZ-057* — Automated Test Suite Setup (Jest/Vitest & Playwright)
Epic: Testing, Observability & Deployment

Priority: MUST-HAVE

Type: QA

Description

Establish unified testing frameworks across workspaces (Vitest/Jest for unit and integration tests, Playwright for end-to-end testing).

Scope

Test configuration in root, frontend, and backend packages.

Sample test suites proving unit, API, and E2E execution.

Requirements

Configure Vitest/Jest runner for fast unit and component testing.

Configure Playwright runner for core E2E user flows (Login -> Submit writing job -> Inspect results -> View history).

Provide npm workspace commands: npm run test, npm run test:e2e.

User / System Behavior

System: Developers and CI pipelines run comprehensive test suites with single CLI command.

Acceptance Criteria

[ ] npm run test executes all unit and integration tests across frontend, backend, and shared packages.

[ ] npm run test:e2e executes Playwright browser tests cleanly in headless mode.

[ ] Test coverage report generates without errors.

Success Metric

Reliable test infrastructure executing unit tests in < 15 seconds and E2E flows in < 2 minutes.

Dependencies: *SNZ-001*, *SNZ-002*, *SNZ-003*, *SNZ-026*

Technical Notes

Ensure test runner uses isolated test database or mocked services.

Testing Requirements

Self-testing test setup script.

AI Coding Agent Instructions

Configure Vitest for backend/frontend unit tests and Playwright for root E2E testing.

*SNZ-058* — End-to-End Core User Flow Integration Tests
Epic: Testing, Observability & Deployment

Priority: MUST-HAVE

Type: QA

Description

Create end-to-end test scenarios covering critical user journeys from registration through writing improvement and history management.

Scope

Playwright test file (e2e/core-flow.spec.ts).

Requirements

Test Flow 1: User sign up -> Redirect to workspace -> Enter text -> Select Formal mode -> Click Improve -> Verify revision display and analysis metrics.

Test Flow 2: Copy result to clipboard -> Navigate to History -> Verify job item exists -> Delete job item -> Confirm removal.

Test Flow 3: Toggle dark/light theme -> Change workspace layout to Input-first -> Refresh page -> Verify preferences persist.

User / System Behavior

System: Automated headless browser executes full application user flows, verifying system functionality end-to-end.

Acceptance Criteria

[ ] Core user flow test suite passes 100% cleanly in automated test run.

[ ] Tests run reliably without flaky timeouts or race conditions.

[ ] Verifies input text preservation on mocked network error state.

Success Metric

High confidence in production release integrity across core user flows.

Dependencies: *SNZ-013*, *SNZ-026*, *SNZ-033*, *SNZ-047*, *SNZ-050*, *SNZ-057*

Technical Notes

Follow PRD section 6 user flow specifications.

Testing Requirements

Headless browser E2E test execution.

AI Coding Agent Instructions

Write Playwright end-to-end tests covering registration, workspace revision, history inspection, and settings.

*SNZ-059* — Production Build, Bundling & Environment Setup
Epic: Testing, Observability & Deployment

Priority: MUST-HAVE

Type: Infrastructure

Description

Configure production build pipelines, static asset optimization, tree shaking, and deployment bundle verification.

Scope

Build configuration scripts in frontend/vite.config.ts and backend/tsconfig.json.

Requirements

Optimize frontend assets (minification, chunk splitting, tree-shaking).

Compile backend TypeScript cleanly into dist/ directory with production sourcemaps.

Ensure zero development dependencies are required in production runtime bundle.

User / System Behavior

System: npm run build generates production artifacts ready for server deployment.

Acceptance Criteria

[ ] Frontend bundle size remains optimized with clean chunk splitting.

[ ] Backend compiles without TypeScript errors or missing module references.

[ ] Static assets build cleanly into dist/ ready for Vercel/Node hosting.

Success Metric

Clean production compilation step completing in < 60 seconds without warnings.

Dependencies: *SNZ-001*, *SNZ-004*

Technical Notes

Follow TECHNICAL_ARCHITECTURE.md section 8 and 9.

Testing Requirements

Build artifact verification script checking dist/ directory contents.

AI Coding Agent Instructions

Configure Vite and TypeScript build settings for optimized production compilation.

*SNZ-060* — Production Readiness & Deployment Verification
Epic: Testing, Observability & Deployment

Priority: MUST-HAVE

Type: Infrastructure

Description

Perform final launch configuration, health check verification, environment variable verification, and deployment documentation.

Scope

Production readiness checklist execution.

Deployment guide documentation (docs/DEPLOYMENT.md).

Requirements

Verify Vercel / Node deployment scripts.

Validate production HTTPS enforcement and database SSL connection requirements.

Conduct live smoke test on deployed production environment endpoint (GET /api/v1/health).

User / System Behavior

System: Deployed application serves production traffic securely over HTTPS with working database connections.

Acceptance Criteria

[ ] Production health check endpoint returns HTTP 200 OK.

[ ] SSL/TLS connection strictly enforced for web clients and database pooling.

[ ] Deployment guide details environment variable configuration steps clearly.

Success Metric

Successful zero-downtime production deployment with passing health checks.

Dependencies: *SNZ-002*, *SNZ-004*, *SNZ-056*, *SNZ-059*

Technical Notes

Comply with TECHNICAL_ARCHITECTURE.md section 8 and SECURITY_AND_ACCESS.md section 9.

Testing Requirements

Live production health check smoke test.

AI Coding Agent Instructions

Write deployment setup documentation and configure production environment entry scripts.

***EPIC 13 — Post-MVP Roadmap Features
*SNZ-061* **— Streaming Output AI Revisions
Epic: Post-MVP Roadmap Features

Priority: SHOULD-HAVE

Type: Feature

Description

Implement Server-Sent Events (SSE) streaming API endpoint and frontend progressive text rendering for real-time text output generation.

Scope

Backend streaming endpoint POST /api/v1/writing/jobs/stream.

Frontend stream reader hook (frontend/src/hooks/useStreamingRevision.ts).

Requirements

OpenRouter API streaming integration returning server-sent token chunks.

Stream revised tokens incrementally into workspace result display.

Maintain fallback to standard synchronous endpoint if SSE connection fails.

User / System Behavior

Success: User sees revised text appear progressively token-by-token in real time.

Acceptance Criteria

[ ] Streaming API delivers incremental text chunks over SSE connection.

[ ] Frontend displays progressive text updates smoothly.

[ ] Final job status and analysis metrics persist correctly upon stream completion.

Success Metric

Reduced perceived latency with instantaneous initial token rendering (< 500ms time-to-first-token).

Dependencies: *SNZ-022*, *SNZ-026*, *SNZ-047*

Technical Notes

PRD Section 5 Nice-To-Have feature.

Testing Requirements

Mock streaming response unit test verifying token assembly and state updates.

AI Coding Agent Instructions

Implement SSE route handling and frontend reader stream parser.

*SNZ-062* — Custom Saved Style & Control Presets
Epic: Post-MVP Roadmap Features

Priority: NICE-TO-HAVE

Type: Feature

Description

Allow users to create, name, and save custom combinations of writing mode, tone, and slider metrics preferences as reusable presets.

Scope

Database table user_presets.

Preset manager UI component (frontend/src/features/writing/PresetManager.tsx).

Requirements

Support saving current control configurations with custom title (e.g. "My Blog Tone").

Quickly apply saved preset configurations to workspace controls in one click.

Limit max presets per free user (e.g. 5 presets maximum).

User / System Behavior

Success: Selecting a saved preset populates mode, tone, and metric sliders instantly.

Acceptance Criteria

[ ] Users can create, load, and delete custom control presets.

[ ] Applying preset updates active workspace Zustand store settings cleanly.

[ ] Presets persist in database across logins.

Success Metric

Increased usage efficiency for recurring specialized writing workflows.

Dependencies: *SNZ-031*, *SNZ-044*

Technical Notes

PRD Section 5 Nice-To-Have roadmap item.

Testing Requirements

Component unit test for saving and applying presets.

AI Coding Agent Instructions

Build preset manager UI and database migration for storing user preset configurations.

*SNZ-063* — Document Export Capabilities (Markdown & Text)
Epic: Post-MVP Roadmap Features

Priority: NICE-TO-HAVE

Type: Feature

Description

Add file export utilities allowing users to download original and revised text outputs in Markdown (.md) or Plain Text (.txt) formats.

Scope

File export dropdown component (frontend/src/components/editor/ExportButton.tsx).

Requirements

Export current draft or revised result to .md or .txt file using client-side blob download triggers.

Generate sanitized file names based on job date and mode (e.g., snyzer-revision-2026-09-10.md).

User / System Behavior

Success: Clicking "Export as Markdown" triggers browser file download containing formatted document text.

Acceptance Criteria

[ ] Export triggers file download cleanly without page navigation or backend round-trips.

[ ] Exported file contains complete untruncated document content.

[ ] Download function works reliably across major desktop and mobile browsers.

Success Metric

Easy integration into external user writing workflows.

Dependencies: *SNZ-047*

Technical Notes

PRD Section 5 Nice-To-Have feature. Perform download completely client-side using Blob APIs.

Testing Requirements

Unit test for file blob generator utility.

AI Coding Agent Instructions

Build client-side file export utility supporting plain text and markdown formats.


# SNZ-064 — GitHub & Vercel Production Deployment

**Priority:** MUST-HAVE
**Type:** Production / Deployment
**Dependencies:** All previous MUST-HAVE tickets, especially SNZ-059 and SNZ-060

## Description

Prepare the complete Snyzer application for public release by making the repository **GitHub-ready** and the application **Vercel-ready**.

The final result must be a clean, reproducible, secure production project that can be stored publicly on GitHub and deployed to Vercel without exposing secrets or breaking production functionality.

---

## Scope

### GitHub Readiness

Prepare the repository for public GitHub hosting.

Requirements:

* Ensure the complete source code is organized correctly.
* Ensure `.gitignore` is present and comprehensive.
* Never commit `.env`, API keys, passwords, tokens, database credentials, or other secrets.
* Create/update `.env.example` containing only required variable names and safe placeholder values.
* Remove development-only secrets or credentials from tracked files.
* Remove unnecessary generated files, build artifacts, caches, and local machine files.
* Ensure `package.json` and lockfiles are correct and reproducible.
* Ensure all required dependencies are declared.
* Ensure the project can be cloned and installed from a clean environment.
* Ensure GitHub contains the source required to build and deploy Snyzer.
* Add/update `README.md`.

### README

The README should clearly explain:

* What Snyzer is
* Main features
* Technology stack
* Project structure
* Requirements/prerequisites
* Local installation
* Environment variables
* Local development commands
* Production build commands
* Deployment instructions
* Security notes
* Contribution/development information where appropriate
* License information if already defined by the project

Do not put real credentials or secrets in the README.

---

## Vercel Readiness

Prepare Snyzer for deployment on Vercel.

Requirements:

* Verify that the application builds successfully in a clean production environment.
* Configure the correct Vercel build/install/output settings.
* Configure the correct framework detection where possible.
* Ensure frontend environment variables use only values safe for the client.
* Keep all server-side secrets server-side.
* Ensure the OpenRouter API key is never exposed to browser code.
* Ensure Supabase secret/service credentials are never exposed to browser code.
* Configure production environment variables through Vercel rather than committing them to Git.
* Verify API/server functionality works correctly in the Vercel deployment architecture.
* Verify routing works correctly after deployment.
* Verify static assets load correctly.
* Verify production error handling.
* Verify authentication works in production.
* Verify database access and RLS work correctly in production.
* Verify CORS/origin configuration where applicable.
* Verify HTTPS-compatible cookie/authentication behavior where applicable.

---

## Security Verification

Before deployment, perform a final security review.

Check for:

* Hard-coded API keys
* Hard-coded passwords
* Supabase secret/service keys in frontend code
* OpenRouter keys in frontend code
* Secrets accidentally included in Git history where practical
* Sensitive information in logs
* Debug endpoints
* Development-only authentication bypasses
* Development-only routes
* Exposed stack traces
* Insecure production configuration
* Incorrect environment-variable prefixes
* Client-trusted authorization or ownership fields

If a secret has previously been committed to a repository, do not simply remove it from the latest commit. Treat it as compromised and recommend rotating/revoking it.

---

## Production Build Verification

Run the complete production validation:

1. Clean install dependencies.
2. Run type checking.
3. Run linting.
4. Run unit/component tests.
5. Run integration/API tests where applicable.
6. Run the production build.
7. Verify the generated production output.
8. Check for build warnings and errors.
9. Verify there are no missing environment variables.
10. Verify there are no broken imports or assets.
11. Verify the application starts/serves correctly in its intended deployment environment.

Do not claim deployment readiness if the production build has not actually been verified.

---

## Vercel Deployment Verification

After connecting the GitHub repository to Vercel:

Verify:

* Production deployment succeeds.
* Build succeeds on Vercel.
* Application loads correctly.
* Main workspace works.
* Writing improvement flow works.
* Authentication works.
* History works where implemented.
* Settings/preferences work where implemented.
* Database operations work.
* AI provider requests work.
* Error states work.
* Responsive UI works.
* No secrets appear in browser source, network responses, or client bundles.

Test both:

* Local production build
* Actual Vercel deployment

---

## GitHub Repository Quality

Before the final push, ensure the repository contains only appropriate project files.

Recommended structure:

```text
snyzer/
├── src/
├── public/
├── ...
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── lockfile
├── tsconfig.json
├── ...
└── LICENSE
```

Adapt this structure to the actual Snyzer architecture rather than forcing this exact structure.

---

## Acceptance Criteria

* [ ] Snyzer can be cloned from GitHub.
* [ ] A clean dependency installation succeeds.
* [ ] TypeScript passes.
* [ ] Lint passes.
* [ ] Tests pass.
* [ ] Production build succeeds.
* [ ] `.gitignore` prevents secrets and generated files from being committed.
* [ ] `.env.example` documents required variables without containing real secrets.
* [ ] README contains complete setup instructions.
* [ ] No API keys or private credentials are present in the repository.
* [ ] OpenRouter credentials remain server-side.
* [ ] Supabase secret/service credentials remain server-side.
* [ ] Production environment variables are configured through Vercel.
* [ ] Snyzer successfully deploys to Vercel.
* [ ] The deployed application loads correctly.
* [ ] Authentication works in production.
* [ ] Database access works in production.
* [ ] AI writing improvement works in production.
* [ ] Production routing works.
* [ ] No critical browser-console errors remain.
* [ ] No critical security issues remain.
* [ ] No development authentication bypasses or debug functionality remain enabled.
* [ ] The final GitHub repository is suitable for public viewing.

---

## Success Metric

**Snyzer can be cloned from GitHub and successfully deployed to Vercel from a clean environment, with all implemented production functionality working and no secrets exposed.**

---

## Technical Notes

* Do not hard-code Vercel-specific assumptions if the existing architecture uses a different deployment pattern.
* Use Vercel environment variables for production secrets.
* Do not expose server-only environment variables through frontend build configuration.
* Do not commit `.env` files containing credentials.
* Do not weaken authentication or RLS to make deployment easier.
* Do not disable security controls merely to resolve deployment errors.
* If Vercel requires architectural changes, make the smallest change necessary and document it.
* Preserve existing functionality.
* Do not implement unrelated future features.

---

## Final Git Workflow

Before pushing:

```bash
git status
git diff
```

Review all changed files.

Then:

```bash
git add .
git commit -m "chore(snz-064): prepare GitHub and Vercel production deployment"
git push
```

Only push after confirming that no secrets or unintended files are included.

---

## Final Report

After completion, report:

**GitHub**

* Repository readiness:
* README:
* `.gitignore`:
* Environment configuration:

**Production Build**

* Typecheck:
* Lint:
* Tests:
* Build:

**Vercel**

* Deployment:
* Production URL:
* Authentication:
* Database:
* AI functionality:

**Security**

* Secrets checked:
* Client bundle checked:
* Production configuration checked:

**Known Issues**

* ...

Then STOP.
