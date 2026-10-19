export const SPRITE_EFFECT_WGSL = /* wgsl */ `

  struct ViewBlock {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
  };

  struct SettingsBlock {
    alphaCutoff: f32,
  };

  @group(0) @binding(0) var<uniform> view: ViewBlock;
  @group(0) @binding(1) var<uniform> settings: SettingsBlock;
  @group(0) @binding(2) var colorMapSampler: sampler;
  @group(0) @binding(3) var colorMap: texture_2d<f32>;

  const CORNERS = array<vec2f, 4>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0),
  );

  struct VertexInput {
    @location(0) origin: vec3f,
    @location(1) axisX: vec3f,
    @location(2) axisY: vec3f,
    @location(3) texcoord: vec4f,
    @location(4) color: vec4f,
    @builtin(vertex_index) vertexIndex: u32,
  };

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) vUV: vec2f,
    @location(1) vColor: vec4f,
  };

  @vertex
  fn vs_main(input: VertexInput) -> VertexOutput {
    let corner = CORNERS[input.vertexIndex % 4u];
    let position = input.origin + corner.x * input.axisX + corner.y * input.axisY;

    var output: VertexOutput;
    output.position = view.projectionMatrix * view.viewMatrix * vec4f(position, 1.0);
    output.vUV = mix(input.texcoord.xy, input.texcoord.zw, corner);
    output.vColor = input.color;
    return output;
  }

  @fragment
  fn fs_main(
    @location(0) vUV: vec2f,
    @location(1) vColor: vec4f,
  ) -> @location(0) vec4f {
    let color = textureSample(colorMap, colorMapSampler, vUV) * vColor;
    if (color.a < settings.alphaCutoff) {
      discard;
    }
    return color;
  }
`
