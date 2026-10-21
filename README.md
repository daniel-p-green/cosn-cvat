# CoSN CVAT

An independent, educator-friendly preparation workspace for **CoSN K-12CVAT Lite 4.1**.
Teachers start with three short classroom prompts and an optional question, then download a useful handoff to district IT. The full vendor/IT questionnaire remains a separate workspace for recording vendor responses and evidence. It does not approve products or assess
legal compliance. Vendor answers and institutional security review remain essential.

## Run locally

No installation, API key, paid service, database, framework or account is required.
Use Python 3:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. Serve over HTTP rather than opening index.html directly,
because the interface fetches its question data. Any ordinary static web host can serve
the contents of `dist/`. The personal Sites identity in `.openai/hosting.json` is only
for the original private deployment; omit that file when deploying elsewhere or
creating a new Sites project. Do not reuse another owner's project ID.

## Portable component kit

`dist/tokens.css` defines one semantic token set (background, foreground, primary,
secondary, border, input, ring, destructive, radius and spacing). `dist/kit.js` owns
reusable Button variants, labelled text areas, checkboxes and summary statistics.
Shared styles provide the remaining native field, navigation, disclosure, table and
confirmation-dialog recipes. Responsive layouts share these same primitives.

The kit uses shadcn-style semantic naming, but is deliberately buildless native HTML,
CSS and JavaScript, not the React shadcn package. This avoids an installation/build
requirement for an educator handoff; these tokens and variants can be ported to shadcn
without changing the data model. Styling uses a restrained warm-paper, blue and sage palette,
not a claimed official MSBA identity. All browser controls retain native semantics.

## Source and data

- `source/CoSN-K-12CVAT-Lite-V4.1-2.xlsx`: original, unchanged source.
- `scripts/extract-source.py`: reproducible standard-library OOXML extractor.
- `dist/questions.json`: all 76 official fields, original wording/IDs, source guidance,
  analyst references and crosswalk. 63 assessment prompts, 12 general fields, 1 date.
- `dist/explanations.js`: separately authored plain-language explanations.
- `dist/model.js`: draft validation, progress counts and CSV export.
- `dist/app.js`: guided navigation, review, local draft lifecycle and source comparison.

Run `python3 scripts/extract-source.py` to regenerate canonical question data.
The source SHA-256 is
`1aad4422dc8ba231f4c8ba499311be8a7b8f55ed37081053dd54a535caa94f7d`.
Source retrieved October 21, 2026. Workbook change log gives March 1, 2024 for v4.1.

## Privacy and limits

Responses are only in browser memory until the user opts into localStorage saving.
No response requests, uploads, analytics, cookies or third-party fonts are added by
this application. No microphone permission is requested and no audio is recorded. Native device dictation may use the device vendor’s own services and privacy settings. Host sign-in/infrastructure is separate from application behavior.
Do not enter student personal data, passwords, secrets or confidential security reports.
Use document references and store the documents in an approved district system.

JSON export/import moves a draft between browsers. Import replaces the current draft
only after confirmation. CSV exports every source field and notes, with spreadsheet
formula-injection escaping. CSV is not an Excel round-trip. There is no cloud sync,
collaborative editing, automated vendor validation or risk/compliance score.
The print view is a preparation summary. Public source code contains no user drafts.

The expandable **Our version vs. the original** section documents omitted COMP-09,
the short Lite named range, COMP-05 scoring ambiguity, broken skip-format references,
the absent Summary Report and GNRL header mismatch. All questions stay visible.
These are source observations; the original workbook and CoSN's intent are not changed.

## Attribution and sharing

See `LICENSE.md`. The source and this adaptation are **CC BY-NC-SA 4.0**, not MIT.
Credit CoSN and EDUCAUSE, identify changes, preserve the license and noncommercial /
share-alike conditions. This is an independent adaptation, with no claimed affiliation
or endorsement from CoSN, EDUCAUSE or MSBA. Do not contact any recipient automatically.

## Verification

Syntax checks: `npm run check` (Node.js required only for this optional check).
Canonical IDs and wording were compared to the original workbook's OOXML, including
whitespace and source typos. Browser QA covers desktop, iPad portrait/landscape and
phone sizes, original rendered prompts, response/unknown distinction, search/filters,
evidence notes, counts, JSON/CSV, import validation, local save/reload/erase, keyboard
controls, responsive overflow and screenshot review. See the delivered QA summary for
actual completed checks and limitations. Browser tests use isolated synthetic data.

## Teacher intake and native dictation

`dist/intake.js` owns the short teacher intake and readable handoff. Its `draft.intake`
object is validated and exported separately from `draft.records`. Classroom notes never
populate vendor security answers. Old v1 JSON drafts still import with an empty intake.
TXT exports include context, explicit unknowns, related workbook IDs and next steps;
CSV preserves all 76 original fields and contains only separately recorded vendor/IT
responses. JSON keeps both sets of information.

`dist/writing.js` binds labelled native textareas. It preserves their DOM identity,
selection and focus while editing; no input handler rerenders the form. Saving is
briefly debounced during normal input and deferred during composition; composition end,
blur and navigation flush the current text. Local saving remains opt-in. Next-writing-
field buttons move focus only after user action and are disabled during composition.
An optional closed field opens when explicitly navigated to. Long text remains editable
and is limited to20,000 characters per field, consistently with import validation.

Use your iPad/phone keyboard’s dictation button rather than a site microphone. Instructions
link to Apple’s guide and explain device-service privacy. Tests simulate composition,
paste and long dictation-sized text using synthetic content. They verify stable focus
and caret, storage/reload, separate context export, unknowns, vendor review and responsive
overflow. Actual iPad speech recognition accuracy and OS keyboard behavior require a
physical device and were not claimed tested on this Mac.
