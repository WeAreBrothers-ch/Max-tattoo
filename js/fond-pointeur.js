/**
 * La lumière qui révèle la gravure, en coordonnées 0–1 (origine en bas à
 * gauche, comme dans le shader), et sa force de 0 à 1.
 *
 * À la souris : le halo suit le curseur avec un léger retard et s'efface
 * quand il quitte la page.
 *
 * Sur écran tactile : une lanterne toujours allumée, visible dès l'arrivée,
 * qui se promène seule un peu partout sur l'écran. Elle ne suit ni le doigt
 * ni le défilement : son trajet est une courbe continue du temps de la
 * visite, et ce temps se poursuit d'une page à l'autre, donc elle ne saute
 * jamais.
 */

const LERP = 0.28;
const FORCE_LERP = 0.12;
const HIDE_DELAY_MOUSE_MS = 400;

// Lanterne tactile : arrivée en fondu à la première page, puis toujours allumée.
const ARRIVEE_TAU_MS = 700;

/**
 * @param {{ immediate: boolean, onChange: () => void, tactile: boolean, dejaAllumee: boolean }} options
 *   immediate : pas de retard (mouvement réduit) ;
 *   onChange : appelé à chaque geste de souris, pour redessiner hors de la boucle ;
 *   tactile : écran tactile, la lanterne promenée remplace la souris ;
 *   dejaAllumee : page suivante de la visite, la lanterne est déjà là (pas de fondu).
 * @returns {{ update: (now: number, secondes: number) => { x: number, y: number, force: number } }}
 */
export function createPointeur({ immediate, onChange, tactile, dejaAllumee }) {
  return tactile ? lanterne({ immediate, dejaAllumee }) : souris({ immediate, onChange });
}

/**
 * @param {{ immediate: boolean, onChange: () => void }} options
 */
function souris({ immediate, onChange }) {
  const target = { x: 0.5, y: 0.6, force: 0 };
  const current = { x: target.x, y: target.y, force: 0 };
  let hideTimer = 0;

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      target.x = event.clientX / window.innerWidth;
      target.y = 1 - event.clientY / window.innerHeight;
      target.force = 1;
      window.clearTimeout(hideTimer);
      onChange();
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      target.force = 0;
      onChange();
    }, HIDE_DELAY_MOUSE_MS);
  });

  function update() {
    const k = immediate ? 1 : LERP;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.force += (target.force - current.force) * (immediate ? 1 : FORCE_LERP);
    return current;
  }

  return { update };
}

/**
 * @param {{ immediate: boolean, dejaAllumee: boolean }} options
 */
function lanterne({ immediate, dejaAllumee }) {
  const courant = { x: 0.5, y: 0.55, force: immediate || dejaAllumee ? 1 : 0 };
  let dernierT = performance.now();

  /**
   * @param {number} now
   * @param {number} secondes temps de la visite (il continue d'une page à l'autre)
   */
  function update(now, secondes) {
    const dt = Math.min(250, Math.max(1, now - dernierT));
    dernierT = now;
    if (!immediate) {
      courant.force += (1 - courant.force) * (1 - Math.exp(-dt / ARRIVEE_TAU_MS));
    }
    // Deux ondes lentes par axe, de périodes sans rapport simple : le trajet
    // couvre tout l'écran sans jamais se répéter à l'œil ni changer brusquement.
    courant.x = 0.5 + 0.3 * Math.sin(secondes * 0.14) + 0.1 * Math.sin(secondes * 0.31 + 0.7);
    courant.y = 0.5 + 0.28 * Math.sin(secondes * 0.105 + 1.3) + 0.1 * Math.sin(secondes * 0.23 + 2.1);
    return courant;
  }

  return { update };
}
