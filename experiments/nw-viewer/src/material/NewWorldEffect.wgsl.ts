import { COMMON_WGSL } from './common.wgsl'

export const NW_EFFECT_WGSL = /* wgsl */ `

struct MaterialBlock {
  baseColor:     vec3<f32>,
  alpha:         f32,
  emissiveColor: vec3<f32>,
  roughness:     f32,
  specularColor: vec3<f32>,
  alphaClip:     f32,
  ior:           f32,
};

struct SettingsBlock {
  lightingEnabled:      u32,
  textureEnabled:       u32,
  normalEnabled:        u32,
  specularEnabled:      u32,
  normalMapEnabled:     u32,
  smoothnessMapEnabled: u32,
  debug:                u32,

};

@group(0) @binding(0) var<uniform> object : ObjectBlock;
@group(0) @binding(1) var<uniform> view : ViewBlock;
@group(0) @binding(2) var<uniform> material : MaterialBlock;
@group(0) @binding(3) var<uniform> lights : LightBlock;
@group(0) @binding(4) var<uniform> settings : SettingsBlock;
@group(0) @binding(5) var<uniform> env : EnvBlock;

@group(1) @binding(0) var baseColorMap : texture_2d<f32>;
@group(1) @binding(1) var baseColorSampler : sampler;

@group(1) @binding(2) var specularColorMap : texture_2d<f32>;
@group(1) @binding(3) var specularColorSampler : sampler;

@group(1) @binding(4) var normalMap : texture_2d<f32>;
@group(1) @binding(5) var normalSampler : sampler;

@group(1) @binding(6) var smoothnessMap : texture_2d<f32>;
@group(1) @binding(7) var smoothnessSampler : sampler;

struct VertexInput {
  // @alias position
  @location(0) aPosition : vec3<f32>,
  // @alias normal
  @location(1) aNormal : vec3<f32>,
  // @alias texture
  @location(2) aTexture : vec2<f32>,
  // @alias color
  @location(3) aColor : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
  @location(1) vColor : vec4<f32>,
  @location(2) vWorldPos : vec3<f32>,
  @location(3) vTexCoord : vec2<f32>,
  @location(4) vToEyeInWS : vec3<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;

  let worldPos = object.modelMatrix * vec4<f32>(input.aPosition, 1.0);
  let viewPos = view.viewMatrix * worldPos;
  let viewPosWrap = paniniWarpCommon(viewPos);

  output.vWorldPos = worldPos.xyz;
  output.vNormal = normalize((object.modelMatrix * vec4<f32>(input.aNormal, 0.0)).xyz);
  output.vTexCoord = input.aTexture;
  output.vColor = input.aColor;
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  // output.Position = view.projectionMatrix * viewPos;
  output.Position = view.projectionMatrix * viewPosWrap;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let toEye = normalize(view.cameraPosition - input.vWorldPos);
  var baseColor = vec4<f32>(1.0);

  if (settings.textureEnabled == 1u) {
    baseColor = textureSampleLevel(baseColorMap, baseColorSampler, input.vTexCoord, 0);
  }

  var alpha = baseColor.a * material.alpha;
  if (alpha < material.alphaClip) {
    discard;
  }
  alpha = 1.0;

  var surface : SurfaceParams;
  surface.Normal = vec4<f32>(normalize(input.vNormal), 1.0);
  surface.BaseColor = vec4<f32>(baseColor.rgb * srgbToLinear(material.baseColor), baseColor.a);
  surface.Specular = srgbToLinear(material.specularColor);
  surface.Roughness =  material.roughness;
  surface.Metallic = 0.0;
  surface.Ior = material.ior;

  if (settings.normalMapEnabled == 1u) {
    let normalSample = textureSample(normalMap, normalSampler, input.vTexCoord).rgb;
    let normal =  decodeNormal(normalSample.xy);
    let tbn = getCotangentFrame(input.vWorldPos, surface.Normal.xyz, input.vTexCoord);
    surface.Normal = vec4(normalize(tbn * normal), 1.0);
  }

  if (settings.specularEnabled == 1u) {
    surface.Specular *= textureSampleLevel(specularColorMap, specularColorSampler, input.vTexCoord, 0).rgb;
  }

  if (settings.smoothnessMapEnabled == 1u) {
    let glossSample = textureSample(smoothnessMap, smoothnessSampler, input.vTexCoord).r;
    surface.Roughness = smoothnessToRoughness(glossSample);
  }

  var color = accumulateLight(lights, env, surface, toEye, input.vWorldPos);

  if (settings.debug > 0u) {
    if (settings.debug == DEBUG_MATERIAL) {
      return vec4<f32>(surface.Metallic, surface.Roughness, surface.Ior, 1.0);
    }
    if (settings.debug == DEBUG_NORMALS) {
      return vec4<f32>(surface.Normal.xyz * 0.5 + 0.5, 1.0);
    }
    if (settings.debug == DEBUG_UVS) {
      return vec4<f32>(input.vTexCoord, 0.0, 1.0);
    }
    if (settings.debug == DEBUG_COLOR) {
      return input.vColor;
    }
  }

  return applyFog(color, alpha, input.vWorldPos, view.cameraPosition);
}
${COMMON_WGSL}
`
