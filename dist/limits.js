/** Excel cell text capacity, shared by controls, validation and local exchange. */
export const MAX_CELL_CHARACTERS = 32767;
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
// XML escaping plus the embedded JSON copy can expand valid full-capacity drafts.
// Keep a finite archive budget while permitting the complete bounded schema.
export const MAX_WORKBOOK_EXPANDED_BYTES = 256 * 1024 * 1024;
