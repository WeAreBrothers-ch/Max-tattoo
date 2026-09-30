/**
 * Les flashs disponibles changent d'ordre à chaque visite : jamais le même
 * dessin en premier. Les dessins déjà tatoués restent à la suite.
 */

export function initMelange() {
  document.querySelectorAll("[data-melange]").forEach((grille) => {
    const disponibles = Array.from(grille.querySelectorAll(":scope > .est-libre"));
    shuffle(disponibles)
      .reverse()
      .forEach((planche) => grille.prepend(planche));
  });
}

/**
 * Mélange de Fisher-Yates, sur une copie.
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
