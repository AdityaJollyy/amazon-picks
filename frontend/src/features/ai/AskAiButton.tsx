import { motion } from "framer-motion";
import { SparkleIcon } from "@/components/ui/Icons";
import { useAiPanel } from "./useAiPanel";

export function AskAiButton() {
  const { open } = useAiPanel();

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Ask AI"
      className="group relative hidden shrink-0 items-center gap-2 overflow-hidden rounded-full px-3.5 py-1.5 text-sm font-semibold text-white sm:inline-flex"
    >
      {/* Animated gradient border */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#a78bfa,#22d3ee,#f472b6,#a78bfa)] opacity-90 blur-[1px] transition-opacity group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1.5px] rounded-full bg-[var(--color-amazon-navy)]"
      />
      {/* Glow pulse */}
      <motion.span
        aria-hidden="true"
        className="absolute -inset-1 rounded-full bg-fuchsia-500/30 blur-xl"
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <span className="relative flex items-center gap-1.5">
        <SparkleIcon className="h-4 w-4 text-fuchsia-300" />
        <span className="bg-gradient-to-r from-fuchsia-200 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
          Ask AI
        </span>
        <kbd className="ml-1 hidden rounded border border-white/20 bg-white/5 px-1.5 py-px text-[10px] font-medium text-white/70 lg:inline">
          ⌘K
        </kbd>
      </span>
    </button>
  );
}
