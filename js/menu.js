/**
 * Menu plein écran bâti sur <dialog> : focus gardé à l'intérieur, Échap ou
 * « retour » du téléphone pour fermer, page figée derrière. Le script ajoute
 * l'entrée et la sortie animées et fait remonter la gravure du fond
 * (js/fond.js lit la classe menu-ouvert).
 * Fermeture en deux temps (css/menu.css) : le rideau noir revient sur le
 * menu, la page reprend sa place derrière lui, puis il descend et la
 * découvre ; le <dialog> ne se ferme qu'une fois le rideau passé.
 * Sans script, les commandes HTML (commandfor) ouvrent le menu quand même.
 */

import { creerCouche } from "./couche.js";

// La page revient quand le rideau est de nouveau opaque…
const MENU_PAGE_MS = 320;
// …et le menu se ferme quand le rideau a fini de descendre.
const MENU_SORTIE_MS = 900;

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
  const couche = creerCouche("menu", fermer);
  let minuteur = 0;
  let minuteurPage = 0;

  dialog.classList.add("anime");
  montrerEmbleme(indexCourant);

  /** @param {Event} [event] */
  function ouvrir(event) {
    event?.preventDefault();
    window.clearTimeout(minuteur);
    window.clearTimeout(minuteurPage);
    dialog.classList.remove("se-ferme");
    if (!dialog.open) {
      dialog.showModal();
      couche.ouverte();
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
    couche.fermee();
    dialog.classList.remove("est-ouvert");
    dialog.classList.add("se-ferme");
    const reduit = mouvementReduit.matches;
    // La page revient derrière le rideau, jamais sous les chapitres.
    minuteurPage = window.setTimeout(() => html.classList.remove("menu-ouvert"), reduit ? 0 : MENU_PAGE_MS);
    minuteur = window.setTimeout(() => dialog.close(), reduit ? 0 : MENU_SORTIE_MS);
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
  });

  dialog.querySelectorAll("a[href]").forEach((lien) => {
    lien.addEventListener("click", (event) => {
      if (!(lien instanceof HTMLAnchorElement) || event.defaultPrevented || lien.target === "_blank") {
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const url = new URL(lien.href, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
      }
      const memePage = url.origin === window.location.origin && url.pathname === window.location.pathname;
      if (memePage) {
        // La page en cours : le menu se referme, puis on rejoint l'ancre s'il y en a une.
        event.preventDefault();
        const cible = url.hash.length > 1 ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
        if (cible) {
          dialog.addEventListener("close", () => cible.scrollIntoView(), { once: true });
        } else if (window.location.hash) {
          // Page à vues (thème, étape) : revenir à son début, comme à l'arrivée.
          dialog.addEventListener(
            "close",
            () => {
              history.pushState(null, "", url.pathname + url.search);
              window.dispatchEvent(new HashChangeEvent("hashchange"));
              window.scrollTo({ top: 0, behavior: "instant" });
            },
            { once: true }
          );
        }
        fermer();
        return;
      }
      // Une autre page : l'entrée « menu » de l'historique est retirée avant de partir.
      if (couche.naviguer(url.href)) {
        event.preventDefault();
      }
    });
  });

  dialog.querySelector(".menu-liste")?.addEventListener("pointerleave", () => montrerEmbleme(indexCourant));

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    fermer();
  });

  // Fermeture par le code, une commande HTML ou le navigateur : même nettoyage.
  dialog.addEventListener("close", () => {
    window.clearTimeout(minuteur);
    window.clearTimeout(minuteurPage);
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
