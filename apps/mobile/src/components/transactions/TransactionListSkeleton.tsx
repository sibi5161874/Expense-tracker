import { View } from "react-native";
import { Skeleton } from "@/components/common/Skeleton";

/** Matches TransactionListItem's shape while loading — same row rhythm as the loaded result. */
export function TransactionListSkeleton() {
  return (
    <View>
      {Array.from({ length: 8 }, (_, i) => (
        <View key={i} className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <View className="flex-1 gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
          </View>
          <Skeleton className="h-4 w-16" />
        </View>
      ))}
    </View>
  );
}
