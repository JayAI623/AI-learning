/**
 * Scene 2: Linear Projections — X × Wq/Wk/Wv → Q, K, V
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { MatrixGrid } from "../components/MatrixGrid";
import { Subtitle } from "../components/Subtitle";
import { DATA, DERIVED, TOKENS } from "../data/attention-data";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Scene2_QKV: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const projs = [
    { key: "Q", w: "Wq", wD: DATA.Wq, rD: DERIVED.Q, cs: "query" as const, color: COLORS.amber },
    { key: "K", w: "Wk", wD: DATA.Wk, rD: DERIVED.K, cs: "key" as const, color: COLORS.cyan },
    { key: "V", w: "Wv", wD: DATA.Wv, rD: DERIVED.V, cs: "value" as const, color: COLORS.violet },
  ];

  // Stagger: each QKV column starts 60 frames apart
  const columnStagger = 90;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary }}>
      {/* Stage header */}
      <StageHeader />

      {/* Shared X matrix */}
      <Sequence from={Math.round(0.5 * fps)} layout="none">
        <div style={{ position: "absolute", top: 130, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <MatrixGrid
            data={DATA.X}
            label="X"
            colorScheme="weight"
            precision={2}
            rowLabels={[...TOKENS]}
            cellSize={42}
            fontSize={11}
          />
        </div>
      </Sequence>

      {/* Arrow */}
      <Sequence from={Math.round(1.2 * fps)} layout="none">
        <div
          style={{
            position: "absolute",
            top: 315,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 24,
            color: COLORS.textDim,
          }}
        >
          ↓
        </div>
      </Sequence>

      {/* Three QKV columns */}
      <div
        style={{
          position: "absolute",
          top: 370,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {projs.map((p, pi) => (
          <Sequence key={p.key} from={Math.round(1.5 * fps + pi * columnStagger)} layout="none">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: 20,
                backgroundColor: COLORS.bgSurface,
                border: `1px solid ${COLORS.borderSubtle}`,
                borderTop: `3px solid ${p.color}`,
                borderRadius: 16,
                minWidth: 220,
              }}
            >
              {/* Formula label */}
              <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: p.color, fontWeight: 600 }}>
                {p.key} = X × {p.w}
              </div>

              {/* Weight matrix */}
              <MatrixGrid
                data={p.wD}
                label={`${p.w} (4×4)`}
                colorScheme="weight"
                precision={1}
                cellSize={32}
                fontSize={9}
              />

              {/* Arrow */}
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.textDim }}>↓</div>

              {/* Result matrix */}
              <MatrixGrid
                data={p.rD}
                label={p.key}
                colorScheme={p.cs}
                precision={2}
                rowLabels={[...TOKENS]}
                startEmpty
                cellAppearStart={0}
                cellStagger={6}
                cellSize={40}
                fontSize={10}
              />
            </div>
          </Sequence>
        ))}
      </div>

      {/* Subtitle */}
      <Sequence from={0} durationInFrames={12 * fps}>
        <Subtitle text='X is multiplied by three weight matrices: Q = "what am I looking for?", K = "what do I contain?", V = "what info do I carry?"' />
      </Sequence>
    </AbsoluteFill>
  );
};

const StageHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(frame / (0.5 * fps), 1);

  return (
    <div style={{ position: "absolute", top: 50, left: 80, display: "flex", alignItems: "center", gap: 20, opacity }}>
      <div
        style={{
          width: 44, height: 44, borderRadius: "50%", backgroundColor: COLORS.amber,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: COLORS.bgPrimary,
        }}
      >
        2
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700, color: COLORS.textPrimary }}>
        Linear Projections — Q, K, V
      </div>
    </div>
  );
};
