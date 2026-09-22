/**
 * Les flashs disponibles changent d'ordre à chaque visite : jamais le même
 * dessin en premier. Les dessins déjà tatoués restent à la suite.
 */

export function initMelange() {
  document.querySelectorAll("[data-melange]").forEach((grid) => {
    const disponibles = Array.from(grid.querySelectorAll(":scope > .pub:not(.is-tatoue)"));
    shuffle(disponibles).reverse().forEach((pub) => grid.prepend(pub));
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
