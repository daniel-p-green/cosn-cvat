# Independent verification — October 23, 2026

The corrected release candidate passed **20/20 capability groups, 100/100 on this fixed project audit rubric**. Each group earns five points. This is not CoSN's vendor scoring system, a certification, a usability score or a guarantee of universal Excel compatibility. Enhancements cannot compensate for baseline gaps or increase this result above 100.

The immutable v11 baseline was `b47eb219d8de1e20d2b0de44953d0cca1a734fb2`. It had 17 passing groups, the 20,000-character defect, and two pending native groups (85/100 demonstrated). The corrected candidate independently passed capacity tests and then fresh native checks, closing all three remaining groups. Historical v11 results are not retroactively called passes.

The tested app manifest SHA-256 is `9a18d087f844a1e6aa014e2019a8c1dfc31fd72046a521884b4922c0166601d9`. `AUDITED-APP-MANIFEST.json` retains its 29 per-file hashes. Final release changes to `dist/app.js` are limited to the About version label; `dist/changelog.js` contains reviewed release documentation. All other deployed assets must match the audited manifest exactly. The final Git commit identifies the release documentation as well as its tested code.

| Baseline group — five points each | Result |
| --- | --- |
| 1. Source purpose, roles, instructions and attribution | Pass |
| 2. All 76 field IDs, exact wording and source rows | Pass |
| 3. Original inputs/additional slots and responsibilities | Pass |
| 4. Yes/No constraints, invalid input rejection and blanks | Pass |
| 5. Original narrative capacity through 32,767 | Pass |
| 6. Original conditional/static/blank guidance | Pass |
| 7. Analyst reasons and follow-up text | Pass |
| 8. Weights, favorable values, lookups and explicit source defects | Pass |
| 9. All 15 category maxima, scores and fractions | Pass |
| 10. Category-mean overall result and A–F bands | Pass |
| 11. Three manual company judgments and adjusted total | Pass |
| 12. Six crosswalks and complete control dictionary | Pass |
| 13. Blank/unknown/reasoned N/A and separate calculation modes | Pass |
| 14. Narratives, additional information, evidence and rationale | Pass |
| 15. Original-format import and atomic invalid-import rejection | Pass |
| 16. JSON and both-mode XLSX browser round trips | Pass |
| 17. Original tabs, formulas, text, picture objects, validation and ChangeLog | Pass; native media representation caveat below |
| 18. Complete printable assessment and sampled presentation | Pass |
| 19. Fresh native recalculation/pivot refresh versus independent expectations | Pass |
| 20. Fresh native save/close/reopen and actual app re-import | Pass |

There are no native chart parts in the supplied source. The Summary Report tab mentioned in instructions is absent from the source, so neither is counted as a missing app feature.

## Native Excel evidence

Microsoft Excel 16.114 completed seven disposable cases with scoped recalculation, pivot refresh, save, close, native UI reopen and actual candidate file-picker import/JSON download. Each file's 76 answer cells were independently checked. Complete records/review/intake/request state was compared for the three candidate exports.

| Synthetic case | Native/app overall | Band | Adjusted company |
| --- | ---: | --- | ---: |
| Quantitative choices blank, synthetic general/narrative context retained | 0% | F | 0 |
| All Yes | 84.9312169312% | B | 50 |
| All No | 13.0687830688% | F | 20 |
| All source-favorable | 98% | A | 85.5 |
| 20,001-character candidate export | 98% | A | 85.5 |
| 32,767-character export, then native narrative and DOCU-04 edits | 96.3333333333% | A | 85.5 |
| Corrected mode with reasoned exclusion and interpretation | 98.6666666667% | A | 95.5 |

The native DOCU-04 edit changed its answer from Yes to No, Documentation to 75/100 and the refreshed attention list to include DOCU-04. A one-character native narrative edit retained the full 32,767 length and sentinel. All changes survived save/reopen and app import. Corrected-mode results were tested separately from source-compatible results.

## Preservation and representation

The supplied workbook's 12 original tabs, visibility, source text, picture objects, guidance and original source formulas were retained outside explicit corrected-mode/input areas. Source-mode native files retained 1,475 original formulas. The crosswalk dictionary's 662 entries, including 54 formula-built descriptions, matched. Pre-native application exports retain all eight source media payloads byte-for-byte and the source ChangeLog XML byte-for-byte.

**Native media variance:** Excel re-encodes the shared CoSN logo into two raster variants when saving, leaving seven of eight original image payloads byte-identical. Original picture objects and readable logo content remain. This also occurs with original-format control copies, so it is a native serialization difference, not a missing app object. Functional retention passed; strict media-byte identity did not. No claim of a bitwise native workbook round-trip is made.

Other independent checks passed 165 calculation scenarios, 228 guidance branches, 794 metadata comparisons, 910 capacity cases across 182 text fields, original-format/browser exchange and a 25-page nonblank print record. Print pages 1/13/25 were visually reviewed. Oversized paste protection used mocks; actual microphone or OS clipboard capture was not tested.

The original workbook SHA-256 is `1aad4422dc8ba231f4c8ba499311be8a7b8f55ed37081053dd54a535caa94f7d`. The retained source and deployed v11 template matched. Direct source-origin retrieval was blocked during the audit; no fresh origin retrieval is claimed.

Native print dialogs, real Safari/iPad/phone hardware, actual microphone capture, screen-reader sessions and arbitrary workbook restructuring/version combinations remain outside this completed baseline verification. Source-compatible and independently corrected calculations are disclosed separately; neither approves a vendor. Synthetic workbooks, private audit paths and user data are excluded from this public repository.
