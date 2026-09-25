export const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  in vec3 vColor;
  // Passed on to the fragment shader. The GPU interpolates this value
  // across the triangle's surface, which is why the result looks smooth.
  out vec3 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`

export const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 vertexColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(vertexColor, 1.0);
  }
`
