/**
 * Les vidéos sont muettes et en boucle. Elles ne tournent que lorsqu'elles
 * sont visibles à l'écran, pour économiser batterie et bande passante.
 */

export function initVideos() {
  const videos = Array.from(document.querySelectorAll("video[data-autoplay]"));
  if (videos.length === 0) {
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
    { rootMargin: "120px 0px", threshold: 0.1 }
  );

  videos.forEach((video) => observer.observe(video));
}

function playSafely(video) {
  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") {
    // La lecture automatique peut être refusée : l'image d'attente reste affichée.
    attempt.catch(() => undefined);
  }
}
