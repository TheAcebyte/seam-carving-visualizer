import store from "/lib/store.js";

const scaleValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];

/**
 * Returns the next larger scale value in sequence.
 * If no larger scale value exists, returns the current scale value.
 *
 * @param {number} currentScale - Current scale value.
 */
export const getNextScale = (currentScale) => {
  for (let i = 0; i < scaleValues.length; i++) {
    const scale = scaleValues[i];
    if (scale > currentScale) return scale;
  }

  return currentScale;
};

/**
 * Returns the previous smaller scale value in sequence.
 * If no smaller scale value exists, returns the current scale value.
 *
 * @param {number} currentScale - Current scale value.
 */
export const getPreviousScale = (currentScale) => {
  for (let i = scaleValues.length - 1; i >= 0; i--) {
    const scale = scaleValues[i];
    if (scale < currentScale) return scale;
  }

  return currentScale;
};

/**
 * Sets the scale to the next larger value in sequence.
 *
 * @param {number} currentScale - Current scale value.
 */
export const scaleUp = (currentScale) => {
  const newScale = getNextScale(currentScale);
  store.set("scale", newScale);
};

/**
 * Sets the scale to the previous smaller value in sequence.
 *
 * @param {number} currentScale - Current scale value.
 */
export const scaleDown = (currentScale) => {
  const newScale = getPreviousScale(currentScale);
  store.set("scale", newScale);
};

/**
 * Returns whether the scale value can be increased.
 *
 * @param {number} currentScale - Current scale value.
 * @returns {boolean}
 */
export const canScaleUp = (currentScale) => {
  return getNextScale(currentScale) == currentScale;
};

/**
 * Returns whether the scale value can be decreased.
 *
 * @param {number} currentScale - Current scale value.
 * @returns {boolean}
 */
export const canScaleDown = (currentScale) => {
  return getPreviousScale(currentScale) == currentScale;
};

/**
 * Returns the maximum scale value.
 * @returns {number}
 */
export const getMaxScale = () => scaleValues[scaleValues.length - 1];

/**
 * Returns the minimum scale value.
 * @returns {number}
 */
export const getMinScale = () => scaleValues[0];
