import { initFond } from "./fond.js";
import { initMelange } from "./melange.js";
import { initVideos } from "./video.js";

document.addEventListener("DOMContentLoaded", () => {
  initMelange();
  initFond();
  initVideos();
});
