/**
 * Titre courant, comme dans un livre : la barre apparaît une fois la page de
 * titre passée et nomme le chapitre en cours de lecture (« II · Pièces portées »).
 */

const FONDU_MS = 200;

export function initTitreCourant() {
  const barre = document.querySelector("[data-barre]");
  const frontispice = document.querySelector("[data-frontispice]");
  const libelle = document.querySelector("[data-chapitre-courant]");
  if (!barre || !frontispice || !libelle || !("IntersectionObserver" in window)) {
    barre?.classList.add("is-visible");
    return;
  }

  new IntersectionObserver(([entry]) => {
    barre.classList.toggle("is-visible", !entry.isIntersecting);
  }, { threshold: 0.15 }).observe(frontispice);

  const chapitres = Array.from(document.querySelectorAll("[data-chapitre]"));
  let courant = "";
  let minuteur = 0;

  /** @param {string} titre */
  function afficher(titre) {
    if (titre === courant) {
      return;
    }
    courant = titre;
    window.clearTimeout(minuteur);
    libelle.classList.add("is-changing");
    minuteur = window.setTimeout(() => {
      libelle.textContent = titre;
      libelle.classList.remove("is-changing");
    }, FONDU_MS);
  }

  // Le chapitre lu est celui qui traverse une fine bande au tiers de l'écran.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          const { num, chapitre } = entry.target.dataset;
          afficher(num ? `${num} · ${chapitre}` : chapitre ?? "Sommaire");
        }
      });
    },
    { rootMargin: "-33% 0px -66% 0px" }
  );
  chapitres.forEach((chapitre) => observer.observe(chapitre));
}
