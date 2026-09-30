/**
 * Visionneuse : toucher une œuvre l'ouvre en grand. L'image grandit depuis
 * sa vignette et y retourne à la fermeture ; on glisse de l'une à l'autre
 * (défilement natif aimanté : le geste est celui du téléphone) et on tire
 * l'image vers le bas pour la reposer. Le « retour » du téléphone la
 * referme aussi. Flèches et Échap au clavier.
 * Toutes les œuvres des blocs [data-visionneuse] de la page forment une suite.
 */

import { creerCouche } from "./couche.js";

const VISIONNEUSE_ENVOL_MS = 460;
const VISIONNEUSE_RETOUR_MS = 360;
const VISIONNEUSE_SORTIE_MS = 300;
const GLISSE_SEUIL_PX = 110;
const GLISSE_VITESSE_PX_MS = 0.55;
const GLISSE_ECHELLE_MIN = 0.86;
const RATIO_VIDEO = 9 / 16;
const EASE_ENVOL = "cubic-bezier(0.22, 1, 0.36, 1)";

export function initVisionneuse() {
  const oeuvres = Array.from(document.querySelectorAll("[data-visionneuse] .oeuvre"));
  if (oeuvres.length === 0 || typeof HTMLDialogElement !== "function" || !("showModal" in HTMLDialogElement.prototype)) {
    return;
  }

  const html = document.documentElement;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dialog = construireVisionneuse();
  const bande = /** @type {HTMLElement} */ (dialog.querySelector(".visionneuse-bande"));
  const compteur = /** @type {HTMLElement} */ (dialog.querySelector(".visionneuse-compteur"));
  const precedent = /** @type {HTMLButtonElement} */ (dialog.querySelector(".visionneuse-prec"));
  const suivant = /** @type {HTMLButtonElement} */ (dialog.querySelector(".visionneuse-suiv"));
  const vues = oeuvres.map((oeuvre) => creerVue(oeuvre, reduit));
  bande.append(...vues);
  document.body.append(dialog);
  let courant = 0;
  let minuteur = 0;
  const couche = creerCouche("visionneuse", () => fermer());

  /** @param {number} index */
  const mediaDe = (index) => /** @type {HTMLElement | null} */ (vues[index]?.querySelector("img, video") ?? null);
  /** @param {number} index */
  const cadreDe = (index) => /** @type {HTMLElement | null} */ (oeuvres[index]?.querySelector(".cadre") ?? null);

  /** @param {number} index */
  function montrer(index) {
    courant = index;
    compteur.textContent = `${index + 1} / ${vues.length}`;
    precedent.disabled = index === 0;
    suivant.disabled = index === vues.length - 1;
    vues.forEach((vue, i) => {
      // L'œuvre regardée et ses voisines se chargent tout de suite.
      const image = vue.querySelector("img");
      if (image && Math.abs(i - index) <= 1) {
        image.loading = "eager";
      }
      const video = vue.querySelector("video");
      if (!video) {
        return;
      }
      if (i === index && !reduit) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }

  /**
   * @param {number} index
   * @param {boolean} doux
   */
  function aller(index, doux) {
    const cible = Math.max(0, Math.min(vues.length - 1, index));
    if (doux) {
      bande.scrollTo({ left: cible * bande.clientWidth, behavior: "smooth" });
    } else {
      bande.scrollLeft = cible * bande.clientWidth;
    }
  }

  /** @param {number} index */
  function ouvrir(index) {
    window.clearTimeout(minuteur);
    dialog.classList.remove("se-ferme");
    effacerGlisse(dialog);
    const media = mediaDe(index);
    if (media) {
      media.getAnimations().forEach((animation) => animation.cancel());
      media.style.removeProperty("transform");
    }
    montrer(index);
    if (!dialog.open) {
      dialog.showModal();
      html.classList.add("visionneuse-ouverte");
      couche.ouverte();
    }
    aller(index, false);
    dialog.focus();
    if (!media || reduit) {
      return;
    }
    // L'image attend d'être prête (au plus un instant), puis part de sa vignette.
    media.style.opacity = "0";
    pret(media).then(() => {
      media.style.removeProperty("opacity");
      envol(media, cadreDe(index), "entree");
    });
  }

  /**
   * Fait voyager le média entre sa vignette et sa place en grand.
   * @param {HTMLElement | null} media
   * @param {HTMLElement | null} cadre
   * @param {"entree" | "sortie"} sens
   * @returns {Animation | null}
   */
  function envol(media, cadre, sens) {
    if (!media || !cadre || typeof media.animate !== "function") {
      return null;
    }
    const vignette = cadre.getBoundingClientRect();
    if (!visible(vignette)) {
      return null;
    }
    const grand = rectContenu(media);
    if (grand.width === 0) {
      return null;
    }
    const echelle = vignette.width / grand.width;
    const dx = vignette.left + vignette.width / 2 - (grand.left + grand.width / 2);
    const dy = vignette.top + vignette.height / 2 - (grand.top + grand.height / 2);
    const surVignette = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${echelle.toFixed(4)})`;
    if (sens === "entree") {
      return media.animate([{ transform: surVignette }, { transform: "none" }], {
        duration: VISIONNEUSE_ENVOL_MS,
        easing: EASE_ENVOL,
      });
    }
    return media.animate([{ transform: media.style.transform || "none" }, { transform: surVignette }], {
      duration: VISIONNEUSE_RETOUR_MS,
      easing: EASE_ENVOL,
      fill: "forwards",
    });
  }

  /** @param {boolean} [glisse] fermeture par le geste vers le bas */
  function fermer(glisse = false) {
    if (!dialog.open || dialog.classList.contains("se-ferme")) {
      return;
    }
    couche.fermee();
    ramenerVignette(courant);
    const media = mediaDe(courant);
    if (media && !reduit) {
      let animation = glisse ? null : envol(media, cadreDe(courant), "sortie");
      if (!animation && typeof media.animate === "function") {
        // Pas de vignette en vue : l'image descend (geste) ou s'efface sur place.
        const depart = media.style.transform || "none";
        const arrivee = glisse ? `translateY(${Math.round(window.innerHeight * 0.45)}px) scale(0.8)` : "scale(0.96)";
        animation = media.animate([{ transform: depart, opacity: 1 }, { transform: arrivee, opacity: 0 }], {
          duration: 240,
          easing: "ease-in",
          fill: "forwards",
        });
      }
    }
    dialog.classList.add("se-ferme");
    minuteur = window.setTimeout(() => dialog.close(), reduit ? 0 : VISIONNEUSE_SORTIE_MS + 60);
  }

  /**
   * Dans une rangée qui défile, l'œuvre qu'on vient de regarder revient en vue :
   * en fermant, on la retrouve là où on l'a laissée.
   * @param {number} index
   */
  function ramenerVignette(index) {
    const oeuvre = oeuvres[index];
    const defileur = oeuvre?.closest("[data-defileur]");
    if (!(oeuvre instanceof HTMLElement) || !(defileur instanceof HTMLElement) || defileur.scrollWidth <= defileur.clientWidth + 2) {
      return;
    }
    const premiere = defileur.querySelector(":scope > .oeuvre");
    if (premiere instanceof HTMLElement) {
      defileur.scrollLeft = oeuvre.offsetLeft - premiere.offsetLeft;
    }
  }

  oeuvres.forEach((oeuvre, index) => {
    const cadre = oeuvre.querySelector(".cadre");
    if (!cadre) {
      return;
    }
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "oeuvre-ouvrir";
    bouton.setAttribute("aria-haspopup", "dialog");
    bouton.setAttribute("aria-label", `Agrandir : ${libelle(oeuvre)}`);
    bouton.addEventListener("click", () => ouvrir(index));
    cadre.append(bouton);
  });

  let attente = false;
  bande.addEventListener(
    "scroll",
    () => {
      if (attente) {
        return;
      }
      attente = true;
      requestAnimationFrame(() => {
        attente = false;
        const index = Math.round(bande.scrollLeft / Math.max(1, bande.clientWidth));
        if (index !== courant && index >= 0 && index < vues.length) {
          montrer(index);
        }
      });
    },
    { passive: true }
  );

  precedent.addEventListener("click", () => aller(courant - 1, true));
  suivant.addEventListener("click", () => aller(courant + 1, true));
  dialog.querySelector("[data-fermer]")?.addEventListener("click", () => fermer());

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      aller(courant + (event.key === "ArrowRight" ? 1 : -1), true);
    }
  });

  // Toucher le noir autour de l'image referme, comme on repose un livre.
  bande.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.classList.contains("vue")) {
      fermer();
    }
  });

  suivreGlisse(bande, dialog, () => mediaDe(courant), fermer);

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    fermer();
  });

  dialog.addEventListener("close", () => {
    window.clearTimeout(minuteur);
    dialog.classList.remove("se-ferme");
    effacerGlisse(dialog);
    html.classList.remove("visionneuse-ouverte");
    vues.forEach((vue) => {
      const media = vue.querySelector("img, video");
      if (media instanceof HTMLElement) {
        media.getAnimations().forEach((animation) => animation.cancel());
        media.style.removeProperty("transform");
        media.style.removeProperty("opacity");
      }
      vue.querySelector("video")?.pause();
    });
  });
}

/**
 * Geste vers le bas, au doigt : l'image suit, le noir s'éclaircit ; relâchée
 * assez loin (ou assez vite), elle se repose, sinon elle revient en place.
 * Le glissement horizontal reste au défilement natif (touch-action: pan-x).
 * @param {HTMLElement} bande
 * @param {HTMLElement} dialog
 * @param {() => HTMLElement | null} mediaCourant
 * @param {(glisse: boolean) => void} fermer
 */
function suivreGlisse(bande, dialog, mediaCourant, fermer) {
  /** @type {{ x: number, y: number, t: number } | null} */
  let depart = null;
  /** @type {"" | "vertical" | "horizontal"} */
  let sens = "";
  let ecart = 0;

  bande.addEventListener(
    "touchstart",
    (event) => {
      const doigt = event.touches[0];
      depart = event.touches.length === 1 && doigt ? { x: doigt.clientX, y: doigt.clientY, t: performance.now() } : null;
      sens = "";
      ecart = 0;
    },
    { passive: true }
  );

  bande.addEventListener(
    "touchmove",
    (event) => {
      const doigt = event.touches[0];
      if (!depart || !doigt) {
        return;
      }
      const dx = doigt.clientX - depart.x;
      const dy = doigt.clientY - depart.y;
      if (!sens) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.3) {
          sens = "vertical";
        } else if (Math.abs(dx) > 10) {
          sens = "horizontal";
        }
      }
      const media = mediaCourant();
      if (sens !== "vertical" || !media) {
        return;
      }
      // Vers le haut, l'image résiste ; vers le bas, elle suit le doigt.
      ecart = dy > 0 ? dy : dy / 4;
      const echelle = Math.max(GLISSE_ECHELLE_MIN, 1 - Math.max(0, ecart) / 1400);
      media.style.transform = `translateY(${ecart.toFixed(1)}px) scale(${echelle.toFixed(4)})`;
      const avance = Math.max(0, ecart);
      dialog.style.setProperty("--fond", (1 - Math.min(1, avance / 360)).toFixed(3));
      dialog.style.setProperty("--habillage", Math.max(0, 1 - avance / 120).toFixed(3));
    },
    { passive: true }
  );

  const relacher = () => {
    const media = mediaCourant();
    if (sens === "vertical" && depart && media) {
      const vitesse = ecart / Math.max(1, performance.now() - depart.t);
      if (ecart > GLISSE_SEUIL_PX || vitesse > GLISSE_VITESSE_PX_MS) {
        fermer(true);
      } else {
        const depuis = media.style.transform;
        media.style.removeProperty("transform");
        effacerGlisse(dialog);
        media.animate([{ transform: depuis }, { transform: "none" }], { duration: 320, easing: EASE_ENVOL });
      }
    }
    depart = null;
    sens = "";
  };
  bande.addEventListener("touchend", relacher);
  bande.addEventListener("touchcancel", relacher);
}

/** @param {HTMLElement} dialog */
function effacerGlisse(dialog) {
  dialog.style.removeProperty("--fond");
  dialog.style.removeProperty("--habillage");
}

/** @returns {HTMLDialogElement} */
function construireVisionneuse() {
  const dialog = document.createElement("dialog");
  dialog.className = "visionneuse";
  dialog.tabIndex = -1;
  dialog.setAttribute("aria-label", "Œuvres en grand");
  dialog.innerHTML = `
    <div class="visionneuse-tete">
      <span class="visionneuse-compteur cap" aria-live="polite"></span>
      <button class="visionneuse-fermer cap" type="button" data-fermer>Fermer <span class="menu-fermer-icone" aria-hidden="true"></span></button>
    </div>
    <div class="visionneuse-bande"></div>
    <p class="visionneuse-aide cap" aria-hidden="true">Glisser vers le bas pour fermer</p>
    <button class="visionneuse-nav visionneuse-prec" type="button" aria-label="Œuvre précédente">←</button>
    <button class="visionneuse-nav visionneuse-suiv" type="button" aria-label="Œuvre suivante">→</button>`;
  return dialog;
}

/**
 * @param {Element} oeuvre
 * @returns {string}
 */
function libelle(oeuvre) {
  const titre = oeuvre.querySelector(".legende-titre, .planche-titre")?.textContent?.trim();
  const lieu = oeuvre.querySelector(".legende-lieu")?.textContent?.trim();
  const alt = oeuvre.querySelector("img")?.getAttribute("alt");
  return [titre, lieu].filter(Boolean).join(", ") || alt || "œuvre";
}

/**
 * Vue en grand d'une œuvre : l'image (ou la vidéo) et sa légende. Le rapport
 * largeur / hauteur est noté pour que l'envol tombe juste avant le chargement.
 * @param {Element} oeuvre
 * @param {boolean} reduit mouvement réduit : la vidéo garde ses commandes
 * @returns {HTMLElement}
 */
function creerVue(oeuvre, reduit) {
  const vue = document.createElement("figure");
  vue.className = "vue";
  const media = oeuvre.querySelector(".cadre img, .cadre video");
  if (media instanceof HTMLImageElement) {
    const image = document.createElement("img");
    image.src = media.currentSrc || media.src;
    image.alt = media.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.className = media.classList.contains("photo") ? "photo" : "";
    const largeur = Number(media.getAttribute("width"));
    const hauteur = Number(media.getAttribute("height"));
    if (largeur > 0 && hauteur > 0) {
      image.dataset.ratio = String(largeur / hauteur);
    }
    vue.append(image);
  } else if (media instanceof HTMLVideoElement) {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = media.poster;
    video.controls = reduit;
    video.dataset.ratio = String(RATIO_VIDEO);
    media.querySelectorAll("source").forEach((source) => video.append(source.cloneNode(true)));
    vue.append(video);
  }
  const legende = document.createElement("figcaption");
  const titre = oeuvre.querySelector(".legende-titre, .planche-titre")?.textContent?.trim();
  const lieu = oeuvre.querySelector(".legende-lieu")?.textContent?.trim();
  if (titre) {
    const span = document.createElement("span");
    span.className = "legende-titre";
    span.textContent = titre;
    legende.append(span);
  }
  if (lieu) {
    const span = document.createElement("span");
    span.className = "legende-lieu cap";
    span.textContent = lieu;
    legende.append(span);
  }
  vue.append(legende);
  return vue;
}

/**
 * Rectangle réellement occupé par l'image dans sa boîte (object-fit: contain).
 * @param {HTMLElement} media
 * @returns {{ left: number, top: number, width: number, height: number }}
 */
function rectContenu(media) {
  const boite = media.getBoundingClientRect();
  const ratio = Number(media.dataset.ratio) || boite.width / Math.max(1, boite.height);
  let largeur = boite.width;
  let hauteur = largeur / ratio;
  if (hauteur > boite.height) {
    hauteur = boite.height;
    largeur = hauteur * ratio;
  }
  return {
    left: boite.left + (boite.width - largeur) / 2,
    top: boite.top + (boite.height - hauteur) / 2,
    width: largeur,
    height: hauteur,
  };
}

/**
 * @param {DOMRect} rect
 * @returns {boolean}
 */
function visible(rect) {
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

/**
 * Attend que l'image soit décodée (au plus un court instant) ; une vidéo
 * montre son image d'attente, elle est prête tout de suite.
 * @param {HTMLElement} media
 * @returns {Promise<void>}
 */
function pret(media) {
  if (!(media instanceof HTMLImageElement) || (media.complete && media.naturalWidth > 0)) {
    return Promise.resolve();
  }
  const decode = typeof media.decode === "function" ? media.decode().catch(() => undefined) : Promise.resolve();
  const delai = new Promise((resolve) => window.setTimeout(resolve, 160));
  return Promise.race([decode, delai]).then(() => undefined);
}
