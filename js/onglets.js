/**
 * Onglets d'une page (Flashs : disponibles, déjà tatoués). Chaque onglet est
 * un lien vers sa partie ; avec le script, une seule partie est montrée et
 * l'adresse garde l'onglet choisi (#tatoues). Sans script, les parties se
 * suivent et les onglets restent cachés.
 */

export function initOnglets() {
  const nav = document.querySelector("[data-onglets]");
  if (!(nav instanceof HTMLElement)) {
    return;
  }
  const liens = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const panneaux = liens.map((lien) => document.getElementById(decodeURIComponent((lien.getAttribute("href") || "").slice(1))));
  if (liens.length === 0 || panneaux.some((panneau) => !(panneau instanceof HTMLElement))) {
    return;
  }

  document.documentElement.classList.add("onglets-actifs");
  nav.hidden = false;

  /**
   * @param {number} index
   * @param {boolean} adresse
   */
  function montrer(index, adresse) {
    panneaux.forEach((panneau, i) => {
      if (!(panneau instanceof HTMLElement)) {
        return;
      }
      panneau.hidden = i !== index;
      if (i !== index) {
        panneau.querySelectorAll("video").forEach((video) => video.pause());
      }
    });
    liens.forEach((lien, i) => lien.setAttribute("aria-current", String(i === index)));
    if (adresse) {
      history.replaceState(null, "", liens[index].getAttribute("href"));
    }
  }

  /** @returns {number} l'onglet demandé par l'adresse, ou le premier */
  function demande() {
    const nom = decodeURIComponent(window.location.hash.slice(1));
    return Math.max(0, panneaux.findIndex((panneau) => panneau?.id === nom));
  }

  liens.forEach((lien, index) => {
    lien.addEventListener("click", (event) => {
      event.preventDefault();
      montrer(index, true);
      // Onglets collés en haut, partie déjà dépassée : on la reprend à son début.
      const panneau = panneaux[index];
      if (panneau instanceof HTMLElement && panneau.getBoundingClientRect().top < nav.getBoundingClientRect().bottom) {
        panneau.scrollIntoView({ block: "start", behavior: "instant" });
      }
    });
  });

  window.addEventListener("hashchange", () => montrer(demande(), false));
  montrer(demande(), false);
}
