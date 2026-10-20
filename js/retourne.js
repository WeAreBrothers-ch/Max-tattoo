/**
 * Dessins déjà tatoués : toucher la carte la retourne sur la pièce portée,
 * la toucher encore ramène le dessin. Sans script, le dessin reste seul et
 * le lien « La pièce portée » mène à la photo.
 */

export function initRetournes() {
  document.querySelectorAll("[data-retourne]").forEach((bouton) => {
    bouton.querySelector(".retourne-indice")?.removeAttribute("hidden");
    bouton.addEventListener("click", () => {
      bouton.setAttribute("aria-pressed", String(bouton.getAttribute("aria-pressed") !== "true"));
    });
  });
}
