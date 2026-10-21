/**
 * Rendez-vous : un formulaire classique (prénom, demande, idée, emplacement,
 * taille, jours, message libre) qui rédige le message et ouvre WhatsApp avec
 * le texte déjà écrit (https://wa.me/<numéro>?text=…).
 * « Autre endroit… » et « Autre taille… » font apparaître une ligne libre ;
 * choisir un projet personnel ouvre le champ de l'idée.
 * Arrivée depuis la page Flashs (?flash=dague-et-roses) : ce flash est déjà
 * choisi. Le numéro est celui du lien « WhatsApp » de la page, une fois
 * complété (voir le README) ; sans lui, WhatsApp propose de choisir le contact.
 * Sans script, le formulaire reste caché et la liste de ce qu'il faut écrire
 * le remplace.
 */

const ESPACE = " ";
const AUTRE = "__autre";

export function initComposeur() {
  const form = document.querySelector("[data-formulaire]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const objet = form.querySelector("[data-objet]");
  const idee = form.querySelector("[data-si-projet]");
  const champIdee = form.querySelector("#idee");
  if (!(objet instanceof HTMLSelectElement)) {
    return;
  }

  form.hidden = false;
  document.querySelector("[data-message-liste]")?.setAttribute("hidden", "");

  const demande = new URLSearchParams(window.location.search).get("flash");
  const choisi = Array.from(objet.options).findIndex((option) => option.dataset.cle === demande);
  if (choisi >= 0) {
    objet.selectedIndex = choisi;
  }

  /** Affiche la ligne libre quand « autre » est choisi, et l'idée pour un projet. */
  function mettreAJour() {
    ["ou", "taille"].forEach((nom) => {
      const select = form.elements.namedItem(nom);
      const libre = form.elements.namedItem(`${nom}_libre`);
      if (select instanceof HTMLSelectElement && libre instanceof HTMLInputElement) {
        libre.hidden = select.value !== AUTRE;
        libre.required = select.value === AUTRE;
      }
    });
    const projet = !objet.selectedOptions[0]?.dataset.flash;
    if (idee instanceof HTMLElement) {
      idee.hidden = !projet;
    }
    if (champIdee instanceof HTMLTextAreaElement) {
      champIdee.required = projet;
    }
  }

  form.addEventListener("change", (event) => {
    mettreAJour();
    const cible = event.target;
    if (!(cible instanceof HTMLSelectElement)) {
      return;
    }
    if (cible.value === AUTRE) {
      const libre = form.elements.namedItem(`${cible.name}_libre`);
      if (libre instanceof HTMLInputElement) {
        libre.focus();
      }
    } else if (cible === objet && champIdee instanceof HTMLTextAreaElement && !champIdee.closest("[hidden]")) {
      champIdee.focus();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    const lien = lienWhatsApp(composer(form));
    if (!window.open(lien, "_blank", "noopener")) {
      window.location.assign(lien);
    }
  });

  mettreAJour();
}

/**
 * @param {HTMLFormElement} form
 * @returns {string} le message prêt à envoyer
 */
function composer(form) {
  const donnees = new FormData(form);
  const valeur = (nom) => {
    const choix = String(donnees.get(nom) || "");
    return choix === AUTRE ? String(donnees.get(`${nom}_libre`) || "").trim() : choix;
  };
  const option = form.querySelector("[data-objet]")?.selectedOptions[0];
  const flash = option?.dataset.flash ?? "";
  const idee = String(donnees.get("idee") || "").trim();
  const mot = String(donnees.get("mot") || "").trim();
  const prenom = String(donnees.get("prenom") || "").trim();
  const jours = donnees.getAll("jours").map((jour) => `le ${jour}`);

  const lignes = [`Je voudrais ${donnees.get("objet")}, sur ${valeur("ou")}, ${valeur("taille")}.`];
  if (!flash && idee) {
    lignes.push(`L'idée${ESPACE}: ${fin(idee)}`);
  }
  if (mot) {
    lignes.push(fin(mot));
  }
  lignes.push(jours.length === 0 ? `Mes disponibilités${ESPACE}: à préciser.` : `Je suis disponible ${enumerer(jours)}.`);
  return `Bonjour Maxime,\n\n${lignes.join("\n")}\n\nMerci, à bientôt.\n${prenom}`;
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

/**
 * @param {string} message
 * @returns {string} le lien WhatsApp, avec le numéro du lien « WhatsApp » de la page s'il est complété
 */
function lienWhatsApp(message) {
  const lien = document.querySelector('a[data-a-completer="whatsapp"]');
  const numero = lien instanceof HTMLAnchorElement ? (lien.href.match(/wa\.me\/(\d+)/)?.[1] ?? "") : "";
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}
