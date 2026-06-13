import { useContext } from "react";
import { VibeContext } from "./VibeContext";

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used inside <VibeProvider>");
  return ctx;
}
