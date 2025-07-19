export default class Circle {
  x;
  y;
  radius;

  /**
   * Creates a circle with the specified center and radius.
   *
   * @param {number} x - X-coordinate of the center.
   * @param {number} y - Y-coordinate of the center.
   * @param {number} radius - Radius of the circle.
   */
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  /**
   * Checks if a point is inside the circle.
   *
   * @param {number} x - X-coordinate of the point.
   * @param {number} y - Y-coordinate of the point.
   * @returns {boolean} 
   */
  containsPoint(x, y) {
    const squaredDistance = (x - this.x) ** 2 + (y - this.y) ** 2;
    return squaredDistance <= this.radius ** 2;
  }
}
