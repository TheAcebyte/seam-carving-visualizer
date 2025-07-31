/**
 * @typedef {Object} ComponentProperties
 * @property {string} tag - HTML tag of the component. Must contain at least one dash.
 * @property {string} path - Absolute path of the component's definition file.
 * @property {string[]} [styles] - Relative path of one or more external CSS file. Optional.
 */

/**
 * @typedef {typeof Component} ComponentConstructor
 */

export default class Component extends HTMLElement {
  /** @type {Map<string, ComponentProperties>} Component registry */
  static registry = new Map();

  /** @type {ShadowRoot} Shadow root of the component */
  root;

  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });
    this.loadStyles();
    this.root.innerHTML = this.render();
  }

  /**
   * Registers a component's properties and adds it to the list of custom HTML elements.
   *
   * @param {ComponentConstructor} constructor - Constructor of the component. Name must be unique.
   * @param {ComponentProperties} properties - Properties of the component.
   * @example
   * Component.register(CustomComponent, {
   *   tag: "custom-component",
   *   path: import.meta.url,
   *   styles: ["custom-component.css"],
   * }
   */
  static register(constructor, properties) {
    Component.registry.set(constructor.name, properties);
    customElements.define(properties.tag, constructor);
  }

  /**
   * Loads an external CSS file.
   *
   * @param {string} path - Absolute path of the file.
   * @throws {Error} Throws if no CSS file is found.
   */
  async loadStyle(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load CSS file at: ${path}`);
    }

    const css = await response.text();
    const style = document.createElement("style");
    style.textContent = css;
    this.root.appendChild(style);
  }

  /**
   * Loads all of the component's registered styles.
   *
   * @throws {Error} Throws if component is not registered.
   */
  loadStyles() {
    const name = this.constructor.name;
    if (!Component.registry.has(name)) {
      throw new Error("Component has not been registered.");
    }

    const properties = Component.registry.get(name);
    if (!properties.styles) return;

    const basePath = new URL(properties.path).href;
    properties.styles.forEach((relativePath) => {
      const absolutePath = new URL(relativePath, basePath).toString();
      this.loadStyle(absolutePath);
    });
  }

  /**
   * Returns the initial HTML content.
   *
   * @returns {string}
   * @throws {Error} Throws if method is not overriden by subclass.
   */
  render() {
    throw new Error("render() has not been implemented.");
  }
}
