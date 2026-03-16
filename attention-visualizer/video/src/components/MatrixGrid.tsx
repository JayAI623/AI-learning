/**
 * MatrixGrid — Renders a 2D matrix with brackets, label, and animated cells.
 *
 * All animations driven by frame (NO CSS transitions).
 * Cells can pop in sequentially or appear all at once.
 * Supports row/col highlighting for multiplication visualization.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, ColorScheme, SCHEME_COLORS } from "../styles/colors";
import { FONT_MONO } from "../styles/fonts";

export type MatrixGridProps = {
  data: number[][];
  label?: string;
  colorScheme?: ColorScheme;
  precision?: number;
  rowLabels?: string[];
  colLabels?: string[];
  /** Frame at which cells start appearing (relative to local frame 0) */
  cellAppearStart?: number;
  /** Frames between each cell appearing */
  cellStagger?: number;
  /** If true, show "?" until cell's appear frame */
  startEmpty?: boolean;
  /** Currently highlighted row index (-1 = none) */
  highlightRow?: number;
  /** Currently highlighted col index (-1 = none) */
  highlightCol?: number;
  /** Currently active cell [row, col] or null */
  activeCell?: [number, number] | null;
  /** Cell size in pixels */
  cellSize?: number;
  /** Font size in pixels */
  fontSize?: number;
};

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  data,
  label,
  colorScheme = "weight",
  precision = 2,
  rowLabels,
  colLabels,
  cellAppearStart = 0,
  cellStagger = 3,
  startEmpty = false,
  highlightRow = -1,
  highlightCol = -1,
  activeCell = null,
  cellSize = 54,
  fontSize = 13,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = data.length;
  const cols = data[0].length;
  const scheme = SCHEME_COLORS[colorScheme];
  const gap = 3;

  // Bracket entrance spring
  const bracketIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Label */}
      {label && (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            fontWeight: 700,
            color: scheme.accent,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          }}
          dangerouslySetInnerHTML={{
            __html: label.replace(/\^(\w+)/g, "<sup>$1</sup>"),
          }}
        />
      )}

      {/* Column labels */}
      {colLabels && (
        <div
          style={{
            display: "flex",
            gap,
            paddingLeft: rowLabels ? 36 + gap : 8,
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {colLabels.map((lbl, j) => (
            <div
              key={j}
              style={{
                width: cellSize,
                textAlign: "center",
                fontFamily: FONT_MONO,
                fontSize: 10,
                color: COLORS.textMuted,
              }}
            >
              {lbl}
            </div>
          ))}
        </div>
      )}

      {/* Body: row labels + brackets + grid */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Row labels */}
        {rowLabels && (
          <div style={{ display: "flex", flexDirection: "column", gap, marginRight: 6 }}>
            {rowLabels.map((lbl, i) => (
              <div
                key={i}
                style={{
                  width: 30,
                  height: cellSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: COLORS.textMuted,
                  paddingRight: 4,
                }}
              >
                {lbl}
              </div>
            ))}
          </div>
        )}

        {/* Left bracket */}
        <div
          style={{
            width: 5,
            borderLeft: `2px solid ${scheme.accent}`,
            borderTop: `2px solid ${scheme.accent}`,
            borderBottom: `2px solid ${scheme.accent}`,
            borderRadius: "3px 0 0 3px",
            marginRight: 3,
            opacity: bracketIn * 0.6,
          }}
        />

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gap,
          }}
        >
          {Array.from({ length: rows }, (_, i) =>
            Array.from({ length: cols }, (_, j) => {
              const cellIdx = i * cols + j;
              const appearFrame = cellAppearStart + cellIdx * cellStagger;
              const isVisible = !startEmpty || frame >= appearFrame;
              const isHighlightRow = highlightRow === i;
              const isHighlightCol = highlightCol === j;
              const isActive =
                activeCell !== null && activeCell[0] === i && activeCell[1] === j;

              // Cell pop-in spring
              const cellSpring = isVisible
                ? spring({
                    frame: frame - appearFrame,
                    fps,
                    config: { damping: 15, stiffness: 200 },
                    durationInFrames: 15,
                  })
                : 0;

              const scale = startEmpty
                ? interpolate(cellSpring, [0, 1], [0.3, 1])
                : 1;
              const cellOpacity = startEmpty ? cellSpring : 1;

              // Background color
              let bgColor = COLORS.bgSurface;
              if (isActive) {
                bgColor = scheme.glow;
              } else if (isHighlightRow || isHighlightCol) {
                bgColor = scheme.soft;
              }

              // Border
              let borderColor = COLORS.borderSubtle;
              if (isActive || isHighlightRow || isHighlightCol) {
                borderColor = scheme.accent;
              }

              // Box shadow for active cell
              const boxShadow = isActive
                ? `0 0 16px ${scheme.glow}, 0 0 4px ${scheme.glow}`
                : "none";

              return (
                <div
                  key={`${i}-${j}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_MONO,
                    fontSize,
                    fontWeight: 600,
                    color: isActive ? "#fff" : isVisible ? COLORS.textPrimary : COLORS.textDim,
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    border: `1px solid ${borderColor}`,
                    transform: `scale(${isActive ? 1.12 : scale})`,
                    opacity: cellOpacity,
                    boxShadow,
                  }}
                >
                  {isVisible ? data[i][j].toFixed(precision) : "?"}
                </div>
              );
            })
          )}
        </div>

        {/* Right bracket */}
        <div
          style={{
            width: 5,
            borderRight: `2px solid ${scheme.accent}`,
            borderTop: `2px solid ${scheme.accent}`,
            borderBottom: `2px solid ${scheme.accent}`,
            borderRadius: "0 3px 3px 0",
            marginLeft: 3,
            opacity: bracketIn * 0.6,
          }}
        />
      </div>
    </div>
  );
};
