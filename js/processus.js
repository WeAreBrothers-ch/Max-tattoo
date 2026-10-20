/**
 * Processus : un seul cadre pour les quatre temps d'un dessin. Toucher un
 * temps (ou glisser l'image du doigt) découvre son image de bas en haut et
 * n'affiche que sa documentation ; le temps vit dans l'adresse (#encre…).
 * Deux flèches sur l'image et les touches ← → font de même.
 * Les vidéos du cadre ne tournent que si le cadre est à l'écran.
 * Sans script, les quatre temps se suivent et le cadre montre le carnet.
 */

const GLISSE_SEUIL_PX = 40;
const ROMAINS = ["I", "II", "III", "IV", "V", "VI"];

export function initProcessus() {
  const racine = document.querySelector("[data-processus]");
  const cadre = racine?.querySelector("[data-scene]");
  if (!(racine instanceof HTMLElement) || !(cadre instanceof HTMLElement)) {
    return;
  }
  const medias = Array.from(cadre.querySelectorAll("[data-media]"));
  const etapes = Array.from(racine.querySelectorAll("[data-etape]")).filter((etape) => etape instanceof HTMLElement);
  const navigation = Array.from(racine.querySelectorAll(".scene-etape"));
  const compteur = racine.querySelector("[data-scene-compteur]");
  const aide = racine.querySelector(".scene-aide");
  const precedente = racine.querySelector("[data-scene-prec]");
  const suivante = racine.querySelector("[data-scene-suiv]");
  const noms = etapes.map((etape) => etape.id);
  if (etapes.length === 0 || medias.length !== etapes.length) {
    return;
  }

  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let courant = -1;
  let cadreVisible = false;

  racine.classList.add("processus-actif");
  if (aide instanceof HTMLElement) {
    aide.hidden = false;
  }
  medias.forEach((media) => {
    if (media instanceof HTMLVideoElement && reduit) {
      media.controls = true;
    }
  });

  function lireCourant() {
    medias.forEach((media, i) => {
      if (!(media instanceof HTMLVideoElement)) {
        return;
      }
      if (i === courant && cadreVisible && !reduit) {
        media.play().catch(() => undefined);
      } else {
        media.pause();
      }
    });
  }

  /**
   * @param {number} index
   * @param {{ adresse?: boolean, remonter?: boolean }} [options]
   */
  function montrer(index, { adresse = true, remonter = false } = {}) {
    if (index < 0 || index >= etapes.length || index === courant) {
      return;
    }
    const precedent = courant;
    courant = index;
    medias.forEach((media, i) => {
      media.classList.toggle("est-active", i === index);
      media.classList.toggle("etait-active", i === precedent);
      media.classList.toggle("retour", i === index && precedent > index);
    });
    etapes.forEach((etape, i) => {
      etape.hidden = i !== index;
      if (i !== index) {
        etape.querySelectorAll("video").forEach((video) => video.pause());
      }
    });
    navigation.forEach((lien, i) => {
      lien.classList.toggle("est-passee", i < index);
      if (i === index) {
        lien.setAttribute("aria-current", "step");
      } else {
        lien.removeAttribute("aria-current");
      }
    });
    if (precedente instanceof HTMLButtonElement) {
      precedente.hidden = false;
      precedente.disabled = index === 0;
    }
    if (suivante instanceof HTMLButtonElement) {
      suivante.hidden = false;
      suivante.disabled = index === etapes.length - 1;
    }
    if (compteur) {
      compteur.textContent = `${ROMAINS[index]} / ${ROMAINS[etapes.length - 1]}`;
    }
    if (adresse) {
      history.replaceState(null, "", `#${noms[index]}`);
    }
    lireCourant();
    // Depuis le bas de la documentation : on remonte jusqu'au cadre (sous la barre, scroll-margin-top).
    if (remonter && racine.getBoundingClientRect().top < 0) {
      racine.scrollIntoView({ block: "start", behavior: reduit ? "auto" : "smooth" });
    }
  }

  racine.querySelectorAll("[data-etape-lien]").forEach((lien) => {
    lien.addEventListener("click", (event) => {
      const index = noms.indexOf(lien.getAttribute("data-etape-lien") || "");
      if (index < 0) {
        return;
      }
      event.preventDefault();
      montrer(index, { remonter: !lien.classList.contains("scene-etape") });
    });
  });

  precedente?.addEventListener("click", () => montrer(courant - 1));
  suivante?.addEventListener("click", () => montrer(courant + 1));
  // Flèches du clavier, tant qu'on n'écrit pas dans un champ.
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
      return;
    }
    const cible = event.target;
    if (cible instanceof HTMLElement && cible.closest("input, textarea, select, dialog[open], [contenteditable]")) {
      return;
    }
    montrer(courant + (event.key === "ArrowRight" ? 1 : -1));
  });

  // Glisser l'image : vers la gauche, le temps suivant ; vers la droite, le précédent.
  /** @type {{ x: number, y: number } | null} */
  let depart = null;
  cadre.addEventListener("pointerdown", (event) => {
    depart = { x: event.clientX, y: event.clientY };
  });
  cadre.addEventListener("pointerup", (event) => {
    if (!depart) {
      return;
    }
    const dx = event.clientX - depart.x;
    const dy = event.clientY - depart.y;
    depart = null;
    if (Math.abs(dx) > GLISSE_SEUIL_PX && Math.abs(dx) > Math.abs(dy)) {
      montrer(courant + (dx < 0 ? 1 : -1));
    }
  });
  cadre.addEventListener("pointercancel", () => {
    depart = null;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entree]) => {
      cadreVisible = entree.isIntersecting;
      lireCourant();
    }).observe(cadre);
  } else {
    cadreVisible = true;
  }

  window.addEventListener("hashchange", () => {
    const index = noms.indexOf(decodeURIComponent(window.location.hash.slice(1)));
    if (index >= 0) {
      montrer(index, { adresse: false });
    }
  });

  const demande = noms.indexOf(decodeURIComponent(window.location.hash.slice(1)));
  montrer(Math.max(0, demande), { adresse: false });
  // Arrivée sur un temps précis : la page s'ouvre sur le cadre, pas au milieu du texte.
  if (demande >= 0) {
    requestAnimationFrame(() => {
      racine.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
}
