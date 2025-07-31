import cursorManager from "/lib/cursor-manager.js";
import { Upload } from "lucide";
import { getCSSVariable } from "/lib/utils.js";

const config = {
  outline: {
    width: 450,
    height: 275,
    borderWidth: 2,
    borderRadius: 8,
    color: getCSSVariable("--outline"),
    hoverColor: getCSSVariable("--fg-primary"),
  },
  icon: {
    size: 24,
    lineWidth: 2,
    color: getCSSVariable("--fg-secondary"),
    hoverColor: getCSSVariable("--fg-primary"),
    paths: Upload.map((part) => {
      const rawPath = part[1].d;
      return new Path2D(rawPath);
    }),
    container: {
      radius: 24,
      borderWidth: 1,
      color: getCSSVariable("--bg-secondary"),
      hoverColor: getCSSVariable("--bg-tertiary"),
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
  get height() {
    return (
      2 * config.icon.container.radius +
      config.title.marginTop +
      2 * config.typography.lineHeight
    );
  },
};

export default config;
