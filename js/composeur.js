/**
 * Rendez-vous : préparer le message. Chaque choix (flash ou projet,
 * l'endroit, la taille, les jours) réécrit aussitôt la carte ; « Ailleurs »
 * ouvre un champ pour préciser l'endroit soi-même. La carte part par e-mail
 * (le lien s'ouvre dans la messagerie, sujet et message déjà écrits) ou se
 * copie pour un message privé sur Instagram.
 * Arrivée depuis la page Flashs (?flash=dague-et-roses) : ce flash est déjà
 * choisi. L'adresse e-mail est celle du lien « E-mail » de la page, une fois
 * complété (voir le README) ; sans elle, la messagerie s'ouvre sans destinataire.
 * Sans script, le formulaire reste caché et la liste de ce qu'il faut écrire
 * le remplace.
 */

const ESPACE = " ";
const COPIE_MS = 4000;

export function initComposeur() {
  const form = document.querySelector("[data-composeur]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const lettre = form.querySelector("[data-lettre]");
  const envoyer = form.querySelector("[data-envoyer]");
  const copier = form.querySelector("[data-copier]");
  const libelleCopier = form.querySelector("[data-copier-libelle]");
  const precis = form.querySelector("[data-si-ailleurs]");
  if (!(lettre instanceof HTMLElement) || !(envoyer instanceof HTMLAnchorElement)) {
    return;
  }

  form.hidden = false;
  document.querySelector("[data-message-liste]")?.setAttribute("hidden", "");

  const demande = new URLSearchParams(window.location.search).get("flash");
  if (demande) {
    form.querySelectorAll('input[name="flash"]').forEach((radio) => {
      if (radio instanceof HTMLInputElement && radio.dataset.cle === demande) {
        radio.checked = true;
      }
    });
  }

  let message = "";
  let minuteur = 0;

  function composer() {
    const donnees = new FormData(form);
    const pour = String(donnees.get("pour") || "flash");
    form.querySelectorAll("[data-si]").forEach((bloc) => {
      if (bloc instanceof HTMLElement) {
        bloc.hidden = bloc.dataset.si !== pour;
      }
    });

    const ou = String(donnees.get("ou") || "");
    if (precis instanceof HTMLElement) {
      precis.hidden = ou !== "ailleurs";
    }
    const lieu = ou === "ailleurs" ? String(donnees.get("ailleurs") || "").trim() || "[l'endroit, à préciser]" : ou;
    const taille = String(donnees.get("taille") || "");
    const flash = String(donnees.get("flash") || "");
    const idee = String(donnees.get("idee") || "").trim() || "[votre idée en quelques mots]";
    const jours = donnees.getAll("jours").map((jour) => `le ${jour}`);

    const objet = pour === "projet" ? `Je voudrais vous proposer un projet${ESPACE}: ${idee}` : `Je voudrais réserver le flash «${ESPACE}${flash}${ESPACE}»`;
    const dispo =
      jours.length === 0 ? `Mes disponibilités${ESPACE}: à préciser.` : `Je suis disponible ${enumerer(jours)}.`;
    message = `Bonjour Maxime,\n\n${objet}, sur ${lieu}, ${taille}.\n${dispo}\n\nMerci, à bientôt.`;
    lettre.textContent = message;

    const sujet = pour === "projet" ? "Rendez-vous — projet personnel" : `Rendez-vous — flash «${ESPACE}${flash}${ESPACE}»`;
    envoyer.href = `mailto:${adresseEmail()}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(message)}`;
  }

  form.addEventListener("input", composer);
  form.addEventListener("change", (event) => {
    composer();
    // « Ailleurs » choisi : on écrit tout de suite où.
    if (event.target instanceof HTMLInputElement && event.target.name === "ou" && event.target.value === "ailleurs") {
      form.querySelector("#ailleurs")?.focus();
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
