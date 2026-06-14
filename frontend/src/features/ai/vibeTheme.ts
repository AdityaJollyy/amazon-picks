import type { AiVibe } from "@/api/ai.api";

export type VibeTheme = {
  name: string;
  emoji: string;
  accent: string;
  soft: string;
  grad: string;
};

/** Maps the backend's vibe categories to a theme used by the Quick Mode banner. */
const THEMES: Record<AiVibe | "default", VibeTheme> = {
  party: {
    name: "Party",
    emoji: "🎉",
    accent: "#7b2ff7",
    soft: "#efe7fd",
    grad: "linear-gradient(120deg,#7b2ff7,#e0218a)",
  },
  medical: {
    name: "Care kit",
    emoji: "🩺",
    accent: "#0a9fc2",
    soft: "#dff3f8",
    grad: "linear-gradient(120deg,#0a9fc2,#56c8e0)",
  },
  emergency: {
    name: "Emergency",
    emoji: "🚨",
    accent: "#dc2626",
    soft: "#fde2e2",
    grad: "linear-gradient(120deg,#dc2626,#f97316)",
  },
  casual: {
    name: "Picks",
    emoji: "🛒",
    accent: "#ff9900",
    soft: "#fff3e0",
    grad: "linear-gradient(120deg,#ff9900,#ff7847)",
  },
  default: {
    name: "Picks",
    emoji: "✦",
    accent: "#ff9900",
    soft: "#fff3e0",
    grad: "linear-gradient(120deg,#ff9900,#ff7847)",
  },
};

export function getVibeTheme(v: AiVibe | string | null | undefined): VibeTheme {
  if (!v) return THEMES.default;
  if (v in THEMES) return THEMES[v as keyof typeof THEMES];
  return THEMES.default;
}
