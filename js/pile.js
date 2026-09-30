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
      // Toutes les mesures d'abord, toutes les écritures ensuite : une seule mise en page par image.
      // Le haut (origine du recul) et la hauteur sans transformation : la mesure
      // ne dépend pas du recul qu'elle commande, donc rien ne tremble.
      const hauts = cartes.map((carte) => carte.getBoundingClientRect().top);
      const hauteurs = cartes.map((carte) => /** @type {HTMLElement} */ (carte).offsetHeight);
      const valeurs = cartes.map((carte, i) => {
        if (!telephone.matches || i === cartes.length - 1) {
          return "";
        }
        const couvert = Math.min(1, Math.max(0, (hauts[i] + hauteurs[i] - hauts[i + 1]) / Math.max(1, hauteurs[i])));
        return couvert.toFixed(2);
      });
      cartes.forEach((carte, i) => {
        if (!(carte instanceof HTMLElement) || carte.style.getPropertyValue("--couvert") === valeurs[i]) {
          return;
        }
        if (valeurs[i]) {
          carte.style.setProperty("--couvert", valeurs[i]);
        } else {
          carte.style.removeProperty("--couvert");
        }
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
