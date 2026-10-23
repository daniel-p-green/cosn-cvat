import { usageGuideURL, SourcesAndAdaptations } from "./sources.js";
import { TextAreaField, Icon, escapeHTML as esc } from "./kit.js";
export const intakeFields = [
  {
    key: "tool",
    label: "Which tool would you like to use?",
    hint: "A product name is enough. You can add a website below.",
    placeholder: "Tool or app name",
    related: ["GNRL-02"],
  },
  {
    key: "use",
    label: "What’s your classroom idea?",
    hint: "The activity and who would use it. One or two sentences are plenty.",
    placeholder: "I’d like my class to…",
    related: ["GNRL-03"],
  },
  {
    key: "data",
    label: "What information do you expect it to use?",
    hint: "Choose what you expect. The vendor still needs to confirm how its product handles information.",
    placeholder:
      "Any extra context? Types of information only, never student details.",
    related: ["GNRL-03", "GNRL-04"],
  },
  {
    key: "help",
    label: "What would you like IT to check?",
    hint: "Optional. A question or concern is enough.",
    placeholder: "I’d like to know whether…",
    related: [],
  },
];
export const dataOptions = [
  { id: "logins", label: "School logins" },
  { id: "schoolwork", label: "Schoolwork" },
  { id: "photos", label: "Photos" },
  { id: "audio", label: "Audio" },
  { id: "other", label: "Other information" },
  { id: "none", label: "No student information planned" },
];
export const handoffPrompts = [
  "GNRL-04",
  "DOCU-06",
  "HLAA-02",
  "HLDA-02",
  "HLDA-03",
  "HLDC-01",
];
export function stepStatuses(t) {
  return [
    t.tool.trim() || t.website.trim() ? "Added" : "Needs a detail",
    t.use.trim() ? "Added" : "Needs a detail",
    t.dataUnknown
      ? "Not sure yet"
      : t.expectedData.length || t.data.trim()
        ? "Added"
        : "Needs a detail",
  ];
}
export function nextStep(t) {
  const s = stepStatuses(t);
  const missing = s.indexOf("Needs a detail");
  return missing >= 0 ? missing : s.indexOf("Not sure yet") >= 0 ? 2 : 0;
}
export function expectedDataText(t) {
  const selected = dataOptions
    .filter((o) => t.expectedData.includes(o.id))
    .map((o) => o.label);
  return (
    [...selected, t.data.trim()].filter(Boolean).join("; ") || "Not sure yet"
  );
}
export function requestContext(t) {
  // Compact deterministic change marker, not a security hash or personal-data store.
  const text = JSON.stringify(t);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `v1:${text.length}:${(h >>> 0).toString(16)}`;
}
export function generateRequest(t) {
  const brief = (v, max = 350) =>
    v.length > max
      ? v.slice(0, max).trimEnd() + "… [more in classroom notes]"
      : v;
  const name = brief(
    t.tool.trim() || t.website.trim() || "a classroom tool",
    100,
  );
  return {
    subject: `Classroom tool review: ${name}`,
    body: [
      `Hello IT team,`,
      `I’d like to discuss ${name}${t.website.trim() && t.tool.trim() ? ` (${brief(t.website.trim(), 180)})` : ""} for classroom use.`,
      `Classroom idea: ${brief(t.use.trim()) || "I still need to add the classroom activity."}`,
      `I expect it may involve: ${brief(expectedDataText(t))}. These are my expectations, not vendor-confirmed data practices.`,
      t.dataUnknown
        ? "I’m still unsure about some of the information involved. Please ask the vendor to confirm what is collected, why, and how it is handled."
        : "Please ask the vendor to confirm the information collected and how it is handled.",
      t.help.trim()
        ? `I’d also like help checking: ${brief(t.help.trim())}`
        : "Questions for review: sign-in, student privacy, retention/deletion, and the vendor’s safeguards and supporting evidence.",
      "Please review this through our district’s process and let me know the next step. The vendor still needs to provide its CoSN responses.",
      "Reference: CoSN K-12CVAT Lite 4.1. CoSN usage guidance: " +
        usageGuideURL,
      "Thank you.",
    ].join("\n\n"),
  };
}
export function currentRequest(draft) {
  return draft.request.edited ? draft.request : generateRequest(draft.intake);
}
export function savedTime(date) {
  return date
    ? new Date(date).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not saved yet";
}
const field = (key, t, rows = 4) =>
  TextAreaField({
    id: `intake-${key}`,
    label:
      intakeFields.find((f) => f.key === key)?.label ||
      "Tool website (optional)",
    value: t[key],
    placeholder:
      intakeFields.find((f) => f.key === key)?.placeholder || "https://…",
    description:
      intakeFields.find((f) => f.key === key)?.hint ||
      "A public product link, if you have one.",
    rows,
  });
