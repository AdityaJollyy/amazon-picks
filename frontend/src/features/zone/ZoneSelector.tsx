import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, PinIcon } from "@/components/ui/Icons";
import { useZone } from "./useZone";

/** Header pill that opens a dropdown to switch the active delivery zone. */
export function ZoneSelector() {
  const { zone, zones, setZoneCode, loading } = useZone();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = zone
    ? `${zone.name} ${zone.pincode}`
    : loading
      ? "Loading…"
      : "Select zone";

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading || zones.length === 0}
        className="flex shrink-0 items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 text-left hover:border-white disabled:opacity-60"
      >
        <PinIcon className="mt-3 h-5 w-5 text-white" />
        <span className="leading-tight">
          <span className="block text-[12px] text-white/70">Deliver to</span>
          <span className="flex items-center gap-1 text-sm font-bold">
            {label}
            <ChevronDownIcon className="h-3 w-3 text-white/70" />
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            role="listbox"
            aria-label="Choose delivery zone"
            className="absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-800 shadow-xl"
          >
            <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Delhi delivery zones
            </div>
            <ul className="max-h-72 overflow-y-auto py-1">
              {zones.map((z) => {
                const active = z.code === zone?.code;
                return (
                  <li key={z.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        setZoneCode(z.code);
                        setOpen(false);
                      }}
                      className={
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 " +
                        (active ? "bg-amber-50" : "")
                      }
                    >
                      <span>
                        <span className="block font-semibold">{z.name}</span>
                        <span className="block text-xs text-slate-500">
                          {z.city} · {z.pincode}
                        </span>
                      </span>
                      {active && (
                        <span className="text-xs font-semibold text-emerald-700">
                          Selected
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
