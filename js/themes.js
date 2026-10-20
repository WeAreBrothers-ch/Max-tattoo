/**
 * Tatouages, un thème à la fois. La page s'ouvre sur les quatre dessins des
 * thèmes ; toucher l'un d'eux montre son chapitre seul, avec les quatre
 * emblèmes en onglets pour passer d'un thème à l'autre. Le thème vit dans
 * l'adresse (#mains, #betes, #cranes, #yeux) : on peut le partager, et le
 * « retour » du téléphone ramène au thème précédent puis aux quatre dessins.
 * Sans script, rien n'est caché : les chapitres se suivent sous les dessins.
 */

const TITRE_PAGE = document.title;

export function initThemes() {
  const accueil = document.querySelector("[data-themes-accueil]");
  const vue = document.querySelector("[data-themes-vue]");
  if (!(accueil instanceof HTMLElement) || !(vue instanceof HTMLElement)) {
    return;
  }
  const chapitres = Array.from(vue.querySelectorAll("[data-theme]")).filter((chapitre) => chapitre instanceof HTMLElement);
  const onglets = Array.from(vue.querySelectorAll("[data-onglet]"));
  const barreOnglets = vue.querySelector(".onglets-themes");
  if (chapitres.length === 0) {
    return;
  }

  document.documentElement.classList.add("themes-actifs");
  if (barreOnglets instanceof HTMLElement) {
    barreOnglets.hidden = false;
  }

  /** @param {boolean} defiler revenir en haut de page (changement de thème) */
  function afficher(defiler) {
    const demande = decodeURIComponent(window.location.hash.slice(1));
    const choisi = chapitres.find((chapitre) => chapitre.id === demande);
    accueil.hidden = Boolean(choisi);
    vue.hidden = !choisi;
    chapitres.forEach((chapitre) => {
      const montre = chapitre === choisi;
      chapitre.hidden = !montre;
      if (!montre) {
        chapitre.querySelectorAll("video").forEach((video) => video.pause());
      }
    });
    onglets.forEach((onglet) => {
      onglet.setAttribute("aria-current", String(onglet.getAttribute("data-onglet") === choisi?.id));
    });
    const titre = choisi?.querySelector(".chapitre-titre")?.textContent?.trim();
    document.title = titre ? `${titre} — ${TITRE_PAGE}` : TITRE_PAGE;
    if (defiler) {
      // Le navigateur recale encore la page après le changement d'ancre : on remonte à l'image suivante aussi.
      window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
  }

  window.addEventListener("hashchange", () => afficher(true));
  // Arrivée sur un thème (lien de l'accueil, adresse partagée) : il s'ouvre en haut de page.
  afficher(window.location.hash.length > 1);
}
