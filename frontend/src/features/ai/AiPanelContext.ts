import { createContext } from "react";
import type { AiTab } from "./types";

export type AiPanelContextValue = {
  isOpen: boolean;
  tab: AiTab;
  open: (tab?: AiTab) => void;
  close: () => void;
  setTab: (tab: AiTab) => void;
};

export const AiPanelContext = createContext<AiPanelContextValue | null>(null);
