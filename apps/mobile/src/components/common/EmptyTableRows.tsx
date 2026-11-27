import { View } from "react-native";

export interface EmptyTableRowsProps {
  currentCount?: number;
  pageSize?: number;
  rowHeight?: number;
}

/**
 * Data table spacer for paginated mobile feeds.
 * Maintains fixed table height equal to `pageSize * rowHeight` when fewer records exist on the active page,
 * preventing layout shift and keeping pagination controls stably positioned.
 */
export function EmptyTableRows({
  currentCount = 0,
  pageSize = 5,
  rowHeight = 68,
}: EmptyTableRowsProps) {
  if (currentCount >= pageSize || currentCount === 0) return null;

  const needed = pageSize - currentCount;

  return (
    <View style={{ height: needed * rowHeight }} aria-hidden={true} />
  );
}
