import {
  DictationSession,
  mergeTranscript,
  speechErrorMessage,
} from "./speech-controller.js";
let active = null,
  consent = false;
const mic =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
export const recognitionCapability = () => ({
  Recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
  supported: !!(
    window.isSecureContext &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  ),
});
export const dictationBusy = () => !!active;
function stateChanged() {
  window.dispatchEvent(new Event("dictationstatechange"));
}
function consentDialog(start) {
  let d = document.querySelector("#dictation-consent");
  if (!d) {
    d = document.createElement("dialog");
    d.id = "dictation-consent";
    d.innerHTML =
      '<form method="dialog"><h2>Use browser dictation?</h2><p>Your browser may send microphone audio to its speech-recognition provider. This site cannot guarantee local processing and does not store audio.</p><p>Use it only for non-sensitive classroom context. Do not speak student names, records, passwords or confidential reports.</p><p>Final words appear in a preview. You choose whether to add them to the field.</p><div class="actions"><button value="cancel">Not now</button><button type="button" class="primary" data-start-dictation>Start dictation</button></div></form>';
    document.body.append(d);
  }
  d.querySelector("[data-start-dictation]").onclick = () => {
    consent = true;
    d.close();
    start();
  };
  d.showModal();
}
export function bindDictation(root) {
  const cap = recognitionCapability();
  for (const field of root.querySelectorAll("textarea[data-writing-field]")) {
    const wrap = field.closest(".writing-field") || field.parentElement;
    const toolbar = document.createElement("div");
    toolbar.className = "speech-toolbar";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dictate-button";
    button.dataset.dictate = field.id;
    const label = field.labels?.[0]?.textContent?.trim() || "this field";
    button.setAttribute("aria-label", "Dictate into " + label);
    button.innerHTML = mic + "<span>Dictate</span>";
    const fallback = document.createElement("span");
    fallback.className = "speech-fallback";
    fallback.textContent = cap.supported
      ? "Review speech before adding."
      : "Browser dictation unavailable. Use keyboard dictation or type.";
    if (!cap.supported) {
      button.disabled = true;
      button.querySelector("span").textContent = "Dictation unavailable";
    }
    toolbar.append(button, fallback);
    field.before(toolbar);
    const panel = document.createElement("section");
    panel.className = "speech-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Dictation preview");
    panel.innerHTML =
      '<p class="speech-status" role="status" aria-live="polite"></p><div class="speech-preview"><strong>Final transcript</strong><p class="speech-final"></p><strong class="interim-label">Still recognizing · not added</strong><p class="speech-interim"></p></div><fieldset class="speech-mode"><legend>When you use the transcript</legend><label><input type="radio" name="speech-mode-' +
      field.id +
      '" value="append" checked> Add to the end</label><label><input type="radio" name="speech-mode-' +
      field.id +
      '" value="replace"> Replace all field text</label></fieldset><div class="speech-actions"><button type="button" data-speech-stop>Stop listening</button><button type="button" data-speech-use class="primary">Add transcript</button><button type="button" data-speech-cancel>Cancel & discard</button></div><p class="speech-privacy">Your browser/provider handles speech. Audio may leave your device. Only final words you choose to use enter this draft.</p>';
    field.after(panel);
    const status = panel.querySelector(".speech-status"),
      use = panel.querySelector("[data-speech-use]"),
      stop = panel.querySelector("[data-speech-stop]");
    const cancelButton = panel.querySelector("[data-speech-cancel]");
    const listeningActions = document.createElement("div");
    listeningActions.className = "speech-actions speech-listening-actions";
    listeningActions.append(stop, cancelButton);
    panel.querySelector(".speech-preview").before(listeningActions);

    const close = () => {
      if (active?.field === field) active = null;
      panel.hidden = true;
      document
        .querySelectorAll("[data-dictate]")
        .forEach((b) => (b.disabled = !recognitionCapability().supported));
      delete field.dataset.voiceActive;
      stateChanged();
    };
    const begin = () => {
      if (active) return;
      panel.querySelector("input[value=append]").checked = true;
      use.textContent = "Add transcript";
      panel.hidden = false;
      field.dataset.voiceActive = "true";
      document
        .querySelectorAll("[data-dictate]")
        .forEach((b) => (b.disabled = true));
      let shownListening = false;
      const controller = new DictationSession({
        Recognition: cap.Recognition,
        lang: navigator.language || "en-US",
        onChange: (s) => {
          if (active?.field !== field) return;
          panel.querySelector(".speech-final").textContent =
            s.transcript || "No final words yet.";
          panel.querySelector(".speech-interim").textContent = s.interim;
          panel.querySelector(".interim-label").hidden = !s.interim;
          const running = ["requesting", "listening", "stopping"].includes(
            s.phase,
          );
          if (s.phase === "listening" && !shownListening) {
            shownListening = true;
            panel.scrollIntoView({ block: "nearest", behavior: "instant" });
          }
          cancelButton.textContent = running
            ? "Cancel & discard"
            : "Discard transcript";
          stop.hidden = !running;
          stop.disabled = s.phase === "stopping";
          use.disabled = running || !s.transcript;
          status.textContent = s.error
            ? speechErrorMessage(s.error)
            : s.phase === "requesting"
              ? "Waiting for microphone permission…"
              : s.phase === "listening"
                ? "Listening — speak now."
                : s.phase === "stopping"
                  ? "Stopping — waiting for final words…"
                  : s.transcript
                    ? "Stopped. Review your final words, then add or discard them."
                    : "No final words received. Cancel and try again, or type.";
          stateChanged();
        },
      });
      active = { field, controller };
      stateChanged();
      controller.start();
    };
    button.onclick = () => {
      if (!cap.supported || active) return;
      consent ? begin() : consentDialog(begin);
    };
    stop.onclick = () => active?.field === field && active.controller.stop();
    panel.querySelector("[data-speech-cancel]").onclick = () => {
      if (active?.field !== field) return;
      active.controller.cancel();
      close();
      field.focus({ preventScroll: true });
    };
    for (const radio of panel.querySelectorAll("input[type=radio]"))
      radio.onchange = () => {
        use.textContent =
          radio.value === "replace" && radio.checked
            ? "Replace field text"
            : "Add transcript";
      };
    use.onclick = () => {
      if (active?.field !== field) return;
      if (field.dataset.composing === "true") {
        status.textContent = "Finish typing before adding the transcript.";
        return;
      }
      const snapshot = active.controller.snapshot();
      if (
        ["requesting", "listening", "stopping"].includes(snapshot.phase) ||
        !snapshot.transcript
      )
        return;
      const mode = panel.querySelector("input:checked").value;
      const next = mergeTranscript(field.value, snapshot.transcript, mode);
      if (next.length > field.maxLength) {
        status.textContent =
          `This would exceed the field’s ${field.maxLength.toLocaleString('en-US')}-character limit. Nothing was added. Shorten the existing text or try a shorter dictation.`;
        return;
      }
      active.controller.cancel();
      close();
      field.value = next;
      field.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertFromDictation",
          data: snapshot.transcript,
        }),
      );
      field.dispatchEvent(new Event("change", { bubbles: true }));
      field.focus({ preventScroll: true });
      field.setSelectionRange(next.length, next.length);
    };
  }
}
window.addEventListener("pagehide", () => {
  active?.controller.cancel();
  active = null;
});
