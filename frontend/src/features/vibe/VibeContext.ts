import { createContext } from "react";
import type { Vibe } from "./types";

export type VibeContextValue = {
  vibe: Vibe;
  setVibe: (v: Vibe) => void;
};

export const VibeContext = createContext<VibeContextValue | null>(null);
