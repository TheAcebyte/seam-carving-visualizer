import Animator from "/lib/animator/animator.js";
import InputHandler from "/lib/canvas-control/handlers/base.js";
import MouseKeyboardHandler from "/lib/canvas-control/handlers/mouse-keyboard-handler.js";
import TouchHandler from "/lib/canvas-control/handlers/touch-handler.js";
import { clamp } from "/lib/utils.js";

/**
 * @typedef {Object} Point
 * @property {number} x - X-coordinate of the point.
 * @property {number} y - Y-coordinate of the point.
 */

/**
 * @callback ScaleGetter
 * @param {number} scale - Current scale value.
 * @returns {number} Next or previous scale value.
 */

/**
 * @typedef {Object} ControlOptions
 * @property {number} decayFactor - Velocity decay multiplier.
 * @property {number} decayDuration - Decay factor application interval in milliseconds.
 * @property {number} velocityThreshold - Minimum velocity required for easing.
 * @property {number} defaultScale - Default scale value.
 * @property {number} scaleEasingDuration - Duration for scale transition animation in milliseconds.
 * @property {number} pinchScaleSensitivity - Conversion factor from pinch distance to scale.
 * @property {number} maxScale - Maximum allowed scale value.
 * @property {number} minScale - Minimum allowed scale value.
 * @property {ScaleGetter} getNextScale - Function that returns the next scale value.
 * @property {ScaleGetter} getPreviousScale - Functions that returns the previous scale value.
 */

/** @type {ControlOptions} */
const defaultOptions = {
  decayFactor: 0.85,
  decayDuration: 25,
  velocityThreshold: 0.5,
  defaultScale: 1,
  scaleEasingDuration: 100,
  pinchScaleSensitivity: 0.005,
  maxScale: 8,
  minScale: 0.125,
  getNextScale: (scale) => scale * 2,
  getPreviousScale: (scale) => scale / 2,
};

/**
 * @typedef {Object} ScalingOptions
 * @property {boolean} ease - Whether to animate the scale transition smoothly. Defaults to true.
 * @property {number} x - X-coordinate of the scale focal point in screenspace. Defaults to canvas center.
 * @property {number} y - Y-coordinate of the scale focal point in screenspace. Defaults to canvas center.
 */

export default class CanvasControl {
  canvas;
  ctx;

  /** @type {ControlOptions} */
  options;

  /** @type {InputHandler[]} */
  handlers;

  panning = false;
  initialCenterX = 0;
  initialCenterY = 0;
  lastTime = 0;

  translationX = 0;
  translationY = 0;
  panX = 0;
  panY = 0;
  lastPanX = 0;
  lastPanY = 0;
  deltaPanX = 0;
  deltaPanY = 0;

  scaleAnimator;
  scaleX = 0;
  scaleY = 0;

  /**
   * Creates a new CanvasControl object.
   *
   * @param {HTMLCanvasElement} canvas - Canvas element.
   * @param {Partial<ControlOptions>} [options] - Configuration options.
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = { ...defaultOptions, ...options };
    this.handlers = [new MouseKeyboardHandler(this), new TouchHandler(this)];
    this.scaleAnimator = new Animator(this.options.defaultScale, {
      easing: "ease-out-cubic",
      duration: this.options.scaleEasingDuration,
    });
  }

  /**
   * Initialises input handlers and calculates initial canvas center.
   */
  init() {
    this.initialCenterX = this.canvas.width >> 1;
    this.initialCenterY = this.canvas.height >> 1;

    for (const handler of this.handlers) {
      handler.init();
    }
  }

  /**
   * Main update step. Call this in your requestAnimationFrame loop.
   */
  step() {
    this.updatePosition();
    this.easeVelocity();
    this.easeScale();
    this.applyTransform();

    this.lastPanX = this.panX;
    this.lastPanY = this.panY;
    this.lastTime = performance.now();
  }

  /**
   * Updates translation values during panning.
   */
  updatePosition() {
    if (!this.panning) return;

    this.deltaPanX = this.panX - this.lastPanX;
    this.deltaPanY = this.panY - this.lastPanY;
    this.translationX += this.deltaPanX;
    this.translationY += this.deltaPanY;
  }

  /**
   * Applies velocity easing when the user stops panning.
   */
  easeVelocity() {
    if (this.panning) return;

    const squaredVelocity = this.deltaPanX ** 2 + this.deltaPanY ** 2;
    if (squaredVelocity < this.options.velocityThreshold ** 2) return;

    const elapsedTime = performance.now() - this.lastTime;
    const timeScaledDecayFactor = Math.pow(
      this.options.decayFactor,
      elapsedTime / this.options.decayDuration,
    );

    this.translationX += this.deltaPanX;
    this.translationY += this.deltaPanY;
    this.deltaPanX *= timeScaledDecayFactor;
    this.deltaPanY *= timeScaledDecayFactor;
  }

