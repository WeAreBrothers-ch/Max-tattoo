/**
 * Visionneuse des pièces portées : toucher une vignette l'ouvre en grand,
 * puis on glisse d'une pièce à l'autre (défilement natif avec aimantation,
 * donc le geste est celui du téléphone, sans code de glisser).
 */

import { createFeuille, dialogDisponible } from "./feuille.js";

export function initVisionneuse() {
  const dialog = document.querySelector("[data-visionneuse]");
  const bande = document.querySelector("[data-visionneuse-bande]");
  const compteur = document.querySelector("[data-compteur]");
  const pieces = Array.from(document.querySelectorAll(".mosaique .piece"));
  if (!(dialog instanceof HTMLDialogElement) || !(bande instanceof HTMLElement) || !compteur || !dialogDisponible()) {
    return;
  }

  pieces.forEach((piece) => bande.append(creerVue(piece)));
  const vues = Array.from(bande.children);
  const feuille = createFeuille(dialog);
  let indexCourant = 0;

  /** @param {number} index */
  function montrer(index) {
    indexCourant = index;
    compteur.textContent = `${index + 1} / ${vues.length}`;
    vues.forEach((vue, i) => {
      const video = vue.querySelector("video");
      if (video && i === index) {
        video.play().catch(() => undefined);
      } else if (video) {
        video.pause();
      }
    });
  }

  pieces.forEach((piece, index) => {
    piece.querySelector(".piece-ouvrir")?.addEventListener("click", () => {
      feuille.ouvrir();
      bande.scrollTo({ left: index * bande.clientWidth, behavior: "instant" });
      montrer(index);
    });
  });

  bande.addEventListener(
    "scroll",
    () => {
      const index = Math.round(bande.scrollLeft / Math.max(1, bande.clientWidth));
      if (index !== indexCourant) {
        montrer(Math.min(vues.length - 1, Math.max(0, index)));
      }
    },
    { passive: true }
  );

  dialog.addEventListener("close", () => vues.forEach((vue) => vue.querySelector("video")?.pause()));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const pas = event.key === "ArrowRight" ? 1 : -1;
      const index = Math.min(vues.length - 1, Math.max(0, indexCourant + pas));
      bande.scrollTo({ left: index * bande.clientWidth, behavior: "smooth" });
    }
  });
}

/**
 * Vue en grand d'une pièce : l'image (ou la vidéo) et l'emplacement sur le corps.
 * @param {Element} piece
 * @returns {HTMLElement}
 */
function creerVue(piece) {
  const vue = document.createElement("figure");
  vue.className = "vue";
  const media = piece.querySelector("img, video");
  if (media instanceof HTMLImageElement) {
    const image = document.createElement("img");
    image.src = media.currentSrc || media.src;
    image.alt = media.alt;
    image.loading = "lazy";
    image.className = "enhance";
    vue.append(image);
  } else if (media instanceof HTMLVideoElement) {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = media.poster;
    media.querySelectorAll("source").forEach((source) => video.append(source.cloneNode(true)));
    vue.append(video);
  }
  const legende = document.createElement("figcaption");
  legende.className = "capitales";
  legende.textContent = piece.querySelector("figcaption")?.textContent ?? "";
  vue.append(legende);
  return vue;
}
