/** Browser speech state machine. No API keys, audio storage, automatic restart or direct microphone acquisition. */
export class DictationSession {
  constructor({ Recognition, onChange = () => {}, lang = "en-US" }) {
    this.Recognition = Recognition;
    this.onChange = onChange;
    this.lang = lang;
    this.phase = "idle";
    this.final = new Map();
    this.interim = "";
    this.error = "";
    this.cancelled = false;
  }
  snapshot() {
    return {
      phase: this.phase,
      transcript: [...this.final.entries()]
        .sort((a, b) => a[0] - b[0])
        .map((x) => x[1].trim())
        .filter(Boolean)
        .join(" "),
      interim: this.interim,
      error: this.error,
    };
  }
  emit() {
    this.onChange(this.snapshot());
  }
  start() {
    if (this.phase !== "idle") return;
    this.phase = "requesting";
    this.emit();
    try {
      const r = (this.recognition = new this.Recognition());
      r.lang = this.lang;
      r.continuous = true;
      r.interimResults = true;
      r.onstart = () => {
        if (this.cancelled) return;
        this.phase = "listening";
        this.emit();
      };
      r.onresult = (e) => {
        if (
          this.cancelled ||
          !["requesting", "listening", "stopping"].includes(this.phase)
        )
          return;
        const interim = [];
        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i];
          const text = result[0]?.transcript || "";
          if (result.isFinal) this.final.set(i, text);
          else interim.push(text);
        }
        this.interim = interim.join(" ");
        this.emit();
      };
      r.onerror = (e) => {
        if (this.cancelled) return;
        this.error = e.error || "unknown";
        this.phase = this.final.size ? "review" : "error";
        this.interim = "";
        this.emit();
        try {
          r.abort();
        } catch {}
      };
      r.onend = () => {
        if (this.cancelled) return;
        if (this.phase !== "error") this.phase = "review";
        this.interim = "";
        this.emit();
      };
      r.start();
    } catch (e) {
      this.error =
        e.name === "NotAllowedError" ? "not-allowed" : "start-failed";
      this.phase = "error";
      this.emit();
    }
  }
  stop() {
    if (!["requesting", "listening"].includes(this.phase)) return;
    this.phase = "stopping";
    this.emit();
    try {
      this.recognition.stop();
    } catch {
      this.phase = "review";
      this.emit();
    }
  }
  cancel() {
    this.cancelled = true;
    this.phase = "cancelled";
    this.interim = "";
    this.final.clear();
    try {
      this.recognition?.abort();
    } catch {}
    this.emit();
  }
}
export function mergeTranscript(current, transcript, mode = "append") {
  if (mode === "replace") return transcript;
  return (
    current +
    (current && transcript && !/\s$/.test(current) ? " " : "") +
    transcript
  );
}
export const speechErrorMessage = (code) =>
  ({
    "not-allowed":
      "Microphone permission was denied or dictation is blocked. Your text is unchanged. You can type or use your device keyboard’s dictation.",
    "service-not-allowed":
      "This browser’s speech service is unavailable or blocked. Your text is unchanged. Try keyboard dictation.",
    "audio-capture":
      "No microphone is available. Check your device input, or type your response.",
    "no-speech":
      "No speech was recognized. Try again, or use keyboard dictation.",
    network:
      "The browser’s speech service could not connect. Try again when connected, or use keyboard dictation.",
    "language-not-supported":
      "This browser’s speech service does not support the current language. Try keyboard dictation.",
    aborted: "Dictation stopped. Your existing field text is unchanged.",
    "start-failed":
      "Dictation could not start in this browser. Try keyboard dictation.",
  })[code] ||
  "Dictation could not complete. Your existing text is safe. Try again or use keyboard dictation.";
