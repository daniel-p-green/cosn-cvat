const SESSION_KEY = "cosn-cvat-orientation-seen";
const slides = [
  {
    title: "A simpler start to a tool review.",
    body: `<p>CoSN CVAT helps schools ask vendors about their services and safeguards.</p><p>This independent adaptation gives teachers a shorter starting point: describe the classroom idea, then prepare a request for IT.</p><div class="orientation-callout">You don’t need to know the technical answers.</div>`,
  },
  {
    title: "The right people do the checks.",
    body: `<ol class="orientation-roles"><li><strong>You</strong><span>Share the tool, classroom use and expected information.</span></li><li><strong>The vendor</strong><span>Confirms data practices and supplies safeguards evidence.</span></li><li><strong>Your IT team</strong><span>Reviews the proposed use through your district’s process.</span></li></ol><p>All 76 original CoSN fields remain in the separate vendor & IT review. No safety score or approval is generated.</p>`,
  },
  {
    title: "Three small steps. One useful request.",
    body: `<p>Add a tool, describe the activity, and choose the information you expect. “Not sure” is useful, too.</p><div class="orientation-example"><span>Fictional example · WordTrail</span><p>“I’d like my fourth-grade class to practice reading aloud. I expect audio recordings, but don’t know whether they’re kept.”</p><strong>The request for IT</strong><p>Please review the reading app and confirm sign-in, audio retention, deletion and vendor safeguards.</p></div><p>Type or use <strong>Dictate</strong> beside a writing field. Browser speech may process audio remotely; you review the transcript. Keep student details out.</p><p>Review and copy the request yourself. Device-only saving is optional; nothing sends automatically.</p>`,
  },
];
export function bindOrientation({ hasSavedDraft = false } = {}) {
  let dialog = document.getElementById("orientation"),
    opener,
    step = 0;
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "orientation";
    dialog.setAttribute("aria-labelledby", "orientation-title");
    document.body.append(dialog);
  }
  const markSeen = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "yes");
    } catch {}
  };
  const close = () => {
    markSeen();
    dialog.close();
    if (opener?.isConnected && opener !== document.body) opener.focus();
    else
      (
        document.getElementById("intake-tool") ||
        document.getElementById("main")
      )?.focus();
  };
  const render = () => {
    const s = slides[step];
    dialog.innerHTML = `<div class="orientation-top"><span>Getting started · ${step + 1} of ${slides.length}</span><button id="orientation-skip" type="button">Skip intro</button></div><div class="orientation-content"><h2 id="orientation-title" tabindex="-1">${s.title}</h2>${s.body}</div><div class="orientation-actions">${step ? '<button id="orientation-back">Back</button>' : "<span>CoSN CVAT · independent educator adaptation</span>"}<button id="orientation-next" class="primary">${step === slides.length - 1 ? "Start my classroom request" : "Next →"}</button></div>`;
    dialog.querySelector("#orientation-skip").onclick = close;
    dialog.querySelector("#orientation-back")?.addEventListener("click", () => {
      step--;
      render();
      dialog.querySelector("h2").focus();
    });
    dialog.querySelector("#orientation-next").onclick = () => {
      if (step === slides.length - 1) close();
      else {
        step++;
        render();
        dialog.querySelector("h2").focus();
      }
    };
  };
  const open = (event) => {
    if (dialog.open) return;
    opener = event?.currentTarget || document.activeElement;
    step = 0;
    render();
    dialog.showModal();
    dialog.querySelector("h2").focus();
  };
  dialog.addEventListener("cancel", () => {
    markSeen();
  });
  dialog.addEventListener("close", () => {
    markSeen();
    if (opener?.isConnected && opener !== document.body) opener.focus();
    else
      (
        document.getElementById("intake-tool") ||
        document.getElementById("main")
      )?.focus();
  });
  document.querySelector("#open-orientation")?.addEventListener("click", open);
  let seen = false;
  try {
    seen = sessionStorage.getItem(SESSION_KEY) === "yes";
  } catch {}
  if (!hasSavedDraft && !seen && ["", "#start"].includes(location.hash)) open();
}
