import { clsx, type ClassValue } from "clsx";

/** Tiny class-name joiner. Uses clsx so undefined/false/null are filtered out. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
