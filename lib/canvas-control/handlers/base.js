import CanvasControl from "/lib/canvas-control/canvas-control.js";
import cursorRegistry from "/lib/cursor-registry.js";

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
    this.cursorClient = cursorRegistry.createClient(this.canvas);
  }

  /**
   * Initialises event listeners for this input handler.
   */
  init() {
    throw new Error("init() has not been implemented.");
  }
}
