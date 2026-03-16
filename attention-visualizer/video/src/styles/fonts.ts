/**
 * Font loading — Fira Sans (display/body) + Fira Code (mono)
 * Same fonts as the web app's tokens.css
 */
import { loadFont as loadFiraCode } from "@remotion/google-fonts/FiraCode";
import { loadFont as loadFiraSans } from "@remotion/google-fonts/FiraSans";

const firaSans = loadFiraSans("normal", {
  weights: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const firaCode = loadFiraCode("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const FONT_DISPLAY = firaSans.fontFamily;
export const FONT_BODY = firaSans.fontFamily;
export const FONT_MONO = firaCode.fontFamily;
