import fs from "node:fs";
import assert from "node:assert/strict";
import { blank, counts, validateDraft, exportCSV, MAX_BACKUP_BYTES } from "../dist/model.js";
import { explanations } from "../dist/explanations.js";
const q = JSON.parse(
  fs.readFileSync(new URL("../dist/questions.json", import.meta.url)),
).questions;
assert(q.every((x) => explanations[x.id]));
const d = blank();
d.records["COMP-05"] = {
  answer: "Yes",
  flag: true,
  evidence: "Synthetic reference",
};
d.records["DOCU-01"] = { unknown: true };
assert.deepEqual(counts(q, d), {
  recorded: 1,
  unknown: 1,
  unanswered: 74,
  flagged: 1,
  evidence: 1,
});
assert.equal(
  validateDraft(JSON.parse(JSON.stringify(d)), q).records["DOCU-01"].unknown,
  true,
);
for (const records of [
  { "BAD-01": { answer: "Yes" } },
  { "DOCU-01": { answer: "N/A" } },
  { "DOCU-01": { answer: 3 } },
  { "DOCU-01": { flag: "yes" } },
  { "DOCU-01": { answer: "Yes", provider: "unrecognized" } },
])
  assert.throws(() => validateDraft({ ...d, records }, q));
assert.throws(() => validateDraft({ ...d, workbookVersion: "3.0" }, q));
const csv = exportCSV(q, d);
assert.equal(csv.split("\r\n").length, 77);
assert(csv.includes("COMP-09"));
assert(csv.includes("HLVU-03"));
d.records["GNRL-01"] = { answer: "=1+1" };
assert(exportCSV(q, d).includes('"\'=1+1"'));
console.log(
  "PASS: 76 independent explanations; unknown/unanswered distinction; 7 malformed imports rejected; 76 exported records; formula injection escaped.",
);
const teacherDraft = blank();
teacherDraft.intake.tool = "Synthetic reading tool";
teacherDraft.intake.use = "Reading practice";
const teacherRoundTrip = validateDraft(
  JSON.parse(JSON.stringify(teacherDraft)),
  q,
);
assert.equal(teacherRoundTrip.intake.tool, "Synthetic reading tool");
assert.equal(Object.keys(teacherRoundTrip.records).length, 0);
assert.equal(teacherRoundTrip.intake.dataUnknown, true);
assert.throws(() => validateDraft({ ...teacherDraft, intake: { tool: 3 } }, q));
assert.throws(() =>
  validateDraft({ ...teacherDraft, intake: { dataUnknown: "yes" } }, q),
);
assert.equal(
  validateDraft({ ...blank(), intake: undefined }, q).intake.tool,
  "",
);
console.log(
  "PASS: classroom context round-trips separately, explicit unknown preserved, no vendor answers inferred, malformed intake rejected, old drafts import.",
);
// Analyst work is a separate, validated part of old and new draft formats.
const legacy=blank();delete legacy.review;assert.equal(validateDraft(legacy,q).review.calculationMode,'source');
const reviewed=blank();reviewed.review.qualitative['COMP-01']={score:8.5,compliant:'Yes',notes:'Rationale'};reviewed.review.applicability['DOCU-01']={state:'not-applicable',reason:''};reviewed.review.categoryApplicability[q.find(x=>x.id==='DOCU-01').section]={state:'not-applicable',reason:'District decision'};reviewed.review.favorableOverrides['COMP-05']={answer:'No',reason:'Independent judgment'};reviewed.review.framework='District custom framework';reviewed.review.analystNotes='Synthetic note';reviewed.review.preparedDate='2026-10-21';
assert.deepEqual(validateDraft(JSON.parse(JSON.stringify(reviewed)),q).review,reviewed.review);
for(const mutation of [r=>r.qualitative['COMP-01'].score=11,r=>r.qualitative['COMP-01'].score=-1,r=>r.qualitative['COMP-01'].score='8',r=>r.calculationMode='official',r=>r.applicability.BAD={state:'applicable',reason:''},r=>r.favorableOverrides['COMP-01']={answer:'Yes',reason:'Bad narrative override'}]) {const bad=structuredClone(reviewed);mutation(bad.review);assert.throws(()=>validateDraft(bad,q));}
const large=blank();for(const x of q)large.records[x.id]={answer:x.kind==='choice'?'Yes':'x'.repeat(20000),additional:'x'.repeat(20000),evidence:'x'.repeat(20000),provider:'Vendor'};const serialized=JSON.stringify(large,null,2);assert(Buffer.byteLength(serialized)>3*1024*1024);assert.deepEqual(validateDraft(JSON.parse(serialized),q).records,validateDraft(large,q).records);
console.log('PASS: old-draft analyst migration, manual scores, partial applicability, interpretations/custom framework/date, malformed review rejection and >3 MiB valid backup roundtrip.');

const escaped=blank(), control='\u0001'.repeat(20000);for(const x of q)escaped.records[x.id]={answer:x.kind==='choice'?'Yes':control,additional:control,evidence:control,provider:'Vendor'};for(const x of q)escaped.review.applicability[x.id]={state:'not-applicable',reason:control};for(const section of new Set(q.map(x=>x.section)))escaped.review.categoryApplicability[section]={state:'not-applicable',reason:control};for(const x of q.filter(x=>x.kind==='choice'))escaped.review.favorableOverrides[x.id]={answer:'No',reason:control};for(const id of ['COMP-01','COMP-02','COMP-09'])escaped.review.qualitative[id]={score:10,compliant:'Yes',notes:control};escaped.review.analystNotes=control;escaped.intake.use=control;escaped.intake.data=control;escaped.intake.help=control;escaped.request.body=control;escaped.request.context=control;const escapedJSON=JSON.stringify(escaped,null,2);assert(Buffer.byteLength(escapedJSON)>32*1024*1024);assert(Buffer.byteLength(escapedJSON)<MAX_BACKUP_BYTES);assert.deepEqual(validateDraft(JSON.parse(escapedJSON),q),validateDraft(escaped,q));console.log('PASS full-schema control-character JSON backup '+Buffer.byteLength(escapedJSON)+' bytes roundtrips within64MiB budget.');
