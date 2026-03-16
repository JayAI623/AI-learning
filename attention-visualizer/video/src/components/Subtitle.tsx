/**
 * Subtitle — Bottom-aligned text overlay with fade in/out.
 * All animation via useCurrentFrame().
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../styles/colors";
import { FONT_BODY } from "../styles/fonts";

type SubtitleProps = {
  text: string;
  /** Frames of fade-in at start */
  fadeIn?: number;
  /** Frames of fade-out at end (from durationInFrames of parent Sequence) */
  fadeOut?: number;
};

export const Subtitle: React.FC<SubtitleProps> = ({
  text,
  fadeIn = 15,
  fadeOut = 15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translateY = interpolate(frame, [0, fadeIn], [12, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 26,
          fontWeight: 400,
          color: COLORS.textSecondary,
          backgroundColor: "rgba(248, 250, 252, 0.85)",
          backdropFilter: "blur(8px)",
          padding: "10px 32px",
          borderRadius: 12,
          border: `1px solid ${COLORS.borderSubtle}`,
          maxWidth: 1400,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
};
