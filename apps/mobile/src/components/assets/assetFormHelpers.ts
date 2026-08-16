import { Alert } from "react-native";

export function confirmAssetDelete(onConfirm: () => void) {
  Alert.alert("Delete?", "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}

export function findEditingRow<T extends { id: string }>(rows: T[] | undefined, id: string | null): T | undefined {
  return id ? rows?.find((r) => r.id === id) : undefined;
}

/**
 * DB rows carry `id`/`user_id`/`created_at`/`updated_at` plus `null` for empty optional
 * columns; the form's Zod-inferred input type has none of those and expects `undefined`
 * instead of `null`. This projects a row down to just the fields the form config declares,
 * with that null→undefined conversion, so it can be handed to AssetForm as `defaultValues`.
 */
export function toFormDefaults<Row extends Record<string, unknown>, Input>(
  row: Row | undefined,
  fields: readonly { name: string }[],
  emptyDefaults: Input
): Input {
  if (!row) return emptyDefaults;
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = row[field.name];
    result[field.name] = value === null ? undefined : value;
  }
  return result as Input;
}

export async function submitAssetForm<T>(
  editingId: string | null,
  data: T,
  create: (data: T) => Promise<unknown>,
  update: (args: { id: string; data: Partial<T> }) => Promise<unknown>,
  onDone: () => void
) {
  if (editingId) {
    await update({ id: editingId, data });
  } else {
    await create(data);
  }
  onDone();
}
