/**
 * Halo rouge sang qui révèle la gravure de fond.
 * À la souris : le halo suit le curseur et s'efface quand il quitte la page.
 * Au doigt : le halo est toujours visible, il glisse vers le dernier point touché.
 * Le calque `.fond` est masqué par un dégradé radial positionné via --mx / --my.
 */

const LERP_FACTOR = 0.16;
const SETTLE_THRESHOLD = 0.3;
const HIDE_DELAY_MOUSE_MS = 400;
const TOUCH_OFFSET_Y = 110;
const TOUCH_REVEAL_DELAY_MS = 300;

export function initFond() {
  const fond = document.querySelector(".fond");
  if (!(fond instanceof HTMLElement)) {
    return;
  }

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touchOnly = window.matchMedia("(hover: none)").matches;
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

  function moveTo(x, y) {
    target.x = x;
    target.y = y;
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

  function bindMouse() {
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch") {
          return;
        }
        moveTo(event.clientX, event.clientY);
        show();
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", () => hide(HIDE_DELAY_MOUSE_MS));
  }

  function followTouch(event) {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    moveTo(touch.clientX, Math.max(0, touch.clientY - TOUCH_OFFSET_Y));
  }

  function bindTouch() {
    paint();
    setTimeout(show, TOUCH_REVEAL_DELAY_MS);
    window.addEventListener("touchstart", followTouch, { passive: true });
    window.addEventListener("touchmove", followTouch, { passive: true });
  }

  if (touchOnly) {
    bindTouch();
  } else {
    bindMouse();
  }
}
