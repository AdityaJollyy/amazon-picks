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
      className="vibe-react group relative hidden shrink-0 items-center gap-2 overflow-hidden rounded-full px-3.5 py-1.5 text-sm font-semibold text-white sm:inline-flex"
    >
      {/* Animated gradient border — pulses through the active vibe palette */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-90 blur-[1px] transition-opacity group-hover:opacity-100"
        style={{
          backgroundImage:
            "conic-gradient(from 0deg, var(--color-vibe-accent), var(--color-vibe-accent-2), var(--color-vibe-accent))",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-[1.5px] rounded-full bg-[var(--color-amazon-navy)]"
      />
      {/* Glow pulse */}
      <motion.span
        aria-hidden="true"
        className="absolute -inset-1 rounded-full blur-xl"
        style={{ backgroundColor: "var(--color-vibe-glow)" }}
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <span className="relative flex items-center gap-1.5">
        <SparkleIcon
          className="h-4 w-4"
          style={{ color: "var(--color-vibe-accent-2)" }}
        />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-vibe-accent-2), #ffffff, var(--color-vibe-accent-2))",
          }}
        >
          Ask AI
        </span>
        <kbd className="ml-1 hidden rounded border border-white/20 bg-white/5 px-1.5 py-px text-[10px] font-medium text-white/70 lg:inline">
          ⌘K
        </kbd>
      </span>
    </button>
  );
}
