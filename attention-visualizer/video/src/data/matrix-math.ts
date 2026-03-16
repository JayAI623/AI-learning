/**
 * MatrixMath — Pure math utilities for matrix operations.
 * Ported from attention-visualizer/js/matrix.js
 */

export const MatrixMath = {
  multiply(A: number[][], B: number[][]): number[][] {
    const m = A.length, p = A[0].length, n = B[0].length;
    const C = Array.from({ length: m }, () => Array(n).fill(0));
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < p; k++)
          C[i][j] += A[i][k] * B[k][j];
    return C;
  },

  transpose(M: number[][]): number[][] {
    const rows = M.length, cols = M[0].length;
    return Array.from({ length: cols }, (_, j) =>
      Array.from({ length: rows }, (_, i) => M[i][j])
    );
  },

  scale(M: number[][], s: number): number[][] {
    return M.map(row => row.map(v => v * s));
  },

  softmax(M: number[][]): number[][] {
    return M.map(row => {
      const max = Math.max(...row);
      const exps = row.map(v => Math.exp(v - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    });
  },

  max(data: number[][]): { row: number; col: number; val: number } {
    let best = { row: 0, col: 0, val: -Infinity };
    for (let i = 0; i < data.length; i++)
      for (let j = 0; j < data[0].length; j++)
        if (data[i][j] > best.val) best = { row: i, col: j, val: data[i][j] };
    return best;
  },

  min(data: number[][]): { row: number; col: number; val: number } {
    let best = { row: 0, col: 0, val: Infinity };
    for (let i = 0; i < data.length; i++)
      for (let j = 0; j < data[0].length; j++)
        if (data[i][j] < best.val) best = { row: i, col: j, val: data[i][j] };
    return best;
  },

  pct(v: number): string {
    return (v * 100).toFixed(1) + '%';
  },

  interpolateColor(
    colorLow: [number, number, number],
    colorHigh: [number, number, number],
    t: number
  ): { r: number; g: number; b: number; css: string } {
    const r = Math.round(colorLow[0] + (colorHigh[0] - colorLow[0]) * t);
    const g = Math.round(colorLow[1] + (colorHigh[1] - colorLow[1]) * t);
    const b = Math.round(colorLow[2] + (colorHigh[2] - colorLow[2]) * t);
    return { r, g, b, css: `rgb(${r},${g},${b})` };
  },
};
