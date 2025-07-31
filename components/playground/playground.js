import CanvasControl from "/lib/canvas-control/canvas-control.js";
import Component from "/components/base.js";
import ImageWidget from "./widgets/image/image-widget.js";
import UploadWidget from "/components/playground/widgets/upload/upload-widget.js";
import WidgetSet from "/components/playground/widgets/widget-set.js";
import store from "/lib/store/store.js";
import { html } from "/lib/utils.js";

export default class Playground extends Component {
  canvas;
  ctx;
  control;
  widgetSet;
  storeClient;

  constructor() {
    super();

    this.canvas = this.root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.control = new CanvasControl(this.canvas, {
      maxScale: store.helpers.getMaxScale(),
      minScale: store.helpers.getMinScale(),
      getNextScale: store.helpers.getNextScale,
      getPreviousScale: store.helpers.getPreviousScale,
    });
    this.widgetSet = new WidgetSet(this.control);
    this.storeClient = store.createClient();

    this.bindMethods();
  }

  bindMethods() {
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.draw = this.draw.bind(this);
  }

  render() {
    return html`<canvas tabindex="0"></canvas>`;
  }

  connectedCallback() {
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);

    this.control.init();
    this.widgetSet.add(UploadWidget);
    this.subscribeToStore();

    this.canvas.focus();
    this.draw();
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeCanvas);
    this.widgetSet.destroy();
    this.storeClient.unsubscribe();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  subscribeToStore() {
    this.storeClient.subscribe("x", (x) => {
      this.control.setUserX(x);
    });

    this.storeClient.subscribe("y", (y) => {
      this.control.setUserY(y);
    });

    this.storeClient.subscribe("scale", (scale) => {
      this.control.setScale(scale);
    });

    this.storeClient.subscribe("image", (image) => {
      createImageBitmap(image).then((bitmap) => {
        store.set("bitmap", bitmap);

        if (image != null && this.widgetSet.has(UploadWidget)) {
          this.widgetSet.remove(UploadWidget);
          this.widgetSet.add(ImageWidget);
        }

        if (image == null && this.widgetSet.has(ImageWidget)) {
          this.widgetSet.remove(ImageWidget);
          this.widgetSet.add(UploadWidget);
        }
      });
    });
  }

  draw() {
    this.clearCanvas();
    this.control.step();
    this.widgetSet.step();
    this.updateStore();

    requestAnimationFrame(this.draw);
  }

  clearCanvas() {
    const transform = this.ctx.getTransform();
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(transform);
  }

  updateStore() {
    this.storeClient.set("x", this.control.getUserX());
    this.storeClient.set("y", this.control.getUserY());
    this.storeClient.set("scale", this.control.getScale());
  }
}

Component.register(Playground, {
  tag: "x-playground",
  path: import.meta.url,
  styles: ["playground.css"],
});
