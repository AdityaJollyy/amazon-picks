import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AiPanelContext } from "./AiPanelContext";

export function AiPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const open = useCallback((next?: string) => {
    setPrefill((next ?? "").trim());
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, prefill, open, close }),
    [isOpen, prefill, open, close],
  );

  return <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>;
}
