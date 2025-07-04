import Component from "/components/base.js";
import { html } from "/lib/utils.js";

export default class Playground extends Component {
  /** @type {HTMLCanvasElement} */
  canvas;

  /** @type {CanvasRenderingContext2D} */
  ctx;

  constructor() {
    super();

    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas = this.resizeCanvas.bind(this);
  }

  render() {
    return html`<canvas />`;
  }

  connectedCallback() {
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeCanvas);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}

Component.register(Playground, {
  tag: "c-playground",
  path: import.meta.url,
  styles: ["playground.css"],
});
