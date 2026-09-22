/**
 * Position de la « lanterne » qui éclaire la brume, en coordonnées 0–1
 * (origine en bas à gauche, comme dans le shader).
 * Souris ou doigt : la lanterne suit, avec un léger retard.
 * Sans geste depuis quelques secondes : elle erre doucement toute seule.
 */

const LERP = 0.08;
const IDLE_AFTER_MS = 3500;
const TOUCH_OFFSET_Y = 90;
const ACTIVE_FORCE = 1;
const IDLE_FORCE = 0.45;

/**
 * @returns {{ update: (time: number) => { x: number, y: number, force: number } }}
 */
export function createPointeur() {
  const current = { x: 0.5, y: 0.6, force: 0 };
  const target = { x: 0.5, y: 0.6 };
  let lastInput = -Infinity;

  /**
   * @param {number} clientX
   * @param {number} clientY
   */
  function aim(clientX, clientY) {
    target.x = clientX / window.innerWidth;
    target.y = 1 - clientY / window.innerHeight;
    lastInput = performance.now();
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "touch") {
        aim(event.clientX, event.clientY);
      }
    },
    { passive: true }
  );

  /** @param {TouchEvent} event */
  function onTouch(event) {
    const touch = event.touches[0];
    if (touch) {
      aim(touch.clientX, Math.max(0, touch.clientY - TOUCH_OFFSET_Y));
    }
  }
  window.addEventListener("touchstart", onTouch, { passive: true });
  window.addEventListener("touchmove", onTouch, { passive: true });

  document.addEventListener("mouseleave", () => {
    lastInput = -Infinity;
  });

  /**
   * @param {number} time secondes écoulées depuis le début de l'animation
   */
  function update(time) {
    const idle = performance.now() - lastInput > IDLE_AFTER_MS;
    const goal = idle ? wander(time) : target;
    const force = idle ? IDLE_FORCE : ACTIVE_FORCE;
    current.x += (goal.x - current.x) * LERP;
    current.y += (goal.y - current.y) * LERP;
    current.force += (force - current.force) * LERP * 0.5;
    return current;
  }

  return { update };
}

/**
 * Trajectoire lente et jamais identique (courbe de Lissajous).
 * @param {number} time
 */
function wander(time) {
  return {
    x: 0.5 + 0.32 * Math.sin(time * 0.11) * Math.cos(time * 0.037),
    y: 0.55 + 0.25 * Math.sin(time * 0.083 + 1.3),
  };
}
