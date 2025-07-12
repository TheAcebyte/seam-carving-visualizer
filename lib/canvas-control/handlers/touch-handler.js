import CanvasControl from "/lib/canvas-control/canvas-control.js";
import InputHandler from "/lib/canvas-control/handlers/base.js";

export default class TouchHandler extends InputHandler {
  /** @type {number} */
  centroidX;

  /** @type {number} */
  centroidY;

  /** @type {number} */
  distance;

  /**
   * @param {CanvasControl} control
   */
  constructor(control) {
    super(control);
  }

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
      if (!this.control.isPanning) return;

      const [touchA, touchB] = event.touches;
      this.calculateTouchCentroid(touchA, touchB);
      this.control.panTo(this.centroidX, this.centroidY);

      const oldDistance = this.distance;
      const newDistance = this.getTouchDistance(touchA, touchB);
      const deltaDistance = newDistance - oldDistance;
      this.distance = newDistance;

      const touchScaleSensitivity = this.control.options.touchScaleSensitivity;
      const oldScale = this.control.getScale();
      const newScale = oldScale + deltaDistance * touchScaleSensitivity;
      this.control.setScale(newScale, {
        ease: false,
        x: this.centroidX,
        y: this.centroidY,
      });
    });
  }

  /**
   * @param {Touch} touchA
   * @param {Touch} touchB
   */
  calculateTouchCentroid(touchA, touchB) {
    this.centroidX = (touchA.clientX + touchB.clientX) / 2;
    this.centroidY = (touchA.clientY + touchB.clientY) / 2;
  }

  /**
   * @param {Touch} touchA
   * @param {Touch} touchB
   * @returns {number}
   */
  getTouchDistance(touchA, touchB) {
    const vectorX = touchB.clientX - touchA.clientX;
    const vectorY = touchB.clientY - touchA.clientY;

    return Math.sqrt(vectorX ** 2 + vectorY ** 2);
  }
}
