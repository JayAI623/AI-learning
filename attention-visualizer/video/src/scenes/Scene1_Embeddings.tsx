/**
 * Scene 1: Input Embeddings — Tokens → IDs → Matrix X
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { MatrixGrid } from "../components/MatrixGrid";
import { Subtitle } from "../components/Subtitle";
import { TokenChip } from "../components/TokenChip";
import { DATA, TOKENS, TOKEN_IDS } from "../data/attention-data";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Scene1_Embeddings: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary }}>
      {/* Stage header */}
      <Sequence from={0} layout="none">
        <StageHeader />
      </Sequence>

      {/* Token chips */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {TOKENS.map((tok, i) => (
          <Sequence key={tok} from={Math.round(0.5 * fps + i * 8)} layout="none">
            <TokenChip token={tok} tokenId={TOKEN_IDS[i]} delay={0} />
          </Sequence>
        ))}
      </div>

      {/* Arrow */}
      <Sequence from={Math.round(1.5 * fps)} layout="none">
        <div
          style={{
            position: "absolute",
            top: 290,
            width: "100%",
            textAlign: "center",
            fontFamily: FONT_MONO,
            fontSize: 28,
            color: COLORS.textDim,
          }}
        >
          ↓ Lookup Embedding Table
        </div>
      </Sequence>

      {/* Matrix X */}
      <Sequence from={Math.round(2.5 * fps)} layout="none">
        <div
          style={{
            position: "absolute",
            top: 370,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <MatrixGrid
            data={DATA.X}
            label="X"
            colorScheme="weight"
            precision={1}
            rowLabels={TOKENS.map((tok, i) => `${tok}[${TOKEN_IDS[i]}]`)}
            colLabels={["d₁", "d₂", "d₃", "d₄"]}
            startEmpty
            cellAppearStart={0}
            cellStagger={5}
            cellSize={60}
            fontSize={15}
          />
        </div>
      </Sequence>

      {/* Subtitle */}
      <Sequence from={0} durationInFrames={8 * fps}>
        <Subtitle text="Each token is converted to a Token ID, then looked up in a learned Embedding Table to form matrix X." />
      </Sequence>
    </AbsoluteFill>
  );
};

const StageHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(frame / (0.5 * fps), 1);

  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 80,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: COLORS.amber,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_MONO,
          fontSize: 18,
          fontWeight: 700,
          color: COLORS.bgPrimary,
        }}
      >
        1
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 36,
          fontWeight: 700,
          color: COLORS.textPrimary,
        }}
      >
        Input Embeddings
      </div>
    </div>
  );
};
