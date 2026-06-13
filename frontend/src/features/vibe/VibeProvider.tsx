import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { VibeContext } from "./VibeContext";
import type { Vibe } from "./types";

export function VibeProvider({
  children,
  initialVibe = "casual",
}: {
  children: ReactNode;
  initialVibe?: Vibe;
}) {
  const [vibe, setVibeState] = useState<Vibe>(initialVibe);

  // Reflect the current vibe on <html data-vibe> so CSS variables apply globally.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.vibe = vibe;
    return () => {
      // Don't strip on unmount — provider lives for the app lifetime.
    };
  }, [vibe]);

  const setVibe = useCallback((v: Vibe) => setVibeState(v), []);

  const value = useMemo(() => ({ vibe, setVibe }), [vibe, setVibe]);
  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>;
}
