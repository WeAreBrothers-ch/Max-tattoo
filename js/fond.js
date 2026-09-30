/**
 * Fond animé : brume et rayons de lumière en mouvement permanent, gravure
 * rouge sang révélée dans un halo qui suit la souris, dessinés en WebGL dans
 * un canevas fixe derrière la page. Sur écran tactile, rien ne suit le doigt :
 * une lanterne toujours allumée se promène seule un peu partout
 * (js/fond-pointeur.js) et révèle la gravure dès l'arrivée.
 * Quand le menu s'ouvre (classe menu-ouvert sur <html>), la gravure entière
 * remonte de la brume.
 * Le canevas garde sa taille quand la barre d'adresse du téléphone apparaît
 * ou disparaît : il ne se redessine à neuf que si sa taille change vraiment.
 * Téléphone : moins de pixels et une octave de brume en moins (la brume est
 * floue, rien ne se voit), à cadence régulière. D'une page à l'autre, le fond
 * reprend là où il en était au lieu de repartir du noir.
 * Mouvement réduit demandé : une seule image fixe.
 * WebGL indisponible ou perdu : la gravure fixe en CSS prend le relais.
 */

import { createScene, loadGravure } from "./fond-gl.js";
import { createPointeur } from "./fond-pointeur.js";

const MAX_PIXELS = 1_100_000;
const MAX_DPR = 1.5;
const MAX_PIXELS_TACTILE = 420_000;
const MAX_DPR_TACTILE = 1;
const FRAME_MS = 1000 / 30;
const CLE_TEMPS = "fond-temps";
const SCROLL_DRIFT = 0.00035;
const HALO_DESKTOP_PX = 380;
// Sur téléphone, la lanterne éclaire une large part de l'écran, en fondu très doux.
const HALO_TACTILE_LARGEUR = 0.8;
const DEVOILE_LERP = 0.05;
const GRAVURE_LERP = 0.12;
// Le défilement fait dériver la brume ; lissé, il ne donne jamais d'à-coup.
const SCROLL_LERP = 0.08;
const GRAVURES = {
  paysage: "assets/img/fond-paysage-masque.webp",
  portrait: "assets/img/fond-portrait-masque.webp",
};

export function initFond() {
  const canvas = document.querySelector("canvas.fond");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }
  try {
    start(canvas);
  } catch (error) {
    fallBack(canvas, error);
  }
}

