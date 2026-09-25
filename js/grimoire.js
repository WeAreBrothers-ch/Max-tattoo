import { initFond } from "./fond.js";
import { initMelange } from "./melange.js";
import { initVideos } from "./video.js";
import { initTitreCourant } from "./grimoire/titre-courant.js";
import { initSommaire } from "./grimoire/sommaire.js";
import { initFeuilleSommaire } from "./grimoire/feuille-sommaire.js";
import { initVisionneuse } from "./grimoire/visionneuse.js";

document.addEventListener("DOMContentLoaded", () => {
  initMelange();
  initFond();
  initVideos();
  initTitreCourant();
  initSommaire();
  initFeuilleSommaire();
  initVisionneuse();
});
