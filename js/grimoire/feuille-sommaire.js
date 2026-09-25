/**
 * Le bouton de la barre ouvre le sommaire en plein écran. La liste est
 * copiée depuis le sommaire de la page : une seule source à tenir à jour.
 * Toucher une entrée ferme la feuille puis descend au chapitre.
 */

import { createFeuille, dialogDisponible } from "./feuille.js";

export function initFeuilleSommaire() {
  const dialog = document.querySelector("[data-feuille]");
  const liste = document.querySelector(".sommaire .sommaire-liste");
  const boutons = document.querySelectorAll("[data-ouvrir-sommaire]");
  if (!(dialog instanceof HTMLDialogElement) || !liste) {
    return;
  }
  if (!dialogDisponible()) {
    // Navigateur trop ancien : le bouton mène au sommaire de la page.
    boutons.forEach((bouton) => bouton.addEventListener("click", () => liste.scrollIntoView()));
    return;
  }

  const copie = liste.cloneNode(true);
  if (copie instanceof HTMLElement) {
    copie.removeAttribute("id");
    dialog.append(copie);
  }
  const feuille = createFeuille(dialog);
  boutons.forEach((bouton) => bouton.addEventListener("click", feuille.ouvrir));

  dialog.querySelectorAll("a[href^='#']").forEach((lien) => {
    lien.addEventListener("click", (event) => {
      const cible = document.querySelector(lien.getAttribute("href") ?? "");
      if (!cible) {
        return;
      }
      event.preventDefault();
      feuille.fermer();
      cible.scrollIntoView({ block: "start" });
      history.replaceState(null, "", lien.getAttribute("href"));
    });
  });
}
