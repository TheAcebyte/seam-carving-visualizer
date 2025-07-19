import CanvasControl from "/lib/canvas-control/canvas-control.js";
import Component from "/components/base.js";
import UploadAreaDrawer from "/components/playground/upload-area-drawer.js";
import cursorRegistry from "/lib/cursor-registry.js";
import store from "/lib/store/store.js";
import { html } from "/lib/utils.js";

export default class Playground extends Component {
  canvas;
  ctx;
  client;

  mouseX = 0;
  mouseY = 0;

  constructor() {
    super();

    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.client = store.createClient();
    this.control = new CanvasControl(this.canvas, {
      maxScale: store.helpers.getMaxScale(),
      minScale: store.helpers.getMinScale(),
      getNextScale: store.helpers.getNextScale,
      getPreviousScale: store.helpers.getPreviousScale,
    });
    this.upload = new UploadAreaDrawer(this.canvas);

    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.draw = this.draw.bind(this);
  }

  render() {
    return html`<canvas tabindex="0" />`;
  }

  connectedCallback() {
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
    this.setupListeners();
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
    this.checkHovers();
    this.upload.draw();

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

  setupListeners() {
    this.canvas.addEventListener("mousemove", (event) => {
      this.mouseX = event.x;
      this.mouseY = event.y;
    });
  }

  checkHovers() {
    const worldPoint = this.control.getWorldCoordinates(this.mouseX, this.mouseY);
    const worldX = worldPoint.x;
    const worldY = worldPoint.y;

    const iconCircle = this.upload.getIconCircle();
    const hoveringIcon = iconCircle.containsPoint(worldX, worldY);
    if (hoveringIcon) this.upload.hoverIcon();
    if (!hoveringIcon) this.upload.unhoverIcon();

    const linkRectangle = this.upload.getLinkRectangle();
    const hoveringLink = linkRectangle.containsPoint(worldX, worldY);
    if (hoveringLink) this.upload.hoverLink();
    if (!hoveringLink) this.upload.unhoverLink();
  }
}

Component.register(Playground, {
  tag: "c-playground",
  path: import.meta.url,
  styles: ["playground.css"],
});
