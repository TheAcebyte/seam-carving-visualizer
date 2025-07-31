import CanvasControl from "/lib/canvas-control/canvas-control.js";
import ColorAnimator from "/lib/animator/color-animator.js";
import Shape from "/lib/shapes/base.js";
import cursorManager from "/lib/cursor-manager.js";
import pointerTracker from "/lib/pointer-tracker.js";

/** @import { AnimatorOptions } from "/lib/animator/animator.js" */

export default class Widget {
  control;
  canvas;
  ctx;
  cursorClient;

  /** @type {Map<string, ColorAnimator>} */
  colors = new Map();

  /** @type {Map<string, Interactable>} */
  interactables = new Map();

  /**
   * Creates a new widget instance for the specified canvas element.
   *
   * @param {CanvasControl} control - CanvasControl instance.
   */
  constructor(control) {
    this.control = control;
    this.canvas = control.getCanvas();
    this.ctx = control.getContext();
    this.cursorClient = cursorManager.createClient(this.canvas);
  }

  /**
   * Initialises the widget's event listeners and subscriptions.
   */
  init() {
    this.onInit();
  }

  /**
   * Updates and draws the widget every animation frame.
   * Call this in your requestAnimationFrame() loop.
   */
  step() {
    const colors = this.colors.values();
    for (const color of colors) {
      color.step();
    }

    this.onStep();
  }

  /**
   * Destroys the widget by cleaning up event listeners and subscriptions.
   */
  destroy() {
    const interactables = this.interactables.values();
    for (const interactable of interactables) {
      interactable.cleanupEventListeners();
    }

    this.cursorClient.cleanup();
    this.onDestroy();
  }

  /**
   * Lifecycle method for widget initialisation.
   */
  onInit() { }

  /**
   * Lifecycle method for widget updates.
   */
  onStep() { }

  /**
   * Lifecycle method for widget cleanups.
   */
  onDestroy() { }

  /**
   * Adds a new ColorAnimator with the specified key and initial color.
   *
   * @param {string} key - Unique color identifier.
   * @param {string} color - Initial color value in hexadecimal.
   * @param {Partial<AnimatorOptions>} options - Animator options. Optional.
   * @throws {Error} Throws if the specified key is already taken.
   */
  addColor(key, color, options = { duration: 100 }) {
    if (this.colors.has(key)) {
      throw new Error(`Color key ${key} is already taken.`);
    }

    const animator = new ColorAnimator(color, options);
    this.colors.set(key, animator);
  }

  /**
   * Sets the target color for an existing ColorAnimator.
   *
   * @param {string} key - Color identifier.
   * @param {string} color - New color value in hexadecimal.
   * @throws {Error} Throws if the specified key does not exist.
   */
  setColor(key, color) {
    if (!this.colors.has(key)) {
      throw new Error(`Color key ${key} does not exist.`);
    }

    const animator = this.colors.get(key);
    animator.setTarget(color);
  }

  /**
   * Returns the current color value of an existing ColorAnimator.
   *
   * @param {string} key - Color identifier.
   * @returns {string} - Color value in hexadecimal.
   * @throws {Error} Throws if the specified key does not exist.
   */
  getColor(key) {
    if (!this.colors.has(key)) {
      throw new Error(`Color key ${key} does not exist.`);
    }

    const animator = this.colors.get(key);
    const color = animator.getValue();
    return color;
  }

  /**
   * Adds a new interactive area with the specified bounds.
   *
   * @param {string} key - Unique identifier for the Interactable.
   * @param {Shape} bounds - Shape defining the Interactable's bounds.
   * @returns {Interactable} Created Interactable instance.
   * @throws {Error} Throws if the specified key is already taken.
   */
  addInteractable(key, bounds) {
    if (this.interactables.has(key)) {
      throw new Error(`Interactable key ${key} is already taken.`);
    }

    const interactable = new Interactable(this.control, bounds);
    this.interactables.set(key, interactable);
    return interactable;
  }

  /**
   * Returns an existing Interactable by its key.
   *
   * @param {string} key - Interactable identifier.
   * @returns {Interactable}
   * @throws {Error} Throws if the specified key does not exist.
   */
  getInteractable(key) {
    if (!this.interactables.has(key)) {
      throw new Error(`Interactable key ${key} does not exist.`);
    }

    const interactable = this.interactables.get(key);
    return interactable;
  }

