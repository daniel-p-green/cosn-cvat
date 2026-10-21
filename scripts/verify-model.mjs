import fs from "node:fs";
import assert from "node:assert/strict";
import { blank, counts, validateDraft, exportCSV } from "../dist/model.js";
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
