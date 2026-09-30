/**
 * En-tête : il se retire quand on descend et revient dès qu'on remonte.
 * Sur l'accueil, le petit nom n'apparaît qu'une fois le grand nom passé.
 */

const ENTETE_SEUIL_PX = 140;
const ENTETE_ECART_PX = 8;

export function initEntete() {
  const entete = document.querySelector("[data-entete]");
  if (!(entete instanceof HTMLElement)) {
    return;
  }

  const html = document.documentElement;
  let dernierY = Math.max(0, window.scrollY);
  let enAttente = false;

  function suivreDefilement() {
    enAttente = false;
    const y = Math.max(0, window.scrollY);
    if (html.classList.contains("menu-ouvert") || Math.abs(y - dernierY) < ENTETE_ECART_PX) {
      return;
    }
    entete.classList.toggle("est-cache", y > dernierY && y > ENTETE_SEUIL_PX);
    dernierY = y;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!enAttente) {
        enAttente = true;
        requestAnimationFrame(suivreDefilement);
      }
    },
    { passive: true }
  );

  // Au clavier, l'en-tête revient dès qu'un de ses liens prend le focus.
  entete.addEventListener("focusin", () => entete.classList.remove("est-cache"));

  const grandNom = document.querySelector("[data-grand-nom]");
  if (grandNom && "IntersectionObserver" in window) {
    html.classList.add("au-sommet");
    new IntersectionObserver(([entree]) => {
      html.classList.toggle("au-sommet", entree.isIntersecting);
    }).observe(grandNom);
  }
}
