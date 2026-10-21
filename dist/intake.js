import { TextAreaField, escapeHTML as esc } from "./kit.js";
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
      "Could you review this proposed use through our district’s process and let me know what you need from me or the vendor? I have not completed or inferred the vendor’s CoSN security responses.",
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
  return `<div class="intake-page"><header class="task-intro"><div><h1>${step === 0 ? "Bring your classroom idea.<br>We’ll help with the IT request." : step === 1 ? "What would it make possible?" : "A few details for your IT team."}</h1><p>${step === 0 ? "A tool, a classroom idea, and what you expect. That’s enough to start." : step === 1 ? "A sentence or two is plenty. You can leave the technical checks to IT." : "Choose what you expect. It’s fine to be unsure about some of it."}</p></div></header>${persist && hasDraft && !editing ? `<section class="resume-draft" aria-label="Saved classroom draft"><div><strong>Continue ${esc(t.tool.trim() || "your classroom draft")}</strong><p>Saved ${esc(savedTime(draft.updatedAt))} · on this device only</p></div><button data-intake-step="${nextStep(t)}">Continue: ${esc(names[nextStep(t)])} →</button></section>` : ""}<nav class="intake-steps" aria-label="Classroom intake steps">${names.map((name, i) => `<button type="button" data-intake-step="${i}" ${i === step ? 'aria-current="step"' : ""}><span class="step-number">${i + 1}</span><span>${name}<small data-step-status="${i}">${status[i]}</small></span></button>`).join("")}</nav><div class="focused-layout"><section class="step-sheet" aria-label="${esc(names[step])}"><p class="step-position">Step ${step + 1} of 3${editing ? " · editing your handoff" : ""}</p>${step === 0 ? `<div class="compact-field">${field("tool", t, 1)}<button class="expand-field" type="button" data-expand="intake-tool" aria-expanded="false">More room for the name</button></div><details class="optional-question" ${t.website ? "open" : ""}><summary>Add a website (optional)</summary><div class="compact-field">${field("website", t, 1)}</div></details>` : step === 1 ? field("use", t) : `<fieldset class="data-choices"><legend>${intakeFields[2].label}</legend><p>${intakeFields[2].hint}</p><div class="choice-grid">${dataOptions.map((o) => `<label class="data-choice"><input type="checkbox" data-data-choice="${o.id}" ${t.expectedData.includes(o.id) ? "checked" : ""}><span>${o.label}</span></label>`).join("")}<label class="data-choice uncertain"><input id="data-unknown" type="checkbox" ${t.dataUnknown ? "checked" : ""}><span>Not sure about some or all of it</span></label></div></fieldset><details class="optional-question" ${t.data ? "open" : ""}><summary>Add information context (optional)</summary>${TextAreaField({ id: "intake-data", label: "Anything else about the information?", description: "Known details and unknowns can coexist. No student personal information.", value: t.data, placeholder: intakeFields[2].placeholder, rows: 3 })}</details><details class="optional-question" ${t.help ? "open" : ""}><summary>Add a question for IT (optional)</summary>${field("help", t, 3)}</details>`}<div class="step-actions">${editing ? '<a class="button primary" href="#handoff">Save & return to request →</a>' : `${step ? `<button data-intake-step="${step - 1}" class="step-back">Back</button>` : '<a class="step-skip" href="#handoff">Make a partial request</a>'}${step < 2 ? `<button data-intake-step="${step + 1}" class="primary">${step === 0 ? "Next: classroom idea" : "Next: information"} →</button>` : '<a class="button primary" href="#handoff">Review my IT request →</a>'}`}</div><div class="step-draft"><label class="check"><input id="persist" type="checkbox" ${persist ? "checked" : ""} ${!storageAvailable ? "disabled" : ""}>Keep a draft on this device</label><span id="writing-status" role="status" aria-live="polite">${persist ? `Saved ${esc(savedTime(draft.updatedAt))}` : "In this tab only · save a backup before closing"}</span><p>Device-only storage is optional. Nothing is sent to your IT team automatically. Don’t include student personal information.</p></div></section><aside class="intake-guide"><h2>You bring the idea.<br>IT helps with the checks.</h2><ol class="responsibility-list"><li><strong>You</strong><span>The activity and what you expect.</span></li><li><strong>The vendor</strong><span>Confirmed data practices and evidence.</span></li><li><strong>Your IT team</strong><span>A review through your district’s process.</span></li></ol>${example()}<p class="workflow-origin">This short intake is our added workflow. <a href="#questions">Original CoSN vendor & IT questions</a> remain separate.</p><details class="native-dictation-tip"><summary>Prefer to speak?</summary><p>Use Dictate beside a writing field, or your keyboard’s microphone. Browser dictation may send audio to its speech provider; review the disclosure before starting. No student details, please.</p></details></aside></div></div>`;
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
  return `<div class="handoff-page"><header class="task-intro"><div><h1>A clear request.<br>A useful next conversation.</h1><p>Review the note, make it yours, then copy it into your district’s usual process.</p></div><a href="#start">Back to classroom idea</a></header><div class="request-layout"><section class="request-paper"><div class="paper-heading"><h2>Your request for IT</h2><span>Editable · nothing sends automatically</span></div><div class="preflight" aria-label="Before copying"><strong>${needs.length ? "A partial request is useful, too." : "Your classroom context is added."}</strong><p>${needs.length ? needs.map((n) => `<a href="#edit/${["tool", "use", "data"][n.i]}">${["Tool", "Classroom idea", "Information"][n.i]}: ${n.s.toLowerCase()}</a>`).join(" · ") : "The vendor still confirms data practices; IT reviews the proposed use."}</p></div>${stale ? '<p class="request-stale" role="status">Your classroom notes changed after you edited this request. Review your wording or refresh it from the notes.</p>' : ""}<div class="compact-field">${TextAreaField({ id: "request-subject", label: "Subject", value: r.subject, rows: 1 })}</div>${TextAreaField({ id: "request-body", label: "Request", description: "Edit freely. Keep student names, recordings and other personal information out of the request.", value: r.body, rows: 12 })}<div id="print-request" class="print-request"><h3>${esc(r.subject)}</h3><p>${esc(r.body)}</p></div><div class="request-actions"><button id="copy-request" class="primary">Copy request for IT</button><button id="refresh-request" class="quiet-button">Refresh from classroom notes</button></div><p id="copy-status" role="status" aria-live="polite">Copies the subject and request. You decide where to share it.</p></section><aside class="context-paper"><h2>Your classroom notes</h2><p class="context-intro">Teacher expectations · vendor confirmation still needed</p>${section("tool", "Tool", t.tool)}${section("website", "Website", t.website)}${section("use", "Classroom idea", t.use)}${section("data", "Expected information", expectedDataText(t))}${t.dataUnknown ? '<p class="uncertainty-note">Some information is still unknown. This stays in your request even when you add known details.</p>' : ""}${section("help", "Questions for IT", t.help)}<p class="context-note">Your notes do not answer the original CoSN safeguards questions or imply approval.</p></aside></div><details class="handoff-utilities"><summary>Save, download or open a backup</summary><div class="utility-content"><div class="utility-actions"><button id="export-handoff">Download readable handoff <small>TXT</small></button><button id="teacher-json">Save a backup <small>JSON</small></button><button id="teacher-print">Print handoff</button><label class="file-label" for="import">Open a backup <small>JSON</small></label><input id="import" type="file" accept=".json,application/json"></div><p id="import-error" role="alert"></p><label class="check"><input id="persist" type="checkbox">Keep a draft on this device</label><p>Local drafts stay in this browser on this device. A backup includes classroom notes, your edited request and any separately recorded vendor responses. Opening a backup replaces the draft after confirmation.</p></div></details><details class="teacher-source-questions"><summary>Original CoSN questions for the vendor & IT team</summary><p>These are starting prompts for their review, not extra homework for you.</p><ul>${handoffPrompts.map((id) => `<li><a href="#question/${id}"><strong>${id}</strong> ${esc(questions.find((q) => q.id === id).text)}</a></li>`).join("")}</ul><a href="#questions">Open all 76 original fields</a></details><p class="handoff-bottom">Independent adaptation · CoSN / EDUCAUSE · CC BY-NC-SA 4.0 · <a href="#about">Source, license & workbook comparison</a> · <a href="#review">Vendor response exports</a></p></div>`;
}
