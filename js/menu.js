/**
 * Menu plein écran bâti sur <dialog> : focus gardé à l'intérieur, Échap pour
 * fermer, page figée derrière. Le script ajoute l'entrée et la sortie animées
 * et fait remonter la gravure du fond (js/fond.js lit la classe menu-ouvert).
 * Sans script, les commandes HTML (commandfor) ouvrent le menu quand même.
 */

const MENU_SORTIE_MS = 480;

export function initMenu() {
  const dialog = document.getElementById("menu");
  const boutons = Array.from(document.querySelectorAll("[data-ouvrir-menu]"));
  if (!(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== "function") {
    return;
  }

  const html = document.documentElement;
  const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  const liens = Array.from(dialog.querySelectorAll(".menu-lien"));
  const emblemes = Array.from(dialog.querySelectorAll(".menu-emblemes img"));
  const indexCourant = Math.max(0, liens.findIndex((lien) => lien.getAttribute("aria-current") === "page"));
  let minuteur = 0;

  dialog.classList.add("anime");
  montrerEmbleme(indexCourant);

  /** @param {Event} [event] */
  function ouvrir(event) {
    event?.preventDefault();
    window.clearTimeout(minuteur);
    dialog.classList.remove("se-ferme");
    if (!dialog.open) {
      dialog.showModal();
    }
    html.classList.add("menu-ouvert");
    boutons.forEach((bouton) => bouton.setAttribute("aria-expanded", "true"));
    precharger();
    // Deux images plus tard, l'état fermé a été peint : la transition peut partir.
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add("est-ouvert")));
  }

  function fermer() {
    if (!dialog.open || dialog.classList.contains("se-ferme")) {
      return;
    }
    dialog.classList.remove("est-ouvert");
    dialog.classList.add("se-ferme");
    // La page revient une fois les chapitres presque sortis, pas dessous.
    const sortie = mouvementReduit.matches ? 0 : MENU_SORTIE_MS;
    minuteur = window.setTimeout(() => {
      html.classList.remove("menu-ouvert");
      dialog.close();
    }, sortie);
  }

  /** @param {number} index */
  function montrerEmbleme(index) {
    emblemes.forEach((image, i) => image.classList.toggle("est-actif", i === index));
  }

  // Les emblèmes ne pèsent rien tant qu'on ne s'approche pas du bouton.
  function precharger() {
    emblemes.forEach((image) => {
      image.loading = "eager";
    });
  }

  boutons.forEach((bouton) => {
    bouton.addEventListener("click", ouvrir);
    bouton.addEventListener("pointerenter", precharger, { once: true });
    bouton.addEventListener("focus", precharger, { once: true });
  });

  dialog.querySelectorAll("[data-fermer-menu]").forEach((bouton) => {
    bouton.addEventListener("click", (event) => {
      event.preventDefault();
      fermer();
    });
  });

  liens.forEach((lien, index) => {
    lien.addEventListener("pointerenter", () => montrerEmbleme(index));
    lien.addEventListener("focus", () => montrerEmbleme(index));
    // Le chapitre en cours : on referme simplement le menu.
    if (lien.getAttribute("aria-current") === "page") {
      lien.addEventListener("click", (event) => {
        event.preventDefault();
        fermer();
      });
    }
  });

  dialog.querySelector(".menu-liste")?.addEventListener("pointerleave", () => montrerEmbleme(indexCourant));

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    fermer();
  });

  // Fermeture par le code, une commande HTML ou le navigateur : même nettoyage.
  dialog.addEventListener("close", () => {
    window.clearTimeout(minuteur);
    dialog.classList.remove("est-ouvert", "se-ferme");
    html.classList.remove("menu-ouvert");
    boutons.forEach((bouton) => bouton.setAttribute("aria-expanded", "false"));
    montrerEmbleme(indexCourant);
  });

  // Retour arrière depuis une autre page : le menu ne doit pas rester ouvert.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && dialog.open) {
      dialog.close();
    }
  });
}
