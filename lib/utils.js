/**
 * Utility tagged template for syntax highlighting without processing HTML.
 *
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 * @returns {string}
 */
export function html(strings, ...values) {
  return strings.reduce((acc, string, i) => {
    if (i >= values.length) return acc + string;
    return acc + string + values[i];
  }, "");
}

/**
 * Maps a value from [a1, b1] range to [a2, b2] range.
 *
 * @param {number} value - Value to map.
 * @param {number} a1 - Source range minimum.
 * @param {number} b1 - Source range maximum.
 * @param {number} a2 - Target range minimum.
 * @param {number} b2 - Target range maximum.
 * @returns {number} Mapped value.
 */
export function map(value, a1, b1, a2, b2) {
  return (value - a1)  * (b2 - a2) / (b1 - a1) + a2;
}

/**
 * Applies cubic ease-out easing to a progress value and returns it.
 *
 * @param {number} x - Absolute progress of the animation. Between 0 and 1.
 * @returns {number} Eased progress. Between 0 and 1.
 */
export function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}
