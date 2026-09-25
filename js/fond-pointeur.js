/**
 * Position du halo qui révèle la gravure, en coordonnées 0–1
 * (origine en bas à gauche, comme dans le shader).
 * À la souris : le halo suit le curseur avec un léger retard et s'efface
 * quand il quitte la page.
 * Au doigt : le halo reste visible et se promène lentement tout seul ;
 * un toucher l'attire un peu au-dessus du doigt (pour ne pas être caché),
 * puis il reprend sa promenade quelques secondes après.
 */

import { positionBalade } from "./fond-balade.js";

const LERP = 0.28;
const LERP_BALADE = 0.04;
const REPRISE_BALADE_MS = 2500;
const FORCE_LERP = 0.12;
const TOUCH_OFFSET_Y = 110;
const HIDE_DELAY_MOUSE_MS = 400;

/**
 * @param {{ immediate: boolean, onChange: () => void }} options
 *   immediate : pas de retard (mouvement réduit) ;
 *   onChange : appelé à chaque geste, pour redessiner hors de la boucle.
 * @returns {{ update: () => { x: number, y: number, force: number } }}
 */
export function createPointeur({ immediate, onChange }) {
  const touchOnly = window.matchMedia("(hover: none)").matches;
  const target = { x: 0.5, y: 0.6, force: touchOnly ? 1 : 0 };
  const current = { x: target.x, y: target.y, force: immediate ? target.force : 0 };
  let hideTimer = 0;
  let dernierToucher = -Infinity;

  /**
   * @param {number} clientX
   * @param {number} clientY
   */
  function aim(clientX, clientY) {
    target.x = clientX / window.innerWidth;
    target.y = 1 - clientY / window.innerHeight;
    target.force = 1;
    window.clearTimeout(hideTimer);
    onChange();
  }

  if (touchOnly) {
    /** @param {TouchEvent} event */
    const onTouch = (event) => {
      const touch = event.touches[0];
      if (touch) {
        dernierToucher = performance.now();
        aim(touch.clientX, Math.max(0, touch.clientY - TOUCH_OFFSET_Y));
      }
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
  } else {
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "touch") {
          aim(event.clientX, event.clientY);
        }
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
  }

  function update() {
    const maintenant = performance.now();
    const enBalade = touchOnly && !immediate && maintenant - dernierToucher > REPRISE_BALADE_MS;
    if (enBalade) {
      const balade = positionBalade(maintenant / 1000);
      target.x = balade.x;
      target.y = balade.y;
    }
    // En promenade, le halo rejoint son trajet en douceur au lieu de sauter.
    const k = immediate ? 1 : enBalade ? LERP_BALADE : LERP;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.force += (target.force - current.force) * (immediate ? 1 : FORCE_LERP);
    return current;
  }

  return { update };
}
