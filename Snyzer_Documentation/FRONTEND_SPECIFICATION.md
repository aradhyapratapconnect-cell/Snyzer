# Snyzer — Frontend Specification Document

## 1. Design Direction
**Style:** Minimal, professional, modern SaaS.

Use the clarity and restraint associated with Grammarly, Linear, Notion, and modern SaaS products as inspiration without copying branding or proprietary UI.

## 2. Color System

### Light
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Muted surface: `#F1F5F9`
- Primary text: `#0F172A`
- Secondary text: `#475569`
- Border: `#E2E8F0`
- Primary: `#2563EB`
- Primary hover: `#1D4ED8`
- Success: `#16A34A`
- Warning: `#D97706`
- Error: `#DC2626`

### Dark
- Background: `#0B1120`
- Surface: `#111827`
- Muted surface: `#1F2937`
- Primary text: `#F8FAFC`
- Secondary text: `#CBD5E1`
- Border: `#334155`
- Primary: `#60A5FA`
- Primary hover: `#93C5FD`
- Success: `#4ADE80`
- Warning: `#FBBF24`
- Error: `#F87171`

### Theme
Support **Light**, **Dark**, and **System**. System follows the operating-system preference.

## 3. Typography
Use Inter or a system sans-serif fallback.
- Display: 28–40px, 600–700.
- Page heading: 24–32px.
- Section heading: 18–20px.
- Body: 14–16px.
- Meta: 12–13px.
- Body line height: approximately 1.4–1.6.

## 4. Spacing
Use Tailwind tokens with a 4px base unit.
- Gaps: 8–16px.
- Card padding: 16–24px.
- Page padding: 24px desktop / 16px mobile.
- Radius: 8–14px.
- Minimal shadows.
- Prioritize the writing workspace over decoration.

## 5. Components

### Buttons
Primary filled; secondary bordered; ghost transparent; destructive reserved for deletion. Provide keyboard focus and meaningful disabled states.

### Inputs
Use visible labels, focus states, validation, and associated error text. Do not rely on placeholders as labels.

### Cards
Subtle border, modest radius, minimal shadow, strong hierarchy.

### Modals
Use for confirmations and focused settings. Include clear title, explanation, Cancel/action controls, Escape support, and accessible focus management.

## 6. Editors
Snyzer provides both:
1. Plain textarea editor.
2. Controlled rich-text editor.

Plain mode is the simplest default. Rich editing must use a controlled data model and must not allow arbitrary unsafe HTML.

## 7. Main Workspace
Snyzer supports two user-selectable layouts.

### Side-by-side
Original on the left, Improved on the right.

### Input first → Result second
Input and controls first; result and analysis second.

Store the selection in user preferences.

## 8. Navigation
- Workspace
- History
- Settings
- Account menu

Keep navigation compact and distraction-free.

## 9. Workspace Components
- Editor
- Character/word count
- Mode selector
- Tone selector
- Style controls
- Improve button
- Processing state
- Result editor
- Analysis panel
- Copy
- Rerun
- Save/history state
- Error/retry state

## 10. Analysis
Show:
- Readability
- Clarity
- Repetition
- Sentence variety
- Vocabulary complexity
- Formality

Explain metrics rather than presenting false precision. Do not present a “human score” as objective truth.

## 11. Responsive Design
Desktop: comparison workspace.

Tablet: narrower comparison or stacked panels.

Mobile: naturally use Input first → Result second; collapse controls into a sheet/popover; prevent horizontal overflow.

## 12. Accessibility
- WCAG-oriented contrast.
- Keyboard navigation.
- Visible focus indicators.
- Semantic HTML.
- Accessible labels.
- Reduced-motion support.
- Screen-reader status updates.
- Never communicate state using color alone.

## 13. Animation
Use a hybrid approach:
- CSS/Tailwind for hover, focus, opacity, and simple transitions.
- Framer Motion for meaningful panel/result/navigation transitions.
- No unnecessary animation while typing.
- Respect `prefers-reduced-motion`.

## 14. Component Libraries
Use **shadcn/ui** as the accessible foundation and **Magic UI** selectively for polished enhancements.

Libraries must follow Snyzer's design system rather than dictate it.

## 15. State
Use Zustand for:
- auth/session UI state
- editor state
- preferences
- layout state
- transient job state

Keep server data separate from local UI state and avoid duplicating server truth.

## 16. Third-Party Integrations

### Supabase Auth
Purpose: identity and sessions.

Frontend:
- initialize with public/publishable key.
- sign up/sign in/sign out.
- listen for auth changes.

Secret credentials remain server-side.

### Supabase/PostgreSQL
Purpose: application data.

Sensitive database credentials never reach the browser. Prefer Snyzer backend APIs for protected operations.

### OpenRouter
Purpose: AI inference.

Only the Snyzer backend calls OpenRouter.

Send:
- writing request
- selected mode/tone/settings
- required model/provider configuration
- necessary metadata

Receive:
- generated revision
- provider/model metadata as needed
- token usage where available

Backend validates and normalizes the response.

### Optional Analytics
If added, collect privacy-conscious event metadata. Do not send full writing content by default.

## 17. API Client Contract

Frontend calls only Snyzer's backend.

`POST /api/v1/writing/jobs`

Request:
```json
{
  "inputText": "...",
  "mode": "natural",
  "tone": "professional",
  "editorMode": "plain",
  "preferences": {
    "clarity": 70,
    "sentenceVariety": 60
  }
}
```

Success:
```json
{
  "job": {
    "id": "uuid",
    "status": "completed",
    "outputText": "...",
    "analysis": {
      "readability": 72,
      "clarity": 80,
      "repetition": 12,
      "sentenceVariety": 68,
      "vocabularyComplexity": 55,
      "formality": 61
    }
  }
}
```

Error:
```json
{
  "error": {
    "code": "TEXT_TOO_LONG",
    "message": "Your text is longer than the supported limit."
  }
}
```

Never expose stack traces, API keys, database credentials, provider secrets, or internal SQL errors.

## 18. Frontend Error States
Every asynchronous action has:
- idle
- loading
- success
- recoverable error
- terminal/permission error

Explain what happened, whether input was preserved, and what the user can do next.

## 19. Definition of Done
A Snyzer frontend feature is complete only when:
- Light/Dark/System work.
- Keyboard navigation works.
- Loading/error states exist.
- Mobile layout works.
- API errors map to useful messages.
- No secrets reach the browser.
- User text is safely rendered.
- Settings persist.
- Duplicate submissions are handled.
- Reduced-motion behavior works.
