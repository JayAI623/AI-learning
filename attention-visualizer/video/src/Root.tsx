import { Composition } from "remotion";
import { AttentionVideo } from "./AttentionVideo";

const FPS = 30;
const DURATION_SECONDS = 3 + 8 + 12 + 15 + 8 + 3; // = 49 seconds

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AttentionVideo"
      component={AttentionVideo}
      durationInFrames={DURATION_SECONDS * FPS}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
