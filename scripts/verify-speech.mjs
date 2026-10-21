import assert from "node:assert/strict";
import {
  DictationSession,
  mergeTranscript,
  speechErrorMessage,
} from "../dist/speech-controller.js";
class MockRecognition {
  constructor() {
    MockRecognition.last = this;
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.stopped = true;
  }
  abort() {
    this.aborted = true;
    this.onend?.();
  }
  results(items) {
    this.onresult({
      results: items.map(([text, final]) =>
        Object.assign([{ transcript: text }], { isFinal: final }),
      ),
    });
  }
}
const changes = [];
let s = new DictationSession({
  Recognition: MockRecognition,
  onChange: (x) => changes.push(x),
});
s.start();
assert.equal(s.phase, "listening");
const r = MockRecognition.last;
r.results([
  ["First phrase", true],
  ["tentative", false],
]);
assert.equal(s.snapshot().transcript, "First phrase");
assert.equal(s.snapshot().interim, "tentative");
r.results([
  ["First phrase", true],
  ["Second phrase", true],
]);
assert.equal(s.snapshot().transcript, "First phrase Second phrase");
s.stop();
assert(r.stopped);
assert.equal(s.phase, "stopping");
r.onend();
assert.equal(s.phase, "review");
assert.equal(s.snapshot().interim, "");
assert.equal(
  mergeTranscript("Edited while listening.", "First phrase Second phrase"),
  "Edited while listening. First phrase Second phrase",
);
assert.equal(
  mergeTranscript("Old text", "Replacement", "replace"),
  "Replacement",
);
s.cancel();
assert(r.aborted);
r.results([["Late words", true]]);
assert.equal(s.snapshot().transcript, "");
assert.equal(s.phase, "cancelled");
s = new DictationSession({ Recognition: MockRecognition });
s.start();
MockRecognition.last.onerror({ error: "not-allowed" });
assert.equal(s.phase, "error");
assert.equal(s.error, "not-allowed");
assert(MockRecognition.last.aborted);
assert(speechErrorMessage(s.error).includes("denied"));
s = new DictationSession({
  Recognition: class {
    start() {
      throw Object.assign(new Error(), { name: "NotAllowedError" });
    }
  },
});
s.start();
assert.equal(s.phase, "error");
assert.equal(s.error, "not-allowed");
s = new DictationSession({ Recognition: MockRecognition });
s.start();
MockRecognition.last.results([
  ["Keep final words", true],
  ["uncommitted", false],
]);
MockRecognition.last.onerror({ error: "network" });
assert.equal(s.snapshot().transcript, "Keep final words");
assert.equal(s.snapshot().interim, "");
assert.equal(s.phase, "review");
console.log(
  "PASS: dictation start/listen/interim/final/deduplication/stop/end/cancel/late events/errors; append preserves current edits, replace explicit, interim never committed.",
);
