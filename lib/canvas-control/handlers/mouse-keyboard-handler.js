import CanvasControl from "/lib/canvas-control/canvas-control.js";
import InputHandler from "/lib/canvas-control/handlers/base.js";

const WHEEL_BUTTON = 1;
const SPACE_KEY = " ";
const PLUS_KEY = "+";
const MINUS_KEY = "-";
const EQUAL_KEY = "=";

export default class MouseKeyboardHandler extends InputHandler {
  canPan = false;

  /**
   * @param {CanvasControl} control - CanvasControl object to handle mouse and keyboard inputs for.
   */
  constructor(control) {
    super(control);
  }

  /**
   * Initialises event listeners for mouse and keyboard inputs.
   */
  init() {
    this.canvas.addEventListener("mousedown", (event) => {
      if (this.canPan || event.button == WHEEL_BUTTON) {
        this.control.panStart(event.x, event.y);
        this.canvas.style.cursor = "grabbing";
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.control.panEnd();
      this.canvas.style.cursor = this.canPan ? "grab" : "default";
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (!this.control.isPanning) return;
      this.control.panTo(event.x, event.y);
    });

    this.canvas.addEventListener("keypress", (event) => {
      switch (event.key) {
        case SPACE_KEY:
          if (this.canPan) return;
          this.canPan = true;
          this.canvas.style.cursor = "grab";
          break;

        case PLUS_KEY:
          if (event.shiftKey) return;
          this.control.zoomIn();
          break;

        case EQUAL_KEY:
          this.control.zoomIn();
          break;

        case MINUS_KEY:
          this.control.zoomOut();
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
      const options = { ease: false, x: event.x, y: event.y };
      if (direction == "in") this.control.zoomIn(options);
      if (direction == "out") this.control.zoomOut(options);
    });
  }
}
