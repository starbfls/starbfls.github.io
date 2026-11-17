export const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uModel;
uniform mat4 uVP;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUV;

void main() {
  vec4 w = uModel * vec4(aPosition, 1.0);
  vWorld = w.xyz;
  vNormal = mat3(uModel) * aNormal;
  vUV = aUV;
  gl_Position = uVP * w;
}
`;

export const fragmentShader = `
precision mediump float;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUV;

uniform vec3 uColor;
uniform float uEmission;
uniform float uOpacity;
uniform sampler2D uTexture;
uniform vec3 uEye;
uniform vec3 uFog;

void main() {
  vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  float sun = max(dot(n, normalize(vec3(-0.5, 0.9, 0.6))), 0.0);
  float fill = max(dot(n, normalize(vec3(0.7, 0.3, -0.5))), 0.0);
  vec3 light = vec3(0.43)
    + vec3(0.56, 0.51, 0.42) * sun
    + vec3(0.15, 0.18, 0.21) * fill;

  vec3 glow = vec3(0.0);
  float d = length(vWorld - vec3(-2.5, 2.4, -8.5));
  glow += vec3(0.26, 0.12, 0.02) * max(0.0, 1.0 - d / 7.0);
  d = length(vWorld - vec3(4.0, 11.5, -8.5));
  glow += vec3(0.07, 0.13, 0.3) * max(0.0, 1.0 - d / 7.0);

  vec4 tex = texture2D(uTexture, vUV);
  vec3 c = uColor * tex.rgb * mix(light + glow, vec3(1.0), uEmission);
  float fog = 1.0 - exp(-0.000085 * pow(length(uEye - vWorld), 2.0));
  gl_FragColor = vec4(mix(c, uFog, fog), uOpacity * tex.a);
}
`;
