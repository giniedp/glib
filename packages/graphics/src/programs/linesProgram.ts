import type { Device } from '../Device'

const vertexShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @binding position
  in vec3 aPosition;

  // @binding World
  uniform mat4 uWorld;
  // @binding View
  uniform mat4 uView;
  // @binding Projection
  uniform mat4 uProjection;

  void main(void) {
    gl_Position = uProjection * uView * uWorld * vec4(aPosition, 1);
  }
`.trim()

const fragmentShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @binding Color
  // @default [1.0, 1.0, 1.0, 1.0]
  uniform vec4 uColor;

  out vec4 outColor;
  void main(void) {
    outColor = vec4(uColor.rgb, 1.0);
  }
`.trim()

export const PROGRAM_LINES = {
  vertexShader,
  fragmentShader,
}
