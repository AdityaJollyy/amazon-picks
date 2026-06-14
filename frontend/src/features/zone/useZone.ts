import { useContext } from "react";
import { ZoneContext } from "./ZoneContext";

export function useZone() {
  const ctx = useContext(ZoneContext);
  if (!ctx) {
    throw new Error("useZone must be used inside <ZoneProvider>");
  }
  return ctx;
}
