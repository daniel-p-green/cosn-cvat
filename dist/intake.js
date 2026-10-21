import { TextAreaField, escapeHTML as esc } from "./kit.js";
import { DictationHelp } from "./writing.js";
export const intakeFields = [
  {
    key: "tool",
    label: "Which tool are you thinking about?",
    hint: "The product name or a website is enough to start.",
    placeholder: "For example, a reading practice app…",
    related: ["GNRL-02"],
  },
  {
    key: "use",
    label: "What would you like to do with it?",
    hint: "Describe the classroom activity and who would use it. A few sentences are plenty.",
    placeholder: "I’d like my class to…",
    related: ["GNRL-03"],
  },
  {
    key: "data",
    label: "What might students or staff put into it?",
    hint: "Think about logins, schoolwork, photos or audio. Describe types of information, never actual student details.",
    placeholder: "For example, school sign-ins and written assignments…",
    related: ["GNRL-03", "GNRL-04"],
  },
  {
    key: "help",
    label: "Anything you want help checking?",
    hint: "Optional. A worry, a question or something you’re unsure about.",
    placeholder: "I’d like to know whether…",
    related: [],
  },
];
export const handoffPrompts = [
  "GNRL-04",
  "DOCU-06",
  "HLAA-02",
  "HLDA-02",
  "HLDA-03",
  "HLDC-01",
];
export function IntakeView(draft, persist, storageAvailable) {
  const t = draft.intake;
  return `<div class="teacher-heading"><h1>Bring a classroom idea.<br>We’ll help you hand it over.</h1><p>Tell your IT team what you want to use and why. Share what you know, leave the rest to the vendor and specialists.</p></div><div class="teacher-layout"><section class="intake-sheet" aria-label="Classroom intake"><div class="intake-intro"><h2>A few details from you</h2><p>Our classroom workflow · separate from the original CoSN questions.</p></div>${DictationHelp()}<div class="intake-storage"><label class="check"><input id="persist" type="checkbox" ${persist ? "checked" : ""} ${!storageAvailable ? "disabled" : ""}>Save this draft on my device</label><span id="writing-status" role="status" aria-live="polite">${persist ? "Saved on this device" : "Otherwise, export before closing"}</span></div>${intakeFields.map((f, i) => ` ${f.key === "help" ? `<details class="optional-question" ${t.help ? "open" : ""}><summary>Add a question or concern (optional)</summary>` : ""}<section class="intake-prompt prompt-${f.key}"><span class="prompt-number" aria-hidden="true">${i + 1}</span><div><p id="hint-${f.key}" class="prompt-hint">${esc(f.hint)}</p>${TextAreaField({ id: "intake-" + f.key, label: f.label, value: t[f.key], placeholder: f.placeholder })}${f.key === "data" ? `<label class="check unknown-check"><input id="data-unknown" type="checkbox" ${t.dataUnknown ? "checked" : ""}>I’m not sure yet — ask the vendor / IT</label>` : ""}</div></section>${f.key === "help" ? "</details>" : ""}`).join("")}<div class="intake-finish"><p>No need to complete the security questionnaire yourself.</p><a class="button primary" href="#handoff">Prepare my handoff</a></div></section><aside class="teacher-companion"><h2>You bring the classroom context.</h2><p>The vendor explains its safeguards. Your district decides what is appropriate.</p><div class="companion-example"><h3>Useful is enough.</h3><p>“I want students to practise reading and submit short recordings. I’m not sure where those recordings go.”</p><span>Example only — don’t enter real student information.</span></div><div class="companion-privacy"><h3>Keep your notes with you</h3><p>Use a private device if you save a draft. Otherwise, download it before closing this tab.</p><p>Your notes stay in your browser. Do not enter student personal data.</p></div><a href="#questions">Open the full vendor & IT questionnaire</a></aside></div>`;
}
export function handoffText(draft, questions) {
  const t = draft.intake;
  const text = [
    "CLASSROOM TOOL HANDOFF",
    "Teacher context — independent adaptation; not vendor security answers.",
    "",
    ...intakeFields.flatMap((f) => [
      f.label,
      t[f.key]?.trim() || "Not yet known / not provided",
      f.key === "data" && t.dataUnknown
        ? "Data context is not confirmed; ask the vendor / district IT."
        : "",
      f.related.length
        ? "Related workbook fields (context only): " + f.related.join(", ")
        : "",
      "",
    ]),
    "NEXT STEPS",
    "Vendor: confirm product/privacy details and provide the original CoSN safeguards responses and evidence.",
    "District IT / privacy team: review the classroom use, data involved, applicable requirements and vendor evidence.",
    "Educator: clarify classroom needs and wait for your district’s decision before sharing student data.",
    "",
    "STARTING QUESTIONS FOR VENDOR / IT",
    ...handoffPrompts.map((id) => {
      const q = questions.find((q) => q.id === id);
      return id + ": " + q.text;
    }),
    "",
    "The full original questionnaire remains uncompleted unless vendor / IT responses were recorded separately. No security, compliance or purchase approval is implied.",
    "Source: CoSN K-12CVAT Lite 4.1; CoSN / EDUCAUSE; CC BY-NC-SA 4.0.",
    "https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx",
  ];
  return text.join("\n");
}
export function HandoffView(draft, questions) {
  const t = draft.intake;
  return `<div class="teacher-heading handoff-heading"><h1>Your idea, ready for the next conversation.</h1><p>Here’s a handoff you can send through your district’s usual process. You don’t need to answer the technical questions to use it.</p></div><div class="teacher-layout"><section class="handoff-paper"><div class="handoff-paper-top"><span>Classroom context</span><a href="#start">Edit your notes</a></div><h2>${esc(t.tool.trim() || "A tool to discuss with IT")}</h2>${intakeFields
    .filter((f) => f.key !== "tool" && (f.key !== "help" || t.help.trim()))
    .map(
      (f) =>
        `<div class="handoff-detail"><h3>${esc(f.label)}</h3><p>${esc(t[f.key]?.trim() || "Not yet known / not provided")}</p>${f.key === "data" && t.dataUnknown ? '<p class="unknown-note">Data context needs vendor / IT confirmation.</p>' : ""}</div>`,
    )
    .join(
      "",
    )}<p class="context-note">These are your classroom notes, not vendor answers or a security assessment. They have not filled in any original CoSN responses.</p><details class="handoff-mapping"><summary>How this connects to the workbook</summary><p>Tool name relates to GNRL-02; intended use and data context help the vendor explain GNRL-03 and GNRL-04. This is context for discussion, not an automatic answer mapping.</p></details></section><aside class="teacher-companion handoff-files"><h2>Take the handoff with you</h2><p>Download a readable note for your IT team. Nothing is sent automatically.</p><button id="export-handoff" class="primary">Download handoff · TXT</button><button id="teacher-json">Export draft · JSON</button><button id="teacher-print">Print handoff</button><label class="file-label" for="import">Reopen a JSON draft</label><input id="import" type="file" accept=".json,application/json"><p id="import-error" class="import-error" role="alert"></p><label class="check"><input id="persist" type="checkbox">Save on this device</label><p class="help-line">JSON keeps both classroom notes and any vendor responses. Import replaces the open draft after confirmation.</p></aside></div><section class="handoff-next"><h2>What happens next</h2><div class="next-steps"><div><span>Vendor</span><h3>Explain the product and safeguards</h3><p>Confirm the privacy notice, how the product handles data, and the evidence behind its answers.</p></div><div><span>District IT / privacy team</span><h3>Review it for your school</h3><p>Check the proposed use, sign-in, data requirements and vendor evidence before a decision.</p></div><div><span>You</span><h3>Help with the classroom details</h3><p>Clarify the activity and what students need. Your district’s process determines whether and how to use the tool.</p></div></div></section><details class="teacher-source-questions"><summary>A few original questions to start the conversation</summary><p>These are prompts for the vendor or IT team, not extra homework for you.</p><ul>${handoffPrompts
    .map((id) => {
      const q = questions.find((q) => q.id === id);
      return `<li><a href="#question/${id}"><strong>${id}</strong> ${esc(q.text)}</a></li>`;
    })
    .join(
      "",
    )}</ul><a href="#questions">Full questionnaire · 63 assessment questions + 13 general/date fields</a></details><p class="handoff-bottom">No approval or compliance result is produced. <a href="#review">Review any recorded vendor responses & export all original fields</a> · <a href="#about">Source & adaptation notes</a></p>`;
}
