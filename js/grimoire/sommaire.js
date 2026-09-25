/**
 * Sommaire : au survol d'une entrée, l'emblème du chapitre apparaît et suit
 * la souris avec un léger retard. Rien sur écran tactile.
 */

const LISSAGE = 0.18;
const DECALAGE_X = 64;
const DECALAGE_Y = -160;

export function initSommaire() {
  const figure = document.querySelector("[data-embleme-flottant]");
  const image = figure?.querySelector("img");
  const entrees = Array.from(document.querySelectorAll(".entree[data-embleme]"));
  const pointeurFin = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!(figure instanceof HTMLElement) || !(image instanceof HTMLImageElement) || !pointeurFin) {
    return;
  }

  prechargerEmblemes(entrees);
  const cible = { x: 0, y: 0 };
  const actuel = { x: 0, y: 0 };
  let boucle = 0;

  function suivre() {
    actuel.x += (cible.x - actuel.x) * LISSAGE;
    actuel.y += (cible.y - actuel.y) * LISSAGE;
    figure.style.setProperty("--ex", `${actuel.x.toFixed(1)}px`);
    figure.style.setProperty("--ey", `${actuel.y.toFixed(1)}px`);
    boucle = requestAnimationFrame(suivre);
  }

  entrees.forEach((entree) => {
    entree.addEventListener("pointerenter", (event) => {
      const source = entree.getAttribute("data-embleme");
      if (source && image.getAttribute("src") !== source) {
        image.src = source;
      }
      if (!figure.classList.contains("is-visible")) {
        // Première apparition : l'emblème naît sous la souris, sans glisser depuis le coin.
        placer(event);
        actuel.x = cible.x;
        actuel.y = cible.y;
      }
      figure.classList.add("is-visible");
      if (boucle === 0) {
        boucle = requestAnimationFrame(suivre);
      }
    });
    entree.addEventListener("pointermove", placer);
  });

  document.querySelector(".sommaire-liste")?.addEventListener("pointerleave", () => {
    figure.classList.remove("is-visible");
    cancelAnimationFrame(boucle);
    boucle = 0;
  });

  /** @param {PointerEvent} event */
  function placer(event) {
    cible.x = event.clientX + DECALAGE_X;
    cible.y = event.clientY + DECALAGE_Y;
  }
}

/** @param {Element[]} entrees */
function prechargerEmblemes(entrees) {
  entrees.forEach((entree) => {
    const source = entree.getAttribute("data-embleme");
    if (source) {
      new Image().src = source;
    }
  });
}
