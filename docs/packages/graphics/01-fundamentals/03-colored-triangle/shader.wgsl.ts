export const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    // Interpolated across the triangle's surface for the fragment shader.
    @location(0) vertexColor : vec3<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    output.vertexColor = input.vColor;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.vertexColor, 1.0);
  }
`
