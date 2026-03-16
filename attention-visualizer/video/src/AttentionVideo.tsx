/**
 * AttentionVideo — Main composition.
 * Sequences all scenes using <Series>.
 */
import React from "react";
import { Series, useVideoConfig } from "remotion";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Scene1_Embeddings } from "./scenes/Scene1_Embeddings";
import { Scene2_QKV } from "./scenes/Scene2_QKV";
import { Scene3_ScoresSoftmax } from "./scenes/Scene3_ScoresSoftmax";
import { Scene4_Output } from "./scenes/Scene4_Output";

export const AttentionVideo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence durationInFrames={Math.round(3 * fps)}>
        <Intro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(8 * fps)}>
        <Scene1_Embeddings />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(12 * fps)}>
        <Scene2_QKV />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(15 * fps)}>
        <Scene3_ScoresSoftmax />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(8 * fps)}>
        <Scene4_Output />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(3 * fps)}>
        <Outro />
      </Series.Sequence>
    </Series>
  );
};
