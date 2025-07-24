import Circle from "/lib/shapes/circle.js";
import ColorAnimator from "/lib/animator/color-animator.js";
import Rectangle from "/lib/shapes/rectangle.js";
import cursorManager from "/lib/cursor-manager.js";
import { Upload } from "lucide";
import { getCSSVariable } from "/lib/utils.js";

const config = {
  outline: {
    width: 450,
    height: 275,
    color: getCSSVariable("--outline"),
    borderRadius: 8,
  },
  icon: {
    size: 24,
    color: getCSSVariable("--fg-secondary"),
    hoverColor: getCSSVariable("--fg-primary"),
    paths: Upload.map((part) => {
      const rawPath = part[1].d;
      return new Path2D(rawPath);
    }),
    container: {
      radius: 24,
      color: getCSSVariable("--bg-secondary"),
      hoverColor: getCSSVariable("--bg-tertiary"),
      borderWidth: 1,
      borderColor: getCSSVariable("--outline"),
    },
  },
  typography: {
    /** @type {CanvasTextBaseline} */
    baseline: "bottom",
    lineHeight: 24,
  },
  title: {
    text: "Upload your image",
    font: "500 16px Inter",
    color: getCSSVariable("--fg-primary"),
    marginTop: 8,
  },
  subtitle: {
    font: "16px Inter",
    color: getCSSVariable("--fg-secondary"),
    prefix: {
      text: "Drag-and-drop or ",
    },
    link: {
      text: "browse from your device",
      underlineThickness: 1,
      hoverColor: getCSSVariable("--fg-primary"),
    },
    get text() {
      return config.subtitle.prefix.text + config.subtitle.link.text;
    },
  },
  widget: {
    get height() {
      return (
        2 * config.icon.container.radius +
        config.title.marginTop +
        2 * config.typography.lineHeight
      );
    },
  },
};

export default class UploadAreaDrawer {
  canvas;
  ctx;
  cursorClient;

  /** @type {Circle} */
  iconCircle;
  iconColorAnimator;
  iconContainerColorAnimator;
  hoveringIcon = false;

  /** @type {Rectangle} */
  linkRectangle;
  linkColorAnimator;
  hoveringLink = false;

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cursorClient = cursorManager.createClient(canvas);

    this.createIconCircle();
    this.createLinkRectangle();

    const options = { duration: 100 };
    this.iconColorAnimator = new ColorAnimator(config.icon.color, options);
    this.iconContainerColorAnimator = new ColorAnimator(
      config.icon.container.color,
      options,
    );
    this.linkColorAnimator = new ColorAnimator(config.subtitle.color, options);
  }

  createIconCircle() {
    const x = 0;
    const y = config.icon.container.radius - config.widget.height / 2;
    const radius = config.icon.container.radius;

    this.iconCircle = new Circle(x, y, radius);
  }

  getIconCircle() {
    return this.iconCircle;
  }

  createLinkRectangle() {
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
      config.widget.height / 2;
    const linkHeight = subtitleHeight + config.subtitle.link.underlineThickness;

    this.linkRectangle = new Rectangle(linkX, linkY, linkWidth, linkHeight);
  }

  getLinkRectangle() {
    return this.linkRectangle;
  }

  draw() {
    this.iconColorAnimator.step();
    this.iconContainerColorAnimator.step();
    this.linkColorAnimator.step();

    this.drawOutline();
    this.drawIcon();
    this.drawTitle();
    this.drawSubtitle();
  }

  drawOutline() {
    const x = -config.outline.width / 2;
    const y = -config.outline.height / 2;
    const width = config.outline.width;
    const height = config.outline.height;
    const radius = config.outline.borderRadius;

    this.ctx.strokeStyle = config.outline.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.stroke();
  }

  drawIcon() {
    const outerCircleX = 0;
    const outerCircleY =
      config.icon.container.radius - config.widget.height / 2;
    const outerCircleRadius = config.icon.container.radius;

    this.ctx.fillStyle = config.icon.container.borderColor;
    this.ctx.beginPath();
    this.ctx.arc(outerCircleX, outerCircleY, outerCircleRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    const innerCircleX = 0;
    const innerCircleY =
      config.icon.container.radius - config.widget.height / 2;
    const innerCircleRadius =
      config.icon.container.radius - config.icon.container.borderWidth;

    this.ctx.fillStyle = this.iconContainerColorAnimator.getValue();
    this.ctx.beginPath();
    this.ctx.arc(innerCircleX, innerCircleY, innerCircleRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    const iconX = -config.icon.size / 2;
    const iconY =
      config.icon.container.radius -
      config.icon.size / 2 -
      config.widget.height / 2;

    this.ctx.translate(iconX, iconY);
    this.ctx.strokeStyle = this.iconColorAnimator.getValue();
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
      config.widget.height / 2;

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
      config.widget.height / 2;

    const prefixText = config.subtitle.prefix.text;
    const prefixX = -subtitleWidth / 2;
    const prefixY = subtitleY;

    this.ctx.fillText(prefixText, prefixX, prefixY);

    const linkText = config.subtitle.link.text;
    const linkWidth = this.ctx.measureText(linkText).width;
    const linkX = -subtitleWidth / 2 + subtitleWidth - linkWidth;
    const linkY = subtitleY;

    this.ctx.fillStyle = this.linkColorAnimator.getValue();
    this.ctx.fillText(linkText, linkX, linkY);

    const underlineX = linkX;
    const underlineY = subtitleY;
    const underlineWidth = linkWidth;
    const underlineHeight = config.subtitle.link.underlineThickness;

    this.ctx.fillRect(underlineX, underlineY, underlineWidth, underlineHeight);
  }

  hoverIcon() {
    if (this.hoveringIcon) return;

    this.hoveringIcon = true;
    this.iconColorAnimator.setTarget(config.icon.hoverColor);
    this.iconContainerColorAnimator.setTarget(config.icon.container.hoverColor);
    this.cursorClient.add("pointer");
  }

  unhoverIcon() {
    if (!this.hoveringIcon) return;

    this.hoveringIcon = false;
    this.iconColorAnimator.setTarget(config.icon.color);
    this.iconContainerColorAnimator.setTarget(config.icon.container.color);
    this.cursorClient.remove("pointer");
  }

  hoverLink() {
    if (this.hoveringLink) return;

    this.hoveringLink = true;
    this.linkColorAnimator.setTarget(config.subtitle.link.hoverColor);
    this.cursorClient.add("pointer");
  }

  unhoverLink() {
    if (!this.hoveringLink) return;

    this.hoveringLink = false;
    this.linkColorAnimator.setTarget(config.subtitle.color);
    this.cursorClient.remove("pointer");
  }
}
