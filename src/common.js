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

/**
 * @param {...Array<string>} parts
 * @returns {string}
 */
function joinPath(...parts) {
  parts = parts.map((p) => p.split("/")).flat();
  console.log("parts", parts);

  const removedEmpty = []
  parts.forEach((p, i) => {
    if (p == "" && i != 0) {
      return;
    }
    removedEmpty.push(p);
  })

  return removedEmpty.join("/");
}

/** Resolve absolute asset URL
 *
 * @param {string} path
 * @returns {string}
 */
export function assetURL(file) {
  const absPath = joinPath(import.meta.env.BASE_URL, "assets", file);
  return new URL(absPath, import.meta.url).href;
}