const example = () =>
  `<details class="worked-example"><summary>See how little you need to write</summary><div class="example-content"><span class="example-label">Fictional example</span><h3>WordTrail · a made-up reading app</h3><p>“I’d like my fourth-grade class to practice reading aloud for ten minutes. I expect audio recordings, but I don’t know whether they’re kept.”</p><h4>A useful request for IT</h4><p>Could you review WordTrail for reading practice? We expect audio recordings. Please confirm retention, deletion, sign-in and vendor safeguards before we use it with students.</p><p class="quiet">That’s enough to start a conversation. No student names or real recordings needed.</p></div></details>`;
export function IntakeView(
  draft,
  persist,
  storageAvailable,
  step = 0,
  editing = false,
) {
  const t = draft.intake,
    status = stepStatuses(t),
    names = ["The tool", "Classroom idea", "Information & questions"],
    hasDraft = !!(
      t.tool ||
      t.website ||
      t.use ||
      t.data ||
      t.help ||
      t.expectedData.length
    );
  const title = [
    "Start with the tool",
    "Your classroom idea",
    "Information & questions",
  ][step];
  const stepIcons = ["cap", "people", "shield"];
  const toolField = TextAreaField({
    id: "intake-tool",
    label: "Tool name",
    value: t.tool,
    placeholder: "Tool or app name",
    rows: 1,
  });
  return `<div class="intake-page simplified-intake"><header class="task-intro"><div><h1>${title}</h1></div></header>${persist && hasDraft && !editing ? `<section class="resume-draft" aria-label="Saved classroom draft"><div><strong>Continue ${esc(t.tool.trim() || "your classroom draft")}</strong><p>${Icon("calendar")} Saved ${esc(savedTime(draft.updatedAt))} · on this device only</p></div><button data-intake-step="${nextStep(t)}">Continue: ${esc(names[nextStep(t)])} →</button></section>` : ""}<nav class="intake-steps" aria-label="Classroom intake steps">${names.map((name, i) => `<button type="button" data-intake-step="${i}" ${i === step ? 'aria-current="step"' : ""}><span class="step-icon">${Icon(stepIcons[i])}</span><span>${["Tool", "Classroom use", "Information"][i]}<small data-step-status="${i}">${status[i]}</small></span></button>`).join("")}</nav><section class="step-sheet" aria-label="${esc(names[step])}">${editing ? '<p class="step-position">Editing your request notes</p>' : ""}${step === 0 ? `<div class="compact-field">${toolField}<button class="expand-field" type="button" data-expand="intake-tool" aria-expanded="false">More room for the name</button></div><div class="compact-field website-field">${field("website", t, 1)}</div>` : step === 1 ? field("use", t) : `<fieldset class="data-choices"><legend>${intakeFields[2].label}</legend><p>Your expectations are enough. The vendor confirms the details.</p><div class="choice-grid">${dataOptions.map((o) => `<label class="data-choice"><input type="checkbox" data-data-choice="${o.id}" ${t.expectedData.includes(o.id) ? "checked" : ""}><span>${o.label}</span></label>`).join("")}<label class="data-choice uncertain"><input id="data-unknown" type="checkbox" ${t.dataUnknown ? "checked" : ""}><span>Not sure about some or all of it</span></label></div></fieldset><details class="optional-question" ${t.data ? "open" : ""}><summary>Add information context (optional)</summary>${TextAreaField({ id: "intake-data", label: "Anything else about the information?", description: "Types of information only. No student personal details.", value: t.data, placeholder: intakeFields[2].placeholder, rows: 3 })}</details><details class="optional-question" ${t.help ? "open" : ""}><summary>Add a question for IT (optional)</summary>${field("help", t, 3)}</details>`}<div class="step-actions">${editing ? '<a class="button primary" href="#handoff">Save & return to request →</a>' : `${step ? `<button data-intake-step="${step - 1}" class="step-back">Back</button>` : '<a class="step-skip" href="#handoff">Make a partial request</a>'}${step < 2 ? `<button data-intake-step="${step + 1}" class="primary">${step === 0 ? "Next: classroom idea" : "Next: information"} →</button>` : '<a class="button primary" href="#handoff">Preview my request →</a>'}`}</div><div class="step-draft"><label class="check"><input id="persist" type="checkbox" ${persist ? "checked" : ""} ${!storageAvailable ? "disabled" : ""}>Keep a draft on this device</label><span id="writing-status" role="status" aria-live="polite">${persist ? `Saved ${esc(savedTime(draft.updatedAt))}` : "In this tab only · save a backup before closing"}</span><p>Optional, in this browser only. Don’t add student personal information.</p></div></section><div class="intake-reference">${example()}${SourcesAndAdaptations()}</div></div>`;
}
export function handoffText(draft, questions) {
  const r = currentRequest(draft);
  return [
    `Subject: ${r.subject}`,
    r.body,
    "CLASSROOM NOTES — teacher expectations, not vendor attestations",
    ...intakeFields.map(
      (f) =>
        `${f.label}\n${f.key === "data" ? expectedDataText(draft.intake) : draft.intake[f.key].trim() || "Not provided"}`,
    ),
    `Website: ${draft.intake.website || "Not provided"}`,
    `Some data details still unknown: ${draft.intake.dataUnknown ? "Yes" : "No — vendor confirmation still required"}`,
    "STARTING QUESTIONS FOR VENDOR / IT",
    ...handoffPrompts.map(
      (id) => `${id}: ${questions.find((q) => q.id === id).text}`,
    ),
    "No approval or compliance result is produced. Original vendor responses remain separate.",
    "CoSN K-12CVAT Lite 4.1; CoSN / EDUCAUSE; CC BY-NC-SA 4.0. Independent adaptation.",
    "https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx",
    "Official CoSN usage guidance: " + usageGuideURL,
  ].join("\n\n");
}
export function HandoffView(draft, questions) {
  const t = draft.intake,
    r = currentRequest(draft),
    status = stepStatuses(t),
    needs = status
      .map((s, i) => (s !== "Added" ? { s, i } : null))
      .filter(Boolean),
    stale = draft.request.edited && draft.request.context !== requestContext(t);
  const section = (key, title, text) =>
    `<section class="context-section"><div><h3>${title}</h3><a href="#edit/${key}" aria-label="Edit ${title.toLowerCase()}">Edit</a></div><p>${esc(text || "Not added yet")}</p></section>`;
  return `<div class="handoff-page simplified-handoff"><header class="task-intro"><div><h1>Your request for IT</h1><p>Ready to copy into your district’s usual process.</p></div></header><section class="request-paper"><div class="request-actions"><button id="copy-request" class="primary">Copy request for IT</button><span>Nothing sends automatically.</span></div><p id="copy-status" role="status" aria-live="polite"></p><div class="preflight" aria-label="Before copying"><p>${needs.length ? needs.map((n) => `<a href="#edit/${["tool", "use", "data"][n.i]}">${["Tool", "Classroom idea", "Information"][n.i]}: ${n.s.toLowerCase()}</a>`).join(" · ") : "Classroom context added · vendor confirmation still needed"}</p></div>${stale ? '<p class="request-stale" role="status">Your classroom notes changed. Review your wording or refresh it below.</p>' : ""}<article class="request-preview" aria-label="Request preview"><h2 id="preview-subject">${esc(r.subject)}</h2><div id="preview-body">${esc(r.body)}</div></article><details id="request-editor" class="request-editor"><summary>Edit wording</summary><div class="compact-field">${TextAreaField({ id: "request-subject", label: "Subject", value: r.subject, rows: 1 })}</div>${TextAreaField({ id: "request-body", label: "Request", value: r.body, rows: 10, description: "Edit or dictate your wording. No student personal information." })}<div class="editor-actions"><button id="finish-editing">Done editing</button><button id="refresh-request" class="quiet-button">Refresh from classroom notes</button></div></details><div id="print-request" class="print-request"><h3>${esc(r.subject)}</h3><p>${esc(r.body)}</p></div></section><details class="classroom-notes"><summary>${Icon("people")} Edit classroom notes</summary><div class="context-paper">${section("tool", "Tool", t.tool)}${section("website", "Website", t.website)}${section("use", "Classroom idea", t.use)}${section("data", "Expected information", expectedDataText(t))}${t.dataUnknown ? '<p class="uncertainty-note">Some information is still unknown. Known details do not clear that state.</p>' : ""}${section("help", "Questions for IT", t.help)}<p class="context-note">Teacher expectations, separate from vendor safeguards answers.</p></div></details><details class="handoff-utilities"><summary>${Icon("calendar")} Save, download or open a backup</summary><div class="utility-content"><div class="utility-actions"><button id="export-handoff">Download readable handoff <small>TXT</small></button><button id="teacher-json">Save a backup <small>JSON</small></button><button id="teacher-print">Print handoff</button><label class="file-label" for="import">Open a backup <small>JSON</small></label><input id="import" type="file" accept=".json,application/json"></div><p id="import-error" role="alert"></p><label class="check"><input id="persist" type="checkbox">Keep a draft on this device</label><p>Drafts stay in this browser. Backups include classroom notes, request edits and separate vendor responses. Opening a backup replaces the draft after confirmation.</p></div></details><details class="teacher-source-questions"><summary>${Icon("shield")} Original CoSN vendor & IT questions</summary><ul>${handoffPrompts.map((id) => `<li><a href="#question/${id}"><strong>${id}</strong> ${esc(questions.find((q) => q.id === id).text)}</a></li>`).join("")}</ul><a href="#questions">Open all 76 original fields</a></details>${SourcesAndAdaptations()}<p class="handoff-bottom">Independent adaptation · <a href="#review">Vendor response exports</a> · <a href="#start">Back to classroom idea</a></p></div>`;
}
