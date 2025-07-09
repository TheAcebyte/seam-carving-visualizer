const WHEEL_BUTTON = 1;
const SPACE_KEY = " ";

/**
 * @typedef {Object} Point
 * @property {number} x - Point's X-coordinate.
 * @property {number} y - Point's Y-coordinate.
 */

/**
 * @callback ScaleGetter
 * @param {number} [scale] - Current scale value.
 * @returns {number} Next or previous scale value.
 */

/**
 * @typedef {Object} ControlOptions
 * @property {number} decayFactor - Velocity decay multiplier.
 * @property {number} decayDuration - Decay factor application interval (ms).
 * @property {number} velocityThreshold - Minimum velocity required for easing momentum.
 * @property {ScaleGetter} getNextScale - Function that returns the next scale value.
 * @property {ScaleGetter} getPreviousScale - Functions that returns the previous scale value.
 */

/** @type {ControlOptions} */
const defaultOptions = {
  decayFactor: 0.85,
  decayDuration: 25,
  velocityThreshold: 0.5,
  getNextScale: (scale) => scale * 2,
  getPreviousScale: (scale) => scale / 2,
};

export default class CanvasControl {
  canvas;
  ctx;

  /** @type {ControlOptions} */
  options;

  tx = 0;
  ty = 0;
  scale = 1;

  canPan = false;
  isPanning = false;
  initialCenterX = 0;
  initialCenterY = 0;

  // c = cursor, l = last, d = delta, t = timestamp
  cx = 0;
  cy = 0;
  lcx = 0;
  lcy = 0;
  dcx = 0;
  dcy = 0;
  lt = 0;

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
        this.lcx = event.x;
        this.lcy = event.y;
        this.cx = event.x;
        this.cy = event.y;
        this.canvas.style.cursor = "grabbing";
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.canvas.style.cursor = this.canPan ? "grab" : "default";
    });

    this.canvas.addEventListener("mousemove", (event) => {
      this.cx = event.x;
      this.cy = event.y;
    });

    this.canvas.addEventListener("keypress", (event) => {
      if (event.key == SPACE_KEY && !this.canPan) {
        this.canPan = true;
        this.canvas.style.cursor = "grab";
      }
    });

    this.canvas.addEventListener("keyup", (event) => {
      if (event.key == SPACE_KEY) {
        this.canPan = false;
        this.canvas.style.cursor = "default";
      }
    });

    this.canvas.addEventListener("wheel", (event) => {
      const mode = event.deltaY < 0 ? "in" : "out";
      this.zoom(mode, event.x, event.y);
    });
  }

  /**
   * Main update step. Call this in your requestAnimationFrame loop.
   */
  step() {
    if (this.isPanning) this.updatePosition();
    if (!this.isPanning) this.ease();
    this.applyTransform();

    this.lcx = this.cx;
    this.lcy = this.cy;
    this.lt = performance.now();
  }

  /**
   * Updates translation values during panning.
   */
  updatePosition() {
    this.dcx = this.cx - this.lcx;
    this.dcy = this.cy - this.lcy;
    this.tx += this.dcx;
    this.ty += this.dcy;
  }

  /**
   * Applies momentum easing when the user stops panning.
   */
  ease() {
    const squaredVelocity = this.dcx ** 2 + this.dcy ** 2;
    if (squaredVelocity < this.options.velocityThreshold ** 2) return;

    const deltaTime = performance.now() - this.lt;
    const timeScaledDecayFactor = Math.pow(
      this.options.decayFactor,
      deltaTime / this.options.decayDuration,
    );

    this.tx += this.dcx;
    this.ty += this.dcy;
    this.dcx *= timeScaledDecayFactor;
    this.dcy *= timeScaledDecayFactor;
  }

  /**
   * Zooms in or out at the specified cursor position.
   * By default, zoom takes place at the center of the screen.
   *
   * @param {"in" | "out"} mode - Zoom direction.
   * @param {number} [cursorX] - X-coordinate to zoom at. Optional.
   * @param {number} [cursorY] - Y-coordinate to zoom at. Optional.
   */
  zoom(mode, cursorX, cursorY) {
    const centerX = this.canvas.width >> 1;
    const centerY = this.canvas.height >> 1;
    const zoomX = cursorX || centerX;
    const zoomY = cursorY || centerY;

    const oldScale = this.scale;
    if (mode == "in") this.scale = this.options.getNextScale(oldScale);
    if (mode == "out") this.scale = this.options.getPreviousScale(oldScale);

    // Adjusting the translation values
    const zoomPoint = new DOMPoint(zoomX, zoomY);
    const inverseTransform = this.ctx.getTransform().invertSelf();
    const worldZoomPoint = inverseTransform.transformPoint(zoomPoint);
    this.tx = zoomX - this.initialCenterX - this.scale * worldZoomPoint.x;
    this.ty = zoomY - this.initialCenterY - this.scale * worldZoomPoint.y;
  }

  /**
   * Applies the transformation matrix to the canvas.
   */
  applyTransform() {
    this.ctx.setTransform(
      this.scale,
      0,
      0,
      this.scale,
      this.tx + this.initialCenterX,
      this.ty + this.initialCenterY,
    );
  }

  /**
   * Returns user X-coordinate with positive axis extending right.
   */
  getUserX() {
    return -this.tx / this.scale;
  }

  /**
   * Sets X-translation value from user X-coordinate.
   *
   * @param {number} x - User X-coordinate.
   */
  setUserX(x) {
    this.tx = -x * this.scale;
  }

  /**
   * Returns user Y-coordinate with positive axis extending down.
   */
  getUserY() {
    return -this.ty / this.scale;
  }

  /**
   * Sets Y-translation value from user Y-coordinate.
   *
   * @param {number} y - User Y-coordinate.
   */
  setUserY(y) {
    this.ty = -y * this.scale;
  }

  /**
   * Returns scale value.
   */
  getScale() {
    return this.scale;
  }

  /**
   * Sets new scale value.
   *
   * @param {number} scale - New scale value.
   */
  setScale(scale) {
    this.scale = scale;
  }
}
