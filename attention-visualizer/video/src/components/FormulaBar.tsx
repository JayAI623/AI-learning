/**
 * FormulaBar — Displays a colored math formula (e.g. "Q × K^T = Scores").
 * Each segment has text + color. Fades in via frame.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../styles/colors";
import { FONT_MONO } from "../styles/fonts";

export type FormulaSegment = {
  text: string;
  color?: string;
  bold?: boolean;
  superscript?: string;
};

type FormulaBarProps = {
  segments: FormulaSegment[];
  delay?: number;
};

export const FormulaBar: React.FC<FormulaBarProps> = ({ segments, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  });

  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 28,
        color: COLORS.textSecondary,
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "14px 32px",
        backgroundColor: COLORS.bgSurface,
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: 12,
        opacity: entrance,
        transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
      }}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            color: seg.color || COLORS.textSecondary,
            fontWeight: seg.bold ? 700 : 400,
          }}
        >
          {seg.text}
          {seg.superscript && (
            <sup style={{ fontSize: "0.6em", verticalAlign: "super" }}>
              {seg.superscript}
            </sup>
          )}
        </span>
      ))}
    </div>
  );
};
