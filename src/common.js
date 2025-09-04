export function intToHex(i, length) {
  const str = i.toString(16);
  return str.padStart(length, "0");
}
