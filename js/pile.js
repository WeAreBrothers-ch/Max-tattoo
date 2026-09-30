/**
 * Pile de tirages (accueil, téléphone) : chaque carte s'arrête en haut de
 * l'écran (position sticky, en CSS) et la suivante vient la recouvrir.
 * Ce script mesure seulement combien chaque carte est recouverte (--couvert,
 * de 0 à 1) pour qu'elle recule et s'assombrisse : tout suit le doigt,
 * rien ne s'anime seul.
 */

export function initPile() {
  const piles = Array.from(document.querySelectorAll(".galerie--pile"));
  const telephone = window.matchMedia("(max-width: 767px)");
  if (piles.length === 0 || !("IntersectionObserver" in window)) {
    return;
  }

  const visibles = new Set();
  let enAttente = false;

  function mesurer() {
    enAttente = false;
    visibles.forEach((pile) => {
      const cartes = Array.from(pile.children).filter((el) => el instanceof HTMLElement && el.offsetParent !== null);
      cartes.forEach((carte, i) => {
        if (!(carte instanceof HTMLElement)) {
          return;
        }
        const suivante = cartes[i + 1];
        if (!telephone.matches || !suivante) {
          carte.style.removeProperty("--couvert");
          return;
        }
        const haut = carte.getBoundingClientRect();
        const dessous = suivante.getBoundingClientRect();
        const couvert = Math.min(1, Math.max(0, (haut.bottom - dessous.top) / Math.max(1, haut.height)));
        carte.style.setProperty("--couvert", couvert.toFixed(3));
      });
    });
  }

  const demander = () => {
    if (!enAttente && visibles.size > 0) {
      enAttente = true;
      requestAnimationFrame(mesurer);
    }
  };

  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (entree.isIntersecting) {
        visibles.add(entree.target);
      } else {
        visibles.delete(entree.target);
      }
    });
    demander();
  });
  piles.forEach((pile) => observateur.observe(pile));

  window.addEventListener("scroll", demander, { passive: true });
  window.addEventListener("resize", demander);
  telephone.addEventListener("change", demander);
}
