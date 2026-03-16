/**
 * Heatmap — Color-coded 2D grid with axis labels, legend, and stagger animation.
 * All animations frame-driven.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MatrixMath } from "../data/matrix-math";
import { COLORS } from "../styles/colors";
import { FONT_MONO } from "../styles/fonts";

type HeatmapProps = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  title?: string;
  precision?: number;
  colorLow?: [number, number, number];
  colorHigh?: [number, number, number];
  rowAxis?: string;
  colAxis?: string;
  lowLabel?: string;
  highLabel?: string;
  delay?: number;
};

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  rowLabels,
  colLabels,
  title = "",
  precision = 2,
  colorLow = [8, 14, 40],
  colorHigh = [232, 168, 56],
  rowAxis = "Row",
  colAxis = "Column",
  lowLabel = "Low",
  highLabel = "High",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = data.length;
  const cols = data[0].length;

  const { val: minVal } = MatrixMath.min(data);
  const { val: maxVal } = MatrixMath.max(data);
  const range = maxVal - minVal || 1;

  const cellSize = 72;
  const gap = 4;

  // Container entrance
  const containerIn = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 25,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: containerIn,
        transform: `translateY(${interpolate(containerIn, [0, 1], [24, 0])}px)`,
      }}
    >
      {/* Title */}
      {title && (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.textDim,
          }}
        >
          {title}
        </div>
      )}

      {/* Column axis label */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.textDim,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        ← {colAxis} →
      </div>

      {/* Column labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `48px repeat(${cols}, ${cellSize}px)`,
          gap,
        }}
      >
        <div /> {/* spacer */}
        {colLabels.map((l, j) => (
          <div
            key={j}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              color: COLORS.textMuted,
              textAlign: "center",
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `48px repeat(${cols}, ${cellSize}px)`,
          gap,
        }}
      >
        {Array.from({ length: rows }, (_, i) => (
          <React.Fragment key={i}>
            {/* Row label */}
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                color: COLORS.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 8,
              }}
            >
              {rowLabels[i]}
            </div>
            {/* Cells */}
            {Array.from({ length: cols }, (_, j) => {
              const val = data[i][j];
              const t = (val - minVal) / range;
              const color = MatrixMath.interpolateColor(colorLow, colorHigh, t);
              const textColor = t > 0.55 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)";
              const cellIdx = i * cols + j;

              // Stagger entrance
              const cellIn = spring({
                frame: frame - delay - 10 - cellIdx * 4,
                fps,
                config: { damping: 200 },
                durationInFrames: 15,
              });

              return (
                <div
                  key={j}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    fontFamily: FONT_MONO,
                    fontSize: 15,
                    fontWeight: 600,
                    backgroundColor: color.css,
                    color: textColor,
                    opacity: cellIn,
                    transform: `scale(${interpolate(cellIn, [0, 1], [0.7, 1])})`,
                    boxShadow:
                      t > 0.7
                        ? `0 0 ${Math.round(t * 16)}px rgba(${colorHigh.join(",")}, ${t * 0.3})`
                        : "none",
                  }}
                >
                  {val.toFixed(precision)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Row axis */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: COLORS.textDim,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        ↑ {rowAxis}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: COLORS.textDim,
        }}
      >
        <span>{lowLabel}</span>
        <div
          style={{
            width: 120,
            height: 8,
            borderRadius: 999,
            background: `linear-gradient(90deg, rgb(${colorLow.join(",")}), rgb(${colorHigh.join(",")}))`,
            border: `1px solid ${COLORS.borderSubtle}`,
          }}
        />
        <span>{highLabel}</span>
      </div>
    </div>
  );
};
