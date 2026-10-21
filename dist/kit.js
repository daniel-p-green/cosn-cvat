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
}) {
  return `<label><span class="field-label">${escapeHTML(label)}</span><textarea id="${escapeHTML(id)}" name="${escapeHTML(id)}" maxlength="${maxLength}" autocomplete="off"${placeholder ? ` placeholder="${escapeHTML(placeholder)}"` : ""}>${escapeHTML(value)}</textarea></label>`;
}
export function CheckField({ id, label, checked = false, disabled = false }) {
  return `<label class="check"><input id="${escapeHTML(id)}" type="checkbox"${checked ? " checked" : ""}${disabled ? " disabled" : ""}>${escapeHTML(label)}</label>`;
}
export function Stat({ value, label, suffix = "" }) {
  return `<div><strong>${escapeHTML(value)}${suffix ? `<small> ${escapeHTML(suffix)}</small>` : ""}</strong><span>${escapeHTML(label)}</span></div>`;
}
