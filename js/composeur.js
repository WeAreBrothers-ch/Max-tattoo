/**
 * Rendez-vous : le message est déjà écrit sur la carte. Chaque champ rouge
 * cache un vrai <select> (flash ou projet, l'endroit, la taille, l'horaire) ;
 * le choisir réécrit le mot sur la carte. « Un autre endroit… » et « une
 * autre taille… » remplacent le champ par une ligne où l'on écrit soi-même :
 * ce qu'on écrit prend la place du mot dans la phrase (↺ ramène à la liste).
 * Un projet ouvre la ligne de l'idée ; on peut ajouter un mot libre, cocher
 * ses jours et signer de son prénom. Le message part par e-mail (le lien
 * s'ouvre dans la messagerie, sujet et texte déjà écrits) ou se copie pour
 * Instagram.
 * Arrivée depuis la page Flashs (?flash=dague-et-roses) : ce flash est déjà
 * choisi. L'adresse e-mail est celle du lien « E-mail » de la page, une fois
 * complété (voir le README) ; sans elle, la messagerie s'ouvre sans destinataire.
 * Sans script, le formulaire reste caché et la liste de ce qu'il faut écrire
 * le remplace.
 */

const ESPACE = "\u00a0";
const COPIE_MS = 4000;
const AUTRE = "__autre";

