/**
 * Color palette — mirrors attention-visualizer/css/tokens.css
 */

export const COLORS = {
  // Backgrounds
  bgPrimary: "#F8FAFC",
  bgSurface: "#FFFFFF",
  bgElevated: "#FFFFFF",
  bgGlass: "rgba(248, 250, 252, 0.92)",

  // Text
  textPrimary: "#1E3A8A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textDim: "#94A3B8",

  // Borders
  border: "rgba(30, 58, 138, 0.15)",
  borderSubtle: "rgba(30, 58, 138, 0.08)",

  // Accent — Matrix roles
  amber: "#F59E0B",       // Query
  amberSoft: "rgba(245, 158, 11, 0.1)",
  amberBright: "#FBBF24",

  cyan: "#0EA5E9",        // Key
  cyanSoft: "rgba(14, 165, 233, 0.1)",
  cyanBright: "#38BDF8",

  violet: "#8B5CF6",      // Value
  violetSoft: "rgba(139, 92, 246, 0.1)",
  violetBright: "#A78BFA",

  rose: "#F43F5E",        // Score
  roseSoft: "rgba(244, 63, 94, 0.1)",

  emerald: "#10B981",     // Output
  emeraldSoft: "rgba(16, 185, 129, 0.1)",

  slate: "#64748B",       // Weight/neutral
  slateSoft: "rgba(100, 116, 139, 0.08)",
};

/** Color scheme map for matrix types */
export type ColorScheme = "query" | "key" | "value" | "score" | "output" | "weight";

export const SCHEME_COLORS: Record<ColorScheme, { accent: string; soft: string; glow: string }> = {
  query:  { accent: COLORS.amber,   soft: COLORS.amberSoft,   glow: "rgba(245,158,11,0.25)" },
  key:    { accent: COLORS.cyan,    soft: COLORS.cyanSoft,    glow: "rgba(14,165,233,0.25)" },
  value:  { accent: COLORS.violet,  soft: COLORS.violetSoft,  glow: "rgba(139,92,246,0.25)" },
  score:  { accent: COLORS.rose,    soft: COLORS.roseSoft,    glow: "rgba(244,63,94,0.25)" },
  output: { accent: COLORS.emerald, soft: COLORS.emeraldSoft, glow: "rgba(16,185,129,0.25)" },
  weight: { accent: COLORS.slate,   soft: COLORS.slateSoft,   glow: "transparent" },
};
