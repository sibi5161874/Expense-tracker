/** Shared cap for every CSV import path (client-side pre-check and server-side re-check). */
export const MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function importFileTooLarge(byteLength: number): boolean {
  return byteLength > MAX_IMPORT_FILE_SIZE_BYTES;
}
