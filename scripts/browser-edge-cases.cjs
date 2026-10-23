// Run after browser-regression.cjs; synthetic data and mocked speech only.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("assert/strict");
const base = process.env.TEST_URL || "http://127.0.0.1:4173",
  out = process.env.TEST_OUTPUT || "/tmp/cosn-cvat-regression";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true }),
    ctx = await b.newContext({
      viewport: { width: 390, height: 420 },
      acceptDownloads: true,
    });
  await ctx.addInitScript(() => {
    window.__instances = [];
    class M {
      constructor() {
        window.__instances.push(this);
      }
      start() {
        this.onstart?.();
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    window.SpeechRecognition = M;
    window.webkitSpeechRecognition = M;
  });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForSelector("#intake-tool");
  assert.equal(await p.locator("#orientation[open]").count(), 0);
  if(await p.locator("#menu-toggle").isVisible()){await p.click("#menu-toggle");await p.click("#mobile-help");}else await p.click("#open-orientation");
  await p.click("#orientation-skip");
  assert.equal(
    await p.evaluate(() => document.activeElement.id),
    await p.locator("#menu-toggle").isVisible() ? "menu-toggle" : "open-orientation",
  );
  await p.click('[data-intake-step="1"]');
  await p.fill("#intake-use", "Known classroom idea");
  await p.click('[data-dictate="intake-use"]');
  await p.click("[data-start-dictation]");
  await p.evaluate(() =>
    window.__instances.at(-1).onresult({
      results: [
        Object.assign([{ transcript: "Dictated addition." }], {
          isFinal: true,
        }),
      ],
    }),
  );
  await p.click("[data-speech-stop]");
  await p.evaluate(() => {
    const sizes = [...document.body.querySelectorAll("*")].map((el) => [
      el,
      parseFloat(getComputedStyle(el).fontSize),
    ]);
    sizes.forEach(([el, size]) =>
      el.style.setProperty("font-size", size * 2 + "px", "important"),
    );
  });
  await p.locator("[data-speech-use]").scrollIntoViewIfNeeded();
  await p.click("[data-speech-use]");
  assert(
    (await p.locator("#intake-use").inputValue()).includes(
      "Dictated addition.",
    ),
  );
  await p
    .locator('.step-actions [data-intake-step="2"]')
    .scrollIntoViewIfNeeded();
  await p.click('.step-actions [data-intake-step="2"]');
  await p.click('.step-actions a[href="#handoff"]');
  await p.waitForSelector("#copy-request");
  await p.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
    }),
  );
  await p.click("#copy-request");
  assert(await p.locator("#manual-copy").isVisible());
  assert(
    (await p.locator("#manual-copy").inputValue()).includes(
      "Dictated addition.",
    ),
  );
  await p.locator("#request-editor summary").click();
  await p.fill("#request-body", "Edited copy");
  await p.click('[data-dictate="request-body"]');
  await p.locator("#request-editor summary").click();
  assert.equal(await p.locator("#request-editor").getAttribute("open"), "");
  assert(await p.locator("#copy-request").isDisabled());
  await p.click(".speech-panel:not([hidden]) [data-speech-cancel]");
  assert.equal(await p.locator("#request-body").inputValue(), "Edited copy");
  await p.click("#refresh-request");
  await p.waitForSelector("#confirm[open]");
  await p.click("#confirm [value=cancel]");
  assert.equal(await p.locator("#request-body").inputValue(), "Edited copy");
  await p.click("#refresh-request");
  await p.click("#confirm [value=confirm]");
  await p.waitForFunction(() =>
    document
      .querySelector("#request-body")
      ?.value.includes("Dictated addition."),
  );
  await p.click(".handoff-utilities summary");
  await p.setInputFiles("#import", out + "/desktop.json");
  await p.waitForSelector("#confirm[open]");
  await p.click("#confirm [value=confirm]");
  await p.waitForFunction(
    () =>
      document.querySelector("#request-body")?.value ===
      "A concise edited request.",
  );
  await p.emulateMedia({ media: "print" });
  assert(await p.locator("#print-request").isVisible());
  assert(
    (await p.locator("#print-request").innerText()).includes(
      "A concise edited request.",
    ),
  );
  assert.equal(await p.locator("#request-body").isVisible(), false);
  await p.emulateMedia({ media: "screen" });
  await p.click(".handoff-utilities summary");
  await p.check("#persist");
  const saved = await p.evaluate(() =>
    localStorage.getItem("cosn-cvat-lite-4.1-draft-v1"),
  );
  const ctx2 = await b.newContext();
  await ctx2.addInitScript(
    (d) => localStorage.setItem("cosn-cvat-lite-4.1-draft-v1", d),
    saved,
  );
  const p2 = await ctx2.newPage();
  await p2.goto(base);
  await p2.waitForSelector(".resume-draft");
  assert.equal(await p2.locator("#orientation[open]").count(), 0);
  await ctx2.close();
  await ctx.close();
  await b.close();
  console.log(
    "PASS extra: first-run focus, 200% text+reduced-height Next and Use transcript, clipboard-denied manual copy, refresh cancel/confirm, JSON UI import, full print text, returning draft in fresh session. No real microphone used.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
