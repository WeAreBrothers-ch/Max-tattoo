/**
 * Rendez-vous : le message est déjà écrit sur la carte. Chaque mot souligné
 * cache un vrai <select> (flash ou projet, l'endroit, la taille) ; le choisir
 * réécrit le mot sur la carte. « ailleurs… » ouvre une ligne pour préciser
 * l'endroit, un projet ouvre la ligne de l'idée, et les jours se cochent sur
 * la carte même. Le message part par e-mail (le lien s'ouvre dans la
 * messagerie, sujet et texte déjà écrits) ou se copie pour Instagram.
 * Arrivée depuis la page Flashs (?flash=dague-et-roses) : ce flash est déjà
 * choisi. L'adresse e-mail est celle du lien « E-mail » de la page, une fois
 * complété (voir le README) ; sans elle, la messagerie s'ouvre sans destinataire.
 * Sans script, le formulaire reste caché et la liste de ce qu'il faut écrire
 * le remplace.
 */

const ESPACE = "\u00a0";
const COPIE_MS = 4000;

export function initComposeur() {
  const form = document.querySelector("[data-composeur]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const objet = form.querySelector("[data-objet]");
  const ou = form.querySelector("[data-ou]");
  const envoyer = form.querySelector("[data-envoyer]");
  const copier = form.querySelector("[data-copier]");
  const libelleCopier = form.querySelector("[data-copier-libelle]");
  const precis = form.querySelector("[data-si-ailleurs]");
  const idee = form.querySelector("[data-si-projet]");
  const ailleurs = form.querySelector("#ailleurs");
  const champIdee = form.querySelector("#idee");
  if (!(objet instanceof HTMLSelectElement) || !(ou instanceof HTMLSelectElement) || !(envoyer instanceof HTMLAnchorElement)) {
    return;
  }

  form.hidden = false;
  document.querySelector("[data-message-liste]")?.setAttribute("hidden", "");

  const demande = new URLSearchParams(window.location.search).get("flash");
  const choisi = Array.from(objet.options).findIndex((option) => option.dataset.cle === demande);
  if (choisi >= 0) {
    objet.selectedIndex = choisi;
  }

  let message = "";
  let minuteur = 0;

  function composer() {
    // Chaque mot souligné reprend l'option choisie.
    form.querySelectorAll(".blanc").forEach((blanc) => {
      const select = blanc.querySelector("select");
      const texte = blanc.querySelector(".blanc-texte");
      if (select instanceof HTMLSelectElement && texte instanceof HTMLElement) {
        texte.textContent = select.selectedOptions[0]?.textContent ?? "";
      }
    });

    const option = objet.selectedOptions[0];
    const flash = option?.dataset.flash ?? "";
    const donnees = new FormData(form);
    if (precis instanceof HTMLElement) {
      precis.hidden = ou.value !== "ailleurs";
    }
    if (idee instanceof HTMLElement) {
      idee.hidden = Boolean(flash);
    }

    if (ailleurs instanceof HTMLInputElement) {
      // La ligne prend la longueur de ce qu'on écrit, sans trou avant la virgule.
      ailleurs.style.width = `${largeurTexte(ailleurs, ailleurs.value || ailleurs.placeholder) + 2}px`;
    }
    if (champIdee instanceof HTMLTextAreaElement) {
      // L'idée gagne des lignes à mesure qu'on écrit.
      champIdee.style.height = "auto";
      champIdee.style.height = `${champIdee.scrollHeight}px`;
    }
    const lieu = ou.value === "ailleurs" ? String(donnees.get("ailleurs") || "").trim() || "[l'endroit, à préciser]" : ou.value;
    const taille = String(donnees.get("taille") || "");
    const texteIdee = String(donnees.get("idee") || "").trim() || "[votre idée en quelques mots]";
    const jours = donnees.getAll("jours").map((jour) => `le ${jour}`);

    const lignes = [`Je voudrais ${objet.value}, sur ${lieu}, ${taille}.`];
    if (!flash) {
      lignes.push(`L'idée${ESPACE}: ${/[.!?…»]$/.test(texteIdee) ? texteIdee : `${texteIdee}.`}`);
    }
    lignes.push(jours.length === 0 ? `Mes disponibilités${ESPACE}: à préciser.` : `Je suis disponible ${enumerer(jours)}.`);
    message = `Bonjour Maxime,\n\n${lignes.join("\n")}\n\nMerci, à bientôt.`;

    const sujet = flash ? `Rendez-vous — flash «${ESPACE}${flash}${ESPACE}»` : "Rendez-vous — projet personnel";
    envoyer.href = `mailto:${adresseEmail()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(message)}`;
  }

  form.addEventListener("input", composer);
  form.addEventListener("change", (event) => {
    composer();
    // « ailleurs… » choisi : on écrit tout de suite où ; un projet : on écrit l'idée.
    if (event.target === ou && ou.value === "ailleurs") {
      ailleurs?.focus();
    } else if (event.target === objet && !objet.selectedOptions[0]?.dataset.flash) {
      champIdee?.focus();
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
