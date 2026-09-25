/**
 * Fond animé : brume et rayons de lumière en mouvement permanent, gravure
 * rouge sang révélée dans un halo qui suit la souris (ou le doigt), dessinés
 * en WebGL dans un canevas fixe derrière la page.
 * Mouvement réduit demandé : une seule image fixe.
 * WebGL indisponible ou perdu : la gravure fixe en CSS prend le relais.
 */

import { createScene, loadGravure } from "./fond-gl.js";
import { createPointeur } from "./fond-pointeur.js";

const MAX_PIXELS = 1_100_000;
const MAX_DPR = 1.5;
const FRAME_MS = 1000 / 30;
const SCROLL_DRIFT = 0.00035;
const HALO_DESKTOP_PX = 380;
const HALO_MOBILE_PX = 240;
const MOBILE_MAX_WIDTH = 767;
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
  const { gl, uniforms } = createScene(canvas);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointeur = createPointeur({
    immediate: reduceMotion,
    // Sans boucle d'animation (mouvement réduit), chaque geste redessine.
    onChange: () => {
      if (reduceMotion) {
        draw(performance.now());
      }
    },
  });
  let orientation = "";
  let frame = 0;
  let lastDraw = 0;
  const startTime = performance.now();

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (width * height)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
    const halo = width <= MOBILE_MAX_WIDTH ? HALO_MOBILE_PX : HALO_DESKTOP_PX;
    gl.uniform1f(uniforms.u_halo, halo * scale);
    swapGravure(width >= height ? "paysage" : "portrait");
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
        gl.uniform1f(uniforms.u_gravureReady, 1);
        draw(performance.now());
      })
      // Sans gravure, la brume et les rayons restent : rien ne casse.
      .catch(() => gl.uniform1f(uniforms.u_gravureReady, 0));
  }

  /** @param {number} now */
  function draw(now) {
    const time = reduceMotion ? 40 : (now - startTime) / 1000;
    const lantern = pointeur.update();
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform1f(uniforms.u_scroll, window.scrollY * SCROLL_DRIFT);
    gl.uniform2f(uniforms.u_pointer, lantern.x, lantern.y);
    gl.uniform1f(uniforms.u_pointerForce, lantern.force);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add("is-ready");
  }

  /** @param {number} now */
  function loop(now) {
    frame = requestAnimationFrame(loop);
    if (now - lastDraw >= FRAME_MS) {
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

  window.addEventListener("resize", () => {
    resize();
    draw(performance.now());
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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {unknown} error
 */
function fallBack(canvas, error) {
  canvas.hidden = true;
  document.documentElement.classList.add("fond-fixe");
  document.documentElement.dataset.fondErreur = error instanceof Error ? error.message : "inconnue";
}
