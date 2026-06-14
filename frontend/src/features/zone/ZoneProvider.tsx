import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ZoneContext, type ZoneContextValue } from "./ZoneContext";
import { zonesApi } from "@/api/products.api";
import type { Zone } from "@/types/product";

const STORAGE_KEY = "zip:selectedZoneCode";

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [code, setCode] = useState<string | null>(
    () => (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch zones once on mount.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    zonesApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setZones(list);
        // Pick a default zone if none selected (or stored one no longer exists).
        setCode((prev) => {
          if (prev && list.some((z) => z.code === prev)) return prev;
          return list[0]?.code ?? null;
        });
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setZoneCode = useCallback((next: string) => {
    setCode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, []);

  const value = useMemo<ZoneContextValue>(() => {
    const zone = zones.find((z) => z.code === code) ?? null;
    return { zones, zone, setZoneCode, loading, error };
  }, [zones, code, setZoneCode, loading, error]);

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}
