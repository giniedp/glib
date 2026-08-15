export const FULLSCREEN_GLSL_VS: string = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  out vec2 uv;

  void main(void) {
    // oversized full-screen triangle: (-1,-1), (-1,3), (3,-1)
    vec2 pos = vec2(
      (gl_VertexID == 2) ? 3.0 : -1.0,
      (gl_VertexID == 1) ? 3.0 : -1.0
    );

    gl_Position = vec4(pos, 0.0, 1.0);
    uv = pos * 0.5 + 0.5;
    // no y-flip here,
    // GL's rasterizer + texture sampling are both bottom-left origin,
    // so writes/reads agree and FBO chains stay consistent unflipped.
  }
`
