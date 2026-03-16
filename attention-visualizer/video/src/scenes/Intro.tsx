/**
 * Intro — Title reveal "Attention Is All You Need"
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 25 });
  const titleIn = spring({ frame: frame - 10, fps, config: { damping: 200 }, durationInFrames: 30 });
  const subtitleIn = spring({ frame: frame - 25, fps, config: { damping: 200 }, durationInFrames: 25 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 14,
          color: COLORS.amber,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginBottom: 24,
          opacity: eyebrowIn,
          transform: `translateY(${interpolate(eyebrowIn, [0, 1], [20, 0])}px)`,
        }}
      >
        Interactive Visualization
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 80,
          fontWeight: 800,
          color: COLORS.textPrimary,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          textAlign: "center",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        Attention Is All You{" "}
        <span
          style={{
            background: `linear-gradient(135deg, ${COLORS.amber}, ${COLORS.cyanBright}, ${COLORS.violetBright})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Need
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 300,
          color: COLORS.textSecondary,
          marginTop: 28,
          maxWidth: 600,
          textAlign: "center",
          lineHeight: 1.6,
          opacity: subtitleIn,
          transform: `translateY(${interpolate(subtitleIn, [0, 1], [20, 0])}px)`,
        }}
      >
        A step-by-step animation of the self-attention pipeline
      </div>
    </AbsoluteFill>
  );
};
