/**
 * Pre-computed attention data — same values as the web app.
 * Ported from attention-visualizer/js/app.js
 */
import { MatrixMath } from "./matrix-math";

export const TOKENS = ["I", "love", "AI"] as const;
export const TOKEN_IDS = [42, 156, 891] as const;

export const DATA = {
  X: [
    [0.8, 0.2, 0.5, 0.1],
    [0.3, 0.9, 0.1, 0.7],
    [0.6, 0.4, 0.8, 0.3],
  ],
  Wq: [
    [0.5, 0.3, 0.2, 0.4],
    [0.1, 0.8, 0.4, 0.2],
    [0.7, 0.2, 0.6, 0.3],
    [0.3, 0.5, 0.1, 0.7],
  ],
  Wk: [
    [0.4, 0.6, 0.1, 0.5],
    [0.2, 0.3, 0.7, 0.1],
    [0.5, 0.1, 0.8, 0.4],
    [0.6, 0.4, 0.2, 0.3],
  ],
  Wv: [
    [0.3, 0.7, 0.5, 0.2],
    [0.8, 0.1, 0.3, 0.6],
    [0.2, 0.5, 0.6, 0.4],
    [0.4, 0.3, 0.8, 0.1],
  ],
};

// Pre-compute all derived matrices
const Q = MatrixMath.multiply(DATA.X, DATA.Wq);
const K = MatrixMath.multiply(DATA.X, DATA.Wk);
const V = MatrixMath.multiply(DATA.X, DATA.Wv);
const Kt = MatrixMath.transpose(K);
const scores = MatrixMath.multiply(Q, Kt);
const dk = DATA.Wq[0].length;
const scaled = MatrixMath.scale(scores, 1 / Math.sqrt(dk));
const weights = MatrixMath.softmax(scaled);
const output = MatrixMath.multiply(weights, V);

export const DERIVED = { Q, K, V, Kt, scores, scaled, weights, output, dk };
