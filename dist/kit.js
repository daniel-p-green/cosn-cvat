import {MAX_CELL_CHARACTERS} from './limits.js';
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
  maxLength = MAX_CELL_CHARACTERS,
  description = "",
  rows = 4,
}) {
  return `<div class="writing-field"><label for="${escapeHTML(id)}"><span class="field-label">${escapeHTML(label)}</span></label>${description ? `<p class="field-description" id="description-${escapeHTML(id)}">${escapeHTML(description)}</p>` : ""}<textarea ${description ? `aria-describedby="description-${escapeHTML(id)}"` : ""} data-writing-field id="${escapeHTML(id)}" name="${escapeHTML(id)}" rows="${rows}" spellcheck="true" autocapitalize="sentences" enterkeyhint="next" maxlength="${maxLength}" autocomplete="off"${placeholder ? ` placeholder="${escapeHTML(placeholder)}"` : ""}>${escapeHTML(value)}</textarea><div class="field-foot"><span class="writing-state">Writing here</span><button type="button" class="field-next" data-next-field="${escapeHTML(id)}">Next writing field</button></div></div>`;
}
export function CheckField({ id, label, checked = false, disabled = false }) {
  return `<label class="check"><input id="${escapeHTML(id)}" type="checkbox"${checked ? " checked" : ""}${disabled ? " disabled" : ""}>${escapeHTML(label)}</label>`;
}
export function Stat({ value, label, suffix = "" }) {
  return `<div><strong>${escapeHTML(value)}${suffix ? `<small> ${escapeHTML(suffix)}</small>` : ""}</strong><span>${escapeHTML(label)}</span></div>`;
}
/** Original geometric education/civic pictograms; no third-party assets. */
export function Icon(name) {
  const paths = {
    cap: '<path d="M2 9 12 4l10 5-10 5L2 9Z"/><path d="M6 11v6c3 3 9 3 12 0v-6M22 9v7"/>',
    people:
      '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15c2 0 3 2 3 4v2"/>',
    shield:
      '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    book: '<path d="M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1v15"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M8 15h1M15 15h1"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.book}</svg>`;
}
