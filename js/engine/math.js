// 列主序矩阵；场景变换仅包含平移与绕 Y 轴旋转。
export const V = {
  add: (a, b) => a.map((v, i) => v + b[i]),
  sub: (a, b) => a.map((v, i) => v - b[i]),
  scale: (a, s) => a.map((v) => v * s),
  dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
  cross: (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  norm: (a) => {
    const d = Math.hypot(...a) || 1;
    return a.map((v) => v / d);
  },
  lerp: (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
};
export const M = {
  identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  multiply: (a, b) => {
    const o = new Array(16).fill(0);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return o;
  },
  transform: (m, v, w = 1) => [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * w,
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * w,
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * w,
  ],
  pose: (x = 0, y = 0, z = 0, a = 0) => {
    const c = Math.cos(a),
      s = Math.sin(a);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1];
  },
  view: (eye, target) => {
    const z = V.norm(V.sub(eye, target)),
      x = V.norm(V.cross([0, 1, 0], z)),
      y = V.cross(z, x);
    return [
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -V.dot(x, eye),
      -V.dot(y, eye),
      -V.dot(z, eye),
      1,
    ];
  },
  perspective: (fov, aspect, near = 0.08, far = 150) => {
    const f = 1 / Math.tan(fov / 2),
      nf = 1 / (near - far);
    return [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0,
    ];
  },
};
