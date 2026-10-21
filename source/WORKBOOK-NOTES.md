# Source inspection

File: CoSN-K-12CVAT-Lite-V4.1-2.xlsx, retrieved from the user-specified CoSN URL
on October 21, 2026. Version 4.1; change log release date March 1, 2024.
Original file SHA-256: 1aad4422dc8ba231f4c8ba499311be8a7b8f55ed37081053dd54a535caa94f7d.

All 12 sheets were inspected: What is the CoSN K-12CVAT; Introduction; Instructions;
CoSN K-12CVAT; Standards Crosswalk; Analyst Report; Analyst Reference; Crosswalk Detail
(hidden); High Risk Non-Compliant (hidden); Questions (hidden); Values (hidden); ChangeLog.
Inspection included OOXML cell text, drawing text, cell comments, validations, defined
names, cached formula results, formulas, conditional formatting and sheet visibility.
No hidden rows or columns were identified in the inspected worksheets. Introduction
text and the license are in drawing objects, not ordinary worksheet cells.

There are 76 canonical IDs: DATE-01; GNRL-01–12; 63 assessment questions across 15
assessment sections. 60 assessment controls validate against YesNo (Values!A4:A5).
N/A appears elsewhere in Values but is not in that validation range. COMP-01,
COMP-02 and COMP-09 use narrative responses. Vendor fields and IT-only fields are
identified in source Instructions and in the main assessment.

Verified inconsistencies:

1. Questions!B2:B63 has 62 assessment IDs, omitting COMP-09 from CoSN K-12CVAT!A38.
2. The Lite defined name is Questions!B2:R62; HLVU-03 is on row 63.
3. Questions!H12 gives COMP-05 a favorable Yes despite that question asking about
   security events. The vendor explanation and institution's judgment are essential.
4. All 13 conditional-formatting blocks in the assessment use broken #REF! operands.
5. Instructions!A24 and Analyst Report!A4 mention a Summary Report absent from the file.
6. CoSN K-12CVAT!A6 says GNRL-01–15; the actual IDs end at12. A17 explicitly reserves
   GNRL-11 and GNRL-12 for institution IT/security, consistent with Instructions!A7.

The scoring support mixes formulas and fixed cached values. It uses favorable-answer
matching, weights, category summaries, high-risk flags, standards crosswalk lookups
and manual analyst conversion of narrative responses. The application intentionally
provides no score, certification, purchase approval or compliance judgment. Every
question remains visible because intended skip logic cannot be recovered reliably.
The original workbook file is unchanged.

The workbook's introduction credits CoSN's adaptation of EDUCAUSE HECVAT-Lite with
permission, the Higher Education Information Security Council Shared Assessments
Working Group, EDUCAUSE2019 and CC BY-NC-SA4.0. See LICENSE.md and drawing-text.json.
No source placeholder contact values are treated as completed answers in the site.
