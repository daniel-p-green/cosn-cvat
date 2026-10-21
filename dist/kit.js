/** Small, portable component kit. Native controls retain browser keyboard behavior.
 * Semantic tokens and variants follow the shadcn convention; this buildless kit
 * does not depend on React or claim to be the shadcn package.
 */
export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function Button({ id, label, variant = "default", disabled = false }) {
  return `<button${id ? ` id="${escapeHTML(id)}"` : ""} class="${variant === "primary" ? "primary" : variant === "link" ? "link" : variant === "destructive" ? "danger" : ""}"${disabled ? " disabled" : ""}>${escapeHTML(label)}</button>`;
}
export function TextAreaField({
  id,
  label,
  value = "",
  placeholder = "",
  maxLength = 20000,
  description = "",
}) {
  return `<div class="writing-field"><label for="${escapeHTML(id)}"><span class="field-label">${escapeHTML(label)}</span></label>${description ? `<p class="field-description" id="description-${escapeHTML(id)}">${escapeHTML(description)}</p>` : ""}<textarea ${description ? `aria-describedby="description-${escapeHTML(id)}"` : ""} data-writing-field id="${escapeHTML(id)}" name="${escapeHTML(id)}" rows="4" spellcheck="true" autocapitalize="sentences" enterkeyhint="next" maxlength="${maxLength}" autocomplete="off"${placeholder ? ` placeholder="${escapeHTML(placeholder)}"` : ""}>${escapeHTML(value)}</textarea><div class="field-foot"><span class="writing-state">Writing here</span><button type="button" class="field-next" data-next-field="${escapeHTML(id)}">Next writing field</button></div></div>`;
}
export function CheckField({ id, label, checked = false, disabled = false }) {
  return `<label class="check"><input id="${escapeHTML(id)}" type="checkbox"${checked ? " checked" : ""}${disabled ? " disabled" : ""}>${escapeHTML(label)}</label>`;
}
export function Stat({ value, label, suffix = "" }) {
  return `<div><strong>${escapeHTML(value)}${suffix ? `<small> ${escapeHTML(suffix)}</small>` : ""}</strong><span>${escapeHTML(label)}</span></div>`;
}
