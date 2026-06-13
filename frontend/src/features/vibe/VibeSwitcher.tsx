import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useVibe } from "./useVibe";
import { VIBES, VIBE_META } from "./types";

/** Temporary developer control to flip the active vibe. Floats bottom-right. */
export function VibeSwitcher() {
  const { vibe, setVibe } = useVibe();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[60] vibe-react">
      <AnimatePresence>
        {open && (
          <motion.div
            key="vibe-popover"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mb-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Dev · Switch vibe
            </div>
            {VIBES.map((v) => {
              const meta = VIBE_META[v];
              const active = v === vibe;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVibe(v)}
                  className={
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition " +
                    (active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white")
                  }
                >
                  <span aria-hidden="true" className="text-base">
                    {meta.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{meta.label}</span>
                    <span className="block text-[11px] text-slate-500">{meta.hint}</span>
                  </span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: "var(--color-vibe-accent)",
                        boxShadow: "0 0 10px var(--color-vibe-glow)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch vibe"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-xl transition hover:bg-slate-900"
        style={{ boxShadow: "0 10px 30px -10px var(--color-vibe-glow)" }}
      >
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: "var(--color-vibe-accent)",
            boxShadow: "0 0 12px var(--color-vibe-glow)",
          }}
        />
        <span className="font-semibold">vibe:</span>
        <span className="text-slate-300">{VIBE_META[vibe].label.toLowerCase()}</span>
      </button>
    </div>
  );
}
