import * as helpers from "/lib/store/helpers.js";

/**
 * @typedef {Object} State
 * @property {number} x - X-position on the playground.
 * @property {number} y - Y-position on the playground.
 * @property {number} scale - Zoom level on the playground.
 */

/** @type {State} */
const defaultState = {
  x: 0,
  y: 0,
  scale: 1,
};

/** @type {State} */
let state = { ...defaultState };

/**
 * Returns the current value for the specified state property.
 *
 * @template {keyof State} T
 * @param {T} key - State property key.
 * @returns {State[T]} State property value.
 */
const get = (key) => {
  return state[key];
};

/**
 * Updates the value of a property and notifies all relevant subscribers, except the emitter if specified.
 *
 * @template {keyof State} T
 * @param {T} key - State property key.
 * @param {State[T] | ((value: State[T]) => State[T])} valueOrSetter - State property value or value setter.
 * @param {string | null} [emitterId=null] - Emitter ID.
 */
const set = (key, valueOrSetter, emitterId = null) => {
  if (typeof valueOrSetter == "function") {
    const setter = valueOrSetter;
    const value = setter(state[key]);
    if (state[key] === value) return;

    state[key] = value;
    notify(key, emitterId);
  } else {
    const value = valueOrSetter;
    if (state[key] === value) return;

    state[key] = value;
    notify(key, emitterId);
  }
};

/**
 * Resets the state to default values, clears history and notifies all subscribers.
 */
const reset = () => {
  state = { ...defaultState };
  history = [{ ...state }];
  historyIndex = 0;
  notifyAll();
};

/**
 * @template {keyof State} T
 * @typedef {Object} Subscriber
 * @property {string} id - Subscriber ID.
 * @property {T} key - State property the subscriber listens to.
 * @property {(value: State[T]) => void} callback - Callback that runs everytime the property's value changes.
 */

/** @type {Subscriber<keyof State>[]} */
let subscribers = [];

/**
 * Registers a callback function to run everytime the specified state property's value changes.
 *
 * @template {keyof State} T
 * @param {string} id - Subscriber ID.
 * @param {T} key - State property key.
 * @param {(value: State[T]) => void} callback - Callback to run on every value change.
 */
const subscribe = (id, key, callback) => {
  const subscriber = { id, key, callback };
  subscribers.push(subscriber);
};

/**
 * Unsubscribes all subscribers with the specified ID.
 *
 * @param {string} id - Subscriber ID.
 */
const unsubscribe = (id) => {
  subscribers = subscribers.filter((subscriber) => subscriber.id != id);
};

class StoreClient {
  id = crypto.randomUUID();

  /**
   * Updates the value of a property and notifies all relevant subscribers except the client's self.
   *
   * @template {keyof State} T
   * @param {T} key - State property key.
   * @param {State[T] | ((value: State[T]) => State[T])} valueOrSetter - State property value or value setter.
   */
  set(key, valueOrSetter) {
    set(key, valueOrSetter, this.id);
  }

  /**
   * Registers a callback function to run everytime the specified state property's value changes.
   *
   * @template {keyof State} T
   * @param {T} key - State property key.
   * @param {(value: State[T]) => void} callback - Callback to run on every value change.
   */
  subscribe(key, callback) {
    subscribe(this.id, key, callback);
  }

  /**
   * Cleans up all registered client subscriptions.
   */
  unsubscribe() {
    unsubscribe(this.id);
  }
}

/**
 * Creates a client object for managing subscriptions and preventing self-reception.
 *
 * @returns {StoreClient}
 */
const createClient = () => new StoreClient();

/**
 * Notifies subscribers listening to the specified state property, except the emitter if specfied.
 *
 * @param {keyof State} key - State property key.
 * @param {string | null} emitterId - Emitter ID.
 */
