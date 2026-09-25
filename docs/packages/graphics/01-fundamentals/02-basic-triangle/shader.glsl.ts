export const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  void main(void) {
    gl_Position = vec4(vPosition, 1.0);
  }
`

export const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`
