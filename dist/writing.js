import { bindDictation, dictationBusy } from "./dictation.js";
/** Stable native text fields, plus separately controlled opt-in browser dictation. */
export function bindWritingFields(root, { onInput, onCommit }) {
  const fields = [...root.querySelectorAll("textarea[data-writing-field]")];
  fields.forEach((field, index) => {
    const fitCompact = () => {
      if (field.closest(".compact-field") && field.rows === 1) {
        field.style.height = "auto";
        field.style.height = Math.max(58, field.scrollHeight + 2) + "px";
      }
    };
    fitCompact();
    field.addEventListener("input", fitCompact);
    const next = root.querySelector(`[data-next-field="${field.id}"]`);
    let lastCommitted = field.value;
    const commit = () => {
      if (field.value !== lastCommitted) {
        onCommit?.(field, field.value);
        lastCommitted = field.value;
      }
    };
    field.addEventListener("compositionstart", () => {
      field.dataset.composing = "true";
      if (next) next.disabled = true;
    });
    field.addEventListener("input", (e) =>
      onInput(
        field,
        field.value,
        e.isComposing || field.dataset.composing === "true",
      ),
    );
    field.addEventListener("compositionend", () => {
      delete field.dataset.composing;
      if (next) next.disabled = false;
      onInput(field, field.value, false);
      commit();
    });
    field.addEventListener("blur", () => {
      if (field.dataset.composing !== "true") commit();
    });
    if (next) {
      next.textContent =
        index === fields.length - 1
          ? "First writing field"
          : "Next writing field";
      next.addEventListener("click", () => {
        if (field.dataset.composing === "true" || dictationBusy()) return;
        commit();
        const target = fields[(index + 1) % fields.length];
        const disclosure = target.closest("details");
        if (disclosure) disclosure.open = true;
        target.focus({ preventScroll: true });
        // Leave the browser in charge of the keyboard and dictation. No focus on input/save.
        target.scrollIntoView({ block: "center", behavior: "instant" });
      });
    }
  });
  bindDictation(root);
}
export const isComposing = () =>
  !!document.querySelector('textarea[data-composing="true"]');
export function DictationHelp() {
  return `<details class="dictation-help"><summary>About microphone & keyboard dictation</summary><div><p>Tap a writing field, then use the dictation microphone on your iPad’s keyboard or Shortcuts bar. Review the text and stop dictation before moving to the next field.</p><p>If dictation is missing, check Settings → General → Keyboard → Enable Dictation. Availability varies by device and language. <a href="https://support.apple.com/guide/ipad/dictate-text-ipad55d35a41/ipados">Apple’s dictation guide</a></p><p>The Dictate control uses your browser’s speech service when available; audio may be processed remotely. You review the transcript before adding it. Keyboard dictation uses your device’s own speech service and privacy settings. Do not dictate student personal information.</p></div></details>`;
}
