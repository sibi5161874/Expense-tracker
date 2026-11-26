/**
 * Deprecated / No-op in mobile feeds.
 * Returning null ensures no phantom ghost rows or artificial vertical voids are injected,
 * maintaining clean mobile-native list flow.
 */
export function EmptyTableRows(_props?: {
  currentCount?: number;
  pageSize?: number;
  rowHeight?: number;
}) {
  return null;
}
