import Component from "/components/base.js";
import Rectangle from "/lib/shapes/rectangle.js";
import toastEvent from "/lib/events/toast-event.js";
import { easeOutExpo } from "/lib/animator/easings.js";
import { html } from "/lib/utils.js";

const GAP = 16;
const SCALE_DECREMENT = 0.05;
const REMOVAL_DELAY = 5000;
const MAX_TOAST_COUNT = 3;

const STACKING_DURATION = 400;
const EXPANDING_DURATION = 500;
const TOP_REMOVAL_DURATION = 300;
const BACK_REMOVAL_DURATION = 100;
const SNAP_BACK_DURATION = 200;

/**
 * @typedef {"success" | "error" | "warning"} ToastStatus
 */

/**
 * @typedef {Object} Toast
 * @property {ToastStatus} status - Toast status.
 * @property {string} message - Toast message to display.
 */

/**
 * @typedef {Object} Removal
 * @property {HTMLElement} toast - DOM element of the toast.
 * @property {number} timeoutId - ID of the removal timeout.
 * @property {number} removedAt - Timestamp when the toast will be removed.
 */

/**
 * @typedef {Object} PendingRemoval
 * @property {HTMLElement} toast - DOM element of the toast.
 * @property {number} delay - Remaining delay before removal in milliseconds.
 */

class Toaster extends Component {
  toastClient;
  container;
  rectangle;

  /** @type {"stacked" | "expanded"} */
  layout = "stacked";
  zIndex = 0;

  /** @type {HTMLElement} */
  dragTarget;
  dragging = false;
  initialDragY = 0;
  deltaDragY = 0;

  /** @type {Removal[]} */
  removals = [];

  /** @type {PendingRemoval[]} */
  pendingRemovals = [];

  constructor() {
    super();

    this.toastClient = toastEvent.createClient();
    this.container = this.root.querySelector(".toast-container");
    this.rectangle = new Rectangle(0, 0, 0, 0);

    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.expandToasts = this.expandToasts.bind(this);
  }

  render() {
    return html`<div class="toast-container"></div>`;
  }

  connectedCallback() {
    this.toastClient.subscribe((toast) => {
      this.addToast(toast.status, toast.message);
    });

    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointermove", this.handlePointerMove);
  }

  disconnectedCallback() {
    this.toastClient.unsubscribe();
    this.cleanupRemovals();

    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointermove", this.handlePointerMove);
  }

  /**
   * @param {PointerEvent} event
   */
  handlePointerUp(event) {
    this.dragEnd(event.x, event.y);
  }

  /**
   * @param {PointerEvent} event
   */
  handlePointerMove(event) {
    this.drag(event.y);
    this.checkPointerExit(event.x, event.y);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  checkPointerExit(x, y) {
    if (this.layout == "stacked" || this.dragging) return;

    const isOutsideRectangle = !this.rectangle.containsPoint(x, y);
    if (!isOutsideRectangle) return;

    this.stackToasts();
  }

  /**
   * @param {HTMLElement} target
   * @param {number} y
   */
  dragStart(target, y) {
    this.dragging = true;
    this.dragTarget = target;
    this.initialDragY = y;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  dragEnd(x, y) {
    this.dragging = false;
    this.checkPointerExit(x, y);

    const dismissToast = this.deltaDragY < -GAP;
    if (dismissToast) {
      this.removeFromTop(this.dragTarget);
    } else {
      const options = { duration: SNAP_BACK_DURATION, easing: "ease" };
      const style = { transform: `translateY(0)` };
      const animation = this.dragTarget.animate(style, options);

      animation.onfinish = () => {
        for (const property in style) {
          this.dragTarget.style[property] = style[property];
        }
      };
    }
  }

  /**
   * @param {number} y
   */
  drag(y) {
    if (!this.dragging) return;

    this.deltaDragY = y - this.initialDragY;
    if (this.deltaDragY > 0) {
      const remainingWindowHeight = window.innerHeight - this.initialDragY;
      const absoluteProgress = this.deltaDragY / remainingWindowHeight;
      const easedProgress = easeOutExpo(absoluteProgress);
      const offsetY = easedProgress * GAP;

      this.dragTarget.style.transform = `translateY(${offsetY}px)`;
    } else {
      this.dragTarget.style.transform = `translateY(${this.deltaDragY}px)`;
    }
  }

  getToastElements() {
    return this.container.querySelectorAll("div");
  }

  /**
   * @param {ToastStatus} status
   * @param {string} message
   */
  addToast(status, message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.classList.add("toast");
    toast.style.zIndex = `${this.zIndex++}`;
    toast.setAttribute("data-status", status);
    toast.addEventListener("pointerenter", this.expandToasts);
    toast.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.dragStart(toast, event.y);
    });

    this.container.prepend(toast);
    this.enforceToastLimit();
    this.reflowToasts();
    this.scheduleRemoval(toast, REMOVAL_DELAY);
  }

