import { View } from "react-native";

interface EmptyTableRowsProps {
  currentCount: number;
  pageSize: number;
  rowHeight?: number;
}

/**
 * Web-parity data table spacer for mobile feeds.
 * Maintains fixed table height equal to `pageSize * rowHeight` when fewer records exist,
 * preventing layout shift and keeping pagination controls stably positioned at the bottom,
 * without rendering distracting placeholder artifacts.
 */
export function EmptyTableRows({
  currentCount,
  pageSize,
  rowHeight = 64,
}: EmptyTableRowsProps) {
  if (currentCount >= pageSize || currentCount === 0) return null;

  const needed = pageSize - currentCount;

  return (
    <View style={{ height: needed * rowHeight }} aria-hidden={true} />
  );
}
