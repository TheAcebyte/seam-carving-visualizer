import CanvasControl from "/lib/canvas-control.js";
import Component from "/components/base.js";
import store from "/lib/store.js";
import { html } from "/lib/utils.js";

export default class Playground extends Component {
  canvas;
  ctx;
  client;
  control;

  constructor() {
    super();

    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.client = store.createClient();
    this.control = new CanvasControl(this.canvas, {
      getNextScale: store.helpers.scaleUp,
      getPreviousScale: store.helpers.scaleDown,
    });

    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.draw = this.draw.bind(this);
  }

  render() {
    return html`<canvas tabindex="0" />`;
  }

  connectedCallback() {
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
    this.subscribe();
    this.control.init();
    this.canvas.focus();
    this.draw();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeCanvas);
    this.client.dispose();
  }

  draw() {
    this.clearCanvas();
    this.control.step();
    this.updateStore();

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(-50, -50, 100, 100);

    requestAnimationFrame(this.draw);
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

  updateStore() {
    this.client.set("x", this.control.getUserX());
    this.client.set("y", this.control.getUserY());
    this.client.set("scale", this.control.getScale());
  }

  subscribe() {
    this.client.subscribe("x", (x) => this.control.setUserX(x));
    this.client.subscribe("y", (y) => this.control.setUserY(y));
    this.client.subscribe("scale", (scale) => this.control.setScale(scale));
  }
}

Component.register(Playground, {
  tag: "c-playground",
  path: import.meta.url,
  styles: ["playground.css"],
});
