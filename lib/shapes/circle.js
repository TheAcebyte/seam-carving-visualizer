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

  /**
   * Returns the X-coordinate of the center.
   *
   * @returns {number}
   */
  getX() {
    return this.x;
  }

  /**
   * Sets the X-coordinate of the center.
   *
   * @param {number} x - X-coordinate of the center.
   */
  setX(x) {
    this.x = x;
  }

  /**
   * Returns the Y-coordinate of the center.
   *
   * @returns {number}
   */
  getY() {
    return this.y;
  }

  /**
   * Sets the Y-coordinate of the center.
   *
   * @param {number} y - Y-coordinate of the center.
   */
  setY(y) {
    this.y = y;
  }

  /**
   * Returns the radius of the circle.
   *
   * @returns {number}
   */
  getRadius() {
    return this.radius;
  }

  /**
   * Sets a new radius for the circle.
   *
   * @param {number} radius - New circle radius.
   */
  setRadius(radius) {
    this.radius = radius;
  }
}
