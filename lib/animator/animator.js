import { easeOutCubic, easeInOutCubic, easeOutExpo } from "/lib/animator/easings.js";
import { map } from "/lib/utils.js";

/**
 * @typedef {"ease-in-out-cubic" | "ease-out-cubic" | "ease-out-expo"} Easing
 */

/**
 * @callback EasingFunction
 * @param {number} progress - Absolute progress of the animation. Between 0 and 1.
 * @returns {number} Eased progress. Between 0 and 1.
 */

/**
 * @typedef {Object} AnimatorOptions
 * @property {Easing} easing - Easing function to use.
 * @property {number} duration - Animation duration in milliseconds.
 */

export default class Animator {
  start;
  current;
  target;

  /** @type {EasingFunction} */
  ease;

  timestamp = performance.now();
  duration;

  /**
   * Creates an Animator object for smooth value transitions.
   *
   * @param {number} initial - Initial value.
   * @param {Partial<AnimatorOptions>} [options] - Configuration options.
   */
  constructor(initial, options = {}) {
    this.start = initial;
    this.current = initial;
    this.target = initial;

    const {
      easing = "ease-in-out-cubic",
      duration = 1000,
    } = options;

    this.setEasing(easing);
    this.duration = duration;
  }

  /**
   * Updates the value based on the elapsed time. Call this in your requestAnimationFrame loop.
   */
  step() {
    const elapsedTime = performance.now() - this.timestamp;
    const absoluteProgress = elapsedTime / this.duration;
    if (absoluteProgress >= 1) {
      this.current = this.target;
      return;
    }

    const easedProgress = this.ease(absoluteProgress);
    this.current = map(easedProgress, 0, 1, this.start, this.target);
  }

  /**
   * Immediately completes the animation.
   */
  end() {
    this.start = this.target;
    this.current = this.target;
  }

  /**
   * Returns whether the animation has completed.
   */
  hasEnded() {
    return this.current == this.target;
  }

  /**
   * Returns the target value.
   *
   * @returns {number}
   */
  getTarget() {
    return this.target;
  }

  /**
   * Sets a new target value and starts animating towards it.
   *
   * @param {number} target - New target value.
   */
  setTarget(target) {
    this.start = this.current;
    this.target = target;
    this.timestamp = performance.now();
  }

  /**
   * Returns the current value.
   *
   * @returns {number}
   */
  getValue() {
    return this.current;
  }

  /**
   * Sets the current value immediately without animation.
   *
   * @param {number} value - New value.
   */
  setValue(value) {
    this.start = value;
    this.current = value;
    this.target = value;
  }

  /**
   * Sets the easing function.
   *
   * @param {Easing} easing - Easing function key.
   */
  setEasing(easing) {
    switch (easing) {
      case "ease-out-cubic":
        this.ease = easeOutCubic;
        break;

      case "ease-in-out-cubic":
        this.ease = easeInOutCubic;
        break;

      case "ease-out-expo":
        this.ease = easeOutExpo;
        break;

      default:
        throw new Error("Invalid easing function key.");
    }
  }

  /**
   * Returns the animation duration in milliseconds.
   *
   * @returns {number}
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Sets new easing duration in milliseconds.
   *
   * @param {number} duration - New easing duration in milliseconds.
   */
  setDuration(duration) {
    this.duration = duration;
  }
}
