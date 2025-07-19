export default class Rectangle {
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
}
