import type { Device } from '../Device'

const vertexShader = /* glsl */ `
  precision highp float;
  precision highp int;

  // @binding position
  attribute vec3 aPosition;
  // @binding normal
  attribute vec2 aNormal;

  // @binding world
  uniform mat4 uWorld;
  // @binding view
  uniform mat4 uView;
  // @binding projection
  uniform mat4 uProjection;

  varying vec2 vNormal;

  void main(void) {
    vNormal = aNormal;
    gl_Position = uProjection * uView * uWorld * vec4(aPosition, 1);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp int;

  // @binding color
  // @default [1.0, 1.0, 1.0, 1.0]
  uniform vec4 uColor;

  void main(void) {
    gl_FragColor = uColor;
  }
`

export const PROGRAM_BASIC = {
  vertexShader,
  fragmentShader,
}
