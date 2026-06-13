import { useContext } from "react";
import { AiPanelContext } from "./AiPanelContext";

export function useAiPanel() {
  const ctx = useContext(AiPanelContext);
  if (!ctx) throw new Error("useAiPanel must be used inside <AiPanelProvider>");
  return ctx;
}
