import InputHandler from "/lib/canvas-control/handlers/base.js";
import MouseKeyboardHandler from "/lib/canvas-control/handlers/mouse-keyboard-handler.js";
import TouchHandler from "/lib/canvas-control/handlers/touch-handler.js";
import { clamp, easeOutCubic, map } from "/lib/utils.js";

/**
 * @callback ScaleGetter
 * @param {number} scale - Current scale value.
 * @returns {number} Next or previous scale value.
 */

/**
 * @typedef {Object} ControlOptions
 * @property {number} decayFactor - Velocity decay multiplier.
 * @property {number} decayDuration - Decay factor application interval (ms).
 * @property {number} velocityThreshold - Minimum velocity required for easing.
 * @property {number} scaleEasingDuration - Duration for scale transition animation (ms).
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

  isPanning = false;
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

  targetScale = 1;
  easedScale = 1;
  startScale = 1;
  scaleX = 0;
  scaleY = 0;
  scaleEasingStartTime = 0;

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
  }

  /**
   * Initialises input handlers and calculates canvas initial center.
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
    if (!this.isPanning) return;

    this.deltaPanX = this.panX - this.lastPanX;
    this.deltaPanY = this.panY - this.lastPanY;
    this.translationX += this.deltaPanX;
    this.translationY += this.deltaPanY;
  }

  /**
   * Applies velocity easing when the user stops panning.
   */
  easeVelocity() {
    if (this.isPanning) return;

    const squaredVelocity = this.deltaPanX ** 2 + this.deltaPanY ** 2;
    if (squaredVelocity < this.options.velocityThreshold ** 2) return;

    const deltaTime = performance.now() - this.lastTime;
    const timeScaledDecayFactor = Math.pow(
      this.options.decayFactor,
      deltaTime / this.options.decayDuration,
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
    if (this.easedScale == this.targetScale) return;

    const deltaTime = performance.now() - this.scaleEasingStartTime;
    const absoluteProgress = deltaTime / this.options.scaleEasingDuration;
    if (absoluteProgress >= 1) {
      this.easedScale = this.targetScale;
    } else {
      const easedProgress = easeOutCubic(absoluteProgress);
      this.easedScale = map(
        easedProgress,
        0,
        1,
        this.startScale,
        this.targetScale,
      );
    }

    this.adjustScaleTranslation();
  }

  /**
   * Adjusts translation to maintain screenspace position of the scale focal point (scaleX, scaleY).
   */
  adjustScaleTranslation() {
    const scalePoint = new DOMPoint(this.scaleX, this.scaleY);
    const inverseTransform = this.ctx.getTransform().invertSelf();
    const worldScalePoint = inverseTransform.transformPoint(scalePoint);

    this.translationX =
      this.scaleX - this.initialCenterX - this.easedScale * worldScalePoint.x;
    this.translationY =
      this.scaleY - this.initialCenterY - this.easedScale * worldScalePoint.y;
  }

  /**
   * Applies the transformation matrix to the canvas.
   */
  applyTransform() {
    this.ctx.setTransform(
      this.easedScale,
      0,
      0,
      this.easedScale,
      this.translationX + this.initialCenterX,
      this.translationY + this.initialCenterY,
    );
  }

  /**
   * Starts panning from the specified X and Y-coordinates in screenspace.
   *
   * @param {number} x - X-coordinate in screenspace.
   * @param {number} y - Y-coordinate in screenspace.
   */
  panStart(x, y) {
    this.isPanning = true;
    this.lastPanX = x;
    this.lastPanY = y;
    this.panX = x;
    this.panY = y;
  }

  /**
   * Ends panning.
   */
  panEnd() {
    this.isPanning = false;
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
   * Returns scale value.
   */
  getScale() {
    return this.targetScale;
  }

  /**
   * Sets new scale value with optional easing and focal point.
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

    const oldScale = this.targetScale;
    const newScale = clamp(scale, this.options.minScale, this.options.maxScale);

    // Complete easing if still ongoing
    this.startScale = oldScale;
    this.easedScale = oldScale;
    this.adjustScaleTranslation();

    this.targetScale = newScale;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleEasingStartTime = performance.now();

    if (!easeScale) {
      this.startScale = newScale;
      this.easedScale = newScale;
      this.adjustScaleTranslation();
    }
  }

  /**
   * Zooms in by the configured scale increment.
   *
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  zoomIn(options = {}) {
    const oldScale = this.targetScale;
    const newScale = this.options.getNextScale(oldScale);
    this.setScale(newScale, options);
  }

  /**
   * Zooms out by the configured scale decrement.
   *
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  zoomOut(options = {}) {
    const oldScale = this.targetScale;
    const newScale = this.options.getPreviousScale(oldScale);
    this.setScale(newScale, options);
  }

  /**
   * Returns user X-coordinate with positive axis extending right.
   */
  getUserX() {
    return -this.translationX / this.targetScale;
  }

  /**
   * Sets X-translation value from user X-coordinate.
   *
   * @param {number} x - User X-coordinate.
   */
  setUserX(x) {
    this.translationX = -x * this.targetScale;
  }

  /**
   * Returns user Y-coordinate with positive axis extending down.
   */
  getUserY() {
    return -this.translationY / this.targetScale;
  }

  /**
   * Sets Y-translation value from user Y-coordinate.
   *
   * @param {number} y - User Y-coordinate.
   */
  setUserY(y) {
    this.translationY = -y * this.targetScale;
  }
}
