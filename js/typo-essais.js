/**
 * ESSAIS TYPO — temporaire, à supprimer quand Maxime aura choisi.
 * Ouvrir le site avec ?typo=ancien (ou gravure, moderne, actuelle) active
 * les essais : la typo choisie est posée sur <html> avant l'affichage, et un
 * sélecteur flottant permet de passer de l'une à l'autre sur toutes les pages.
 * Script classique (pas un module) chargé dans <head> : il doit agir avant
 * le premier affichage pour éviter un clignotement de police.
 */
(function typoEssais() {
  var STORAGE_KEY = "maxime-typo-essai";
  var CHOIX = [
    { id: "actuelle", label: "Actuelle" },
    { id: "ancien", label: "A Ancien" },
    { id: "gravure", label: "B Gravure" },
    { id: "moderne", label: "C Moderne" },
  ];

  function isKnown(id) {
    return CHOIX.some(function (choix) {
      return choix.id === id;
    });
  }

  function readStored() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function store(id) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, id);
    } catch (error) {
      // Stockage bloqué (navigation privée) : l'essai vaut pour cette page seulement.
    }
  }

  function apply(id) {
    if (id === "actuelle") {
      document.documentElement.removeAttribute("data-typo");
    } else {
      document.documentElement.setAttribute("data-typo", id);
    }
  }

  function buildSwitcher(activeId) {
    var bar = document.createElement("div");
    bar.className = "typo-essais";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Essais de typographie");
    CHOIX.forEach(function (choix) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = choix.label;
      button.setAttribute("aria-pressed", String(choix.id === activeId));
      button.addEventListener("click", function () {
        apply(choix.id);
        store(choix.id);
        bar.querySelectorAll("button").forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === button));
        });
      });
      bar.appendChild(button);
    });
    document.body.appendChild(bar);
  }

  var fromUrl = new URLSearchParams(window.location.search).get("typo");
  var active = isKnown(fromUrl) ? fromUrl : readStored();
  if (!isKnown(active)) {
    return;
  }
  store(active);
  apply(active);
  document.addEventListener("DOMContentLoaded", function () {
    buildSwitcher(active);
  });
})();
