# Teacher workflow redesign — verification

October 21, 2026. Synthetic data only. No real microphone was activated or permitted.

| Requested improvement | Implemented and verified |
| --- | --- |
| 1. Copy request for IT | Editable subject/body, classroom purpose, expected data, unresolved questions and district review request. Clipboard success and denied/manual-copy fallback tested. No sending. |
| 2. Selectable information | Logins, schoolwork, photos, audio, other, no student information planned; independent not-sure choice and optional narrative. Mutually exclusive “none” tested. |
| 3. Worked example | Clearly fictional WordTrail classroom note and miniature request in an expandable intake example and onboarding. No real student data. |
| 4. Partial uncertainty | Known choices/narrative preserve explicit uncertainty through autosave, reload and backup; teacher expectations and vendor confirmation remain distinct. |
| 5. Meaningful status | Added, Needs a detail, Not sure yet; partial-request preflight never gates copying or implies approval. |
| 6. Direct editing | All five summary sections open and focus their exact source field, expand optional fields, and return directly to request. Edited request preserved; changed-context notice and confirmed refresh tested. |
| 7. Continue draft | Tool, actual saved time, device-only text, next incomplete step. Existing schema/key retained. Save a backup/Open a backup; JSON round-trip and UI import confirmed. |
| 8. Compact name/website | One-row labelled textareas, expandable name, optional website, dictation controls. Compact text grows for longer values without replacing field. |
| 9. Readable responsive controls | Phone helper/privacy/save text increased; five viewport paths, doubled text and reduced viewport heights pass without horizontal overflow. Next and Use transcript tested at doubled text/reduced height. |
| 10. Coherent hierarchy | Shared native component kit, warm neutral canvas, blue actions, predictable step navigation and paper-like request editor. Source/backups secondary. Actual screenshots inspected, independent read-only review completed and findings fixed. |

## Additional orientation requirement

Three short first-run dialog screens explain purpose, roles, workflow, dictation and a fictional example. Skip, Escape, next/back, focus within the dialog, initial close focus to tool, reopen focus restoration and session-only dismissal tested. Existing opted-in drafts bypass onboarding even in a fresh session. No in-app login or server records added.

## Verification executed

- `npm run check`: exact OOXML parity for all 76 original IDs/prompts, 63 assessment questions, 60 Yes/No controls, 16 sections; original wording unchanged.
- Model tests: old draft migration, valid/invalid backups, CSV formula escaping, unknown states, independent intake, concise request generation and 100,000-character total intake backup round-trip.
- Speech tests: requesting/listening/interim/final/stop/review/cancel/late events/permission errors; explicit append/replace preserves edits and does not commit interim text.
- Browser regression: desktop 1440×1000, iPad portrait 768×1024, iPad landscape 1024×768, phone 390×844, small phone 320×740. Composition/caret stable across autosave, exact rendered 76-question parity, vendor unknown, JSON/CSV, reload, direct edits, clipboard, draft continuation, screenshots and overflow.
- Edge cases: denied clipboard fallback; refresh cancel/confirm; UI backup opening; complete print representation; unsupported speech fallback; returning saved draft in fresh session.
- Independent review caught and prompted fixes for bounded request context, first-run focus, full print text, mobile step density and deliberate tablet header layout.

## Limitations

Viewport simulation is not an actual iPad keyboard test. Native iPad dictation and real browser microphone capture remain untested on the user's device. Browser support, mic permission and provider behavior vary. The app truthfully discloses possible remote speech processing. No score, certification or approval is produced. Clipboard may require manual copy. Local storage is optional and device/browser-specific. Deployment access is separate from application draft storage.
