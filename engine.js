import { V, M } from './js/engine/math.js';
import { color } from './js/engine/materials.js';
import { vertexShader, fragmentShader } from './js/engine/shaders.js';

// 保留原有导出入口，调用方不需要了解引擎内部的文件布局。
export { V, M } from './js/engine/math.js';
export { color, material } from './js/engine/materials.js';
export { box, ring, tube } from './js/engine/geometry.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw Error('浏览器未启用 WebGL。请开启硬件加速，或使用支持 WebGL 的浏览器。');
    this.gl = gl;
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
      return s;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, shader(gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(this.program, shader(gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);
    this.loc = {};
    for (const k of [
      'uModel',
      'uVP',
      'uColor',
      'uEmission',
      'uOpacity',
      'uTexture',
      'uEye',
      'uFog',
    ])
      this.loc[k] = gl.getUniformLocation(this.program, k);
    this.attrs = ['aPosition', 'aNormal', 'aUV'].map((k) => gl.getAttribLocation(this.program, k));
    this.objects = [];
    this.batches = [];
    this.fog = color('#ece8df');
    this.white = this.texture(new Uint8Array([255, 255, 255, 255]));
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(...this.fog, 1);
    gl.uniform1i(this.loc.uTexture, 0);
    this.frames = 0;
    this.lost = false;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.lost = true;
      document.querySelector('#error').hidden = false;
      document.querySelector('#error-message').textContent =
        '图形上下文已中断，请点击重新载入恢复场景。';
    });
  }

  texture(source) {
    const gl = this.gl,
      t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (source instanceof Uint8Array)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  add(geometry, mat, matrix = M.identity(), action = null) {
    const obj = { geometry, mat, matrix, action };
    this.objects.push(obj);
    return obj;
  }

  upload(geometry) {
    const gl = this.gl,
      b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    return { buffer: b, count: geometry.length / 8 };
  }

  compile() {
    for (const b of this.batches) this.gl.deleteBuffer(b.buffer);
    this.batches = [];
    const groups = new Map();
    for (const o of this.objects) {
      if (typeof o.matrix === 'function') {
        this.batches.push({ ...this.upload(o.geometry), mat: o.mat, matrix: o.matrix });
        continue;
      }
      let list = groups.get(o.mat);
      if (!list) groups.set(o.mat, (list = []));
      for (let i = 0; i < o.geometry.length; i += 8) {
        list.push(
          ...M.transform(o.matrix, o.geometry.slice(i, i + 3)),
          ...M.transform(o.matrix, o.geometry.slice(i + 3, i + 6), 0),
          ...o.geometry.slice(i + 6, i + 8),
        );
      }
    }
    for (const [mat, g] of groups)
      this.batches.push({ ...this.upload(g), mat, matrix: M.identity() });
    this.batches.sort((a, b) => ((a.mat.opacity ?? 1) < 1 ? 1 : (b.mat.opacity ?? 1) < 1 ? -1 : 0));
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.6),
      w = Math.round(innerWidth * dpr),
      h = Math.round(innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  draw(camera) {
    if (this.lost) return;
    this.resize();
    const gl = this.gl;
    this.camera = camera;
    this.vp = M.multiply(
      M.perspective(camera.fov || 0.72, innerWidth / innerHeight),
      M.view(camera.eye, camera.target),
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.loc.uVP, false, this.vp);
    gl.uniform3fv(this.loc.uEye, camera.eye);
    gl.uniform3fv(this.loc.uFog, this.fog);
    for (const b of this.batches) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
      for (let i = 0; i < 3; i++) {
        gl.enableVertexAttribArray(this.attrs[i]);
        gl.vertexAttribPointer(
          this.attrs[i],
          i === 2 ? 2 : 3,
          gl.FLOAT,
          false,
          32,
          i === 0 ? 0 : i === 1 ? 12 : 24,
        );
      }
      gl.uniformMatrix4fv(
        this.loc.uModel,
        false,
        typeof b.matrix === 'function' ? b.matrix() : b.matrix,
      );
      gl.uniform3fv(this.loc.uColor, b.mat.color);
      gl.uniform1f(this.loc.uEmission, b.mat.emissive || 0);
      gl.uniform1f(this.loc.uOpacity, b.mat.opacity ?? 1);
      gl.bindTexture(gl.TEXTURE_2D, b.mat.texture || this.white);
      gl.depthMask((b.mat.opacity ?? 1) >= 1);
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
    }
    gl.depthMask(true);
    this.frames++;
  }

  project(p) {
    if (!this.vp) return null;
    const v = M.transform(this.vp, p),
      m = this.vp,
      w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return w <= 0
      ? null
      : {
          x: ((v[0] / w) * 0.5 + 0.5) * innerWidth,
          y: ((-0.5 * v[1]) / w + 0.5) * innerHeight,
          z: v[2] / w,
        };
  }

  ray(x, y) {
    const c = this.camera,
      z = V.norm(V.sub(c.target, c.eye)),
      right = V.norm(V.cross(z, [0, 1, 0])),
      up = V.cross(right, z),
      s = Math.tan((c.fov || 0.72) / 2);
    return {
      origin: c.eye,
      direction: V.norm(
        V.add(
          z,
          V.add(
            V.scale(right, (((x / innerWidth) * 2 - 1) * s * innerWidth) / innerHeight),
            V.scale(up, (1 - (y / innerHeight) * 2) * s),
          ),
        ),
      ),
    };
  }

  pick(x, y) {
    const ray = this.ray(x, y);
    let closest = Infinity,
      hit = null;
    for (const o of this.objects) {
      if (o.mat.opacity < 0.5) continue;
      const m = typeof o.matrix === 'function' ? o.matrix() : o.matrix;
      const delta = V.sub(ray.origin, [m[12], m[13], m[14]]),
        inv = (v) => [
          m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
          m[4] * v[0] + m[5] * v[1] + m[6] * v[2],
          m[8] * v[0] + m[9] * v[1] + m[10] * v[2],
        ],
        ro = inv(delta),
        rd = inv(ray.direction),
        g = o.geometry;
      if (!o.bounds) {
        const min = [Infinity, Infinity, Infinity],
          max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < g.length; i += 8)
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k], g[i + k]);
            max[k] = Math.max(max[k], g[i + k]);
          }
        o.bounds = { min, max };
      }
      let tmin = -Infinity,
        tmax = Infinity;
      for (let k = 0; k < 3; k++) {
        if (Math.abs(rd[k]) < 1e-8) {
          if (ro[k] < o.bounds.min[k] || ro[k] > o.bounds.max[k]) {
            tmax = -1;
            break;
          }
        } else {
          const t1 = (o.bounds.min[k] - ro[k]) / rd[k],
            t2 = (o.bounds.max[k] - ro[k]) / rd[k];
          tmin = Math.max(tmin, Math.min(t1, t2));
          tmax = Math.min(tmax, Math.max(t1, t2));
        }
      }
      if (tmax < Math.max(tmin, 0) || tmin > closest) continue;
      for (let i = 0; i < g.length; i += 24) {
        const a = g.slice(i, i + 3),
          e1 = V.sub(g.slice(i + 8, i + 11), a),
          e2 = V.sub(g.slice(i + 16, i + 19), a),
          h = V.cross(rd, e2),
          det = V.dot(e1, h);
        if (Math.abs(det) < 1e-8) continue;
        const f = 1 / det,
          s = V.sub(ro, a),
          u = f * V.dot(s, h);
        if (u < 0 || u > 1) continue;
        const q = V.cross(s, e1),
          v = f * V.dot(rd, q);
        if (v < 0 || u + v > 1) continue;
        const t = f * V.dot(e2, q);
        if (t > 0.05 && t < closest) {
          closest = t;
          hit = o;
        }
      }
    }
    return hit;
  }
}