export function initComposeur() {
  const form = document.querySelector("[data-composeur]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const objet = form.querySelector("[data-objet]");
  const envoyer = form.querySelector("[data-envoyer]");
  const copier = form.querySelector("[data-copier]");
  const libelleCopier = form.querySelector("[data-copier-libelle]");
  const idee = form.querySelector("[data-si-projet]");
  if (!(objet instanceof HTMLSelectElement) || !(envoyer instanceof HTMLAnchorElement)) {
    return;
  }
  const textareas = Array.from(form.querySelectorAll("textarea"));
  const libres = Array.from(form.querySelectorAll("[data-libre]"));

  form.hidden = false;
  document.querySelector("[data-message-liste]")?.setAttribute("hidden", "");

  const demande = new URLSearchParams(window.location.search).get("flash");
  const choisi = Array.from(objet.options).findIndex((option) => option.dataset.cle === demande);
  if (choisi >= 0) {
    objet.selectedIndex = choisi;
  }

  let message = "";
  let minuteur = 0;

  /**
   * Un champ rouge : la liste, ou la ligne libre si « autre » est choisi.
   * @param {string} nom
   * @returns {string} ce qui prend place dans la phrase
   */
  function valeur(nom, repli) {
    const select = form.querySelector(`select[name="${nom}"]`);
    const libre = form.querySelector(`[data-libre="${nom}"] input`);
    if (!(select instanceof HTMLSelectElement)) {
      return "";
    }
    if (select.value === AUTRE && libre instanceof HTMLInputElement) {
      return libre.value.trim() || repli;
    }
    return select.value;
  }

  function composer() {
    // Chaque champ rouge reprend l'option choisie ; « autre » laisse place à la ligne libre.
    form.querySelectorAll("[data-choix]").forEach((blanc) => {
      const select = blanc.querySelector("select");
      const texte = blanc.querySelector(".blanc-texte");
      if (select instanceof HTMLSelectElement && texte instanceof HTMLElement) {
        texte.textContent = select.selectedOptions[0]?.textContent ?? "";
        const libre = form.querySelector(`[data-libre="${select.name}"]`);
        if (libre instanceof HTMLElement) {
          const autre = select.value === AUTRE;
          blanc.toggleAttribute("hidden", autre);
          libre.hidden = !autre;
        }
      }
    });
    libres.forEach((libre) => {
      const ligne = libre.querySelector("input");
      if (ligne instanceof HTMLInputElement && !libre.hidden) {
        // La ligne prend la longueur de ce qu'on écrit, sans trou avant la virgule.
        ligne.style.width = `${largeurTexte(ligne, ligne.value || ligne.placeholder) + 4}px`;
      }
    });
    textareas.forEach((zone) => {
      // Les lignes réglées s'allongent à mesure qu'on écrit.
      zone.style.height = "auto";
      zone.style.height = `${zone.scrollHeight}px`;
    });

    const option = objet.selectedOptions[0];
    const flash = option?.dataset.flash ?? "";
    if (idee instanceof HTMLElement) {
      idee.hidden = Boolean(flash);
    }
    const donnees = new FormData(form);
    const lieu = valeur("ou", "[l'endroit, à préciser]");
    const taille = valeur("taille", "[la taille, à préciser]");
    const horaire = String(donnees.get("horaire") || "");
    const texteIdee = String(donnees.get("idee") || "").trim() || "[votre idée en quelques mots]";
    const mot = String(donnees.get("mot") || "").trim();
    const prenom = String(donnees.get("prenom") || "").trim();
    const jours = donnees.getAll("jours").map((jour) => `le ${jour}`);

    const lignes = [`Je voudrais ${objet.value}, sur ${lieu}, ${taille}.`];
    if (!flash) {
      lignes.push(`L'idée${ESPACE}: ${fin(texteIdee)}`);
    }
    if (mot) {
      lignes.push(fin(mot));
    }
    lignes.push(jours.length === 0 ? `Mes disponibilités${ESPACE}: à préciser.` : `Je suis disponible ${enumerer(jours)}.`);
    if (horaire) {
      lignes.push(`Côté horaire${ESPACE}: ${horaire}.`);
    }
    message = `Bonjour Maxime,\n\n${lignes.join("\n")}\n\nMerci, à bientôt.${prenom ? `\n${prenom}` : ""}`;

    const sujet = flash ? `Rendez-vous — flash «${ESPACE}${flash}${ESPACE}»` : "Rendez-vous — projet personnel";
    envoyer.href = `mailto:${adresseEmail()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(message)}`;
  }

  form.addEventListener("input", composer);
  form.addEventListener("change", (event) => {
    composer();
    const cible = event.target;
    if (!(cible instanceof HTMLSelectElement)) {
      return;
    }
    // « autre » choisi : on écrit tout de suite ; un projet : on écrit l'idée.
    if (cible.value === AUTRE) {
      form.querySelector(`[data-libre="${cible.name}"] input`)?.focus();
    } else if (cible === objet && !objet.selectedOptions[0]?.dataset.flash) {
      form.querySelector("#idee")?.focus();
    }
  });
  // ↺ : on revient à la liste.
  form.addEventListener("click", (event) => {
    const retour = event.target instanceof Element ? event.target.closest("[data-retour]") : null;
    const libre = retour?.closest("[data-libre]");
    if (!(libre instanceof HTMLElement)) {
      return;
    }
    const select = form.querySelector(`select[name="${libre.dataset.libre}"]`);
    if (select instanceof HTMLSelectElement) {
      select.selectedIndex = 0;
      composer();
      select.focus({ preventScroll: true });
    }
  });
  form.addEventListener("submit", (event) => event.preventDefault());

  copier?.addEventListener("click", () => {
    copierTexte(message).then((reussi) => {
      if (!(libelleCopier instanceof HTMLElement)) {
        return;
      }
      libelleCopier.textContent = reussi ? "Copié, à coller sur Instagram" : "Sélectionnez la carte pour la copier";
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(() => {
        libelleCopier.textContent = "Copier pour Instagram";
      }, COPIE_MS);
    });
  });

  composer();
}

/**
 * Une phrase libre se termine par un point si l'auteur n'en a pas mis.
 * @param {string} texte
 * @returns {string}
 */
function fin(texte) {
  return /[.!?…»]$/.test(texte) ? texte : `${texte}.`;
}

/**
 * « le lundi », « le lundi et le jeudi », « le lundi, le mardi et le jeudi ».
 * @param {string[]} mots
 * @returns {string}
 */
function enumerer(mots) {
  return mots.length < 2 ? mots.join("") : `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}

const regle = document.createElement("canvas").getContext("2d");

/**
 * Largeur d'un texte écrit dans la police du champ.
 * @param {HTMLInputElement} champ
 * @param {string} texte
 * @returns {number}
 */
function largeurTexte(champ, texte) {
  if (!regle) {
    return texte.length * 10;
  }
  const style = getComputedStyle(champ);
  regle.font = `${style.fontStyle} ${style.fontSize} ${style.fontFamily}`;
  return Math.ceil(regle.measureText(texte).width);
}

/** @returns {string} l'adresse du lien « E-mail » de la page, une fois complété */
function adresseEmail() {
  const lien = document.querySelector('a[data-a-completer="e-mail"][href^="mailto:"], a[href^="mailto:"]:not([data-envoyer])');
  if (!(lien instanceof HTMLAnchorElement)) {
    return "";
  }
  return decodeURIComponent(lien.href.slice("mailto:".length).split("?")[0]);
}

/**
 * @param {string} texte
 * @returns {Promise<boolean>}
 */
function copierTexte(texte) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texte).then(
      () => true,
      () => copierAncien(texte)
    );
  }
  return Promise.resolve(copierAncien(texte));
}

/**
 * Repli des navigateurs sans presse-papiers moderne (ou page en http).
 * @param {string} texte
 * @returns {boolean}
 */
function copierAncien(texte) {
  const zone = document.createElement("textarea");
  zone.value = texte;
  zone.setAttribute("readonly", "");
  zone.style.position = "fixed";
  zone.style.opacity = "0";
  document.body.append(zone);
  zone.select();
  let reussi = false;
  try {
    reussi = document.execCommand("copy");
  } catch {
    reussi = false;
  }
  zone.remove();
  return reussi;
}
