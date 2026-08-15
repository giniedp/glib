export const SKYBOX_WGSL: string = /* wgsl */ `

  struct ViewBlock {
    viewProjectionMatrix: mat4x4f,
  };

  struct ObjectBlock {
    modelMatrix: mat4x4f,
  };

  struct MaterialBlock {
    intensity : f32,
    blur      : f32,
    mipCount  : i32,
  };

  @group(0) @binding(1) var<uniform> view: ViewBlock;
  @group(0) @binding(2) var<uniform> object: ObjectBlock;
  @group(0) @binding(3) var<uniform> material: MaterialBlock;
  // @block material
  @group(1) @binding(0) var environmentMap : texture_cube<f32>;
  // @block material
  @group(1) @binding(1) var environmentMapSampler : sampler;

  struct VertexInput {
    // @alias position
    @location(0) position: vec3f,
  }

  struct FragmentInput {
    @builtin(position) position : vec4f,
    @location(0) uv : vec3f,
  }

  @vertex
  fn vs_main(input: VertexInput) -> FragmentInput {
    var output: FragmentInput;

    var rot = object.modelMatrix;
    rot[3] = vec4f(0.0, 0.0, 0.0, 0.1);
    output.uv = (rot * vec4(input.position, 1.0)).xyz;

    var m = view.viewProjectionMatrix;
    m[3] = vec4(0.0, 0.0, 0.0, 0.1);
    output.position = (m * vec4(input.position, 1.0)).xyww;

    return output;
  }

  @fragment
  fn fs_main(input: FragmentInput) -> @location(0) vec4f {
    let uv = input.uv;
    let mip = material.blur * f32(material.mipCount - 1);
    var color = textureSampleLevel(environmentMap, environmentMapSampler, uv, mip);
    return vec4f(color.rgb * material.intensity, 1.0);
  }
`
