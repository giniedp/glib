export const BASIC_EFFECT_WGSL: string = /* wgsl */ `

struct GlobalBlock {
  skyColor      : vec3f,   // default 1.0,1.0,1.0
  groundColor   : vec3f,   // default 1.0,1.0,1.0
  skyDirection  : vec3f,   // default 0.0,1.0,0.0
};

struct ViewBlock {
  viewMatrix       : mat4x4f,
  projectionMatrix : mat4x4f,
};

struct ObjectBlock {
  modelMatrix : mat4x4f,
};

struct MaterialBlock {
  baseColor  : vec3f,   // default 1.0,1.0,1.0
  alpha      : f32,     // default 1.0
  alphaClip  : f32,     // default 0.0
  textureMod : mat4x4f, // default identity
};

struct SettingsBlock {
  useFog         : u32, // enables fog
  useSun         : u32, // enables sun light
  useBlend       : u32, // indicates that alpha blending is used
  useBaseMap     : u32, // enables base color texture
  useVertexColor : u32, // enables vertex color tint
};

const TRUE  : u32 = 1u;
const FALSE : u32 = 0u;

@group(0) @binding(0) var<uniform> global   : GlobalBlock;
@group(1) @binding(0) var<uniform> view     : ViewBlock;
@group(2) @binding(0) var<uniform> object   : ObjectBlock;
@group(3) @binding(0) var<uniform> material : MaterialBlock;
@group(3) @binding(1) var<uniform> settings : SettingsBlock;

// @block texture
@group(3) @binding(2) var baseMap : texture_2d<f32>;
// @block texture
@group(3) @binding(3) var baseMapSampler : sampler;

struct VertexInput {
  @location(0) position : vec3f,
  @location(1) texture  : vec2f,
  @location(2) normal   : vec3f,
  @location(3) color    : vec4f,
};

struct VertexOutput {
  @builtin(position) clipPosition : vec4f,
  @location(0) vWorldNormal : vec3f,
  @location(1) vColor       : vec4f,
  @location(2) vUvBase      : vec2f,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;

  let modelMatrix = object.modelMatrix;
  let worldPos = modelMatrix * vec4f(input.position.xyz, 1.0);
  let viewPos = view.viewMatrix * worldPos;
  let clipPos = view.projectionMatrix * viewPos;

  out.clipPosition = clipPos;

  var rotMatrix = modelMatrix;
  rotMatrix[3] = vec4f(0.0, 0.0, 0.0, 1.0);

  var normal = input.normal;
  if (length(normal) == 0.0) {
    // assume, normal stream not given and project position instead
    normal = normalize(input.position);
  }
  out.vWorldNormal = normalize((rotMatrix * vec4f(normal, 1.0)).xyz);

  out.vUvBase = (material.textureMod * vec4f(input.texture.xy, 0.0, 1.0)).xy;

  out.vColor = vec4f(1.0);
  if (settings.useVertexColor == TRUE) {
    out.vColor = input.color;
  }

  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  var baseColor = in.vColor * vec4f(material.baseColor, material.alpha);
  if (settings.useBaseMap == TRUE) {
    baseColor *= textureSample(baseMap, baseMapSampler, in.vUvBase);
  }

  let normal = normalize(in.vWorldNormal);

  if (baseColor.a < material.alphaClip) {
    discard;
  }
  if (settings.useBlend == FALSE) {
    baseColor.a = 1.0;
  }

  let light = mix(global.groundColor, global.skyColor, dot(global.skyDirection, normal) * 0.5 + 0.5);

  return vec4f(baseColor.rgb * light, baseColor.a);
}
`
