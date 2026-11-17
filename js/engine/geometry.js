import { V } from './math.js';

// 顶点布局：位置 xyz、法线 xyz、纹理坐标 uv。
function tri(out, a, b, c, n, ua = [0, 0], ub = [1, 0], uc = [1, 1]) {
  for (const [p, uv] of [
    [a, ua],
    [b, ub],
    [c, uc],
  ])
    out.push(...p, ...n, ...uv);
}
export function box(w, h, d) {
  const o = [],
    x = w / 2,
    y = h / 2,
    z = d / 2;
  const faces = [
    [
      [x, -y, -z],
      [x, y, -z],
      [x, y, z],
      [x, -y, z],
      [1, 0, 0],
    ],
    [
      [-x, -y, z],
      [-x, y, z],
      [-x, y, -z],
      [-x, -y, -z],
      [-1, 0, 0],
    ],
    [
      [-x, y, -z],
      [-x, y, z],
      [x, y, z],
      [x, y, -z],
      [0, 1, 0],
    ],
    [
      [-x, -y, z],
      [-x, -y, -z],
      [x, -y, -z],
      [x, -y, z],
      [0, -1, 0],
    ],
    [
      [x, -y, z],
      [x, y, z],
      [-x, y, z],
      [-x, -y, z],
      [0, 0, 1],
    ],
    [
      [-x, -y, -z],
      [-x, y, -z],
      [x, y, -z],
      [x, -y, -z],
      [0, 0, -1],
    ],
  ];
  for (const [a, b, c, d, n] of faces) {
    tri(o, a, b, c, n);
    tri(o, a, c, d, n, [0, 0], [1, 1], [0, 1]);
  }
  return o;
}
export function ring(inner, outer, height, start = 0, length = Math.PI * 2, segments = 96) {
  const o = [],
    p = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
  for (let i = 0; i < segments; i++) {
    const a = start + (length * i) / segments,
      b = start + (length * (i + 1)) / segments;
    for (const [y, n] of [
      [height / 2, [0, 1, 0]],
      [-height / 2, [0, -1, 0]],
    ]) {
      tri(o, p(inner, a, y), p(outer, a, y), p(outer, b, y), n);
      tri(o, p(inner, a, y), p(outer, b, y), p(inner, b, y), n);
    }
    for (const [r, s] of [
      [outer, 1],
      [inner, -1],
    ]) {
      const n = [Math.sin((a + b) / 2) * s, 0, Math.cos((a + b) / 2) * s];
      tri(o, p(r, a, -height / 2), p(r, b, -height / 2), p(r, b, height / 2), n);
      tri(o, p(r, a, -height / 2), p(r, b, height / 2), p(r, a, height / 2), n);
    }
  }
  for (const [a, s] of [
    [start, -1],
    [start + length, 1],
  ]) {
    const n = [Math.cos(a) * s, 0, -Math.sin(a) * s];
    tri(o, p(inner, a, -height / 2), p(outer, a, -height / 2), p(outer, a, height / 2), n);
    tri(o, p(inner, a, -height / 2), p(outer, a, height / 2), p(inner, a, height / 2), n);
  }
  return o;
}
export function tube(points, r = 0.035, sides = 7) {
  const o = [];
  for (let i = 0; i < points.length - 1; i++) {
    const tangent = V.norm(V.sub(points[i + 1], points[i])),
      right = V.norm(V.cross(tangent, Math.abs(tangent[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0])),
      up = V.cross(right, tangent);
    const radial = (a) => V.add(V.scale(right, Math.cos(a)), V.scale(up, Math.sin(a)));
    for (let j = 0; j < sides; j++) {
      const a = (j * Math.PI * 2) / sides,
        b = ((j + 1) * Math.PI * 2) / sides,
        n = radial((a + b) / 2),
        ra = V.scale(radial(a), r),
        rb = V.scale(radial(b), r),
        v0 = V.add(points[i], ra),
        v1 = V.add(points[i + 1], ra),
        v2 = V.add(points[i + 1], rb),
        v3 = V.add(points[i], rb);
      tri(o, v0, v1, v2, n);
      tri(o, v0, v2, v3, n);
    }
  }
  return o;
}
