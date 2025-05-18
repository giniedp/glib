import type { Device } from '../Device'

const vertexShader = /* glsl */ `
  precision highp float;
  precision highp int;

  // @binding position
  attribute vec3 aPosition;
  // @binding texture
  attribute vec2 aTexture;
  // @binding normal
  attribute vec2 aNormal;

  // @binding world
  uniform mat4 uWorld;
  // @binding view
  uniform mat4 uView;
  // @binding projection
  uniform mat4 uProjection;

  varying vec2 vTexcoord;
  varying vec2 vNormal;

  void main(void) {
    vTexcoord = aTexture;
    vNormal = aNormal;
    gl_Position = uProjection * uView * uWorld * vec4(aPosition, 1);
  }`

const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp int;

  // @binding texture
  // @register 0
  // @filter LinearWrap
  uniform sampler2D uSampler;

  varying vec2 vTexcoord;

  void main(void) {
    gl_FragColor = texture2D(uSampler, vTexcoord);
  }
`

export const basicProgramOptions = {
  vertexShader,
  fragmentShader,
}

export function basicProgram(device: Device) {
  return device.createProgram(basicProgramOptions)
}
