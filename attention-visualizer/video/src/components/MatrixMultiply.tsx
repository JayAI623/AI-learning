/**
 * MatrixMultiply — Animated A × B = C visualization.
 *
 * At each frame, computes which cell is being filled, highlights
 * the corresponding row of A and column of B, and reveals the result cell.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { MatrixMath } from "../data/matrix-math";
import { COLORS, ColorScheme } from "../styles/colors";
import { FONT_MONO } from "../styles/fonts";
import { MatrixGrid } from "./MatrixGrid";

type MatrixConfig = {
  data: number[][];
  label: string;
  colorScheme: ColorScheme;
  precision?: number;
  rowLabels?: string[];
  colLabels?: string[];
};

type MatrixMultiplyProps = {
  matA: MatrixConfig;
  matB: MatrixConfig;
  resultConfig: { label: string; colorScheme: ColorScheme; precision?: number };
  /** Frame offset when the cell-by-cell animation starts */
  animStart?: number;
  /** Frames per cell */
  framesPerCell?: number;
};

export const MatrixMultiply: React.FC<MatrixMultiplyProps> = ({
  matA,
  matB,
  resultConfig,
  animStart = 30,
  framesPerCell = 8,
}) => {
  const frame = useCurrentFrame();
  const result = MatrixMath.multiply(matA.data, matB.data);
  const totalCells = matA.data.length * matB.data[0].length;
  const resultCols = matB.data[0].length;

  // Which cell is currently being computed
  const animFrame = frame - animStart;
  const currentCellIdx = Math.floor(animFrame / framesPerCell);
  const currentRow = currentCellIdx >= 0 ? Math.floor(currentCellIdx / resultCols) : -1;
  const currentCol = currentCellIdx >= 0 ? currentCellIdx % resultCols : -1;

  // Build result data: show computed values for revealed cells, 0 for unrevealed
  const revealedData = result.map((row, i) =>
    row.map((val, j) => {
      const idx = i * resultCols + j;
      return idx <= currentCellIdx ? val : 0;
    })
  );

  const isDone = currentCellIdx >= totalCells;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Matrix A */}
      <MatrixGrid
        data={matA.data}
        label={matA.label}
        colorScheme={matA.colorScheme}
        precision={matA.precision ?? 2}
        rowLabels={matA.rowLabels}
        highlightRow={isDone ? -1 : currentRow}
      />

      {/* Operator × */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 32,
          color: COLORS.textDim,
          fontWeight: 300,
          opacity: 0.6,
        }}
      >
        ×
      </div>

      {/* Matrix B */}
      <MatrixGrid
        data={matB.data}
        label={matB.label}
        colorScheme={matB.colorScheme}
        precision={matB.precision ?? 2}
        colLabels={matB.colLabels}
        highlightCol={isDone ? -1 : currentCol}
      />

      {/* Operator = */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 32,
          color: COLORS.textDim,
          fontWeight: 300,
          opacity: 0.6,
        }}
      >
        =
      </div>

      {/* Result matrix */}
      <MatrixGrid
        data={revealedData}
        label={resultConfig.label}
        colorScheme={resultConfig.colorScheme}
        precision={resultConfig.precision ?? 2}
        rowLabels={matA.rowLabels}
        colLabels={matB.colLabels}
        startEmpty
        cellAppearStart={animStart}
        cellStagger={framesPerCell}
        activeCell={
          !isDone && currentCellIdx >= 0 ? [currentRow, currentCol] : null
        }
      />
    </div>
  );
};
