# Interface changelog

Interface releases are independent from CoSN's source workbook version. Source: CoSN K-12CVAT Lite 4.1, whose original ChangeLog records March 1, 2024. Only observed interface history is recorded here.

## Version 12 — October 23, 2026 · Text capacity and verified Excel exchange

- Raise validated free-text capacity from 20,000 to 32,767 UTF-16 code units, matching the Excel-exchange bound. Oversized values are rejected without truncation.
- Share limits across fields, import validation and dictation messaging; reject oversized pastes before insertion.
- Allow 256 MiB expanded XLSX packages so valid complete maximum-length drafts can round-trip; retain 64 MiB input limits.
- Verify 20,001/32,767 exact preservation and 32,768 rejection; test native Excel edit/save/reopen and actual app import/download at both accepted boundaries.
- Refresh public setup, attribution, licensing, privacy, calculation-mode and verification documentation.

Scoring formulas, original questions and visual design are unchanged. Independent verification completed October 23: all 20/20 baseline capability groups pass, 100/100 under the fixed equally weighted rubric. Fresh Excel 16.114 recalculation, pivot refresh, save/reopen and app reimport passed across seven workbooks. This is bounded CVAT capability parity, not universal compatibility or vendor approval. Native Excel re-encodes the shared CoSN logo while retaining its picture objects and readable content; byte-for-byte native identity is not claimed.

## Version 11 — October 22, 2026

- Add a compact phone/portrait-tablet Menu drawer with all assessment destinations and workbook sections.
- Add current-location indication, keyboard/focus behavior and touch-sized navigation; retain desktop navigation.

## Version 10 — prepared October 21, 2026 (Central)

- Add the district analyst workflow, 59 answer-dependent guidance formulas, manual narrative review, category/overall calculations and six-framework historical crosswalk.
- Add separate source-compatible and independently corrected modes with source-defect disclosures and reasoned applicability.
- Add editable XLSX exchange, complete print record, large-backup/date handling and conflict detection for linked views.
- Preserve all original tabs, source attribution and license; add explicitly labeled review/context/state sheets.

Earlier internal tests reported complete baseline checklist coverage; a later independent review identified the text-capacity gap addressed above. That earlier checklist is not an independent guarantee of full parity.

## Version 9 — October 21, 2026

- Existing teacher intake, IT request, 76 original fields, evidence notes, optional device-only drafts, backups and supported browser dictation.
- Correct cross-route header contrast, text sizing and enlarged-text readability.
