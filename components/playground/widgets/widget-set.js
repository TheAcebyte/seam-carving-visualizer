import CanvasControl from "/lib/canvas-control/canvas-control.js";
import Widget from "/components/playground/widgets/base.js";

/**
 * @typedef {typeof Widget} WidgetConstructor
 */

export default class WidgetSet {
  control;

  /**
   * Internal map storing widget constructors as keys and their singleton instances as values.
   * Ensures only one instance per widget class exists.
   *
   * @type {Map<WidgetConstructor, Widget>}
   */
  map = new Map();

  /**
   * Creates a new WidgetSet for managing unique widget instances.
   *
   * @param {CanvasControl} control - CanvasControl instance.
   */
  constructor(control) {
    this.control = control;
  }

  /**
   * Adds and initialises a new widget instance.
   *
   * @param {WidgetConstructor} WidgetConstructor - Widget class to instantiate.
   * @throws {Error} Throws if the widget already exists.
   */
  add(WidgetConstructor) {
    if (this.map.has(WidgetConstructor)) {
      throw new Error(`Widget of type ${WidgetConstructor.name} already exists.`);
    }

    const widget = new WidgetConstructor(this.control);
    widget.init();
    this.map.set(WidgetConstructor, widget);
  }

  /**
   * Removes and destroys a widget instance from the set.
   *
   * @param {WidgetConstructor} WidgetConstructor - Widget class to remove.
   * @throws {Error} Throws if the widget does not exist.
   */
  remove(WidgetConstructor) {
    if (!this.map.has(WidgetConstructor)) {
      throw new Error(`Widget of type ${WidgetConstructor.name} does not exist.`);
    }

    const widget = this.map.get(WidgetConstructor);
    widget.destroy();
    this.map.delete(WidgetConstructor);
  }

  /**
   * Checks if a widget of the specified class exists.
   *
   * @param {WidgetConstructor} WidgetConstructor - Widget class to check for.
   * @returns {boolean}
   */
  has(WidgetConstructor) {
    return this.map.has(WidgetConstructor);
  }

  /**
   * Returns the widget instance for the specified class.
   *
   * @param {WidgetConstructor} WidgetConstructor - Widget class to retrieve.
   * @returns {Widget}
   * @throws {Error} Throws if widget does not exist.
   */
  get(WidgetConstructor) {
    if (!this.map.has(WidgetConstructor)) {
      throw new Error(`Widget of type ${WidgetConstructor.name} does not exist.`);
    }

    return this.map.get(WidgetConstructor);
  }

  /**
   * Updates and draws all existing widgets in the set each animation frame.
   * Call this in your requestAnimationFrame() loop.
   */
  step() {
    const widgets = this.map.values();
    for (const widget of widgets) {
      widget.step();
    }
  }

  /**
   * Destroys all widgets and clears the set.
   */
  destroy() {
    const widgets = this.map.values();
    for (const widget of widgets) {
      widget.destroy();
    }

    this.map.clear();
  }
}
