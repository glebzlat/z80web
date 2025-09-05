export function intToHex(i, length) {
  const str = i.toString(16);
  return str.padStart(length, "0");
}

/** Parse hexadecimal string into a number
 *
 * Returns NaN if the string can not be parsed.
 *
 * @param {string} s
 * @returns {number}
 */
export function parseHex(s) {
  if (s.substring(0, 2) == "0x") {
    s = s.substring(2);
  }

  if (!s.match(/^[a-fA-F0-9]+$/)) {
    return NaN;
  }

  return parseInt(s, 16);
}
