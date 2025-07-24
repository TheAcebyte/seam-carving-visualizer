import CanvasControl from "/lib/canvas-control/canvas-control.js";
import cursorManager from "/lib/cursor-manager.js";

export default class InputHandler {
  control;
  canvas;
  cursorClient;

  /**
   * Creates a new input handler for the given CanvasControl object.
   *
   * @param {CanvasControl} control - CanvasControl instance to handle input for.
   */
  constructor(control) {
    this.control = control;
    this.canvas = control.getCanvas();
    this.cursorClient = cursorManager.createClient(this.canvas);
  }

  /**
   * Initialises event listeners for this input handler.
   */
  init() {
    throw new Error("init() has not been implemented.");
  }
}