/** @param {HTMLCanvasElement} canvas */
function start(canvas) {
  const tactile = window.matchMedia("(hover: none)").matches;
  const { gl, uniforms } = createScene(canvas, { octaves: tactile ? 4 : 5 });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let orientation = "";
  let frame = 0;
  let lastDraw = 0;
  let devoile = 0;
  let scrollLisse = window.scrollY;
  let taille = "";
  // La gravure arrive en fondu quand sa texture est prête, jamais d'un coup.
  let gravure = 0;
  let gravureCible = 0;
  const startTime = performance.now();
  const html = document.documentElement;
  // Temps déjà écoulé sur les pages précédentes : la brume continue son chemin.
  const tempsAcquis = lireTemps();
  if (tempsAcquis > 0) {
    canvas.classList.add("sans-fondu");
  }
  const pointeur = createPointeur({
    immediate: reduceMotion,
    tactile,
    // Page suivante de la visite : la lanterne est déjà allumée, au même endroit.
    dejaAllumee: tempsAcquis > 0,
    // Sans boucle d'animation (mouvement réduit), chaque geste de souris redessine.
    onChange: () => {
      if (reduceMotion) {
        draw(performance.now());
      }
    },
  });

  /** @returns {boolean} vrai si la taille a changé */
  function resize() {
    // Taille du canevas lui-même (100lvh en CSS) : stable pendant le défilement.
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (`${width}x${height}` === taille) {
      return false;
    }
    taille = `${width}x${height}`;
    const scale = tactile
      ? Math.min(window.devicePixelRatio || 1, MAX_DPR_TACTILE, Math.sqrt(MAX_PIXELS_TACTILE / (width * height)))
      : Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (width * height)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
    const halo = tactile ? Math.min(width, height) * HALO_TACTILE_LARGEUR : HALO_DESKTOP_PX;
    gl.uniform1f(uniforms.u_halo, halo * scale);
    swapGravure(width >= height ? "paysage" : "portrait");
    return true;
  }

  /** @param {"paysage" | "portrait"} next */
  function swapGravure(next) {
    if (next === orientation) {
      return;
    }
    orientation = next;
    loadGravure(gl, GRAVURES[next])
      .then((ratio) => {
        gl.uniform1f(uniforms.u_gravureAspect, ratio);
        gravureCible = 1;
        draw(performance.now());
      })
      // Sans gravure, la brume et les rayons restent : rien ne casse.
      .catch(() => {
        gravureCible = 0;
      });
  }

  /** @param {number} now */
  function draw(now) {
    const time = reduceMotion ? 40 : tempsAcquis + (now - startTime) / 1000;
    const lantern = pointeur.update(now, time);
    const devoileCible = html.classList.contains("menu-ouvert") ? 1 : 0;
    devoile = reduceMotion ? devoileCible : devoile + (devoileCible - devoile) * DEVOILE_LERP;
    gl.uniform1f(uniforms.u_devoile, devoile);
    gravure = reduceMotion ? gravureCible : gravure + (gravureCible - gravure) * GRAVURE_LERP;
    gl.uniform1f(uniforms.u_gravureReady, gravure);
    gl.uniform1f(uniforms.u_time, time);
    scrollLisse = reduceMotion ? window.scrollY : scrollLisse + (window.scrollY - scrollLisse) * SCROLL_LERP;
    gl.uniform1f(uniforms.u_scroll, scrollLisse * SCROLL_DRIFT);
    gl.uniform2f(uniforms.u_pointer, lantern.x, lantern.y);
    gl.uniform1f(uniforms.u_pointerForce, lantern.force);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add("is-ready");
  }

  /** @param {number} now */
  function loop(now) {
    frame = requestAnimationFrame(loop);
    // Cadence régulière (une trame sur deux à 60 Hz, une sur quatre à 120 Hz) :
    // la lanterne glisse sans à-coup. Petite marge pour ne pas rater la trame.
    if (now - lastDraw >= FRAME_MS - 4) {
      lastDraw = now;
      draw(now);
    }
  }

  function play() {
    if (!reduceMotion && frame === 0 && !document.hidden) {
      frame = requestAnimationFrame(loop);
    }
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  // Sans boucle (mouvement réduit), l'ouverture du menu redessine une fois.
  if (reduceMotion) {
    new MutationObserver(() => draw(performance.now())).observe(html, { attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("pagehide", () => {
    if (!reduceMotion) {
      ecrireTemps(tempsAcquis + (performance.now() - startTime) / 1000);
    }
  });

  window.addEventListener("resize", () => {
    if (resize()) {
      draw(performance.now());
    }
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    pause();
    fallBack(canvas, new Error("Contexte WebGL perdu"));
  });

  resize();
  draw(performance.now());
  play();
}

/** @returns {number} secondes de brume déjà écoulées dans cette visite */
function lireTemps() {
  try {
    const valeur = Number(window.sessionStorage.getItem(CLE_TEMPS));
    return Number.isFinite(valeur) && valeur > 0 ? valeur : 0;
  } catch {
    return 0;
  }
}

/** @param {number} secondes */
function ecrireTemps(secondes) {
  try {
    window.sessionStorage.setItem(CLE_TEMPS, secondes.toFixed(2));
  } catch {
    // Stockage refusé (navigation privée) : la brume repartira de zéro.
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {unknown} error
 */
function fallBack(canvas, error) {
  canvas.hidden = true;
  document.documentElement.classList.add("fond-fixe");
  document.documentElement.dataset.fondErreur = error instanceof Error ? error.message : "inconnue";
}
