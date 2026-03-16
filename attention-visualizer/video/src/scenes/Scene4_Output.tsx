/**
 * Scene 4: Weights × V → Output
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { FormulaBar } from "../components/FormulaBar";
import { MatrixMultiply } from "../components/MatrixMultiply";
import { Subtitle } from "../components/Subtitle";
import { DERIVED, TOKENS } from "../data/attention-data";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Scene4_Output: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary }}>
      {/* Stage header */}
      <StageHeader />

      {/* Formula */}
      <Sequence from={Math.round(0.3 * fps)} layout="none">
        <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <FormulaBar
            segments={[
              { text: "Output", color: COLORS.emerald, bold: true },
              { text: "=", color: COLORS.textDim },
              { text: "Weights", color: COLORS.rose, bold: true },
              { text: "×", color: COLORS.textDim },
              { text: "V", color: COLORS.violet, bold: true },
            ]}
          />
        </div>
      </Sequence>

      {/* Matrix multiplication */}
      <Sequence from={Math.round(1 * fps)} layout="none">
        <div style={{ position: "absolute", top: 220, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <MatrixMultiply
            matA={{
              data: DERIVED.weights,
              label: "Weights",
              colorScheme: "score",
              precision: 3,
              rowLabels: [...TOKENS],
            }}
            matB={{
              data: DERIVED.V,
              label: "V",
              colorScheme: "value",
              colLabels: ["d₁", "d₂", "d₃", "d₄"],
            }}
            resultConfig={{ label: "Output", colorScheme: "output", precision: 2 }}
            animStart={15}
            framesPerCell={12}
          />
        </div>
      </Sequence>

      {/* Subtitle */}
      <Sequence from={0} durationInFrames={8 * fps}>
        <Subtitle text="Multiply attention weights by V — each output row is a weighted combination of all Value vectors." />
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
        4
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700, color: COLORS.textPrimary }}>
        Weighted Output
      </div>
    </div>
  );
};
