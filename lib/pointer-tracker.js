/**
 * @callback SubscriberCallback
 * @param {number} x - X-coordinate of the pointer.
 * @param {number} y - Y-coordinate of the pointer.
 */

/** @type {WeakMap<EventTarget, SubscriberCallback[]>} */
const registry = new WeakMap();

/** @type {number} */
let x;

/** @type {number} */
let y;

/** @param {PointerEvent} event */
const handlePointerMove = (event) => {
  x = event.x;
  y = event.y;

  const callbacks = registry.get(event.target);
  for (const callback of callbacks) {
    callback(x, y);
  }
};

/**
 * Subscribes to pointer position updates on the specified element.
 *
 * @param {HTMLElement} element - Element to track.
 * @param {SubscriberCallback} callback - Function to call on pointer updates.
 * @returns {Function} Unsubscribe function.
 */
const subscribe = (element, callback) => {
  if (!registry.has(element)) {
    registry.set(element, []);
    element.addEventListener("pointermove", handlePointerMove);
  }

  const callbacks = registry.get(element);
  callbacks.push(callback);

  return () => {
    const index = callbacks.indexOf(callback);
    callbacks.splice(index, 1);

    if (callbacks.length == 0) {
      registry.delete(element);
      element.removeEventListener("pointermove", handlePointerMove);
    }
  };
};

const pointerTracker = {
  subscribe,
};

export default pointerTracker;
