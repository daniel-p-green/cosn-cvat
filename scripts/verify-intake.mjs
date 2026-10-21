import assert from "node:assert/strict";
import fs from "node:fs";
import { blank, validateDraft, counts } from "../dist/model.js";
import {
  generateRequest,
  currentRequest,
  expectedDataText,
  stepStatuses,
  nextStep,
  requestContext,
  IntakeView,
  HandoffView,
} from "../dist/intake.js";
const q = JSON.parse(
  fs.readFileSync(new URL("../dist/questions.json", import.meta.url)),
).questions;
const d = blank();
assert.deepEqual(stepStatuses(d.intake), [
  "Needs a detail",
  "Needs a detail",
  "Not sure yet",
]);
d.intake.tool = "WordTrail";
d.intake.use = "Reading aloud for ten minutes.";
d.intake.expectedData = ["audio"];
d.intake.data = "Teacher expects recordings.";
assert.equal(d.intake.dataUnknown, true);
assert(expectedDataText(d.intake).includes("Audio"));
assert.deepEqual(stepStatuses(d.intake), ["Added", "Added", "Not sure yet"]);
assert.equal(nextStep(d.intake), 2);
const r = generateRequest(d.intake);
assert(r.subject.includes("WordTrail"));
assert(r.body.includes(d.intake.use));
assert(r.body.includes("Audio"));
assert(r.body.includes("still unsure"));
assert(r.body.includes("not vendor-confirmed"));
assert(r.body.includes("district’s process"));
d.request = {
  ...r,
  body: "My edited request",
  edited: true,
  context: requestContext(d.intake),
};
d.intake.use = "Changed classroom idea";
assert.equal(currentRequest(d).body, "My edited request");
assert.notEqual(d.request.context, requestContext(d.intake));
d.updatedAt = "2026-10-21T12:00:00.000Z";
assert.deepEqual(validateDraft(JSON.parse(JSON.stringify(d)), q), d);
const old = {
  ...blank(),
  intake: {
    tool: "Old draft",
    use: "Existing use",
    data: "Some known data",
    help: "",
    dataUnknown: true,
  },
  updatedAt: d.updatedAt,
};
delete old.request;
const migrated = validateDraft(old, q);
assert.equal(migrated.intake.dataUnknown, true);
assert.deepEqual(migrated.intake.expectedData, []);
assert.equal(migrated.intake.website, "");
assert.equal(migrated.updatedAt, d.updatedAt);
assert.equal(migrated.request.edited, false);
for (const expectedData of [
  ["none", "audio"],
  ["invented"],
  ["audio", "audio"],
  "audio",
])
  assert.throws(() =>
    validateDraft({ ...d, intake: { ...d.intake, expectedData } }, q),
  );
assert.equal(counts(q, d).recorded, 0);
const long = blank();
for (const key of ["tool", "website", "use", "data", "help"])
  long.intake[key] = "x".repeat(20000);
const concise = generateRequest(long.intake);
assert(concise.body.length < 3000);
assert(concise.subject.length < 200);
assert(requestContext(long.intake).length < 50);
long.request = {
  ...concise,
  edited: true,
  context: requestContext(long.intake),
};
assert.equal(validateDraft(long, q).intake.use.length, 20000);
const start = IntakeView(d, true, true, 0),
  handoff = HandoffView(d, q);
assert(start.includes("Fictional example"));
assert(start.includes("Continue WordTrail"));
assert(start.includes("on this device only"));
assert(start.includes("More room for the name"));
for (const key of ["tool", "website", "use", "data", "help"])
  assert(handoff.includes(`#edit/${key}`));
assert(handoff.includes("Copy request for IT"));
assert(handoff.includes("Save a backup"));
assert(handoff.includes("Open a backup"));
assert(handoff.includes("Your classroom notes changed"));
console.log(
  "PASS: ten-improvement intake model, editable request, data choices, independent uncertainty, statuses, resume timestamp, five edit routes, backup labels, source separation and old-draft migration.",
);
