export function color(hex) {
  return typeof hex === 'string'
    ? hex
        .replace('#', '')
        .match(/../g)
        .map((v) => parseInt(v, 16) / 255)
    : hex;
}
export function material(hex, options = {}) {
  return { color: color(hex), emissive: 0, ...options };
}
