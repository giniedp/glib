import type { Device } from '../Device'

const vertexShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @binding position
  in vec3 aPosition;
  // @binding texture
  in vec2 aTexture;
  // @binding normal
  in vec3 aNormal;

  // @binding World
  uniform mat4 uWorld;
  // @binding View
  uniform mat4 uView;
  // @binding Projection
  uniform mat4 uProjection;

  out vec2 vTexcoord;
  out vec3 vNormal;

  void main(void) {
    vTexcoord = aTexture;
    vNormal = aNormal;
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

  // @binding Texture
  // @register 0
  uniform sampler2D uSampler;

  in vec2 vTexcoord;

  out vec4 outColor;
  void main(void) {
    outColor = texture(uSampler, vTexcoord);
    outColor.rgb *= uColor.rgb;
  }
`.trim()

export const PROGRAM_BASIC_TEXTURED = {
  vertexShader,
  fragmentShader,
}

export function basicProgram(device: Device) {
  return device.createProgram(PROGRAM_BASIC_TEXTURED)
}