  /**
   * Removes an interactable and cleans up its event listeners.
   *
   * @param {string} key - Interactable identifier
   */
  removeInteractable(key) {
    const interactable = this.getInteractable(key);
    interactable.cleanupEventListeners();
    this.interactables.delete(key);
  }
}

/**
 * @typedef {"click" | "enter" | "leave"} InteractableEventType
 */

/**
 * @callback InteractableEventListener
 * @param {InteractableEvent} event
 */

/**
 * @typedef {Object} InteractableEvent
 * @property {number} x - X-coordinate of the pointer in worldspace.
 * @property {number} y - Y-coordinate of the pointer in worldspace.
 */

class Interactable {
  control;
  canvas;

  bounds;
  isInsideBounds = false;

  /** @type {Function[]} */
  cleanups = [];

  /**
   * Creates a new interactive area with the specified bounds.
   *
   * @param {CanvasControl} control - CanvasControl instance.
   * @param {Shape} bounds - Shape defining the Interactable's bounds.
   */
  constructor(control, bounds) {
    this.control = control;
    this.canvas = control.getCanvas();
    this.bounds = bounds;
  }

  /**
   * Updates the bounds of this Interactable.
   *
   * @param {Shape} bounds - New shape for this Interactable's bounds.
   */
  setBounds(bounds) {
    this.bounds = bounds;
  }

  /**
   * Returns the bounds of this Interactable.
   *
   * @returns {Shape} - Current bounds shape.
   */
  getBounds() {
    return this.bounds;
  }

  /**
   * Checks if a point is within the Interactable's bounds.
   *
   * @param {number} x - X-coordinate of the point.
   * @param {number} y - Y-coordinate of the point.
   * @returns {boolean}
   */
  containsPoint(x, y) {
    return this.bounds.containsPoint(x, y);
  }

  /**
   * Returns the event object passed in to event listeners.
   *
   * @param {number} x - X-coordinate in screenspace.
   * @param {number} y - Y-coordinate in screenspace.
   * @returns {InteractableEvent}
   */
  getEventObject(x, y) {
    const worldPoint = this.control.getWorldCoordinates(x, y);
    const event = {
      x: worldPoint.x,
      y: worldPoint.y,
    };

    return event;
  }

  /**
   * Adds an event listener for the specified event type.
   *
   * @param {InteractableEventType} type - Event type to listen for.
   * @param {InteractableEventListener} listener - Callback to call when event occurs.
   * @returns {Function} Cleanup function to remove this event listener.
   */
  addEventListener(type, listener) {
    /** @type {Function} */
    let cleanup;

    switch (type) {
      case "click":
        /** @param {PointerEvent} event */
        const callback = (event) => {
          const worldPoint = this.control.getWorldCoordinates(event.x, event.y);
          const hasClickedInsideBounds = this.bounds.containsPoint(
            worldPoint.x,
            worldPoint.y,
          );
          if (!hasClickedInsideBounds) return;

          const interactableEvent = this.getEventObject(event.x, event.y);
          listener(interactableEvent);
        };

        this.canvas.addEventListener("click", callback);
        cleanup = () => this.canvas.removeEventListener("click", callback);
        break;

      case "enter":
        cleanup = pointerTracker.subscribe(this.canvas, (screenX, screenY) => {
          if (this.isInsideBounds) return;

          const worldPoint = this.control.getWorldCoordinates(screenX, screenY);
          this.isInsideBounds = this.bounds.containsPoint(
            worldPoint.x,
            worldPoint.y,
          );
          if (!this.isInsideBounds) return;

          const interactableEvent = this.getEventObject(screenX, screenY);
          listener(interactableEvent);
        });
        break;

      case "leave":
        cleanup = pointerTracker.subscribe(this.canvas, (screenX, screenY) => {
          if (!this.isInsideBounds) return;

          const worldPoint = this.control.getWorldCoordinates(screenX, screenY);
          this.isInsideBounds = this.bounds.containsPoint(
            worldPoint.x,
            worldPoint.y,
          );
          if (this.isInsideBounds) return;

          const interactableEvent = this.getEventObject(screenX, screenY);
          listener(interactableEvent);
        });
        break;

      default:
        throw new Error(`Invalid event type: ${type}`);
    }

    this.cleanups.push(cleanup);
    return () => {
      cleanup();
      const index = this.cleanups.indexOf(cleanup);
      this.cleanups.splice(index, 1);
    };
  }

  /**
   * Cleans up all registered event listeners for this Interactable.
   */
  cleanupEventListeners() {
    for (const cleanup of this.cleanups) {
      cleanup();
    }

    this.cleanups = [];
  }
}
