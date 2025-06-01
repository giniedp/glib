import type { Device } from '../Device'

const vertexShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @binding position
  in vec3 aPosition;
  // @binding normal
  in vec3 aNormal;

  // @binding World
  uniform mat4 uWorld;
  // @binding View
  uniform mat4 uView;
  // @binding Projection
  uniform mat4 uProjection;

  out vec3 vNormal;
  out vec3 vPosition;
  out vec3 vEyePosition;

  void main(void) {
    vNormal = aNormal;
    vEyePosition = inverse(uView)[3].xyz;
    vPosition = (uWorld * vec4(aPosition, 1)).xyz;
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

  in vec3 vNormal;
  in vec3 vPosition;
  in vec3 vEyePosition;

  out vec4 outColor;
  void main(void) {
    vec3 viewDir = normalize(vEyePosition - vPosition);
    float facing = max(dot(vNormal, viewDir), 0.0);
    outColor = uColor;
    outColor.rgb *= facing;
  }
`.trim()

export const PROGRAM_BASIC = {
  vertexShader,
  fragmentShader,
}
