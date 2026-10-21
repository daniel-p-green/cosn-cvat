import { bindOrientation } from "./orientation.js";
import { dictationBusy } from "./dictation.js";
import {
  IntakeView,
  HandoffView,
  handoffText,
  stepStatuses,
  generateRequest,
  currentRequest,
  requestContext,
  savedTime,
} from "./intake.js";
import { bindWritingFields, isComposing, DictationHelp } from "./writing.js";
import { Button, TextAreaField, CheckField, Stat, escapeHTML } from "./kit.js";
import { explanations } from "./explanations.js";
import {
  KEY,
  blank,
  responseState,
  counts,
  validateDraft,
  exportCSV,
} from "./model.js";
const $ = (s) => document.querySelector(s),
  escape = escapeHTML;
const sourceURL =
  "https://www.cosn.org/wp-content/uploads/2022/11/CoSN-K-12CVAT-Lite-V4.1-2.xlsx";
let data,
  questions,
  draft = blank(),
  persist = false,
  storageAvailable = true,
  dirty = false,
  mode = "start",
  active = 0,
  filter = "all",
  query = "",
  showList = false,
  intakeStep = 0,
  editingIntake = false,
  noticeTimer,
  saveTimer;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    draft = JSON.parse(raw);
    persist = true;
  }
} catch {
  storageAvailable = false;
}
const labels = {
  recorded: "Response recorded",
  unknown: "Not yet known",
  unanswered: "Awaiting response",
};
function notify(message) {
  $("#notice").textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($("#notice").textContent = ""), 5500);
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = null;
  dirty = true;
  if (isComposing()) return;
  if ($("#notice").textContent.startsWith("Finish this text entry"))
    $("#notice").textContent = "";
  draft.updatedAt = new Date().toISOString();
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
      $("#draft-status").textContent = "Saved on this device";
    } catch {
      persist = false;
      storageAvailable = false;
      notify(
        "Device storage is unavailable. Save a backup before closing this tab.",
      );
    }
  } else $("#draft-status").textContent = "Draft in this tab";
  const writingStatus = $("#writing-status");
  if (writingStatus)
    writingStatus.textContent = persist
      ? "Saved " + savedTime(draft.updatedAt) + " · on this device"
      : "In this tab only · save a backup before closing";
  document
    .querySelectorAll("[data-step-status]")
    .forEach(
      (el) =>
        (el.textContent = stepStatuses(draft.intake)[
          Number(el.dataset.stepStatus)
        ]),
    );
  updateProgress();
}
function queueSave(composing = false) {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!composing) saveTimer = setTimeout(save, 350);
}
function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    save();
  }
}
function rec(q) {
  return draft.records[q.id] || {};
}
function updateProgress() {
  if (!questions) return;
  const c = counts(questions, draft);
  $("#progress-count").textContent = c.recorded + " of " + questions.length;
  $("#progress").value = c.recorded;
  const sectionsHTML = data.sections
    .map((s, i) => {
      const qs = questions.filter((q) => q.section === s),
        n = counts(qs, draft).recorded;
      return `<a href="#question/${qs[0].id}" ${mode === "questions" && questions[active]?.section === s ? 'aria-current="page"' : ""}>${escape(s)}<span>${n}/${qs.length}</span></a>`;
    })
    .join("");
  if ($("#sections").innerHTML !== sectionsHTML)
    $("#sections").innerHTML = sectionsHTML;
}
function navigate() {
  if (dictationBusy()) {
    notify(
      "Stop dictation and use or discard your transcript before changing pages.",
    );
    return;
  }
  if (isComposing()) {
    notify("Finish this entry before changing pages.");
    return;
  }
  flushSave();
  const hash = location.hash.slice(1);
  const oldMode = mode;
  let editField = null;
  editingIntake = false;
  if (
    hash.startsWith("edit/") &&
    ["tool", "website", "use", "data", "help"].includes(hash.split("/")[1])
  ) {
    editField = hash.split("/")[1];
    intakeStep = ["tool", "website"].includes(editField)
      ? 0
      : editField === "use"
        ? 1
        : 2;
    mode = "start";
    editingIntake = true;
  } else if (hash.startsWith("question/")) {
    mode = "questions";
    const idx = questions.findIndex((q) => q.id === hash.split("/")[1]);
    active = idx < 0 ? 0 : idx;
    query = "";
    filter = "all";
    showList = false;
  } else if (
    ["start", "handoff", "questions", "review", "about"].includes(hash)
  )
    mode = hash;
  else mode = "start";
  document.querySelectorAll(".nav-step").forEach((a) => {
    a.removeAttribute("aria-current");
    if (a.hash === "#" + mode || (mode === "review" && a.hash === "#questions"))
      a.setAttribute("aria-current", "page");
  });
  if (innerWidth < 768 && (oldMode !== mode || hash.startsWith("question/")))
    $(".section-menu").open = false;
  render();
  if (hash || oldMode !== mode) {
    $("#main").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  if (editField) {
    const target = $("#intake-" + editField);
    if (target) {
      const details = target.closest("details");
      if (details) details.open = true;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center" });
    }
  }
}
function render() {
  const teacher = mode === "start" || mode === "handoff";
  document.body.classList.toggle("teacher-mode", teacher);
  const headerLink = $(".top-actions a");
  headerLink.href = teacher ? "#handoff" : "#review";
  headerLink.textContent = teacher ? "Your handoff" : "Review & export";
  updateProgress();
  $("#draft-status").textContent = persist
    ? "Saved on this device"
    : "Draft in this tab";
  if (mode === "start") renderStart();
  else if (mode === "questions") renderQuestions();
  else if (mode === "review") renderReview();
  else if (mode === "handoff") renderHandoff();
  else renderAbout();
}
function bindIntakeWriting() {
  bindWritingFields($("#view"), {
    onInput: (field, value, composing) => {
      const key = field.id.replace("intake-", "");
      draft.intake[key] = value;
      queueSave(composing);
    },
    onCommit: () => save(),
  });
}
function renderStart() {
  $("#view").innerHTML = IntakeView(
    draft,
    persist,
    storageAvailable,
    intakeStep,
    editingIntake,
  );
  if ($("#data-unknown"))
    $("#data-unknown").onchange = (e) => {
      draft.intake.dataUnknown = e.target.checked;
      save();
    };
  document.querySelectorAll("[data-data-choice]").forEach(
    (el) =>
      (el.onchange = () => {
        const id = el.dataset.dataChoice;
        let selected = draft.intake.expectedData.filter((v) => v !== id);
        if (el.checked)
          selected =
            id === "none"
              ? [id]
              : [...selected.filter((v) => v !== "none"), id];
        draft.intake.expectedData = selected;
        document
          .querySelectorAll("[data-data-choice]")
          .forEach(
            (c) => (c.checked = selected.includes(c.dataset.dataChoice)),
          );
        save();
      }),
  );
  document.querySelectorAll("[data-expand]").forEach(
    (el) =>
      (el.onclick = () => {
        const target = document.getElementById(el.dataset.expand),
          expanded = el.getAttribute("aria-expanded") === "true";
        target.rows = expanded ? 1 : 3;
        el.setAttribute("aria-expanded", String(!expanded));
        el.textContent = expanded
          ? "More room for the name"
          : "Compact name field";
        target.focus();
      }),
  );
  document.querySelectorAll("[data-intake-step]").forEach(
    (button) =>
      (button.onclick = () => {
        if (isComposing() || dictationBusy()) {
          notify(
            "Stop dictation and use or discard the transcript before moving on.",
          );
          return;
        }
        flushSave();
        intakeStep = Number(button.dataset.intakeStep);
        renderStart();
        window.scrollTo(0, 0);
        $("#main").focus({ preventScroll: true });
      }),
  );
  bindIntakeWriting();
  bindPersist();
}
function exportJSON() {
  flushSave();
  download(
    JSON.stringify(
      { ...draft, sourceURL, exportedAt: new Date().toISOString() },
      null,
      2,
    ),
    "application/json",
    fileName("json"),
  );
  dirty = false;
  notify(
    "Draft exported. It includes classroom context and separately recorded vendor responses.",
  );
}
function renderHandoff() {
  $("#view").innerHTML = HandoffView(draft, questions);
  $("#persist").checked = persist;
  $("#export-handoff").onclick = () => {
    flushSave();
    download(
      handoffText(draft, questions),
      "text/plain;charset=utf-8",
      fileName("txt"),
    );
    notify(
      "Handoff downloaded. Share it through your district’s usual process. Nothing was sent automatically.",
    );
  };
  bindWritingFields($("#view"), {
    onInput: (field, value, composing) => {
      if (!draft.request.edited)
        draft.request = {
          ...generateRequest(draft.intake),
          edited: true,
          context: requestContext(draft.intake),
        };
      draft.request[field.id.replace("request-", "")] = value;
      queueSave(composing);
      const print = $("#print-request");
      if (print) {
        print.querySelector("h3").textContent = draft.request.subject;
        print.querySelector("p").textContent = draft.request.body;
      }
    },
    onCommit: () => save(),
  });
  $("#copy-request").onclick = async () => {
    if (dictationBusy() || isComposing()) {
      notify("Finish dictation or text entry before copying the request.");
      return;
    }
    flushSave();
    const r = currentRequest(draft),
      text = `Subject: ${r.subject}\n\n${r.body}`;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      $("#copy-status").textContent =
        "Copied subject and request. Paste it into your district’s usual process. Nothing was sent.";
    } catch {
      const fallback = document.createElement("textarea");
      fallback.id = "manual-copy";
      fallback.value = text;
      fallback.setAttribute(
        "aria-label",
        "Subject and request for manual copying",
      );
      const status = $("#copy-status");
      status.textContent =
        "Clipboard access is unavailable. Copy the selected text below using your device’s Copy command.";
      $("#manual-copy")?.remove();
      status.after(fallback);
      fallback.focus();
      fallback.select();
    }
  };
  $("#refresh-request").onclick = async () => {
    if (dictationBusy() || isComposing()) {
      notify("Finish dictation or text entry first.");
      return;
    }
    if (
      draft.request.edited &&
      !(await confirmAction(
        "Refresh this request?",
        "This replaces your edited subject and request with a fresh version of your classroom notes.",
        "Refresh request",
      ))
    )
      return;
    draft.request = { subject: "", body: "", edited: false, context: "" };
    save();
    renderHandoff();
    $("#request-body").focus();
  };
  $("#teacher-json").onclick = exportJSON;
  $("#teacher-print").onclick = () => window.print();
  $("#import").onchange = importDraft;
  bindPersist();
}
function bindPersist() {
  const el = $("#persist");
  if (!el) return;
  el.addEventListener("change", () => {
    persist = el.checked;
    if (persist) {
      save();
    } else {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      $("#draft-status").textContent = "Draft in this tab";
      if ($("#writing-status"))
        $("#writing-status").textContent =
          "In this tab only · save a backup before closing";
      notify(
        "Device copy removed. Your current draft is still open in this tab.",
      );
    }
  });
}
function matched() {
  const t = query.toLowerCase().trim();
  return questions.filter((q) => {
    const r = rec(q);
    let ok =
      filter === "all" ||
      (filter === "followup" && r.flag) ||
      responseState(r) === filter ||
      (filter === "no-evidence" && !r.evidence?.trim());
    return (
      ok &&
      (!t ||
        [q.id, q.text, q.section, explanations[q.id]].some((x) =>
          x.toLowerCase().includes(t),
        ))
    );
  });
}
function tools() {
  return `<div class="question-tools"><label><span class="field-label">Find a question</span><input id="search" name="search" type="search" autocomplete="off" placeholder="Search question or ID…" value="${escape(query)}"></label><label><span class="field-label">Show</span><select id="filter"><option value="all">All questions</option><option value="unanswered">Awaiting response</option><option value="unknown">Not yet known</option><option value="followup">Marked for follow-up</option><option value="no-evidence">No evidence reference</option><option value="recorded">Response recorded</option></select></label><button id="toggle-list">${showList ? "Guided view" : "Browse questions"}</button></div>`;
}
function renderQuestions() {
  const qs = matched();
  if (!qs.some((q) => q.id === questions[active].id) && qs.length)
    active = questions.indexOf(qs[0]);
  const q = questions[active];
  $("#view").innerHTML =
    `<div class="page-heading"><div><h1>Gather responses</h1><p>Record what the vendor provides. Leave specialist judgments to district IT.</p></div></div>${tools()}<div id="question-content"></div>`;
  $("#filter").value = filter;
  $("#search").addEventListener("input", (e) => {
    query = e.target.value;
    showList = true;
    renderContent();
    $("#toggle-list").textContent = "Guided view";
  });
  $("#filter").addEventListener("change", (e) => {
    filter = e.target.value;
    showList = true;
    renderContent();
    $("#toggle-list").textContent = "Guided view";
  });
  $("#toggle-list").onclick = () => {
    showList = !showList;
    $("#toggle-list").textContent = showList
      ? "Guided view"
      : "Browse questions";
    renderContent();
  };
  renderContent();
}
function renderContent() {
  const qs = matched(),
    holder = $("#question-content");
  if (!qs.length) {
    holder.innerHTML = `<div class="empty"><h2>No questions match</h2><p>Try a different term or clear the filters.</p><button id="clear-filter">Show all questions</button></div>`;
    $("#clear-filter").onclick = () => {
      query = "";
      filter = "all";
      renderQuestions();
    };
    return;
  }
  if (!qs.some((q) => q === questions[active]))
    active = questions.indexOf(qs[0]);
  if (showList) {
    holder.innerHTML = `<div class="list-heading"><h2>${qs.length} ${qs.length === 1 ? "question" : "questions"}</h2><small>Original workbook order</small></div><div class="question-list">${qs.map((q) => `<a class="question-row" href="#question/${q.id}"><strong>${q.id}</strong><span>${escape(q.text)}</span><small>${labels[responseState(rec(q))]}${rec(q).flag ? " · Follow-up" : ""}</small></a>`).join("")}</div>`;
    holder.querySelectorAll(".question-row").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        history.pushState(null, "", a.hash);
        navigate();
      }),
    );
    return;
  }
  renderQuestion(holder, qs);
}
function renderQuestion(holder, qs) {
  const q = questions[active],
    r = rec(q),
    pos = qs.indexOf(q);
  holder.innerHTML = `<div class="vendor-workspace-note"><a href="#start">Just gathering a classroom idea?</a><span>The short intake is for teachers. This complete questionnaire is for vendor responses and district review.</span></div><p class="section-title">${escape(q.section)}</p><article class="question-sheet"><div class="question-meta"><span class="question-id">${q.id} <span class="source-badge">· Original workbook wording</span></span><span class="question-count">${active + 1} / ${questions.length}</span></div><h2 id="question-title">${escape(q.text)}</h2><div class="explanation"><strong>In plain language · adaptation</strong><p>${escape(explanations[q.id])}</p></div><p class="who"><strong>${q.owner === "District IT" ? "District IT completes this field." : "Vendor provides this response."}</strong> ${q.owner === "District IT" ? "The workbook assigns this field to the institution’s IT or security office." : q.id.startsWith("GNRL") || q.id === "DATE-01" ? "Educators can gather public product details; ask the vendor to confirm them." : "Educators can record the vendor’s answer and ask for evidence. Do not infer a security answer from classroom use."}</p>${DictationHelp()}${q.kind === "choice" ? `<fieldset><legend>Vendor answer</legend><div class="responses">${["Yes", "No"].map((a) => `<label class="response"><input type="radio" name="answer" value="${a}" ${r.answer === a ? "checked" : ""}>${a}</label>`).join("")}<label class="response unknown"><input type="radio" name="answer" value="unknown" ${r.unknown && !r.answer ? "checked" : ""}>Not yet known</label></div><p class="help-line">“Not yet known” tracks a missing response. It is not a workbook answer or a pass/fail result.</p></fieldset>` : `<div class="answer-block"><label class="field-label" for="answer">${q.owner === "District IT" ? "Institution response" : "Vendor response"}</label><div class="writing-field"><textarea data-writing-field id="answer" name="answer" rows="4" spellcheck="true" autocapitalize="sentences" enterkeyhint="next" maxlength="20000" autocomplete="off">${escape(r.answer || "")}</textarea><div class="field-foot"><span class="writing-state">Writing here</span><button type="button" class="field-next" data-next-field="answer">Next writing field</button></div></div><label class="check"><input id="unknown" type="checkbox" ${r.unknown && !r.answer ? "checked" : ""}>Response not yet known</label></div>`}
${q.guidance ? `<p class="help-line"><strong>Workbook guidance:</strong> ${escape(q.guidance)}</p>` : ""}<div class="evidence">${TextAreaField({ id: "additional", label: "Additional information", value: r.additional, placeholder: "Vendor explanation or details…" })}${TextAreaField({ id: "evidence", label: "Evidence reference / notes", value: r.evidence, placeholder: "Document title, date, link or follow-up question…" })}</div><p class="help-line">Use references to documents held in your district’s approved system. Do not paste confidential reports or student personal data.</p><div class="evidence" style="margin-top:16px;padding-top:16px"><label><span class="field-label">Response provided by</span><select id="provider" name="provider"><option value="">Not recorded</option><option>Vendor</option><option>District IT</option><option>Educator / public source</option></select></label>${CheckField({ id: "flag", label: "Mark for follow-up with vendor / IT", checked: r.flag })}</div>${Button({ id: "clear-answer", label: "Clear response", variant: "link" })}${
    q.reason || q.followup || Object.keys(q.crosswalk).length
      ? `<details><summary>Workbook analyst reference & crosswalk</summary><div class="reference-body"><p class="muted">Original reference text from Lite 4.1. Historical references may need district IT review; mappings do not establish compliance.</p>${q.reason ? `<h3>Reason for question</h3><p>${escape(q.reason)}</p>` : ""}${q.followup ? `<h3>Follow-up inquiries / responses</h3><p>${escape(q.followup)}</p>` : ""}${
          Object.keys(q.crosswalk).length
            ? `<h3>Standards crosswalk · source version</h3><dl class="crosswalk">${Object.entries(
                q.crosswalk,
              )
                .map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`)
                .join("")}</dl>`
            : ""
        }</div></details>`
      : ""
  }</article><div class="question-footer"><p id="response-status" aria-live="polite">${labels[responseState(r)]}</p><div class="actions">${Button({ id: "previous", label: "Previous", disabled: pos === 0 })}${Button({ id: "next", label: pos === qs.length - 1 ? "Review responses" : "Next question", variant: "primary" })}</div></div>`;
  $("#provider").value = r.provider || "";
  const set = (key, value) => {
    draft.records[q.id] = { ...rec(q), [key]: value };
    save();
    $("#response-status").textContent = labels[responseState(rec(q))];
  };
  if (q.kind === "choice") {
    document.querySelectorAll("input[name=answer]").forEach(
      (el) =>
        (el.onchange = () => {
          draft.records[q.id] = {
            ...rec(q),
            answer: el.value === "unknown" ? "" : el.value,
            unknown: el.value === "unknown",
          };
          save();
          $("#response-status").textContent = labels[responseState(rec(q))];
        }),
    );
  } else {
    $("#unknown").onchange = async (e) => {
      if (e.target.checked && rec(q).answer) {
        const ok = await confirmAction(
          "Replace the response?",
          "Marking this response as not yet known will clear its answer. Notes and evidence references will stay.",
          "Mark not yet known",
        );
        if (!ok) {
          e.target.checked = false;
          return;
        }
      }
      draft.records[q.id] = {
        ...rec(q),
        unknown: e.target.checked,
        answer: e.target.checked ? "" : rec(q).answer || "",
      };
      save();
      renderContent();
    };
  }
  bindWritingFields(holder, {
    onInput: (field, value, composing) => {
      const key = field.id;
      draft.records[q.id] = { ...rec(q), [key]: value };
      if (key === "answer") {
        draft.records[q.id].unknown = false;
        $("#unknown").checked = false;
      }
      queueSave(composing);
      $("#response-status").textContent = labels[responseState(rec(q))];
    },
    onCommit: () => save(),
  });
  $("#provider").onchange = (e) => set("provider", e.target.value);
  $("#flag").onchange = (e) => set("flag", e.target.checked);
  $("#clear-answer").onclick = async () => {
    if (!rec(q).answer && !rec(q).unknown) return;
    if (
      await confirmAction(
        "Clear this response?",
        "The answer will be cleared. Your additional information, evidence references and follow-up marker will stay.",
        "Clear response",
      )
    ) {
      draft.records[q.id] = { ...rec(q), answer: "", unknown: false };
      save();
      renderContent();
    }
  };
  $("#previous").onclick = () => step(qs, pos - 1);
  $("#next").onclick = () =>
    pos === qs.length - 1 ? (location.hash = "review") : step(qs, pos + 1);
}
function step(qs, pos) {
  if (isComposing() || dictationBusy()) return;
  flushSave();
  active = questions.indexOf(qs[pos]);
  renderContent();
  updateProgress();
  $("#main").focus({ preventScroll: true });
  window.scrollTo(0, 0);
  history.replaceState(null, "", "#question/" + questions[active].id);
}
function fileName(ext) {
  return (
    "cosn-cvat-lite-4.1-" + new Date().toISOString().slice(0, 10) + "." + ext
  );
}
function download(content, type, name) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function renderReview() {
  const c = counts(questions, draft),
    follow = questions.filter(
      (q) => responseState(rec(q)) !== "recorded" || rec(q).flag,
    );
  $("#view").innerHTML =
    `<div class="page-heading"><div><h1>Prepare the handoff</h1><p>Take the open questions to your vendor and district IT team.</p></div></div><div class="summary-stats">${Stat({ value: c.recorded, suffix: "/ 76", label: "Responses recorded" })}${Stat({ value: c.unknown + c.unanswered, label: "Awaiting an answer" })}${Stat({ value: c.flagged, label: "Marked for follow-up" })}</div><p class="review-explainer">${c.unknown} not yet known · ${c.unanswered} unanswered · ${c.evidence} with an evidence reference. A recorded response or reference has not been verified. This summary does not rate a vendor’s security, approve a purchase, or determine compliance.</p><div class="review-layout"><section><h2>Responses by section</h2><div class="table-wrap"><table><thead><tr><th scope="col">Workbook section</th><th scope="col">Recorded</th></tr></thead><tbody>${data.sections
      .map((s) => {
        const qs = questions.filter((q) => q.section === s);
        return `<tr><td><a href="#question/${qs[0].id}">${escape(s)}</a></td><td>${counts(qs, draft).recorded} / ${qs.length}</td></tr>`;
      })
      .join(
        "",
      )}</tbody></table></div><p class="review-note">Next step: ask the vendor to fill the gaps. Your district’s security analyst should review the complete responses and supporting documents through its approved assessment process.</p></section><aside class="handoff-actions"><h2>Take your work with you</h2><p>JSON reopens this draft here. CSV includes all 76 original prompts, responses, notes and follow-up markers.</p><button class="primary" id="export-json">Export draft · JSON</button><button id="export-csv">Export responses · CSV</button><button id="print">Print review summary</button><label class="file-label" for="import">Import a saved JSON draft</label><input id="import" type="file" accept=".json,application/json"><p id="import-error" class="import-error" role="alert"></p><p>Import replaces the current draft after confirmation. Files stay in this browser.</p></aside></div><section style="margin-top:36px"><h2>Open questions & follow-ups <small>(${follow.length})</small></h2><p class="muted" style="font-size:14px">Includes unanswered and not-yet-known responses, plus items you marked. Export CSV for the full record, including evidence notes.</p>${
      follow.length
        ? `<ul class="followup-list">${follow
            .map((q) => {
              const r = rec(q);
              return `<li><a href="#question/${q.id}"><strong>${q.id}</strong> · ${escape(q.text)}</a><p>${labels[responseState(r)]} · ${q.owner} ${r.flag ? "· Follow-up marked" : ""}${r.evidence ? "\nEvidence / notes: " + escape(r.evidence) : ""}</p></li>`;
            })
            .join("")}</ul>`
        : "<p>Every field has a response, and no items are marked. District IT review is still required.</p>"
    }</section><section class="storage-settings"><h2>Draft & privacy</h2><p>This is a browser-local workspace. No responses are sent to a server or shared with CoSN. Anyone using this browser profile could see a saved draft. Exported files may contain business contact details or sensitive notes; handle them through your district’s approved systems.</p><label class="check"><input id="persist" type="checkbox" ${persist ? "checked" : ""} ${!storageAvailable ? "disabled" : ""}>Save this draft on this device</label><div class="actions"><button class="danger" id="erase">Erase this draft</button><a href="#about">Source & limitations</a></div></section><p class="print-only">Independent adaptation of CoSN K-12CVAT Lite 4.1. CoSN / EDUCAUSE. Source: ${sourceURL}. Responses are unverified. No approval or compliance result is produced.</p>`;
  $("#export-json").onclick = () => {
    download(
      JSON.stringify(
        { ...draft, sourceURL, exportedAt: new Date().toISOString() },
        null,
        2,
      ),
      "application/json",
      fileName("json"),
    );
    dirty = false;
    notify("JSON draft exported. Keep the file in an approved location.");
  };
  $("#export-csv").onclick = () => {
    download(
      exportCSV(questions, draft),
      "text/csv;charset=utf-8",
      fileName("csv"),
    );
    notify(
      "All 76 fields exported to CSV. This file is not an Excel workbook round-trip.",
    );
  };
  $("#print").onclick = () => window.print();
  $("#import").onchange = importDraft;
  $("#erase").onclick = async () => {
    if (
      await confirmAction(
        "Erase this draft?",
        "This clears all responses and removes the saved copy from this browser. Export a JSON draft first if you need to keep it.",
        "Erase draft",
      )
    ) {
      draft = blank();
      dirty = false;
      persist = false;
      try {
        localStorage.removeItem(KEY);
      } catch {}
      render();
      notify("Draft erased from this browser.");
    }
  };
  bindPersist();
}
async function importDraft(e) {
  const f = e.target.files[0];
  if (!f) return;
  const error = $("#import-error");
  try {
    if (f.size > 3 * 1024 * 1024)
      throw Error("Choose a JSON draft smaller than 3 MB.");
    const incoming = validateDraft(JSON.parse(await f.text()), questions);
    if (
      !(await confirmAction(
        "Replace this draft?",
        "The imported file will replace all current responses and notes. Export the current draft first if you want to keep both.",
        "Replace draft",
      ))
    ) {
      e.target.value = "";
      return;
    }
    draft = incoming;
    save();
    render();
    notify(
      "Draft imported. Responses and notes are available in Gather responses.",
    );
  } catch (err) {
    error.textContent =
      err instanceof SyntaxError
        ? "This file is not valid JSON. Choose a draft exported by this site."
        : err.message;
    e.target.value = "";
  }
}
function confirmAction(title, text, label) {
  const dialog = $("#confirm");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  dialog.querySelector("[value=confirm]").textContent = label;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) =>
    dialog.addEventListener(
      "close",
      () => resolve(dialog.returnValue === "confirm"),
      { once: true },
    ),
  );
}
function renderAbout() {
  $("#view").innerHTML =
    `<article class="about"><a class="back-link" href="#start">Back to getting oriented</a><h1>Source & adaptation notes</h1><p>This workspace is an independent educational adaptation of the <strong>CoSN K-12 Community Vendor Assessment Tool (CVAT) – Lite, Version 4.1</strong>. It is not affiliated with, endorsed by, or an official product of CoSN or EDUCAUSE.</p><div class="actions"><a class="button primary" href="${sourceURL}">Open original workbook</a><a href="https://www.cosn.org/edtech-topics/cybersecurity/">CoSN cybersecurity resources</a></div><h2>Use it to prepare a review</h2><p>The workbook is a starting point for assessing vendor-provided services in school procurement. Vendors supply the safeguards information. Educators can gather product context, identify gaps and prepare questions; the institution’s security analyst evaluates the responses in the district’s environment.</p><p>The original instructions say the security worksheet should be completed by the vendor, not the school system. GNRL-11 and GNRL-12 belong to district IT or the security office. This adaptation helps educators coordinate that work; it does not replace your district’s procurement, privacy, legal or security review.</p><h2>What is preserved</h2><ul><li>All 63 assessment prompts, 12 general-information fields and DATE-01, with their original IDs, wording and order. Source spelling and punctuation are retained.</li><li>The 16 workbook sections, the 60 Yes/No response fields and the three narrative assessment questions.</li><li>Available original guidance, analyst reference text and standards crosswalk mappings. These are historical source references, not current certification claims.</li></ul><h2>What this adaptation changes</h2><p>The short classroom intake is an added teacher workflow. Its notes are stored and exported separately from the original vendor responses; it never infers answers to the security questionnaire. Native device dictation can enter text into the labelled fields. The optional Dictate controls use browser SpeechRecognition when supported. Starting requires your action and browser microphone permission. Your browser may send audio to its speech provider; local processing is not guaranteed. This application does not store audio. Final words enter the draft only when you choose to use the transcript. Keyboard dictation remains an alternative.</p><ul><li>Plain-language explanations, evidence references, response-source labels and follow-up markers are added and labelled separately from source text.</li><li>“Not yet known” is a workflow state, not a workbook Yes/No response. Neither an unknown nor an unanswered item receives a pass or fail.</li><li>All prompts remain visible. The workbook has 13 conditional-formatting blocks containing broken <code>#REF!</code> references, so their intended skip logic cannot be reliably reproduced.</li><li>No security score is calculated. The hidden scoring sheet has 62 assessment IDs, omits COMP-09, and contains a mix of formulas and fixed cached values. The workbook also requires institution-specific analyst judgments. Reproducing its displayed percentages would be misleading.</li><li>Exports are portable JSON drafts and CSV records, not a completed original Excel workbook. The print view is a preparation summary, not the workbook’s Analyst Report.</li></ul><details class="comparison"><summary>Our version vs. the original</summary><p>These findings describe the supplied workbook, not a claim about CoSN’s intended scoring. The downloadable original has not been modified.</p><div class="comparison-item"><h3>COMP-09 missing from the scoring table</h3><p><strong>Original:</strong> CoSN K-12CVAT!A38 contains COMP-09; hidden Questions!B2:B63 contains only 62 assessment IDs and omits it.</p><p><strong>Impact:</strong> A scoring-table-only conversion would lose a narrative question.</p><p><strong>Our handling:</strong> All 63 assessment questions are included. <strong>Fixed mechanically for this interface:</strong> completeness restored; source scoring remains unresolved.</p></div><div class="comparison-item"><h3>Final question excluded from named range</h3><p><strong>Original:</strong> Defined name Lite points to Questions!B2:R62; HLVU-03 is on row 63.</p><p><strong>Impact:</strong> Features relying on that range may omit the last question.</p><p><strong>Our handling:</strong> HLVU-03 is included in navigation, response counts and exports. <strong>Fixed mechanically for this interface.</strong></p></div><div class="comparison-item"><h3>Security-event answer has an ambiguous favorable value</h3><p><strong>Original:</strong> COMP-05 asks about a security event in the last five years. Questions!H12 lists Yes as its “Compliant Answer”.</p><p><strong>Impact:</strong> Treating the favorable value as a safety judgment could reward an incident disclosure without reviewing the explanation.</p><p><strong>Our handling:</strong> Yes and No are recorded without a score; district IT reviews the context. <strong>Unresolved interpretation:</strong> no replacement favorable answer is asserted.</p></div><div class="comparison-item"><h3>Skip-formatting rules contain broken references</h3><p><strong>Original:</strong> The assessment sheet’s 13 conditional-formatting blocks refer to #REF! rather than valid parent cells.</p><p><strong>Impact:</strong> The intended nested-question visibility cannot be established reliably.</p><p><strong>Our handling:</strong> All questions remain visible and accessible. <strong>Unresolved interpretation:</strong> no skip or automatic N/A rule is invented.</p></div><div class="comparison-item"><h3>Instructions refer to a missing Summary Report</h3><p><strong>Original:</strong> Instructions!A24 and Analyst Report!A4 mention a Summary Report tab; none is present among the 12 supplied sheets.</p><p><strong>Impact:</strong> The documented review path cannot be followed literally.</p><p><strong>Our handling:</strong> Review & export provides a clearly labelled preparation summary. <strong>Fixed mechanically for navigation:</strong> the original report and its scoring are not recreated.</p></div><div class="comparison-item"><h3>General-information header overstates the field range</h3><p><strong>Original:</strong> CoSN K-12CVAT!A6 says GNRL-01 through GNRL-15; actual IDs stop at GNRL-12. A17 assigns GNRL-11 and GNRL-12 to institution IT.</p><p><strong>Impact:</strong> Readers could look for nonexistent fields or assign institution-only fields to the vendor.</p><p><strong>Our handling:</strong> The actual 12 fields are preserved; vendor fields 01–10 and institution fields 11–12 are labelled. <strong>Fixed mechanically for this interface.</strong></p></div></details><h2>Privacy & storage</h2><p>The application has no backend, response uploads, analytics or third-party fonts. Draft saving is optional and uses local browser storage. Without it, closing or reloading this tab loses the draft. No student personal data, passwords, access tokens or confidential reports should be entered. Put document references here and keep the documents in your institution’s approved system.</p><p>Private Site access and local drafts are separate: the Site owner can access the hosted tool, but responses are only in the browser where they were entered. To move work between devices, export and import a JSON draft using an approved transfer method.</p><h2>Attribution & license</h2><p>CoSN’s Cybersecurity Advisory Team adapted the K–12 toolkit from EDUCAUSE’s Higher Education Community Vendor Assessment Tool – Lite (HECVAT-Lite), created by the Higher Education Information Security Council Shared Assessments Working Group, with EDUCAUSE’s permission.</p><p>The workbook states “(C) EDUCAUSE 2019” and licenses the work under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)</a>. This independent adaptation, including its added explanations and interface, is provided under the same license. Changes include the interactive workflow, explanations and browser-local draft format.</p><h2>Source record</h2><dl><dt>Version</dt><dd>Lite 4.1; workbook change log release date March 1, 2024.</dd><dt>Retrieved</dt><dd>October 21, 2026, from the user-specified CoSN link.</dd><dt>Workbook inspection</dt><dd>12 sheets; hidden sheets: Crosswalk Detail, High Risk Non-Compliant, Questions, Values. Drawing text, cell comments, validation lists, formulas and conditional formatting were inspected.</dd><dt>Source SHA-256</dt><dd><code>${data.sha256}</code></dd></dl><p>Some source instructions mention a Summary Report tab that is not present in this file, and one section header mentions GNRL-15 although the actual general fields end at GNRL-12. This adaptation follows the actual fields. Ask district IT to verify current requirements and references.</p></article>`;
}
document.addEventListener(
  "click",
  (event) => {
    if (
      event.target.closest('a[href^="#"]') &&
      (isComposing() || dictationBusy())
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      notify(
        dictationBusy()
          ? "Stop dictation and use or discard your transcript before changing pages."
          : "Finish this text entry before changing pages.",
      );
    }
  },
  true,
);
window.addEventListener("dictationstatechange", () => {
  if (!dictationBusy() && $("#notice").textContent.startsWith("Stop dictation"))
    $("#notice").textContent = "";
  document
    .querySelectorAll(
      "[data-intake-step],[data-next-field],#copy-request,#refresh-request",
    )
    .forEach((b) => (b.disabled = dictationBusy()));
});
window.addEventListener("hashchange", navigate);
window.addEventListener("pagehide", () => {
  if (persist) flushSave();
});
window.addEventListener("beforeunload", (e) => {
  if (persist) flushSave();
  if ((dirty && !persist) || dictationBusy()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
try {
  data = await (await fetch("questions.json")).json();
  questions = data.questions;
  try {
    draft = validateDraft(draft, questions);
  } catch {
    draft = blank();
    persist = false;
    notify(
      "The saved draft could not be read. Import a valid JSON backup to restore your work.",
    );
  }
  dirty = false;
  if (innerWidth < 768) $(".section-menu").open = false;
  navigate();
  bindOrientation({ hasSavedDraft: persist });
} catch (err) {
  $("#view").innerHTML =
    '<h1>The assessment could not load</h1><p>Reload this page. If the problem continues, use the <a href="' +
    sourceURL +
    '">original CoSN workbook</a>.</p>';
  console.error(err);
}
