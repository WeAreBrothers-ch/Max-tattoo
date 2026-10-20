/**
 * Les vidéos sont muettes et en boucle. Elles se lancent seules, sans qu'on
 * touche à rien, mais ne tournent que lorsqu'elles sont visibles à l'écran,
 * pour économiser batterie et forfait.
 * Un mot « Pause » sous un film (bouton [data-pause]) l'arrête ; il ne
 * repart alors plus seul, jusqu'à ce qu'on touche « Lecture ».
 * Mouvement réduit demandé : elles restent sur leur image d'attente, avec
 * les commandes du navigateur pour les lancer soi-même.
 */

export function initVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-autoplay]"));
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  initPauses(reduit);
  if (videos.length === 0 || reduit) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    videos.forEach((video) => playSafely(video));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) {
          return;
        }
        if (entry.isIntersecting) {
          if (video.dataset.enPause !== "1") {
            playSafely(video);
          }
        } else {
          video.pause();
        }
      });
    },
    // Téléphone : seulement les vidéos vraiment à l'écran (batterie, fluidité du défilement).
    window.matchMedia("(max-width: 767px)").matches ? { rootMargin: "0px", threshold: 0.2 } : { rootMargin: "200px 0px", threshold: 0.01 }
  );

  videos.forEach((video) => observer.observe(video));
}

/**
 * Boutons « Pause » / « Lecture » : cachés sans script, ils pilotent la vidéo
 * qu'ils désignent (aria-controls).
 * @param {boolean} reduit
 */
function initPauses(reduit) {
  document.querySelectorAll("button[data-pause]").forEach((bouton) => {
    const video = document.getElementById(bouton.getAttribute("aria-controls") || "");
    if (!(bouton instanceof HTMLButtonElement) || !(video instanceof HTMLVideoElement)) {
      return;
    }
    if (reduit) {
      video.controls = true;
      return;
    }
    const afficher = () => {
      bouton.textContent = video.dataset.enPause === "1" ? "Lecture" : "Pause";
    };
    bouton.addEventListener("click", () => {
      if (video.dataset.enPause === "1") {
        delete video.dataset.enPause;
        playSafely(video);
      } else {
        video.dataset.enPause = "1";
        video.pause();
      }
      afficher();
    });
    afficher();
    bouton.hidden = false;
  });
}

/** @param {HTMLVideoElement} video */
function playSafely(video) {
  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") {
    // La lecture automatique peut être refusée : l'image d'attente reste affichée.
    attempt.catch(() => undefined);
  }
}
