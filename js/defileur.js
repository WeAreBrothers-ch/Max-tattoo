/**
 * Défilés (rangées qu'on fait glisser au pouce) : sous chaque rangée, un
 * compteur « 2 / 5 » et un filet dont le curseur avance avec le doigt.
 * Ils n'apparaissent que si la rangée déborde vraiment : sur ordinateur,
 * les mêmes œuvres sont en grille et l'indicateur se retire.
 * Une rangée qui défile devient aussi une région qu'on peut parcourir au
 * clavier (Tab, puis flèches).
 */

export function initDefileurs() {
  document.querySelectorAll("[data-defileur]").forEach((defileur) => {
    if (!(defileur instanceof HTMLElement)) {
      return;
    }
    const cartes = Array.from(defileur.querySelectorAll(":scope > .oeuvre"));
    if (cartes.length < 2) {
      return;
    }

    const etat = document.createElement("div");
    etat.className = "defileur-etat cap";
    etat.setAttribute("aria-hidden", "true");
    etat.innerHTML = '<span class="defileur-compteur"></span><span class="defileur-piste"><span class="defileur-curseur"></span></span>';
    defileur.after(etat);
    const compteur = /** @type {HTMLElement} */ (etat.querySelector(".defileur-compteur"));
    const curseur = /** @type {HTMLElement} */ (etat.querySelector(".defileur-curseur"));
    curseur.style.width = `${100 / cartes.length}%`;

    let enAttente = false;
    function suivre() {
      enAttente = false;
      const parcours = defileur.scrollWidth - defileur.clientWidth;
      const actif = parcours > 2;
      etat.hidden = !actif;
      if (actif) {
        defileur.tabIndex = 0;
        defileur.setAttribute("role", "region");
        defileur.setAttribute("aria-label", defileur.dataset.defileur || "Œuvres à faire défiler");
      } else {
        defileur.removeAttribute("tabindex");
        defileur.removeAttribute("role");
        defileur.removeAttribute("aria-label");
        return;
      }
      const avance = Math.min(1, Math.max(0, defileur.scrollLeft / parcours));
      compteur.textContent = `${carteCourante(defileur, cartes, parcours) + 1} / ${cartes.length}`;
      curseur.style.transform = `translateX(${avance * (cartes.length - 1) * 100}%)`;
    }
    const demander = () => {
      if (!enAttente) {
        enAttente = true;
        requestAnimationFrame(suivre);
      }
    };
    defileur.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    suivre();
    // Après le tirage au sort des flashs, le navigateur garde aimantée l'ancienne
    // première carte : la rangée repart du début.
    requestAnimationFrame(() => {
      defileur.scrollLeft = 0;
      suivre();
    });
  });
}

/**
 * La carte dont le bord gauche est le plus près du bord aligné de la rangée ;
 * tout au bout, la dernière (elle ne peut pas s'aligner à gauche).
 * @param {HTMLElement} defileur
 * @param {Element[]} cartes
 * @param {number} parcours
 * @returns {number}
 */
function carteCourante(defileur, cartes, parcours) {
  if (defileur.scrollLeft >= parcours - 2) {
    return cartes.length - 1;
  }
  const origine = /** @type {HTMLElement} */ (cartes[0]).offsetLeft;
  let meilleure = 0;
  let ecart = Infinity;
  cartes.forEach((carte, i) => {
    const distance = Math.abs(/** @type {HTMLElement} */ (carte).offsetLeft - origine - defileur.scrollLeft);
    if (distance < ecart) {
      ecart = distance;
      meilleure = i;
    }
  });
  return meilleure;
}
