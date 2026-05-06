const commmons = /* wgsl */ `
  const faceMat = array(
    mat3x3f( 0,  0,  -2,  0, -2,   0,  1,  1,   1),   // +x
    mat3x3f( 0,  0,   2,  0, -2,   0, -1,  1,  -1),   // -x
    mat3x3f( 2,  0,   0,  0,  0,   2, -1,  1,  -1),   // +y
    mat3x3f( 2,  0,   0,  0,  0,  -2, -1, -1,   1),   // -y
    mat3x3f( 2,  0,   0,  0, -2,   0, -1,  1,   1),   // +z
    mat3x3f(-2,  0,   0,  0, -2,   0,  1,  1,  -1));  // -z

  struct VSOutput {
    @builtin(position)
    position: vec4f,

    @location(0)
    texcoord: vec2f,

    @location(1)
    @interpolate(flat, either)
    baseArrayLayer: u32,
  };

  @vertex
  fn vertexMain(
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32
  ) -> VSOutput {
    var pos = array<vec2f, 3>(
      vec2f(-1.0, -1.0),
      vec2f(-1.0,  3.0),
      vec2f( 3.0, -1.0),
    );

    let xy = pos[vertexIndex];

    var out: VSOutput;
    out.position = vec4f(xy, 0.0, 1.0);
    out.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
    out.baseArrayLayer = instanceIndex;

    return out;
  }
`

export const MIPMAPS_2D = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_2d<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    return textureSample(textureMap, textureMapSampler, input.texcoord);
  }
`

export const MIPMAPS_2D_ARRAY = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_2d_array<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    return textureSample(
      textureMap,
      textureMapSampler,
      input.texcoord,
      input.baseArrayLayer);
  }
`

export const MIPMAPS_CUBE = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_cube<f32>;

  @fragment
  fn fragmentMain(input: VSOutput) -> @location(0) vec4f {
    let uv = faceMat[input.baseArrayLayer] * vec3f(fract(input.texcoord), 1);
    return textureSample(textureMap, textureMapSampler, uv);
  }
`

export const MIPMAPS_CUBE_ARRAY = /* wgsl */ `
  ${commmons}

  @group(0)
  @binding(0)
  var textureMapSampler: sampler;

  @group(0)
  @binding(1)
  var textureMap: texture_cube_array<f32>;

  @fragment
  fn fragmentMain(fsInput: VSOutput) -> @location(0) vec4f {
    let uv = faceMat[fsInput.baseArrayLayer] * vec3f(fract(fsInput.texcoord), 1);
    return textureSample(textureMap, textureMapSampler, uv, fsInput.baseArrayLayer);
  }
`
