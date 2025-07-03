/**
 * Utility tagged template for syntax highlighting without processing HTML.
 *
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 * @returns {string}
 */
export function html(strings, ...values) {
  return strings.reduce((acc, string, i) => {
    if (i >= values.length) return acc + string;
    return acc + string + values[i];
  }, "");
}
