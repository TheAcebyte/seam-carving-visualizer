/**
 * Applies cubic ease-out easing to a progress value and returns it.
 *
 * @param {number} x - Absolute progress of the animation. Between 0 and 1.
 * @returns {number} Eased progress. Between 0 and 1.
 */
export function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Applies cubic ease-in-out easing to a progress value and returns it.
 *
 * @param {number} x - Absolute progress of the animation. Between 0 and 1.
 * @returns {number} Eased progress. Between 0 and 1.
 */
export function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
