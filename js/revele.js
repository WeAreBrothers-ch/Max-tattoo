/**
 * Révélations au défilement. Seuls les éléments encore sous l'écran au
 * chargement sont cachés, puis dévoilés en entrant dans la vue : ce qui est
 * déjà visible ne clignote pas, et rien n'est caché sans script.
 * Une image n'est dévoilée qu'une fois chargée (ou au plus tard après
 * REVELE_ATTENTE_MS), pour ne jamais découvrir un cadre vide.
 * Les éléments qui entrent ensemble se suivent de près (--delai).
 */

const REVELE_PAS_MS = 90;
const REVELE_PAS_MAX = 5;
const REVELE_ATTENTE_MS = 1200;

export function initRevele() {
  const elements = Array.from(document.querySelectorAll("[data-revele]"));
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (elements.length === 0 || reduit || !("IntersectionObserver" in window)) {
    return;
  }

  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees
        .filter((entree) => entree.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entree, rang) => {
          const element = entree.target;
          observateur.unobserve(element);
          if (element instanceof HTMLElement) {
            element.style.setProperty("--delai", `${Math.min(rang, REVELE_PAS_MAX) * REVELE_PAS_MS}ms`);
          }
          imagesPretes(element).then(() => element.classList.add("est-revele"));
        });
    },
    { rootMargin: "0px 0px -6% 0px" }
  );

  const basEcran = window.innerHeight;
  elements.forEach((element) => {
    if (element.getBoundingClientRect().top > basEcran) {
      element.classList.add("a-reveler");
      observateur.observe(element);
    }
  });
}

/**
 * @param {Element} element
 * @returns {Promise<void>} résolue quand les images de l'élément sont décodées
 */
function imagesPretes(element) {
  const enAttente = Array.from(element.querySelectorAll("img")).filter((image) => !image.complete);
  if (enAttente.length === 0) {
    return Promise.resolve();
  }
  const chargees = Promise.all(
    enAttente.map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        })
    )
  );
  const delai = new Promise((resolve) => window.setTimeout(resolve, REVELE_ATTENTE_MS));
  return Promise.race([chargees, delai]).then(() => undefined);
}