  enforceToastLimit() {
    const toasts = this.getToastElements();
    if (toasts.length <= MAX_TOAST_COUNT) return;

    for (let i = MAX_TOAST_COUNT; i < toasts.length; i++) {
      const toast = toasts[i];
      this.removeFromBack(toast);
    }
  }

  reflowToasts() {
    if (this.layout == "stacked") this.stackToasts();
    if (this.layout == "expanded") this.expandToasts();
  }

  stackToasts() {
    this.layout = "stacked";
    this.resumeRemovals();

    const toasts = this.getToastElements();
    let cumulativeY = 0;
    let cumulativeScale = 1;

    /** @type {KeyframeAnimationOptions} */
    const options = {
      duration: STACKING_DURATION,
      fill: "forwards",
      easing: "ease",
    };

    for (const toast of toasts) {
      const style = {
        translate: `0 ${cumulativeY}px`,
        scale: `${cumulativeScale} 1`,
      };
      toast.animate(style, options);

      cumulativeY += GAP;
      cumulativeScale -= SCALE_DECREMENT;
    }
  }

  expandToasts() {
    this.layout = "expanded";
    this.pauseRemovals();

    const toasts = this.getToastElements();
    let cumulativeY = 0;

    /** @type {KeyframeAnimationOptions} */
    const options = {
      duration: EXPANDING_DURATION,
      fill: "forwards",
      easing: "ease",
    };

    for (const toast of toasts) {
      const style = { translate: `0 ${cumulativeY}px`, scale: "1" };
      toast.animate(style, options);

      const bounds = toast.getBoundingClientRect();
      const height = bounds.height;
      cumulativeY += height + GAP;
    }

    const totalHeight = cumulativeY - GAP;
    this.updateRectangle(totalHeight);
  }

  /**
   * @param {number} height
   */
  updateRectangle(height) {
    const toasts = this.getToastElements();
    const frontToast = toasts[0];
    const bounds = frontToast.getBoundingClientRect();

    this.rectangle.setX(bounds.x);
    this.rectangle.setY(0);
    this.rectangle.setWidth(bounds.width);
    this.rectangle.setHeight(bounds.y + height);
  }

  /**
   * @param {HTMLElement} toast
   * @param {number} delay
   */
  scheduleRemoval(toast, delay) {
    const timeoutId = setTimeout(() => {
      const toasts = this.getToastElements();
      const isFrontToast = toast == toasts[0];
      if (isFrontToast) this.removeFromTop(toast);
      if (!isFrontToast) this.removeFromBack(toast);

      const removalIndex = this.removals.findIndex(
        (removal) => removal.toast == toast,
      );
      this.removals.splice(removalIndex, 1);
    }, delay);

    const removedAt = performance.now() + delay;
    const removal = { toast, timeoutId, removedAt };
    this.removals.push(removal);
  }

  cleanupRemovals() {
    for (const removal of this.removals) {
      clearTimeout(removal.timeoutId);
    }
  }

  pauseRemovals() {
    for (const removal of this.removals) {
      clearTimeout(removal.timeoutId);

      const toast = removal.toast;
      const delay = removal.removedAt - performance.now();
      this.pendingRemovals.push({ toast, delay });
    }

    this.removals = [];
  }

  resumeRemovals() {
    for (const pendingRemoval of this.pendingRemovals) {
      this.scheduleRemoval(pendingRemoval.toast, pendingRemoval.delay);
    }

    this.pendingRemovals = [];
  }

  /**
   * @param {HTMLElement} toast
   */
  removeFromTop(toast) {
    /** @type {KeyframeAnimationOptions} */
    const options = {
      duration: TOP_REMOVAL_DURATION,
      fill: "forwards",
      easing: "ease",
    };
    const style = { translate: "0 calc(-100% - 16px)", opacity: "0" };
    const animation = toast.animate(style, options);

    animation.onfinish = () => {
      toast.remove();
      this.reflowToasts();
    };
  }

  /**
   * @param {HTMLElement} toast
   */
  removeFromBack(toast) {
    /** @type {KeyframeAnimationOptions} */
    const options = {
      duration: BACK_REMOVAL_DURATION,
      fill: "forwards",
      easing: "ease",
    };
    const style = { opacity: "0" };
    const animation = toast.animate(style, options);

    animation.onfinish = () => {
      toast.remove();
      this.reflowToasts();
    };
  }
}

Component.register(Toaster, {
  tag: "x-toaster",
  path: import.meta.url,
  styles: ["toaster.css"],
});
