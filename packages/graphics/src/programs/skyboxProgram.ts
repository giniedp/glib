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

  out vec3 vTexCoord;

  void main(void) {
    vTexCoord = aPosition;
    gl_Position = uProjection * uView * uWorld * vec4(aPosition, 1);
    gl_Position.z = gl_Position.w;
  }
`.trim()

const fragmentShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  // @binding Texture
  // @register 0
  uniform samplerCube uTexture;

  // @binding Intensity
  // @default 1.0
  uniform float uIntensity;

  // @binding Blur
  // @default 0
  uniform float uBlur;

  // @binding MipCount
  // @default 5
  uniform int uMipCount;

  in vec3 vTexCoord;

  out vec4 outColor;
  void main(void) {
    outColor = textureLod(uTexture, vTexCoord, uBlur * float(uMipCount - 1));
    outColor.rgb *= uIntensity;
    outColor.a = 1.0;
  }
`.trim()

export const PROGRAM_SKYBOX = {
  vertexShader,
  fragmentShader,
}

export function skyboxProgram(device: Device) {
  return device.createProgram(PROGRAM_SKYBOX)
}
