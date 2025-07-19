import CanvasControl from "/lib/canvas-control/canvas-control.js";
import InputHandler from "/lib/canvas-control/handlers/base.js";

export default class TouchHandler extends InputHandler {
  /** @type {number} X-coordinate of the center point between two touch points. */
  centroidX;

  /** @type {number} Y-coordinate of the center point between two touch points. */
  centroidY;

  /** @type {number} Distance between two touch points. */
  distance;

  /**
   * @param {CanvasControl} control - CanvasControl object to handle touch inputs for.
   */
  constructor(control) {
    super(control);
  }

  /**
   * Initialises touch event listeners for two-finger gestures.
   */
  init() {
    document.addEventListener("touchstart", (event) => {
      if (event.touches.length != 2) return;

      const [touchA, touchB] = event.touches;
      this.calculateTouchCentroid(touchA, touchB);
      this.control.panStart(this.centroidX, this.centroidY);
      this.distance = this.getTouchDistance(touchA, touchB);
    });

    document.addEventListener("touchend", () => {
      this.control.panEnd();
    });

    document.addEventListener("touchmove", (event) => {
      if (!this.control.isPanning()) return;

      const [touchA, touchB] = event.touches;
      this.calculateTouchCentroid(touchA, touchB);
      this.control.panTo(this.centroidX, this.centroidY);

      const oldDistance = this.distance;
      const newDistance = this.getTouchDistance(touchA, touchB);
      const deltaDistance = newDistance - oldDistance;
      this.distance = newDistance;

      const pinchScaleSensitivity = this.control.options.pinchScaleSensitivity;
      const oldScale = this.control.getScale();
      const newScale = oldScale + deltaDistance * pinchScaleSensitivity;
      this.control.setScale(newScale, {
        ease: false,
        x: this.centroidX,
        y: this.centroidY,
      });
    });
  }

  /**
   * Calculates and stores the center point between two touch points.
   *
   * @param {Touch} touchA - First touch point.
   * @param {Touch} touchB - Second touch point.
   */
  calculateTouchCentroid(touchA, touchB) {
    this.centroidX = (touchA.clientX + touchB.clientX) / 2;
    this.centroidY = (touchA.clientY + touchB.clientY) / 2;
  }

  /**
   * Returns the distance between two touch points.
   *
   * @param {Touch} touchA - First touch point.
   * @param {Touch} touchB - Second touch point.
   * @returns {number} Distance between the two touch points.
   */
  getTouchDistance(touchA, touchB) {
    const vectorX = touchB.clientX - touchA.clientX;
    const vectorY = touchB.clientY - touchA.clientY;

    return Math.sqrt(vectorX ** 2 + vectorY ** 2);
  }
}
