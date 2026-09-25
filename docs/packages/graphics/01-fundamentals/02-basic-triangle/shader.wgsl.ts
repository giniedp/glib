export const wgslShader = /*wgsl*/ `
  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
  };

  @vertex
  fn vs(
    @location(0) vPosition : vec3<f32>
  ) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(vPosition, 1.0);
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  }
`
