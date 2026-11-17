import { M } from './engine/math.js';

/** 将中庭的半径、方位角和高度转换为世界坐标。 */
export function world(radius, angle, height) {
  return [Math.sin(angle) * radius, height, Math.cos(angle) * radius];
}

/** 将房间内的坐标转换为世界坐标。 */
export function local(room, x, y, z) {
  return M.transform(room.parent, [x, y, z]);
}
