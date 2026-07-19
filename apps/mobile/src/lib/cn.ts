import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Same utility as apps/web/src/lib/utils.ts, ported for the mobile app. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
