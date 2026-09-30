/**
 * Couches plein écran (menu, visionneuse) et retour arrière du téléphone :
 * le bouton ou le geste « retour » referme la couche au lieu de quitter la
 * page. Chaque ouverture ajoute une entrée à l'historique, retirée à la
 * fermeture ; un lien suivi depuis la couche la retire aussi avant de partir,
 * pour qu'un retour depuis la page suivante ne tombe pas sur une entrée vide.
 */

/**
 * @param {string} nom
 * @param {() => void} fermer referme la couche (appelé au retour arrière)
 * @returns {{ ouverte: () => void, fermee: () => void, naviguer: (url: string) => boolean }}
 */
export function creerCouche(nom, fermer) {
  let active = false;
  let destination = "";

  window.addEventListener("popstate", () => {
    if (destination) {
      const url = destination;
      destination = "";
      window.location.assign(url);
      return;
    }
    if (active) {
      active = false;
      fermer();
    }
  });

  return {
    ouverte() {
      if (!active) {
        history.pushState({ couche: nom }, "");
        active = true;
      }
    },
    fermee() {
      if (active) {
        active = false;
        history.back();
      }
    },
    naviguer(url) {
      if (!active) {
        return false;
      }
      active = false;
      destination = url;
      history.back();
      return true;
    },
  };
}
