# Source inspection

File: CoSN-K-12CVAT-Lite-V4.1-2.xlsx, retrieved from the user-specified CoSN URL
on October 21, 2026. Version 4.1; change log release date March 1, 2024.
Original file SHA-256: 1aad4422dc8ba231f4c8ba499311be8a7b8f55ed37081053dd54a535caa94f7d.

All 12 sheets were inspected: What is the CoSN K-12CVAT; Introduction; Instructions;
CoSN K-12CVAT; Standards Crosswalk; Analyst Report; Analyst Reference; Crosswalk Detail
(hidden); High Risk Non-Compliant (hidden); Questions (hidden); Values (hidden); ChangeLog.
Inspection included OOXML cell text, drawing text, cell comments, validations, defined
names, cached formula results, formulas, conditional formatting and sheet visibility.
No hidden rows were identified. Standards Crosswalk column E is hidden in the source; its ISO 27002:2013 mapping remains included in this interface and crosswalk exports. Introduction
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
and manual analyst conversion of narrative responses. The district review reproduces source-compatible calculations and separates documented independent corrections; neither produces certification, purchase approval or an official compliance judgment. Every
question remains visible because intended skip logic cannot be recovered reliably.
The original source file is unchanged. Editable exports start from it and clearly label added review/state sheets and calculation mode.

Additional source defects verified during the frozen v9 audit: Questions!I14/I15 lack the COMP-07/08 answer lookups, so their weights cannot earn automatic credit in source-compatible mode. The High Risk pivot excludes final HLVU-03 even though category SUMIFS includes it; Analyst Report high-risk formulas also reference rows beyond its populated source pivot. Independent corrections repair missing lookups and complete the attention list without silently changing COMP-05. Instructions also place framework selection at B7, while the actual Analyst Report field is B10. There are 1,475 formula elements, including shared-formula followers, and 1,223 nonempty formula strings.

All 59 conditional guidance formulas are now evaluated, alongside three static narrative guidance cells. The two-argument HLAP-03 No branch returns Boolean FALSE in the original; it is shown explicitly, with no invented written guidance. Source arithmetic was independently evaluated and tested; desktop Excel recalculation is separately recorded in QA evidence.

The workbook's introduction credits CoSN's adaptation of EDUCAUSE HECVAT-Lite with
permission, the Higher Education Information Security Council Shared Assessments
Working Group, EDUCAUSE2019 and CC BY-NC-SA4.0. See LICENSE.md and drawing-text.json.
No source placeholder contact values are treated as completed answers in the site.

## Official usage guidance (reviewed October 21, 2026)

CoSN’s four-page “Using the K-12CVAT” guide is linked at
https://www.cosn.org/wp-content/uploads/2024/03/Using-the-K-12CVAT.pdf .
It recommends vendor completion before purchase/renewal and careful district analyst
review. Page 3 explicitly says company questions 01, 02 and 09 are outside aggregate
scoring and require manual analyst review. Thus COMP-09’s absence from the hidden
scoring table is a conversion-completeness risk, not evidence that narrative exclusion
from aggregate scoring is an error. All three narrative prompts stay available.
The guide is marked CC BY-NC; it is linked and briefly paraphrased, not republished.
