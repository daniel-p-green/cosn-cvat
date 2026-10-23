import { Icon } from "./kit.js";
export const usageGuideURL =
  "https://www.cosn.org/wp-content/uploads/2024/03/Using-the-K-12CVAT.pdf";
export const workbookURL =
  "https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx";
export function SourcesAndAdaptations() {
  return `<details class="sources-adaptations"><summary>${Icon("book")} Sources and adaptations</summary><div><p><strong>Original questions:</strong> <a href="${workbookURL}">CoSN K-12CVAT Lite 4.1 workbook</a>. All 76 fields retain their IDs and wording.</p><p><strong>CoSN guidance:</strong> <a href="${usageGuideURL}">Using the K-12CVAT</a> (pp. 1–3) describes vendor completion and district analyst review. Narrative company questions 01, 02 and 09 require manual review outside the aggregate score.</p><p><strong>Our simplifications:</strong> the teacher intake, plain-language explanations, dictation and editable handoff are independent additions. They do not answer vendor safeguards questions or imply approval.</p><p>Workbook: CoSN / EDUCAUSE, CC BY-NC-SA 4.0. Usage guide: CoSN, marked CC BY-NC. <a href="#about">Attribution, workbook discrepancies and adaptation details</a>.</p></div></details>`;
}