  /**
   * Smoothly transitions the current scale toward the target scale over time.
   */
  easeScale() {
    if (this.scaleAnimator.hasEnded()) return;
    this.scaleAnimator.step();
    this.adjustScaleTranslation();
  }

  /**
   * Adjusts translation to maintain screenspace position of the scale focal point (scaleX, scaleY).
   */
  adjustScaleTranslation() {
    const scale = this.scaleAnimator.getValue();
    const worldScalePoint = this.getWorldCoordinates(this.scaleX, this.scaleY);

    this.translationX =
      this.scaleX - this.initialCenterX - scale * worldScalePoint.x;
    this.translationY =
      this.scaleY - this.initialCenterY - scale * worldScalePoint.y;
  }

  /**
   * Applies the transformation matrix to the canvas.
   */
  applyTransform() {
    const scale = this.scaleAnimator.getValue();
    const translationX = this.translationX + this.initialCenterX;
    const translationY = this.translationY + this.initialCenterY;

    this.ctx.setTransform(scale, 0, 0, scale, translationX, translationY);
  }

  /**
   * Converts screen coordinates to world coordinates and returns them.
   *
   * @param {number} x - X-coordinate in screenspace.
   * @param {number} y - Y-coordinate in screenspace.
   * @returns {Point} Corresponding coordinates in worldspace.
   */
  getWorldCoordinates(x, y) {
    const screenPoint = new DOMPoint(x, y);
    const inverseTransform = this.ctx.getTransform().invertSelf();
    const worldPoint = inverseTransform.transformPoint(screenPoint);

    return { x: worldPoint.x, y: worldPoint.y };
  }

  /**
   * Starts panning from the specified X and Y-coordinates in screenspace.
   *
   * @param {number} x - X-coordinate in screenspace.
   * @param {number} y - Y-coordinate in screenspace.
   */
  panStart(x, y) {
    this.panning = true;
    this.lastPanX = x;
    this.lastPanY = y;
    this.panX = x;
    this.panY = y;
  }

  /**
   * Ends panning.
   */
  panEnd() {
    this.panning = false;
  }

  /**
   * Pans to specified X and Y-coordinates in screenspace.
   *
   * @param {number} x - X-coordinate in screenspace.
   * @param {number} y - Y-coordinate in screenspace.
   */
  panTo(x, y) {
    this.panX = x;
    this.panY = y;
  }

  /**
   * Returns whether the user is currently panning.
   *
   * @returns {boolean}
   */
  isPanning() {
    return this.panning;
  }

  /**
   * Returns scale value.
   */
  getScale() {
    const scale = this.scaleAnimator.getTarget();
    return scale;
  }

  /**
   * Updates the scale value with optional easing and centering on a focal point.
   *
   * @param {number} scale - New scale value.
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  setScale(scale, options = {}) {
    const {
      ease: easeScale = true,
      x: scaleX = this.canvas.width >> 1,
      y: scaleY = this.canvas.height >> 1,
    } = options;

    const clampedScale = clamp(
      scale,
      this.options.minScale,
      this.options.maxScale,
    );

    this.scaleAnimator.setTarget(clampedScale);
    this.scaleX = scaleX;
    this.scaleY = scaleY;

    if (!easeScale) {
      this.scaleAnimator.end();
      this.adjustScaleTranslation();
    }
  }

  /**
   * Zooms in by the configured scale increment.
   *
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  zoomIn(options = {}) {
    const oldScale = this.scaleAnimator.getTarget();
    const newScale = this.options.getNextScale(oldScale);
    this.setScale(newScale, options);
  }

  /**
   * Zooms out by the configured scale decrement.
   *
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  zoomOut(options = {}) {
    const oldScale = this.scaleAnimator.getTarget();
    const newScale = this.options.getPreviousScale(oldScale);
    this.setScale(newScale, options);
  }

  /**
   * Returns user X-coordinate with positive axis extending right.
   *
   * @returns {number}
   */
  getUserX() {
    const scale = this.scaleAnimator.getTarget();
    return -this.translationX / scale;
  }

  /**
   * Sets X-translation value from user X-coordinate.
   *
   * @param {number} x - User X-coordinate.
   */
  setUserX(x) {
    const scale = this.scaleAnimator.getTarget();
    this.translationX = -x * scale;
  }

  /**
   * Returns user Y-coordinate with positive axis extending down.
   *
   * @returns {number}
   */
  getUserY() {
    const scale = this.scaleAnimator.getTarget();
    return -this.translationY / scale;
  }

  /**
   * Sets Y-translation value from user Y-coordinate.
   *
   * @param {number} y - User Y-coordinate.
   */
  setUserY(y) {
    const scale = this.scaleAnimator.getTarget();
    this.translationY = -y * scale;
  }

  /**
   * Returns the assigned canvas element.
   *
   * @returns {HTMLCanvasElement}
   */
  getCanvas() {
    return this.canvas;
  }
}
