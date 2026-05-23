import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct InstanceBlock {
  position: vec4<f32>,
  scale:    vec4<f32>,
  color:    vec4<f32>,
};

@group(0) @binding(0) var<uniform> global: GlobalBlock;
@group(0) @binding(1) var<uniform> view: ViewBlock;
@group(0) @binding(2) var<uniform> object: ObjectBlock;
@group(0) @binding(3) var<storage, read> instances: array<InstanceBlock, 1>; // default size, will be dynamically resized by the material

struct VertexInput {
  // @alias position
  @location(0) aPosition: vec3<f32>,
  @builtin(instance_index) id: u32,
};

struct FragmentInput {
  @builtin(position) Position: vec4<f32>,
  @location(0)       color:    vec4<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let instance = instances[input.id];

  var output: FragmentInput;
  var position = input.aPosition * instance.scale.xyz + instance.position.xyz;
  let worldPos = object.modelMatrix * vec4<f32>(position, 1.0);
  let viewPos = paniniWarpCommon(view.viewMatrix * worldPos);

  output.Position = view.projectionMatrix * viewPos;
  output.color = instance.color;

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
  return input.color;
}
${COMMON_WGSL}
`
