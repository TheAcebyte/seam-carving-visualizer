/**
 * List of cursor values, sorted from highest to lowest priority.
 * @type {string[]}
 */
const cursorPriorityTable = ["grabbing", "grab", "pointer"];

const defaultCursor = "default";

/**
 * Compare two cursor values by priority.
 * Returns equal if neither cursor has been registered.
 *
 * @param {string} a - First cursor value.
 * @param {string} b - Second cursor value.
 * @returns -1 if a has higher priority, 1 if b has higher priority, 0 if equal priority.
 */
const compareCursorPriority = (a, b) => {
  if (a == b) return 0;

  for (const cursor of cursorPriorityTable) {
    if (cursor == a) return -1;
    if (cursor == b) return 1;
  }

  return 0;
};

/**
 * @typedef {Object} CursorEntry
 * @property {string} id - Cursor entry ID.
 * @property {string} cursor - Cursor value.
 */

/** @type {WeakMap<HTMLElement, CursorEntry[]>} */
const registry = new WeakMap();

/**
 * Adds or updates a cursor entry for an element.
 *
 * @param {HTMLElement} element - DOM element to manage.
 * @param {string} id - Cursor entry ID.
 * @param {string} cursor - Cursor value.
 */
const addEntry = (element, id, cursor) => {
  if (!registry.has(element)) {
    registry.set(element, []);
  }

  const entries = registry.get(element);
  const entry = { id, cursor };
  entries.push(entry);
  entries.sort((a, b) => compareCursorPriority(a.cursor, b.cursor));

  updateCursor(element);
};

/**
 * Removes a cursor entry for a registered element.
 *
 * @param {HTMLElement} element - DOM element to manage.
 * @param {string} id - Cursor entry ID.
 * @param {string} cursor - Cursor value.
 */
const removeEntry = (element, id, cursor) => {
  if (!registry.has(element)) {
    return;
  }

  const entries = registry.get(element);
  const newEntries = entries.filter(
    (entry) => entry.id != id || entry.cursor != cursor,
  );
  registry.set(element, newEntries);

  updateCursor(element);
};

/**
 * Returns the currently applied cursor for a registered element.
 *
 * @param {HTMLElement} element - DOM element to query.
 * @returns {string}
 * @throws {Error} Throws if element has not been registered.
 */
const getCursor = (element) => {
  if (!registry.has(element)) {
    throw new Error("Element has not been registered.");
  }

  const entries = registry.get(element);
  if (entries.length == 0) return defaultCursor;
  return entries[0].cursor;
};

/**
 * Applies the highest priority cursor to a registered element.
 *
 * @param {HTMLElement} element - DOM element to update.
 */
const updateCursor = (element) => {
  const cursor = getCursor(element);
  element.style.cursor = cursor;
};

class CursorClient {
  element;
  id;

  /**
   * Creates a new cursor registry client for a DOM element.
   *
   * @param {HTMLElement} element - DOM element to manage cursors for.
   */
  constructor(element) {
    this.element = element;
    this.id = crypto.randomUUID();
  }

  /**
   * Adds a cursor entry for this client.
   *
   * @param {string} cursor - Cursor value.
   */
  add(cursor) {
    addEntry(this.element, this.id, cursor);
  }

  /**
   * Removes a cursor entry for this client.
   *
   * @param {string} cursor - Cursor value.
   */
  remove(cursor) {
    removeEntry(this.element, this.id, cursor);
  }

  /**
   * Returns the currently applied cursor for this client's DOM element.
   *
   * @returns {string}
   */
  get() {
    return getCursor(this.element);
  }
}

/**
 * Creates a new cursor registry client for a DOM element and returns it.
 *
 * @param {HTMLElement} element - DOM element to manage cursors for.
 * @returns {CursorClient}
 */
const createClient = (element) => new CursorClient(element);

const cursorManager = {
  add: addEntry,
  remove: removeEntry,
  get: getCursor,
  createClient: createClient,
};

export default cursorManager;
