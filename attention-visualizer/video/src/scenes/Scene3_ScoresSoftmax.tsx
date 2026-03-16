/**
 * Scene 3: Q × K^T → Scores → Scale → Softmax → Heatmap
 * Two phases: matrix multiplication, then cell-fill for scale + softmax.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { FormulaBar } from "../components/FormulaBar";
import { Heatmap } from "../components/Heatmap";
import { MatrixGrid } from "../components/MatrixGrid";
import { MatrixMultiply } from "../components/MatrixMultiply";
import { Subtitle } from "../components/Subtitle";
import { DERIVED, TOKENS } from "../data/attention-data";
import { COLORS } from "../styles/colors";
import { FONT_DISPLAY, FONT_MONO } from "../styles/fonts";

export const Scene3_ScoresSoftmax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase A: Matrix multiply Q × K^T (frames 0 ~ 7s)
  const phaseADuration = Math.round(7 * fps);
  // Phase B: Scale + Softmax fill (frames 7s ~ 12s)
  const phaseBStart = phaseADuration;
  const phaseBDuration = Math.round(5 * fps);
  // Phase C: Heatmap reveal (frames 12s ~ 15s)
  const phaseCStart = phaseBStart + phaseBDuration;

  const n = TOKENS.length;
  const totalCells = n * n;

  // Phase B: which cell is being filled
  const phaseBFrame = frame - phaseBStart;
  const framesPerCellB = 6;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgPrimary }}>
      {/* Stage header */}
      <StageHeader />

      {/* Formula */}
      <Sequence from={Math.round(0.3 * fps)} layout="none">
        <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <FormulaBar
            segments={[
              { text: "Weights", color: COLORS.rose, bold: true },
              { text: "= softmax(", color: COLORS.textSecondary },
              { text: "Q", color: COLORS.amber, bold: true },
              { text: "×", color: COLORS.textDim },
              { text: "K", color: COLORS.cyan, bold: true, superscript: "T" },
              { text: "/ √d", color: COLORS.textSecondary },
              { text: ")", color: COLORS.textSecondary },
            ]}
          />
        </div>
      </Sequence>

      {/* Phase A: Matrix multiply */}
      <Sequence from={Math.round(1 * fps)} durationInFrames={phaseADuration} layout="none">
        <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <MatrixMultiply
            matA={{ data: DERIVED.Q, label: "Q", colorScheme: "query", rowLabels: [...TOKENS] }}
            matB={{ data: DERIVED.Kt, label: "K^T", colorScheme: "key", colLabels: [...TOKENS] }}
            resultConfig={{ label: "Scores", colorScheme: "score" }}
            animStart={15}
            framesPerCell={10}
          />
        </div>
      </Sequence>

      {/* Phase B: Scores → Scaled → Weights */}
      {frame >= phaseBStart && (
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <MatrixGrid
            data={DERIVED.scores}
            label="Scores"
            colorScheme="score"
            precision={2}
            rowLabels={[...TOKENS]}
            colLabels={[...TOKENS]}
            cellSize={50}
            fontSize={12}
          />
          <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: COLORS.textDim, marginTop: 60 }}>→</div>
          <MatrixGrid
            data={DERIVED.scaled}
            label="Scaled"
            colorScheme="score"
            precision={2}
            rowLabels={[...TOKENS]}
            colLabels={[...TOKENS]}
            startEmpty
            cellAppearStart={0}
            cellStagger={framesPerCellB}
            cellSize={50}
            fontSize={12}
          />
          <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: COLORS.textDim, marginTop: 60 }}>→</div>
          <MatrixGrid
            data={DERIVED.weights}
            label="Weights"
            colorScheme="output"
            precision={3}
            rowLabels={[...TOKENS]}
            colLabels={[...TOKENS]}
            startEmpty
            cellAppearStart={totalCells * framesPerCellB}
            cellStagger={framesPerCellB}
            cellSize={50}
            fontSize={10}
          />
        </div>
      )}

      {/* Phase C: Heatmap */}
      {frame >= phaseCStart && (
        <Sequence from={phaseCStart} layout="none">
          <div
            style={{
              position: "absolute",
              top: 470,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Heatmap
              data={DERIVED.weights}
              rowLabels={[...TOKENS]}
              colLabels={[...TOKENS]}
              title="Attention Weights (0–1 probability)"
              precision={3}
              rowAxis="Query"
              colAxis="Key"
              lowLabel="Low"
              highLabel="High"
            />
          </div>
        </Sequence>
      )}

      {/* Subtitles */}
      <Sequence from={0} durationInFrames={phaseADuration}>
        <Subtitle text="Compute Q × K^T — each cell measures how much token i should attend to token j." />
      </Sequence>
      <Sequence from={phaseBStart} durationInFrames={phaseBDuration + Math.round(3 * fps)}>
        <Subtitle text="Divide by √dk to stabilize gradients, then apply row-wise softmax. Each row sums to 1." />
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
        3
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 700, color: COLORS.textPrimary }}>
        Attention Scores & Weights
      </div>
    </div>
  );
};
