import { initFond } from "./fond.js";
import { initMenu } from "./menu.js";
import { initEntete } from "./entete.js";
import { initMelange } from "./melange.js";
import { initThemes } from "./themes.js";
import { initProcessus } from "./processus.js";
import { initOnglets } from "./onglets.js";
import { initRetournes } from "./retourne.js";
import { initComposeur } from "./composeur.js";
import { initVisionneuse } from "./visionneuse.js";
import { initRevele } from "./revele.js";
import { initVideos } from "./video.js";
import { initMusique } from "./musique.js";

document.addEventListener("DOMContentLoaded", () => {
  initMelange();
  initThemes();
  initProcessus();
  initOnglets();
  initRetournes();
  initComposeur();
  initFond();
  initMenu();
  initEntete();
  initVisionneuse();
  initRevele();
  initVideos();
  initMusique();
});
