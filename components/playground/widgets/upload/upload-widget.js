import CanvasControl from "/lib/canvas-control/canvas-control.js";
import Circle from "/lib/shapes/circle.js";
import Rectangle from "/lib/shapes/rectangle.js";
import Widget from "/components/playground/widgets/base.js";
import config from "/components/playground/widgets/upload/config.js";
import store from "/lib/store/store.js";
import toastEvent from "/lib/events/toast-event.js";
import { isImageFile, decodeImageFile } from "/lib/utils.js";

export default class UploadWidget extends Widget {
  /** @type {HTMLInputElement} */
  input;

  /**
   * @param {CanvasControl} control
   */
  constructor(control) {
    super(control);

    this.createInput();
    this.bindMethods();
  }

  createInput() {
    this.input = document.createElement("input");
    this.input.setAttribute("type", "file");
    this.input.setAttribute("accept", "image/*");
    this.input.style.display = "none";
    this.canvas.after(this.input);
  }

  bindMethods() {
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  onInit() {
    this.setupOutline();
    this.setupIcon();
    this.setupLink();
    this.attachEventListeners();
  }

  onStep() {
    this.drawOutline();
    this.drawIcon();
    this.drawTitle();
    this.drawSubtitle();
  }

  onDestroy() {
    this.input.remove();
    this.cleanupEventListeners();
  }

  setupOutline() {
    this.addColor("outline", config.outline.color);
  }

  setupIcon() {
    this.addColor("icon", config.icon.color);
    this.addColor("icon-container", config.icon.container.color);

    const x = 0;
    const y = config.icon.container.radius - config.height / 2;
    const radius = config.icon.container.radius;

    const bounds = new Circle(x, y, radius);
    const interactable = this.addInteractable("icon", bounds);

    interactable.addEventListener("enter", () => {
      this.setColor("icon", config.icon.hoverColor);
      this.setColor("icon-container", config.icon.container.hoverColor);
      this.cursorClient.add("pointer");
    });

    interactable.addEventListener("leave", () => {
      this.setColor("icon", config.icon.color);
      this.setColor("icon-container", config.icon.container.color);
      this.cursorClient.remove("pointer");
    });

    interactable.addEventListener("click", () => {
      this.input.click();
    });
  }

  setupLink() {
    this.addColor("link", config.subtitle.color);

    this.ctx.font = config.subtitle.font;
    const subtitleText = config.subtitle.text;
    const subtitleMeasures = this.ctx.measureText(subtitleText);
    const subtitleWidth = subtitleMeasures.width;
    const subtitleHeight =
      subtitleMeasures.actualBoundingBoxAscent +
      subtitleMeasures.actualBoundingBoxDescent;

    const linkText = config.subtitle.link.text;
    const linkWidth = this.ctx.measureText(linkText).width;
    const linkX = -subtitleWidth / 2 + subtitleWidth - linkWidth;
    const linkY =
      2 * config.icon.container.radius +
      config.title.marginTop +
      2 * config.typography.lineHeight -
      subtitleHeight -
      config.height / 2;
    const linkHeight = subtitleHeight + config.subtitle.link.underlineThickness;

    const bounds = new Rectangle(linkX, linkY, linkWidth, linkHeight);
    const interactable = this.addInteractable("link", bounds);

    interactable.addEventListener("enter", () => {
      this.setColor("link", config.subtitle.link.hoverColor);
      this.cursorClient.add("pointer");
    });

    interactable.addEventListener("leave", () => {
      this.setColor("link", config.subtitle.color);
      this.cursorClient.remove("pointer");
    });

    interactable.addEventListener("click", () => {
      this.input.click();
    });
  }

  attachEventListeners() {
    this.input.addEventListener("change", this.handleInputChange);
    document.addEventListener("dragenter", this.handleDragEnter);
    document.addEventListener("dragleave", this.handleDragLeave);
    document.addEventListener("dragover", this.handleDragOver);
    document.addEventListener("drop", this.handleDrop);
  }

  handleInputChange() {
    const imageFile = this.input.files[0];

    decodeImageFile(imageFile)
      .then((image) => store.set("image", image))
      .catch((error) => console.error(error));
  }

  handleDragEnter() {
    this.setColor("outline", config.outline.hoverColor);
  }

  handleDragLeave() {
    this.setColor("outline", config.outline.color);
  }

  /** @param {DragEvent} event */
  handleDragOver(event) {
    event.preventDefault();
  }

  /** @param {DragEvent} event */
  handleDrop(event) {
    event.preventDefault();
    this.setColor("outline", config.outline.color);

    const files = event.dataTransfer.files;
    /** @type {File | null} */
    let imageFile = null;

    for (const file of files) {
      if (isImageFile(file)) {
        imageFile = file;
        break;
      }
    }

    if (!imageFile) {
      toastEvent.emit({
        status: "error",
        message: "Please select an image file (PNG, JPG, WEBP...)",
      });
      return;
    }

    decodeImageFile(imageFile)
      .then((image) => store.set("image", image))
      .catch((error) => console.error(error));
  }

  drawOutline() {
    const x = -config.outline.width / 2;
    const y = -config.outline.height / 2;
    const width = config.outline.width;
    const height = config.outline.height;
    const radius = config.outline.borderRadius;

    this.ctx.strokeStyle = this.getColor("outline");
    this.ctx.lineWidth = config.outline.borderWidth;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.stroke();
  }

  drawIcon() {
    const outerCircleX = 0;
    const outerCircleY = config.icon.container.radius - config.height / 2;
    const outerCircleRadius = config.icon.container.radius;

    this.ctx.fillStyle = config.icon.container.borderColor;
    this.ctx.beginPath();
    this.ctx.arc(outerCircleX, outerCircleY, outerCircleRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    const innerCircleX = 0;
    const innerCircleY = config.icon.container.radius - config.height / 2;
    const innerCircleRadius =
      config.icon.container.radius - config.icon.container.borderWidth;

    this.ctx.fillStyle = this.getColor("icon-container");
    this.ctx.beginPath();
    this.ctx.arc(innerCircleX, innerCircleY, innerCircleRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    const iconX = -config.icon.size / 2;
    const iconY =
      config.icon.container.radius - config.icon.size / 2 - config.height / 2;

    this.ctx.strokeStyle = this.getColor("icon");
    this.ctx.lineWidth = config.icon.lineWidth;
    this.ctx.translate(iconX, iconY);
    for (const path of config.icon.paths) {
      this.ctx.stroke(path);
    }
    this.ctx.translate(-iconX, -iconY);
  }

  drawTitle() {
    this.ctx.textBaseline = config.typography.baseline;
    this.ctx.font = config.title.font;
    this.ctx.fillStyle = config.title.color;

    const text = config.title.text;
    const width = this.ctx.measureText(text).width;
    const x = -width / 2;
    const y =
      2 * config.icon.container.radius +
      config.title.marginTop +
      config.typography.lineHeight -
      config.height / 2;

    this.ctx.fillText(text, x, y);
  }

  drawSubtitle() {
    this.ctx.textBaseline = config.typography.baseline;
    this.ctx.font = config.subtitle.font;
    this.ctx.fillStyle = config.subtitle.color;

    const subtitleText = config.subtitle.text;
    const subtitleWidth = this.ctx.measureText(subtitleText).width;
    const subtitleY =
      2 * config.icon.container.radius +
      config.title.marginTop +
      2 * config.typography.lineHeight -
      config.height / 2;

    const prefixText = config.subtitle.prefix.text;
    const prefixX = -subtitleWidth / 2;
    const prefixY = subtitleY;

    this.ctx.fillText(prefixText, prefixX, prefixY);

    const linkText = config.subtitle.link.text;
    const linkWidth = this.ctx.measureText(linkText).width;
    const linkX = -subtitleWidth / 2 + subtitleWidth - linkWidth;
    const linkY = subtitleY;

    this.ctx.fillStyle = this.getColor("link");
    this.ctx.fillText(linkText, linkX, linkY);

    const underlineX = linkX;
    const underlineY = subtitleY;
    const underlineWidth = linkWidth;
    const underlineHeight = config.subtitle.link.underlineThickness;

    this.ctx.fillRect(underlineX, underlineY, underlineWidth, underlineHeight);
  }

  cleanupEventListeners() {
    document.removeEventListener("dragenter", this.handleDragEnter);
    document.removeEventListener("dragleave", this.handleDragLeave);
    document.removeEventListener("dragover", this.handleDragOver);
    document.removeEventListener("drop", this.handleDrop);
  }
}
