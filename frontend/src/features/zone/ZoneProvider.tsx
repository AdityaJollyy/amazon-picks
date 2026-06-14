import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ZoneContext, type ZoneContextValue } from "./ZoneContext";
import { zonesApi } from "@/api/products.api";
import type { Zone } from "@/types/product";

const STORAGE_KEY = "zip:selectedZoneCode";
// MVP demo: CP is the only stocked zone. Other zones still appear in the
// picker, but the seeded catalog lives entirely in CP, so we always boot the
// app there and overwrite any stale localStorage code from earlier sessions.
const DEMO_ZONE_CODE = "CP";

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [code, setCode] = useState<string | null>(DEMO_ZONE_CODE);
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
        const demo = list.find((z) => z.code === DEMO_ZONE_CODE);
        const next = demo?.code ?? list[0]?.code ?? null;
        setCode(next);
        if (next) {
          try {
            window.localStorage.setItem(STORAGE_KEY, next);
          } catch {
            // ignore
          }
        }
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
