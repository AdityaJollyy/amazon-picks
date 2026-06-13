import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AiPanelContext } from "./AiPanelContext";
import type { AiTab } from "./types";

export function AiPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<AiTab>("quick");

  const open = useCallback((next?: AiTab) => {
    if (next) setTab(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, tab, open, close, setTab }),
    [isOpen, tab, open, close],
  );

  return <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>;
}
