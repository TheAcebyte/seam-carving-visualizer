/**
 * Utility tagged template for syntax highlighting without processing HTML.
 *
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 * @returns {string}
 */
export function html(strings, ...values) {
  return strings.reduce((acc, string, i) => {
    if (i >= values.length) {
      return acc + string;
    }

    return acc + string + values[i];
  }, "");
}

/**
 * Maps a value from [a1, b1] range to [a2, b2] range.
 *
 * @param {number} value - Value to map.
 * @param {number} a1 - Source range minimum.
 * @param {number} b1 - Source range maximum.
 * @param {number} a2 - Target range minimum.
 * @param {number} b2 - Target range maximum.
 * @returns {number} Mapped value.
 */
export function map(value, a1, b1, a2, b2) {
  const slope = (b2 - a2) / (b1 - a1);
  return a2 + slope * (value - a1);
}

/**
 * Constrains a numeric value within the specified bounds.
 *
 * @param {number} value - Value to constrain.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns Constrained value.
 *
 */
export function clamp(value, min, max) {
  if (value >= max) return max;
  if (value <= min) return min;
  return value;
}

/**
 * @template K
 * @template V
 * @callback Getter
 * @param {K} key - Key.
 * @returns {V} Value.
 */

/**
 * Creates a cached version of a key-value getter function.
 *
 * @template K
 * @template V
 * @param {Getter<K, V>} fn - Function that returns values from keys.
 * @returns {Getter<K, V>} Cached version of the function.
 */
export function cache(fn) {
  /** @type {Map<K, V>} */
  const lookup = new Map();

  return (key) => {
    if (lookup.has(key)) {
      return lookup.get(key);
    }

    const value = fn(key);
    lookup.set(key, value);
    return value;
  };
}

/**
 * Returns the value of a CSS variable.
 *
 * @param {string} variable - Variable name.
 * @returns {string} Value of the CSS variable.
 */
function uncached_getCSSVariable(variable) {
  const style = window.getComputedStyle(document.body);
  return style.getPropertyValue(variable);
}

/**
 * Returns the value of a CSS variable. Cached.
 *
 * @param {string} variable - Variable name.
 * @returns {string} Value of the CSS variable.
 */
export const getCSSVariable = cache(uncached_getCSSVariable);

/**
 * Checks if a file is an image.
 *
 * @param {File} file - File to check.
 * @returns {boolean}
 */
export function isImageFile(file) {
  return file.type.startsWith("image/");
}

/**
 * Decodes an image file and returns its ImageData.
 *
 * @param {File} file - Image file to decode.
 * @returns {Promise<ImageData>} Promise that resolves to the ImageData of the decoded image file.
 * @throws {Error} Throws if the file is not an image or fails to load.
 */
export function decodeImageFile(file) {
  if (!isImageFile(file)) {
    throw new Error(`Expected file of type image, found: ${file.type}`);
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      try {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      const error = new Error("Failed to load image from URL.");
      reject(error);
      URL.revokeObjectURL(url);
    };
  });
}
