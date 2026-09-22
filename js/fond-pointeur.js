/**
 * Position du halo qui révèle la gravure, en coordonnées 0–1
 * (origine en bas à gauche, comme dans le shader).
 * À la souris : le halo suit le curseur avec un léger retard et s'efface
 * quand il quitte la page.
 * Au doigt : le halo reste visible et glisse vers le dernier point touché,
 * un peu au-dessus du doigt pour ne pas être caché.
 */

const LERP = 0.28;
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
    const k = immediate ? 1 : LERP;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.force += (target.force - current.force) * (immediate ? 1 : FORCE_LERP);
    return current;
  }

  return { update };
}
