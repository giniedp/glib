export const FULLSCREEN_WGSL_VS = /* wgsl */ `
  struct FragmentInput {
    @builtin(position) position : vec4f,
    @location(0) uv : vec2f,

    @location(1)
    @interpolate(flat, either)
    instanceIndex: u32,
  };

  @vertex
  fn vs(
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex: u32,
  ) -> FragmentInput {
    // oversized full-screen triangle: (-1,-1), (-1,3), (3,-1)
    var pos = vec2f(
      select(-1.0, 3.0, vertexIndex == 2u),
      select(-1.0, 3.0, vertexIndex == 1u)
    );

    var out : FragmentInput;
    out.position = vec4f(pos, 0.0, 1.0);
    out.uv = pos * 0.5 + vec2f(0.5);
    // flip y so texture coordinates are top-left origin
    out.uv.y = 1.0 - out.uv.y;

    out.instanceIndex = instanceIndex;
    return out;
  }
`
