/**
 * Les vidéos sont muettes et en boucle. Elles ne tournent que lorsqu'elles
 * sont visibles à l'écran, pour économiser batterie et forfait.
 * Mouvement réduit demandé : elles restent sur leur image d'attente.
 */

export function initVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-autoplay]"));
  if (videos.length === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
          playSafely(video);
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

/** @param {HTMLVideoElement} video */
function playSafely(video) {
  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") {
    // La lecture automatique peut être refusée : l'image d'attente reste affichée.
    attempt.catch(() => undefined);
  }
}
