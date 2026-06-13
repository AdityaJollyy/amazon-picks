export const VIBES = ["casual", "medical", "party", "emergency"] as const;
export type Vibe = (typeof VIBES)[number];

export const VIBE_META: Record<Vibe, { label: string; emoji: string; hint: string }> = {
  casual:    { label: "Casual",    emoji: "🛒", hint: "Default storefront" },
  medical:   { label: "Medical",   emoji: "🩺", hint: "Calm, clinical blue" },
  party:     { label: "Party",     emoji: "🎉", hint: "Late-night violet" },
  emergency: { label: "Emergency", emoji: "🚨", hint: "Urgent red" },
};
