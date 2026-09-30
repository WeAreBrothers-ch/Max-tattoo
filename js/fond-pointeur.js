/**
 * Position du halo qui révèle la gravure sous la souris, en coordonnées 0–1
 * (origine en bas à gauche, comme dans le shader). Le halo suit le curseur
 * avec un léger retard et s'efface quand il quitte la page.
 * Au doigt, rien ne suit le geste : sur téléphone, le halo sautait à chaque
 * toucher et pendant le défilement. Les lueurs y dérivent seules, dans le
 * shader (voir u_autonome dans js/fond-shader.js).
 */

const LERP = 0.28;
const FORCE_LERP = 0.12;
const HIDE_DELAY_MOUSE_MS = 400;

/**
 * @param {{ immediate: boolean, onChange: () => void }} options
 *   immediate : pas de retard (mouvement réduit) ;
 *   onChange : appelé à chaque geste, pour redessiner hors de la boucle.
 * @returns {{ update: () => { x: number, y: number, force: number } }}
 */
export function createPointeur({ immediate, onChange }) {
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
