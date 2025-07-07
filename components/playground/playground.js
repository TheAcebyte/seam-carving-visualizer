import Component from "/components/base.js";
import store from "/lib/store.js";
import { html } from "/lib/utils.js";

const WHEEL_BUTTON = 1;
const SPACE_KEY = " ";

const decayFactor = 0.85;
const decayDuration = 25;
const deltaThreshold = 0.5;

export default class Playground extends Component {
  canvas;
  ctx;

  canPan = false;
  isPanning = false;

  lastTimestamp = 0;
  mouseX = 0;
  mouseY = 0;
  lastX = 0;
  lastY = 0;
  deltaX = 0;
  deltaY = 0;

  constructor() {
    super();

    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.draw = this.draw.bind(this);
  }

  render() {
    return html`<canvas tabindex="0" />`;
  }

  connectedCallback() {
    this.attachListeners();
    window.addEventListener("resize", this.resizeCanvas);

    this.canvas.focus();
    this.resizeCanvas();
    this.draw();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeCanvas);
  }

  draw() {
    this.clearCanvas();
    if (this.isPanning) this.updatePosition();
    if (!this.isPanning) this.ease();

    const x = store.get("x");
    const y = store.get("y");
    this.ctx.setTransform(1, 0, 0, 1, x, y);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, 100, 100);

    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.draw);
  }

  updatePosition() {
    this.deltaX = this.mouseX - this.lastX;
    this.deltaY = this.mouseY - this.lastY;
    store.set("x", (x) => x + this.deltaX);
    store.set("y", (y) => y + this.deltaY);
    this.lastX = this.mouseX;
    this.lastY = this.mouseY;
  }

  ease() {
    if (this.deltaX ** 2 + this.deltaY ** 2 <= deltaThreshold ** 2) return;

    const deltaTime = performance.now() - this.lastTimestamp;
    const timeScaledDecayFactor = Math.pow(
      decayFactor,
      deltaTime / decayDuration,
    );

    store.set("x", (x) => x + this.deltaX);
    this.deltaX *= timeScaledDecayFactor;

    store.set("y", (y) => y + this.deltaY);
    this.deltaY *= timeScaledDecayFactor;
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clearCanvas() {
    const transform = this.ctx.getTransform();
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(transform);
  }

  attachListeners() {
    this.canvas.addEventListener("mousedown", (event) => {
      if (this.canPan || event.button == WHEEL_BUTTON) {
        this.isPanning = true;
        this.lastX = event.x;
        this.lastY = event.y;
        this.mouseX = event.x;
        this.mouseY = event.y;
        this.canvas.style.cursor = "grabbing";
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.canvas.style.cursor = this.canPan ? "grab" : "default";
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.isPanning) {
        this.mouseX = event.x;
        this.mouseY = event.y;
      }
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
  }
}

Component.register(Playground, {
  tag: "c-playground",
  path: import.meta.url,
  styles: ["playground.css"],
});
