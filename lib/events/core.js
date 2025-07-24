/**
 * @template T - Type of emitted data.
 * @typedef {Object} Subscriber
 * @property {string} id - Subscriber ID.
 * @property {(data: T) => void} callback - Function to call when data is received.
 */

/** @template T - Type of emitted data. */
export default class EventChannel {
  /** @type {Subscriber<T>[]} */
  subscribers = [];

  /**
   * Emits data to all subscribers except the emitter, if specified.
   *
   * @param {T} data - Data to emit.
   * @param {string | null} [emitterId] - ID of the emitter. Optional.
   */
  emit(data, emitterId = null) {
    for (const subscriber of this.subscribers) {
      if (subscriber.id == emitterId) continue;
      subscriber.callback(data);
    }
  }

  /**
   * Registers a callback to listen for emitted data.
   *
   * @param {string} id - Subscriber ID.
   * @param {(data: T) => void} callback - Function to call when data is received.
   */
  subscribe(id, callback) {
    const subscriber = { id, callback };
    this.subscribers.push(subscriber);
  }

  /**
   * Unsubscribes a subscriber by ID.
   *
   * @param {string} id - Subscriber ID.
   */
  unsubscribe(id) {
    this.subscribers = this.subscribers.filter(
      (subscriber) => subscriber.id != id,
    );
  }

  /**
   * Creates and returns a client interface for this event.
   *
   * @returns {EventClient<T>}
   */
  createClient() {
    return new EventClient(this);
  }
}

/** @template T - Type of emitted data. */
class EventClient {
  event;
  id;

  /**
   * @param {EventChannel<T>} event - EventChannel instance to connect to.
   */
  constructor(event) {
    this.event = event;
    this.id = crypto.randomUUID();
  }

  /**
   * Emits data to all subscribers, except the client itself.
   *
   * @param {T} data - Data to emit.
   */
  emit(data) {
    this.event.emit(data, this.id);
  }

  /**
   * Registers this client to listen for emitted data.
   *
   * @param {(data: T) => void} callback - Function to call when data is received.
   */
  subscribe(callback) {
    this.event.subscribe(this.id, callback);
  }

  /**
   * Unsubscribes this client from the event.
   */
  unsubscribe() {
    this.event.unsubscribe(this.id);
  }
}
