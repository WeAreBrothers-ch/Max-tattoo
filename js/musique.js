/**
 * Bouton « Son » : allume ou coupe la musique lugubre (js/musique-synthe.js).
 * Coupée par défaut. Le choix est gardé d'une page à l'autre ; comme un
 * navigateur n'accepte de jouer du son qu'après un geste, la musique d'une
 * page suivante reprend au premier toucher, clic ou touche du clavier.
 * Onglet caché : la musique se tait, elle revient au retour.
 */

import { createSynthe } from "./musique-synthe.js";

const CLE = "musique";

export function initMusique() {
  const boutons = Array.from(document.querySelectorAll("[data-musique]"));
  if (boutons.length === 0) {
    return;
  }
  if (!("AudioContext" in window || "webkitAudioContext" in window)) {
    boutons.forEach((bouton) => (bouton.hidden = true));
    return;
  }

  const synthe = createSynthe();
  let voulue = lireChoix();
  let joue = false;

  function afficher() {
    boutons.forEach((bouton) => {
      bouton.setAttribute("aria-pressed", String(voulue));
      bouton.classList.toggle("est-joue", joue);
    });
  }

  function demarrer() {
    if (joue || document.hidden) {
      return;
    }
    synthe
      .jouer()
      .then(() => {
        // Coupée entre-temps (le son met un instant à démarrer) : on se tait.
        if (!voulue) {
          synthe.couper();
          return;
        }
        joue = true;
        afficher();
      })
      .catch(() => {
        // Son refusé ou indisponible : le bouton revient à l'arrêt.
        voulue = false;
        joue = false;
        ecrireChoix(false);
        afficher();
      });
  }

  function arreter() {
    joue = false;
    synthe.couper();
    afficher();
  }

  boutons.forEach((bouton) =>
    bouton.addEventListener("click", () => {
      voulue = !voulue;
      ecrireChoix(voulue);
      if (voulue) {
        demarrer();
      } else {
        arreter();
      }
      afficher();
    })
  );

  // Page suivante d'une visite en musique : elle reprend au premier geste.
  if (voulue) {
    /** @param {Event} event */
    const premierGeste = (event) => {
      window.removeEventListener("pointerdown", premierGeste, true);
      window.removeEventListener("keydown", premierGeste, true);
      // Un geste sur le bouton lui-même : c'est son clic qui décide.
      const surBouton = event.target instanceof Element && event.target.closest("[data-musique]");
      if (voulue && !surBouton) {
        demarrer();
      }
    };
    window.addEventListener("pointerdown", premierGeste, true);
    window.addEventListener("keydown", premierGeste, true);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && joue) {
      arreter();
    } else if (!document.hidden && voulue && !joue) {
      demarrer();
    }
  });

  afficher();
}

/** @returns {boolean} */
function lireChoix() {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    return false;
  }
}

/** @param {boolean} allumee */
function ecrireChoix(allumee) {
  try {
    window.localStorage.setItem(CLE, allumee ? "1" : "0");
  } catch {
    // Stockage refusé (navigation privée) : le choix vaut pour cette page seulement.
  }
}
