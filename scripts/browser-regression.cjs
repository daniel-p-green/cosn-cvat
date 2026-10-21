// Run a local preview first. Uses an isolated browser and mocked speech; never grants a microphone.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const base = process.env.TEST_URL || "http://127.0.0.1:4173",
  out = process.env.TEST_OUTPUT || "/tmp/cosn-cvat-regression";
const source = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../dist/questions.json")),
);
function mockSpeech() {
  window.__starts = 0;
  window.__instances = [];
  class Mock {
    constructor() {
      window.__instances.push(this);
    }
    start() {
      window.__starts++;
      this.onstart?.();
    }
    stop() {
      this.onend?.();
    }
    abort() {
      this.onend?.();
    }
    results(items) {
      this.onresult?.({
        results: items.map(([text, final]) =>
          Object.assign([{ transcript: text }], { isFinal: final }),
        ),
      });
    }
  }
  window.SpeechRecognition = Mock;
  window.webkitSpeechRecognition = Mock;
}
async function noOverflow(p, label) {
  if (
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ) {
    console.log(
      label,
      await p.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        inner: innerWidth,
        els: [...document.body.querySelectorAll("*")]
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => ({
            tag: e.tagName,
            cls: e.className,
            right: e.getBoundingClientRect().right,
            text: e.innerText?.slice(0, 40),
          })),
      })),
    );
    await p.screenshot({
      path: path.join(out, "overflow.png"),
      fullPage: true,
    });
  }
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    label + " overflow",
  );
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "chrome",
    headless: true,
  });
  const results = [];
  for (const [name, w, h] of [
    ["desktop", 1440, 1000],
    ["ipad-portrait", 768, 1024],
    ["ipad-landscape", 1024, 768],
    ["phone", 390, 844],
    ["small-phone", 320, 740],
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      acceptDownloads: true,
    });
    await ctx.addInitScript(mockSpeech);
    const p = await ctx.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    await p.waitForSelector("#orientation[open]");
    assert.equal(await p.evaluate(() => window.__starts), 0);
    await p.keyboard.press("Tab");
    assert(
      await p.evaluate(() =>
        document.querySelector("#orientation").contains(document.activeElement),
      ),
    );
    await p.keyboard.press("Escape");
    assert.equal(await p.locator("#orientation[open]").count(), 0);
    await p.click("#open-orientation");
    for (let i = 0; i < 2; i++) await p.click("#orientation-next");
    assert(
      (await p.locator("#orientation").innerText()).includes(
        "Fictional example",
      ),
    );
    await p.click("#orientation-next");
    await p.reload();
    await p.waitForSelector("#intake-tool");
    assert.equal(await p.locator("#orientation[open]").count(), 0);
    assert.equal(await p.locator("#intake-tool").getAttribute("rows"), "1");
    await p.click("[data-expand]");
    assert.equal(await p.locator("#intake-tool").getAttribute("rows"), "3");
    await p.check("#persist");
    await p.fill("#intake-tool", "WordTrail fictional");
    await p.click('[data-intake-step="1"]');
    await p.fill("#intake-use", "Reading aloud.");
    // Composition/autosave never replaces the field or moves its caret.
    await p.locator("#intake-use").focus();
    await p.evaluate(() => {
      const t = document.querySelector("#intake-use");
      window.__field = t;
      t.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      );
      t.value = "Reading aloud with my class.";
      t.setSelectionRange(8, 8);
      t.dispatchEvent(
        new InputEvent("input", { bubbles: true, isComposing: true }),
      );
    });
    await p.waitForTimeout(450);
    assert(
      await p.evaluate(
        () =>
          window.__field === document.querySelector("#intake-use") &&
          document.activeElement === window.__field &&
          window.__field.selectionStart === 8,
      ),
    );
    await p.evaluate(() =>
      document
        .querySelector("#intake-use")
        .dispatchEvent(
          new CompositionEvent("compositionend", { bubbles: true }),
        ),
    );
    await p.click('[data-dictate="intake-use"]');
    assert.equal(await p.evaluate(() => window.__starts), 0);
    assert(
      (await p.locator("#dictation-consent").innerText()).includes(
        "may send microphone audio",
      ),
    );
    await p.click("[data-start-dictation]");
    await p.evaluate(() =>
      window.__instances.at(-1).results([
        ["Spoken detail.", true],
        ["interim words", false],
      ]),
    );
    assert.equal(await p.locator("[data-speech-use]").isDisabled(), true);
    assert(await p.locator('[data-intake-step="2"]').first().isDisabled());
    await p.fill("#intake-use", "Edited during dictation.");
    await p.click("[data-speech-stop]");
    await p.click("[data-speech-use]");
    assert.equal(
      await p.locator("#intake-use").inputValue(),
      "Edited during dictation. Spoken detail.",
    );
    await p.click('[data-dictate="intake-use"]');
    await p.evaluate(() =>
      window.__instances.at(-1).results([["Replacement.", true]]),
    );
    await p.click("[data-speech-stop]");
    await p.check(".speech-mode input[value=replace]");
    await p.click("[data-speech-use]");
    assert.equal(await p.locator("#intake-use").inputValue(), "Replacement.");
    await p.click('[data-dictate="intake-use"]');
    await p.evaluate(() =>
      window.__instances.at(-1).results([["Discard.", true]]),
    );
    await p.click(".speech-panel:not([hidden]) [data-speech-cancel]");
    await p.evaluate(() =>
      window.__instances.at(-1).results([["Late.", true]]),
    );
    assert.equal(await p.locator("#intake-use").inputValue(), "Replacement.");
    await p.click('[data-dictate="intake-use"]');
    await p.evaluate(() =>
      window.__instances.at(-1).onerror({ error: "not-allowed" }),
    );
    assert((await p.locator(".speech-status").innerText()).includes("denied"));
    await p.click(".speech-panel:not([hidden]) [data-speech-cancel]");
    await p.click('[data-intake-step="2"]');
    assert(await p.isChecked("#data-unknown"));
    await p.check('[data-data-choice="audio"]');
    await p.check('[data-data-choice="schoolwork"]');
    await p.locator(".optional-question").first().locator("summary").click();
    await p.fill("#intake-data", "Recordings and written responses.");
    assert(await p.isChecked("#data-unknown"));
    assert(
      (await p.locator('[data-step-status="2"]').innerText()).includes(
        "Not sure",
      ),
    );
    await p.check('[data-data-choice="none"]');
    assert.equal(await p.isChecked('[data-data-choice="audio"]'), false);
    await p.check('[data-data-choice="audio"]');
    assert.equal(await p.isChecked('[data-data-choice="none"]'), false);
    assert(await p.isChecked("#data-unknown"));
    await p.click('.step-actions a[href="#handoff"]');
    await p.waitForSelector("#copy-request");
    assert(
      (await p.locator("#request-body").inputValue()).includes("still unsure"),
    );
    assert((await p.locator("#request-body").inputValue()).includes("Audio"));
    assert.equal(
      await p.locator(".preflight a").innerText(),
      "Information: not sure yet",
    );
    // Editable subject/body copy uses current edits; clipboard mocked, no external delivery.
    await p.fill("#request-subject", "Please review our reading idea");
    await p.fill("#request-body", "A concise edited request.");
    await p.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (text) => (window.__copied = text) },
      }),
    );
    await p.click("#copy-request");
    assert.equal(
      await p.evaluate(() => window.__copied),
      "Subject: Please review our reading idea\n\nA concise edited request.",
    );
    for (const key of ["tool", "website", "use", "data", "help"]) {
      await p.click(`.context-section a[href="#edit/${key}"]`);
      await p.waitForFunction(
        (id) => document.activeElement.id === id,
        "intake-" + key,
      );
      await p.fill(
        "#intake-" + key,
        key === "tool" ? "WordTrail fictional" : `Edited ${key}`,
      );
      await p.click('.step-actions a[href="#handoff"]');
      await p.waitForSelector("#copy-request");
    }
    assert.equal(
      await p.locator("#request-body").inputValue(),
      "A concise edited request.",
    );
    assert(await p.locator(".request-stale").isVisible());
    await p.locator(".handoff-utilities summary").click();
    let event = p.waitForEvent("download");
    await p.click("#teacher-json");
    const dl = await event,
      fp = path.join(out, name + ".json");
    await dl.saveAs(fp);
    const payload = JSON.parse(fs.readFileSync(fp));
    assert(payload.intake.dataUnknown);
    assert.equal(payload.request.body, "A concise edited request.");
    assert.equal(Object.keys(payload.records).length, 0);
    await p.reload();
    await p.waitForSelector("#copy-request");
    assert.equal(await p.locator("#orientation[open]").count(), 0);
    assert.equal(
      await p.locator("#request-body").inputValue(),
      "A concise edited request.",
    );
    await p.click('a[href="#start"]');
    await p.waitForSelector(".resume-draft");
    assert(
      (await p.locator(".resume-draft").innerText()).includes(
        "WordTrail fictional",
      ),
    );
    assert(
      (await p.locator(".resume-draft").innerText()).includes(
        "on this device only",
      ),
    );
    await p.locator(".resume-draft button").click();
    assert(await p.locator("#data-unknown").isVisible());
    await noOverflow(p, name + " intake");
    await p.screenshot({
      path: path.join(out, name + "-intake.png"),
      fullPage: true,
    });
    await p.click('.step-actions a[href="#handoff"]');
    await p.screenshot({
      path: path.join(out, name + "-handoff.png"),
      fullPage: true,
    });
    await noOverflow(p, name + " handoff");
    // 200% text enlargement and a keyboard-like reduced visual area. This is desktop simulation.
    await p.evaluate(() => {
      const sizes = [...document.body.querySelectorAll("*")].map((el) => [
        el,
        parseFloat(getComputedStyle(el).fontSize),
      ]);
      sizes.forEach(([el, size]) =>
        el.style.setProperty("font-size", size * 2 + "px", "important"),
      );
    });
    await p.setViewportSize({
      width: w,
      height: Math.max(320, Math.floor(h * 0.55)),
    });
    await noOverflow(p, name + " enlarged/reduced");
    await p.locator("#copy-request").scrollIntoViewIfNeeded();
    assert(await p.locator("#copy-request").isVisible());
    await p.setViewportSize({ width: w, height: h });
    await p.reload();
    await p.waitForSelector("#copy-request");
    await p.click('a[href="#questions"]');
    await p.waitForSelector("#answer");
    await p
      .getByRole("button", { name: "Browse questions", exact: true })
      .click();
    assert.equal(await p.locator(".question-row").count(), 76);
    assert.deepEqual(
      await p.locator(".question-row span").allTextContents(),
      source.questions.map((q) => q.text),
    );
    await p.locator("#search").fill("DOCU-01");
    await p.locator(".question-row").click();
    await p.getByRole("radio", { name: "Not yet known", exact: true }).check();
    await p.getByRole("link", { name: "Review & export", exact: true }).click();
    await p.waitForSelector("#export-csv");
    event = p.waitForEvent("download");
    await p.click("#export-csv");
    const csv = await event;
    const cf = path.join(out, name + ".csv");
    await csv.saveAs(cf);
    assert(fs.readFileSync(cf, "utf8").includes("HLVU-03"));
    await noOverflow(p, name + " full review");
    assert.deepEqual(errors, []);
    results.push({ name, width: w, height: h, passed: true });
    await ctx.close();
  }
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await ctx.addInitScript(() => {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
    sessionStorage.setItem("cosn-cvat-orientation-seen", "yes");
  });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForSelector("#intake-tool");
  assert(await p.locator('[data-dictate="intake-tool"]').isDisabled());
  assert(
    (await p.locator(".speech-fallback").first().innerText()).includes(
      "unavailable",
    ),
  );
  await p.fill("#intake-tool", "Typed tool");
  await p.click('[data-intake-step="1"]');
  assert(await p.locator("#intake-use").isVisible());
  await ctx.close();
  await browser.close();
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(
      {
        results,
        mockedSpeech: true,
        noRealMic: true,
        unsupportedFallback: true,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        results,
        mockedSpeech: true,
        noRealMic: true,
        unsupportedFallback: true,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
