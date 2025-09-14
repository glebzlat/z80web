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

/** Sleep for the given amount of time in milliseconds
 *
 * @param {number} timeMs
 */
export async function sleep(timeMs) {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve(), timeMs);
  });
  await promise;
}

/** Get the basename of a file path
 *
 * @param {string} path
 * @returns {string}
 */
export function basename(path) {
  const lastIdx = path.lastIndexOf("/");
  if (lastIdx == -1) {
    return path;
  }
  return path.substring(lastIdx + 1);
}

/** Resolve path relative to current module and return an HREF
 *
 * @param {string} path
 * @returns {string}
 */
export function resolveURL(path) {
  if (import.meta.env.PROD) {
    return new URL(["/assets", basename(path)].join("/"), import.meta.url).href;
  }
  return new URL(path, import.meta.url).href;
}

