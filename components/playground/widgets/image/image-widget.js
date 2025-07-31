import CanvasControl from "/lib/canvas-control/canvas-control.js";
import Widget from "/components/playground/widgets/base.js";
import store from "/lib/store/store.js";

export default class ImageWidget extends Widget {
  /** @type {number} */
  initialOffsetX;

  /** @type {number} */
  initialOffsetY;

  /**
   * @param {CanvasControl} control
   */
  constructor(control) {
    super(control);

    this.calculateInitialOffset();
  }

  calculateInitialOffset() {
    const image = store.get("image");
    this.initialOffsetX = -image.width / 2;
    this.initialOffsetY = -image.height / 2;
  }

  onStep() {
    this.drawImage();
  }

  drawImage() {
    const bitmap = store.get("bitmap");
    this.ctx.drawImage(bitmap, this.initialOffsetX, this.initialOffsetY);
  }
}
