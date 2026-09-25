/**
 * Promenade lente du halo sur écran tactile, quand personne ne touche l'écran.
 * Deux ondes lentes par axe, de périodes sans rapport simple : le trajet ne
 * se répète pas à l'œil et reste dans la partie centrale de l'écran.
 */

const CENTRE_X = 0.5;
const CENTRE_Y = 0.55;

/**
 * @param {number} secondes temps écoulé depuis le chargement
 * @returns {{ x: number, y: number }} position 0–1, origine en bas à gauche
 */
export function positionBalade(secondes) {
  const t = secondes;
  return {
    x: CENTRE_X + 0.26 * Math.sin(t * 0.13) + 0.08 * Math.sin(t * 0.31 + 0.7),
    y: CENTRE_Y + 0.2 * Math.sin(t * 0.097 + 1.3) + 0.07 * Math.sin(t * 0.23 + 2.1),
  };
}
