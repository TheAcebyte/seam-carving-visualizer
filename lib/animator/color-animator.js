import Animator from "/lib/animator/animator.js";

/** @import { AnimatorOptions, Easing } from "/lib/animator/animator.js" */

const HEX_PATTERN =
  /^#?(?<r>[0-9A-Fa-f]{2})(?<g>[0-9A-Fa-f]{2})(?<b>[0-9A-Fa-f]{2})$/;

/**
 * @typedef {Object} Color
 * @property {number} r - Red color channel value.
 * @property {number} g - Green color channel value.
 * @property {number} b - Blue color channel value.
 */

export default class ColorAnimator {
  r;
  g;
  b;

  /**
   * Creates a ColorAnimator object for smooth color transitions.
   *
   * @param {string} initial - Initial color.
   * @param {Partial<AnimatorOptions>} [options] - Configuration options.
   */
  constructor(initial, options = {}) {
    const color = this.convertHexToRGB(initial);

    this.r = new Animator(color.r, options);
    this.g = new Animator(color.g, options);
    this.b = new Animator(color.b, options);
  }

  /**
   * Converts a color from hexadecimal to RGB format and returns it.
   *
   * @param {string} hex - Color in hexadecimal.
   * @returns {Color} Color in RGB.
   *
   * @throws {Error} Throws if specified hex color is invalid.
   */
  convertHexToRGB(hex) {
    const match = hex.match(HEX_PATTERN);
    if (!match) {
      throw new Error("Invalid hex color.");
    }

    const r = parseInt(match.groups.r, 16);
    const g = parseInt(match.groups.g, 16);
    const b = parseInt(match.groups.b, 16);

    return { r, g, b };
  }

  /**
   * Converts a color from RGB to hexadecimal format and returns it.
   *
   * @param {number} r - Red color channel value.
   * @param {number} g - Green color channel value.
   * @param {number} b - Blue color channel value.
   * @returns {string} - Color in hexadecimal.
   */
  convertRGBToHex(r, g, b) {
    return (
      "#" +
      r.toString(16).padStart(2, "0") +
      g.toString(16).padStart(2, "0") +
      b.toString(16).padStart(2, "0")
    );
  }

  /**
   * Updates the color based on the elapsed time. Call this in your requestAnimationFrame loop.
   */
  step() {
    this.r.step();
    this.g.step();
    this.b.step();
  }

  /**
   * Immediately completes the animation.
   */
  end() {
    this.r.end();
    this.g.end();
    this.b.end();
  }

  /**
   * Returns whether the animation has completed.
   */
  hasEnded() {
    return (
      this.r.getValue() == this.r.getTarget() &&
      this.g.getValue() == this.g.getTarget() &&
      this.b.getValue() == this.b.getTarget()
    );
  }

  /**
   * Returns the target color in hexadecimal.
   *
   * @returns {string}
   */
  getTarget() {
  const r = this.r.getTarget();
  const g = this.g.getTarget();
  const b = this.b.getTarget();

  return this.convertRGBToHex(r, g, b);
  }

  /**
   * Sets a new target color and starts animating towards it.
   *
   * @param {string} hex - New target color in hexadecimal.
   */
  setTarget(hex) {
    const color = this.convertHexToRGB(hex);
    this.r.setTarget(color.r);
    this.g.setTarget(color.g);
    this.b.setTarget(color.b);
  }

  /**
   * Returns the current color in hexadecimal.
   *
   * @returns {string}
   */
  getValue() {
    const r = Math.round(this.r.getValue());
    const g = Math.round(this.g.getValue());
    const b = Math.round(this.b.getValue());

    return this.convertRGBToHex(r, g, b);
  }

  /**
   * Sets the current color immediately without animation.
   *
   * @param {string} hex - New color value in hexadecimal.
   */
  setValue(hex) {
    const color = this.convertHexToRGB(hex);
    this.r.setValue(color.r);
    this.g.setValue(color.g);
    this.b.setValue(color.b);
  }

  /**
   * Sets the easing function.
   *
   * @param {Easing} easing - Easing function key.
   */
  setEasing(easing) {
    this.r.setEasing(easing);
    this.g.setEasing(easing);
    this.b.setEasing(easing);
  }

  /**
   * Returns the animation duration in milliseconds.
   *
   * @returns {number}
   */
  getDuration() {
    return this.r.getDuration();
  }

  /**
   * Sets new easing duration in milliseconds.
   *
   * @param {number} duration - New easing duration in milliseconds.
   */
  setDuration(duration) {
    this.r.setDuration(duration);
    this.g.setDuration(duration);
    this.b.setDuration(duration);
  }
}
