import { createContext } from "react";
import type { Zone } from "@/types/product";

export type ZoneContextValue = {
  zones: Zone[];
  /** The currently-selected zone. Null while loading. */
  zone: Zone | null;
  setZoneCode: (code: string) => void;
  loading: boolean;
  error: string | null;
};

export const ZoneContext = createContext<ZoneContextValue | null>(null);
