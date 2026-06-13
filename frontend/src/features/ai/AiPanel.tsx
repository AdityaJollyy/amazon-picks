import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { CloseIcon, SparkleIcon } from "@/components/ui/Icons";
import { useAiPanel } from "./useAiPanel";
import { QuickMode } from "./QuickMode";
import { Conversation } from "./Conversation";
import type { AiTab } from "./types";

const TABS: { id: AiTab; label: string; hint: string }[] = [
  { id: "quick", label: "Quick Mode", hint: "One-shot cart" },
  { id: "conversation", label: "Conversation", hint: "Chat to build" },
];

export function AiPanel() {
  const { isOpen, close, tab, setTab } = useAiPanel();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.aside
            key="ai-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Ask AI"
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.4 }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="vibe-react fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] flex-col overflow-hidden border-l border-white/10 text-slate-100 shadow-2xl"
            style={{ backgroundColor: "var(--color-vibe-panel)" }}
          >
            {/* Atmospheric gradient backdrop — driven by current vibe accents */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(120% 60% at 50% -10%, var(--color-vibe-accent-soft), transparent 60%), radial-gradient(80% 50% at 100% 100%, var(--color-vibe-accent-soft), transparent 60%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_30%)]"
            />

            {/* Header */}
            <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-6 pt-5 pb-4">
              <div>
                <div
                  className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--color-vibe-accent-2)" }}
                >
                  <SparkleIcon className="h-3.5 w-3.5" />
                  <span>Zip Intelligence</span>
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  What can I get you?
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Describe an occasion or chat it through — I&rsquo;ll build the cart.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close AI panel"
                className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </header>

            {/* Tab strip */}
            <div className="relative px-6 pt-4">
              <div
                role="tablist"
                aria-label="AI mode"
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur"
              >
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={`ai-panel-${t.id}`}
                      onClick={() => setTab(t.id)}
                      className="relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                    >
                      {active && (
                        <motion.span
                          layoutId="ai-tab-pill"
                          className="absolute inset-0 rounded-full"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, var(--color-vibe-accent), var(--color-vibe-accent-2))",
                            boxShadow: "0 0 20px var(--color-vibe-glow)",
                          }}
                          transition={{ type: "spring", damping: 26, stiffness: 320 }}
                        />
                      )}
                      <span
                        className={
                          "relative " + (active ? "text-white" : "text-slate-400 hover:text-slate-200")
                        }
                      >
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  id={`ai-panel-${tab}`}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {tab === "quick" ? <QuickMode /> : <Conversation />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
