import { initFond } from "./fond.js";
import { initMenu } from "./menu.js";
import { initEntete } from "./entete.js";
import { initMelange } from "./melange.js";
import { initDefileurs } from "./defileur.js";
import { initPile } from "./pile.js";
import { initVisionneuse } from "./visionneuse.js";
import { initRevele } from "./revele.js";
import { initVideos } from "./video.js";

document.addEventListener("DOMContentLoaded", () => {
  initMelange();
  initFond();
  initMenu();
  initEntete();
  initDefileurs();
  initPile();
  initVisionneuse();
  initRevele();
  initVideos();
});
