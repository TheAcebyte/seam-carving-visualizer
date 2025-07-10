import { easeOutCubic, map } from "/lib/utils.js";

const WHEEL_BUTTON = 1;
const SPACE_KEY = " ";
const PLUS_KEY = "+";
const MINUS_KEY = "-";
const EQUAL_KEY = "=";

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
 * @property {ScaleGetter} getNextScale - Function that returns the next scale value.
 * @property {ScaleGetter} getPreviousScale - Functions that returns the previous scale value.
 */

/** @type {ControlOptions} */
const defaultOptions = {
  decayFactor: 0.85,
  decayDuration: 25,
  velocityThreshold: 0.5,
  scaleEasingDuration: 100,
  getNextScale: (scale) => scale * 2,
  getPreviousScale: (scale) => scale / 2,
};

/**
 * @typedef {Object} ScalingOptions
 * @property {boolean} ease - Whether to animate the scale transition smoothly. Defaults to true.
 * @property {number} x - X-coordinate of the scale focal point in screen space. Defaults to canvas center.
 * @property {number} y - Y-coordinate of the scale focal point in screen space. Defaults to canvas center.
 */

export default class CanvasControl {
  canvas;
  ctx;

  /** @type {ControlOptions} */
  options;

  canPan = false;
  isPanning = false;

  initialCenterX = 0;
  initialCenterY = 0;
  lastTime = 0;

  translationX = 0;
  translationY = 0;
  cursorX = 0;
  cursorY = 0;
  lastCursorX = 0;
  lastCursorY = 0;
  deltaCursorX = 0;
  deltaCursorY = 0;

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
  }

  /**
   * Initialises event listeners and calculates canvas initial center.
   */
  init() {
    this.initialCenterX = this.canvas.width >> 1;
    this.initialCenterY = this.canvas.height >> 1;

    this.canvas.addEventListener("mousedown", (event) => {
      if (this.canPan || event.button == WHEEL_BUTTON) {
        this.isPanning = true;
        this.lastCursorX = event.x;
        this.lastCursorY = event.y;
        this.cursorX = event.x;
        this.cursorY = event.y;
        this.canvas.style.cursor = "grabbing";
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.canvas.style.cursor = this.canPan ? "grab" : "default";
    });

    this.canvas.addEventListener("mousemove", (event) => {
      this.cursorX = event.x;
      this.cursorY = event.y;
    });

    this.canvas.addEventListener("keydown", (event) => {
      switch (event.key) {
        case SPACE_KEY:
          if (this.canPan) return;
          this.canPan = true;
          this.canvas.style.cursor = "grab";
          break;

        case PLUS_KEY:
          if (event.shiftKey) return;
          this.zoom("in");
          break;

        case EQUAL_KEY:
          this.zoom("in");
          break;

        case MINUS_KEY:
          this.zoom("out");
          break;
      }
    });

    this.canvas.addEventListener("keyup", (event) => {
      if (event.key == SPACE_KEY) {
        this.canPan = false;
        this.canvas.style.cursor = "default";
      }
    });

    this.canvas.addEventListener("wheel", (event) => {
      const direction = event.deltaY < 0 ? "in" : "out";
      this.zoom(direction, { ease: false, x: event.x, y: event.y });
    });
  }

  /**
   * Main update step. Call this in your requestAnimationFrame loop.
   */
  step() {
    this.updatePosition();
    this.easeVelocity();
    this.easeScale();
    this.applyTransform();

    this.lastCursorX = this.cursorX;
    this.lastCursorY = this.cursorY;
    this.lastTime = performance.now();
  }

  /**
   * Updates translation values during panning.
   */
  updatePosition() {
    if (!this.isPanning) return;

    this.deltaCursorX = this.cursorX - this.lastCursorX;
    this.deltaCursorY = this.cursorY - this.lastCursorY;
    this.translationX += this.deltaCursorX;
    this.translationY += this.deltaCursorY;
  }

  /**
   * Applies velocity easing when the user stops panning.
   */
  easeVelocity() {
    if (this.isPanning) return;

    const squaredVelocity = this.deltaCursorX ** 2 + this.deltaCursorY ** 2;
    if (squaredVelocity < this.options.velocityThreshold ** 2) return;

    const deltaTime = performance.now() - this.lastTime;
    const timeScaledDecayFactor = Math.pow(
      this.options.decayFactor,
      deltaTime / this.options.decayDuration,
    );

    this.translationX += this.deltaCursorX;
    this.translationY += this.deltaCursorY;
    this.deltaCursorX *= timeScaledDecayFactor;
    this.deltaCursorY *= timeScaledDecayFactor;
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
   * Adjusts translation to maintain screen space position of the scale focal point (scaleX, scaleY).
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
    const newScale = scale;

    this.startScale = oldScale;
    this.easedScale = oldScale;
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
   * Zooms in or out by the configured scale increment.
   *
   * @param {"in" | "out"} direction - Zoom direction.
   * @param {Partial<ScalingOptions>} [options] - Scaling configuration options.
   */
  zoom(direction, options = {}) {
    const oldScale = this.targetScale;
    const newScale =
      direction == "in"
        ? this.options.getNextScale(oldScale)
        : this.options.getPreviousScale(oldScale);

    this.setScale(newScale, options);
  }
}
