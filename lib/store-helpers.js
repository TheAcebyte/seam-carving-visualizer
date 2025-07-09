import store from "/lib/store.js";

const scaleValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
let scaleIndex = scaleValues.indexOf(1);

/**
 * Increases the scale up to the next level and returns it.
 */
export const scaleUp = () => {
  if (scaleIndex >= scaleValues.length - 1) return scaleValues[scaleIndex];

  const scale = scaleValues[++scaleIndex];
  store.set("scale", scale);
  return scale;
};

/**
 * Decreases the scale down to the previous level and returns it.
 */
export const scaleDown = () => {
  if (scaleIndex <= 0) return scaleValues[scaleIndex];

  const scale = scaleValues[--scaleIndex];
  store.set("scale", scale);
  return scale;
};

/**
 * Returns whether the scale value can be increased.
 *
 * @returns {boolean}
 */
export const canScaleUp = () => scaleIndex < scaleValues.length - 1;

/**
 * Returns whether the scale value can be decreased.
 *
 * @returns {boolean}
 */
export const canScaleDown = () => scaleIndex > 0;
