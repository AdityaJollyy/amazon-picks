import { createContext } from "react";

export type AiPanelContextValue = {
  isOpen: boolean;
  /** Pre-filled intent set when the user opens via the hero input. */
  prefill: string;
  open: (prefill?: string) => void;
  close: () => void;
};

export const AiPanelContext = createContext<AiPanelContextValue | null>(null);
