import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { CloseIcon, SparkleIcon } from "@/components/ui/Icons";
import { useAiPanel } from "./useAiPanel";
import { QuickMode } from "./QuickMode";
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
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[640px] flex-col overflow-hidden border-l border-white/10 bg-slate-950 text-slate-100 shadow-2xl"
          >
            {/* Atmospheric gradient backdrop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-10%,rgba(168,85,247,0.35),transparent_60%),radial-gradient(80%_50%_at_100%_100%,rgba(34,211,238,0.18),transparent_60%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_30%)]"
            />

            {/* Header */}
            <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-6 pt-5 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-fuchsia-300/90">
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
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500/80 to-cyan-500/80 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
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
                  {tab === "quick" ? <QuickMode /> : <ConversationPlaceholder />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      {children}
    </div>
  );
}

function ConversationPlaceholder() {
  return (
    <PanelCard>
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300/80">
        Conversation
      </div>
      <h3 className="mt-1 text-lg font-semibold text-white">
        Chat it through, watch the cart build
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        I&rsquo;ll ask a couple of clarifying questions and assemble a draft cart
        beside the chat. Hooked up next.
      </p>
    </PanelCard>
  );
}
