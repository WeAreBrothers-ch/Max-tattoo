/**
 * Halo rouge sang qui suit la souris (ou le pouce sur écran tactile).
 * Le calque `.fond` est masqué par un dégradé radial positionné via --mx / --my.
 */

const LERP_FACTOR = 0.16;
const SETTLE_THRESHOLD = 0.3;
const HIDE_DELAY_MOUSE_MS = 400;
const HIDE_DELAY_TOUCH_MS = 900;

export function initFond() {
  const fond = document.querySelector(".fond");
  if (!(fond instanceof HTMLElement)) {
    return;
  }

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  const current = { x: target.x, y: target.y };
  let frame = null;
  let hideTimer = null;

  function paint() {
    root.style.setProperty("--mx", `${current.x.toFixed(1)}px`);
    root.style.setProperty("--my", `${current.y.toFixed(1)}px`);
  }

  function tick() {
    const k = reduceMotion ? 1 : LERP_FACTOR;
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    paint();
    const settled =
      Math.abs(target.x - current.x) <= SETTLE_THRESHOLD &&
      Math.abs(target.y - current.y) <= SETTLE_THRESHOLD;
    frame = settled ? null : requestAnimationFrame(tick);
  }

  function moveTo(x, y, snap) {
    target.x = x;
    target.y = y;
    if (snap) {
      current.x = x;
      current.y = y;
      paint();
    }
    if (frame === null) {
      frame = requestAnimationFrame(tick);
    }
  }

  function show() {
    clearTimeout(hideTimer);
    fond.classList.add("is-active");
  }

  function hide(delay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => fond.classList.remove("is-active"), delay);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      moveTo(event.clientX, event.clientY, false);
      show();
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", () => hide(HIDE_DELAY_MOUSE_MS));

  window.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      moveTo(touch.clientX, touch.clientY, true);
      show();
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      moveTo(touch.clientX, touch.clientY, false);
      show();
    },
    { passive: true }
  );
  window.addEventListener("touchend", () => hide(HIDE_DELAY_TOUCH_MS), { passive: true });
  window.addEventListener("touchcancel", () => hide(HIDE_DELAY_TOUCH_MS), { passive: true });
}