const notify = (key, emitterId = null) => {
  const value = state[key];
  subscribers
    .filter((subscriber) => subscriber.key == key && subscriber.id != emitterId)
    .forEach((subscriber) => subscriber.callback(value));
};

/**
 * Notifies all subscribers of their respective state property values.
 */
const notifyAll = () => {
  subscribers.forEach((subscriber) => {
    const value = state[subscriber.key];
    subscriber.callback(value);
  });
};

/** @type {State[]} */
let history = [{ ...state }];
let historyIndex = 0;

/**
 * Takes a snapshot of the current state and adds it to history.
 */
const snapshot = () => {
  // Clear all history following historyIndex
  history.length = historyIndex + 1;

  history.push({ ...state });
  historyIndex++;
};

/**
 * Takes one step backward in history, updates the state and notifies all subscribers.
 */
const undo = () => {
  if (historyIndex <= 0) return;

  historyIndex--;
  state = { ...history[historyIndex] };
  notifyAll();
};

/**
 * Takes one step forward in history, updates the state and notifies all subscribers.
 */
const redo = () => {
  if (historyIndex >= history.length - 1) return;

  historyIndex++;
  state = { ...history[historyIndex] };
  notifyAll();
};

/**
 * Returns whether undo operation is possible.
 *
 * @returns {boolean}
 */
const canUndo = () => historyIndex > 0;

/**
 * Returns whether redo operation is possible.
 *
 * @returns {boolean}
 */
const canRedo = () => historyIndex < history.length - 1;

/** @type {State[][]} */
const tabs = [[]];
let tabIndex = 0;

/**
 * Returns all tab histories.
 *
 * @returns {State[][]}
 */
const getTabs = () => tabs;

/**
 * Returns the index of the currently selected tab.
 *
 * @returns {number}
 */
const getSelectedTab = () => tabIndex;

/**
 * Saves the current history to the currently selected tab.
 */
const saveTab = () => {
  tabs[tabIndex] = [...history];
};

/**
 * Loads in a specified tab by copying its history, updating state as latest snapshot
 * and notifying subscribers.
 *
 * @param {number} index - Index of the tab to load in.
 * @throws {Error} Throws if index is out of bounds.
 * @throws {Error} Throws if loaded tab has an empty history.
 */
const loadTab = (index) => {
  if (index < 0 || index >= tabs.length) {
    throw new Error("Index is out of bounds.");
  }

  history = [...tabs[index]];
  if (history.length == 0) {
    throw new Error("Found tab with empty history.");
  }

  // Load in latest history into state
  state = { ...history[history.length - 1] };
  historyIndex = history.length - 1;
  tabIndex = index;
  notifyAll();
};

/**
 * Creates a new tab with default state, empty history and switches to it after saving current work.
 */
const newTab = () => {
  saveTab();
  tabs.push([]);
  reset();
  tabIndex++;
  notifyAll();
};

/**
 * Switches to the specified tab after saving current work.
 *
 * @param {number} index - Index of the tab to select.
 */
const selectTab = (index) => {
  saveTab();
  loadTab(index);
};

/**
 * Deletes the specified tab and adjusts the tab selection.
 *
 * @param {number} index - Index of the tab to delete.
 * @throws {Error} Throws if there are less than 2 tabs.
 */
const deleteTab = (index) => {
  if (tabs.length <= 1) {
    throw new Error("Must keep at least one tab alive.");
  }

  tabs.splice(index, 1);
  if (index < tabIndex) {
    tabIndex--;
  } else if (index == tabIndex) {
    if (tabIndex >= tabs.length) tabIndex--;
    loadTab(tabIndex);
  }
};

const store = {
  get,
  set,
  reset,
  subscribe,
  createClient,
  snapshot,
  undo,
  redo,
  canUndo,
  canRedo,
  tabs: {
    getAll: getTabs,
    getSelected: getSelectedTab,
    new: newTab,
    select: selectTab,
    delete: deleteTab,
  },
  helpers,
};

export default store;
