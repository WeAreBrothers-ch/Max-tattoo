/**
 * Barre du bas (téléphone et tablette). Son filet se remplit à mesure qu'on
 * avance dans la page, et son milieu nomme le chapitre en cours, comme le
 * titre courant d'un livre. Les chapitres portent data-titre : un mot court,
 * qui tient entre les deux boutons même sur un petit écran.
 */

const BARRE_SORTIE_MS = 170;

export function initBarre() {
  const barre = document.querySelector("[data-barre]");
  const libelle = barre?.querySelector("[data-barre-titre]");
  if (!(barre instanceof HTMLElement) || !(libelle instanceof HTMLElement)) {
    return;
  }

  let enAttente = false;
  function suivreLecture() {
    enAttente = false;
    const parcours = document.documentElement.scrollHeight - window.innerHeight;
    const avance = parcours > 0 ? Math.min(1, Math.max(0, window.scrollY / parcours)) : 0;
    barre.style.setProperty("--progression", avance.toFixed(4));
  }
  const demander = () => {
    if (!enAttente) {
      enAttente = true;
      requestAnimationFrame(suivreLecture);
    }
  };
  window.addEventListener("scroll", demander, { passive: true });
  window.addEventListener("resize", demander);
  suivreLecture();

  const chapitres = Array.from(document.querySelectorAll("[data-titre]"));
  if (chapitres.length === 0 || !("IntersectionObserver" in window)) {
    return;
  }

  let courant = libelle.textContent ?? "";
  let minuteur = 0;

  /** @param {string} texte */
  function afficher(texte) {
    if (texte === courant) {
      return;
    }
    courant = texte;
    window.clearTimeout(minuteur);
    libelle.classList.remove("entre");
    libelle.classList.add("sort");
    minuteur = window.setTimeout(() => {
      libelle.textContent = texte;
      libelle.classList.remove("sort");
      libelle.classList.add("entre");
      // Deux images plus tard, le nouveau titre part d'en bas et monte en place.
      requestAnimationFrame(() => requestAnimationFrame(() => libelle.classList.remove("entre")));
    }, BARRE_SORTIE_MS);
  }

  // Le chapitre en cours est celui qui traverse une fine ligne au milieu de l'écran.
  const observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting && entree.target instanceof HTMLElement) {
          afficher(entree.target.dataset.titre ?? "");
        }
      });
    },
    { rootMargin: "-45% 0px -54% 0px" }
  );
  chapitres.forEach((chapitre) => observateur.observe(chapitre));
}
