import Shape from "/lib/shapes/base.js";

export default class Rectangle extends Shape {
  x;
  y;
  width;
  height;

  /**
   * Creates a rectangle with the specified bounding box.
   *
   * @param {number} x - X-coordinate of the top-left corner.
   * @param {number} y - Y-coordinate of the top-left corner.
   * @param {number} width - Width of the rectangle.
   * @param {number} height - Height of the rectangle.
   */
  constructor(x, y, width, height) {
    super();

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Checks if a point is inside the rectangle.
   *
   * @param {number} x - X-coordinate of the point.
   * @param {number} y - Y-coordinate of the point.
   * @returns {boolean}
   */
  containsPoint(x, y) {
    return (
      x >= this.x &&
      x < this.x + this.width &&
      y >= this.y &&
      y < this.y + this.height
    );
  }

  /**
   * Returns the X-coordinate of the top-left corner.
   *
   * @returns {number}
   */
  getX() {
    return this.x;
  }

  /**
   * Sets a new X-coordinate for the top-left corner.
   *
   * @param {number} x - X-coordinate of the top left corner.
   */
  setX(x) {
    this.x = x;
  }

  /**
   * Returns the Y-coordinate of the top-left corner.
   *
   * @returns {number}
   */
  getY() {
    return this.y;
  }

  /**
   * Sets a new Y-coordinate for the top-left corner.
   *
   * @param {number} y - Y-coordinate of the top left corner.
   */
  setY(y) {
    this.y = y;
  }

  /**
   * Returns the width of the rectangle.
   *
   * @returns {number}
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets a new width for the rectangle.
   *
   * @param {number} width - New rectangle width.
   */
  setWidth(width) {
    this.width = width;
  }

  /**
   * Returns the height of the rectangle.
   *
   * @returns {number}
   */
  getHeight() {
    return this.height;
  }

  /**
   * Sets a new height for the rectangle.
   *
   * @param {number} height - New rectangle height.
   */
  setHeight(height) {
    this.height = height;
  }
}
