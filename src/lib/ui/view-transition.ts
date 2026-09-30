/** Cheap View Transition wrapper. No-ops when the API is missing or motion is reduced. */
export function runViewTransition(update: () => void) {
  if (typeof document === "undefined") {
    update();
    return;
  }

  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;
  const start = document.startViewTransition?.bind(document);
  if (!start || reduceMotion) {
    update();
    return;
  }

  start(update);
}
