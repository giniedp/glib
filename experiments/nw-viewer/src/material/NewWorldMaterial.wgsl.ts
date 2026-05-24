import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct MaterialBlock {
  baseColor:     vec3<f32>,
  alpha:         f32,
  emissiveColor: vec3<f32>,
  roughness:     f32,
  specularColor: vec3<f32>,
  alphaClip:     f32,
  ior:           f32,
  textureEnabled:       u32,
  normalEnabled:        u32,
  specularEnabled:      u32,
  smoothnessMapEnabled: u32,
};


@group(0) @binding(0) var<uniform> global : GlobalBlock;
@group(0) @binding(1) var<storage, read> object : array<ObjectBlock, 1>;
@group(0) @binding(2) var<uniform> view : ViewBlock;
@group(0) @binding(3) var<uniform> lights : LightBlock;
@group(0) @binding(4) var<uniform> material : MaterialBlock;

// @block material
@group(1) @binding(0) var baseColorMap : texture_2d<f32>;
// @block material
@group(1) @binding(1) var baseColorSampler : sampler;

// @block material
@group(1) @binding(2) var specularColorMap : texture_2d<f32>;
// @block material
@group(1) @binding(3) var specularColorSampler : sampler;

// @block material
@group(1) @binding(4) var normalMap : texture_2d<f32>;
// @block material
@group(1) @binding(5) var normalSampler : sampler;

// @block material
@group(1) @binding(6) var smoothnessMap : texture_2d<f32>;
// @block material
@group(1) @binding(7) var smoothnessSampler : sampler;

struct VertexInput {
  @builtin(instance_index) id: u32,
  // @alias position
  @location(0) aPosition : vec3<f32>,
  // @alias normal
  @location(1) aNormal : vec3<f32>,
  // @alias texture
  @location(2) aTexture : vec2<f32>,
  // @alias tangent
  @location(4) aTangent : vec4<f32>,
  // @alias color
  //@location(3) aColor : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
  @location(1) vColor : vec4<f32>,
  @location(2) vWorldPos : vec3<f32>,
  @location(3) vTexCoord : vec2<f32>,
  @location(4) vToEyeInWS : vec3<f32>,
  @location(5) vTangent   : vec3f,
  @location(6) vBinormal  : vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  let modelMatrix = object[input.id].modelMatrix;

  let worldPos = modelMatrix * vec4<f32>(input.aPosition, 1.0);
  let viewPos = view.viewMatrix * worldPos;
  let viewPosWrap = paniniWarpCommon(viewPos);

  let N = normalize((modelMatrix * vec4f(input.aNormal,          0.0)).xyz);
  let T = normalize((modelMatrix * vec4f(input.aTangent.xyz,     0.0)).xyz);
  let B = cross(N, T) * input.aTangent.w;

  output.vWorldPos = worldPos.xyz;
  output.vNormal    = N;
  output.vTangent   = T;
  output.vBinormal  = B;
  output.vTexCoord = input.aTexture;
  //output.vColor = input.aColor;
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  output.Position = view.projectionMatrix * viewPosWrap;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let toEye = normalize(view.cameraPosition - input.vWorldPos);
  let texCoord = input.vTexCoord;

  var baseColor = vec4<f32>(1.0);

  if (material.textureEnabled == 1u) {
    baseColor = textureSampleLevel(baseColorMap, baseColorSampler, texCoord, 0);
  }

  var alpha = baseColor.a * material.alpha;
  if (alpha < material.alphaClip) {
    discard;
  }
  alpha = 1.0;

  var surface : SurfaceParams;


  surface.BaseColor = vec4<f32>(baseColor.rgb * srgbToLinear(material.baseColor), baseColor.a);
  surface.Specular = srgbToLinear(material.specularColor);
  surface.Roughness =  material.roughness;
  surface.Metallic = 0.0;
  surface.Ior = material.ior;

  let normalSample = textureSample(normalMap, normalSampler, texCoord).rgb;
  let normal       = decodeNormal(normalSample.xy);
  let tbn          = mat3x3f(
      normalize(input.vTangent),
      normalize(input.vBinormal),
      normalize(input.vNormal),
  );
  surface.Normal = vec4f(normalize(tbn * normal), 1.0);

  if (material.specularEnabled == 1u) {
    surface.Specular *= textureSampleLevel(specularColorMap, specularColorSampler, texCoord, 0).rgb;
  }

  if (material.smoothnessMapEnabled == 1u) {
    let glossSample = textureSample(smoothnessMap, smoothnessSampler, texCoord).r;
    surface.Roughness = smoothnessToRoughness(glossSample);
  }

  var color = accumulateLight(lights, global, surface, toEye, input.vWorldPos);

  let debug = global.debug;
  if (debug > 0u) {
    if (debug == DEBUG_MTL_BASE) {
      return vec4<f32>(surface.BaseColor.rgb, 1.0);
    }
    if (debug == DEBUG_MTL_SPEC) {
      return vec4<f32>(surface.Specular.rgb, 1.0);
    }
    if (debug == DEBUG_MTL_PBR) {
      return vec4<f32>(surface.Metallic, surface.Roughness, surface.Ior, 1.0);
    }

    if (debug == DEBUG_NORMALS) {
      return vec4<f32>(surface.Normal.xyz * 0.5 + 0.5, 1.0);
    }
    if (debug == DEBUG_TANGENTS) {
      return vec4<f32>(input.vTangent.xyz * 0.5 + 0.5, 1.0);
    }
    if (debug == DEBUG_BINORMALS) {
      return vec4<f32>(input.vBinormal.xyz * 0.5 + 0.5, 1.0);
    }

    if (debug == DEBUG_COLOR1) {
      return input.vColor;
    }
    if (debug == DEBUG_COLOR2) {
      return input.vColor;
    }

    if (debug == DEBUG_UV1) {
      return vec4<f32>(texCoord, 0.0, 1.0);
    }
    if (debug == DEBUG_UV2) {
      return vec4<f32>(texCoord, 0.0, 1.0);
    }
  }

  return applyFog(color, alpha, input.vWorldPos, view.cameraPosition);
}
${COMMON_WGSL}
`
