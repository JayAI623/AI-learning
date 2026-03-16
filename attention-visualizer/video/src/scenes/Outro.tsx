/**
 * Outro — Summary and fade out
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          textAlign: "center",
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        Each token's output is informed by{" "}
        <span style={{ color: COLORS.amber }}>every other token</span>
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: 300,
          color: COLORS.textSecondary,
          marginTop: 20,
          opacity: interpolate(titleIn, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
        }}
      >
        That's the power of self-attention.
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: COLORS.textDim,
          marginTop: 40,
          letterSpacing: "0.1em",
          opacity: interpolate(titleIn, [0.7, 1], [0, 1], { extrapolateLeft: "clamp" }),
        }}
      >
        Interactive Attention Mechanism Visualizer — Built for learning.
      </div>
    </AbsoluteFill>
  );
};
