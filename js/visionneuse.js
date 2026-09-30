/**
 * Visionneuse : toucher une œuvre l'ouvre en grand, puis on glisse de l'une
 * à l'autre (défilement natif aimanté : le geste est celui du téléphone),
 * ou aux flèches de l'écran et du clavier. Toutes les œuvres des blocs
 * [data-visionneuse] de la page forment une seule suite.
 */

const VISIONNEUSE_SORTIE_MS = 260;

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

  /** @param {number} index */
  function montrer(index) {
    courant = index;
    compteur.textContent = `${index + 1} / ${vues.length}`;
    precedent.disabled = index === 0;
    suivant.disabled = index === vues.length - 1;
    vues.forEach((vue, i) => {
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
    if (!dialog.open) {
      dialog.showModal();
      html.classList.add("visionneuse-ouverte");
    }
    aller(index, false);
    montrer(index);
    dialog.focus();
  }

  function fermer() {
    if (!dialog.open || dialog.classList.contains("se-ferme")) {
      return;
    }
    dialog.classList.add("se-ferme");
    minuteur = window.setTimeout(() => dialog.close(), reduit ? 0 : VISIONNEUSE_SORTIE_MS);
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
  dialog.querySelector("[data-fermer]")?.addEventListener("click", fermer);

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

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    fermer();
  });

  dialog.addEventListener("close", () => {
    window.clearTimeout(minuteur);
    dialog.classList.remove("se-ferme");
    html.classList.remove("visionneuse-ouverte");
    vues.forEach((vue) => vue.querySelector("video")?.pause());
  });
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
 * Vue en grand d'une œuvre : l'image (ou la vidéo) et sa légende.
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
    vue.append(image);
  } else if (media instanceof HTMLVideoElement) {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = media.poster;
    video.controls = reduit;
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
