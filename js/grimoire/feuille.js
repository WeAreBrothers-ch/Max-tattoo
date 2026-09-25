/**
 * Feuille plein écran bâtie sur <dialog> : focus gardé à l'intérieur,
 * Échap pour fermer, fond de page bloqué tant qu'elle est ouverte.
 */

/**
 * @param {HTMLDialogElement} dialog
 * @returns {{ ouvrir: () => void, fermer: () => void }}
 */
export function createFeuille(dialog) {
  const html = document.documentElement;

  function ouvrir() {
    if (dialog.open) {
      return;
    }
    html.classList.add("is-verrouille");
    dialog.showModal();
    // Le focus va à la feuille, pas au bouton Fermer : pas de cadre au toucher,
    // et Tab mène ensuite au premier lien.
    dialog.focus();
  }

  function fermer() {
    if (dialog.open) {
      dialog.close();
    }
  }

  // Fermeture par Échap, par le bouton ou par le code : même nettoyage.
  dialog.addEventListener("close", () => html.classList.remove("is-verrouille"));
  dialog.querySelectorAll("[data-fermer]").forEach((bouton) => bouton.addEventListener("click", fermer));

  return { ouvrir, fermer };
}

/** @returns {boolean} */
export function dialogDisponible() {
  return typeof HTMLDialogElement === "function" && "showModal" in HTMLDialogElement.prototype;
}
