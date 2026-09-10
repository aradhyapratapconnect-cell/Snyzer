# Snyzer — Product Requirements Document (PRD)

## 1. Product Summary
Snyzer is a web-based AI-assisted writing editor. Users sign in, write or paste text, choose improvement preferences, and receive a clearer, more natural revision while preserving meaning and intent.

Snyzer is a writing-quality product, not an AI-detector bypass tool.

## 2. Target Users
Snyzer is designed for everyone: students, professionals, creators, job seekers, business users, and everyday writers.

## 3. Problem
Writers often know what they want to say but struggle with clarity, flow, repetition, vocabulary, sentence variety, or tone. Snyzer provides a focused workspace for improving these qualities.

## 4. Goals
- Produce useful revisions quickly.
- Preserve meaning and user intent.
- Give users control over tone and style.
- Make changes transparent through comparison.
- Provide practical writing-quality analysis.
- Protect user text and account data.

## 5. Features

### Must Have — MVP
- Mandatory account creation/login.
- Secure session management.
- Plain-text editor.
- Rich-text editor.
- Original → improved comparison.
- User-selectable layouts: Side-by-side or Input first → Result second.
- Tone/style controls.
- Naturalness/readability controls.
- Improve/rewrite action.
- Analysis for readability, clarity, repetition, sentence variety, vocabulary complexity, and formality.
- Copy result.
- Loading, success, and error states.
- Writing history.
- Delete history items.
- Settings.
- Light, dark, and system themes.
- Responsive UI.
- Server-enforced limits and usage controls.
- Privacy-conscious retention and deletion.

### Nice to Have — Post-MVP
- Streaming output.
- Saved custom presets.
- Multiple versions per document.
- DOCX/PDF/Markdown export.
- Sharing.
- Team workspaces.
- Browser extension.
- Advanced style profiles.
- Local-model support.
- Additional AI providers.
- Collaboration.

## 6. User Flow
1. Open Snyzer.
2. Register or log in.
3. Enter the workspace.
4. Write or paste text.
5. Choose mode, tone, and preferences.
6. Start improvement.
7. Snyzer validates authentication, input, and usage.
8. Backend sends the request to the AI provider.
9. Backend validates and stores the result.
10. Snyzer displays the improved text and analysis.
11. User edits, compares, copies, or reruns.
12. The job appears in history.
13. User can manage settings and data.

## 7. MVP Definition
The MVP is complete when a signed-in user can enter text, select preferences, generate a revision, inspect and compare it, copy it, access/delete history, change settings, and recover gracefully from failures.

## 8. Success Metrics
- Registration → first successful job.
- Time to first result.
- Successful-job rate.
- Copy/use rate.
- Rerun/edit rate.
- User-rated helpfulness.
- Median and p95 processing latency.
- API and AI-provider success rates.
- Weekly returning users.
- History usage.
- Unauthorized-access/security incidents.
- Successful deletion requests.

Do not treat AI-detector scores as a product truth metric.

## 9. V1 Non-Goals
Snyzer will not build:
- AI-detector bypass functionality.
- Guarantees that text will be classified as human-written.
- A plagiarism checker.
- A full word processor.
- A social network.
- Team collaboration.
- Browser extensions.
- Native desktop/mobile apps.
- Foundation-model training.
- A prompt marketplace.
- Unlimited free AI inference.
- Complex queues unless traffic requires them.
- Dozens of AI providers at launch.

## 10. Principles
Meaning first. User control first. Transparent changes. Privacy by default. Fast, calm UX. Useful metrics over vanity scores.
