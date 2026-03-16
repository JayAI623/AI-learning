/**
 * TokenChip — Rounded pill showing a token string.
 * Optionally shows token ID below.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../styles/colors";
import { FONT_MONO } from "../styles/fonts";

type TokenChipProps = {
  token: string;
  tokenId?: number;
  delay?: number;
};

export const TokenChip: React.FC<TokenChipProps> = ({ token, tokenId, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 200 },
    durationInFrames: 18,
  });

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity: entrance,
        transform: `scale(${interpolate(entrance, [0, 1], [0.5, 1])})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 24,
          fontWeight: 500,
          color: COLORS.textPrimary,
          padding: "8px 24px",
          backgroundColor: COLORS.bgSurface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 999,
          letterSpacing: "0.03em",
        }}
      >
        {token}
      </div>
      {tokenId !== undefined && (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 14,
            color: COLORS.amber,
            fontWeight: 600,
            backgroundColor: COLORS.amberSoft,
            padding: "2px 10px",
            borderRadius: 4,
            opacity: interpolate(entrance, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          ID: {tokenId}
        </div>
      )}
    </div>
  );
};
