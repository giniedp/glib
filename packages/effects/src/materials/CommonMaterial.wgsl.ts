export const COMMON_EFFECT_WGSL: string = /* wgsl */ `

const LIGHT_COUNT: i32 = 8;
const LIGHT_TYPE_OFF: i32 = 0;
const LIGHT_TYPE_DIRECTIONAL: i32 = 1;
const LIGHT_TYPE_POINT: i32 = 2;
const LIGHT_TYPE_SPOT: i32 = 3;
const TRUE: u32 = 1u;
const FALSE: u32 = 0u;
const PI: f32 = 3.141592653589793;

//              | Directional   | Point Light | Spot Light
// color     R  | color         | color       | color
// color     G  | color         | color       | color
// color     B  | color         | color       | color
// color     A  | type: 1       | type: 2     | type: 3
//              |               |             |
// position  R  | -             | pos         | pos
// position  G  | -             | pos         | pos
// position  B  | -             | pos         | pos
// position  A  | -             | range       | range
//              |               |             |
// direction R  | direction     | -           | direction
// direction G  | direction     | -           | direction
// direction B  | direction     | -           | direction
// direction A  | -             | -           | fov

struct Light {
  color: vec4f,
  position: vec4f,
  direction: vec4f,
};

struct EnvBlock {
  lights: array<Light, LIGHT_COUNT>,
  fogColor: vec3f,
  fogNear: f32,
  fogFar: f32,
};

struct IblBlock {
  rotation: mat3x3f,
  intensity: f32,
  mipCount: u32,
};

struct ViewBlock {
  viewMatrix: mat4x4f,
  projectionMatrix: mat4x4f,
  cameraPosition: vec3f,
};

struct ObjectBlock {
  modelMatrix: mat4x4f,
};

struct MaterialBlock {
  baseColor       : vec3f,   // default 1.0,1.0,1.0
  alpha           : f32,     // default 1.0

  specularColor   : vec3f,   // default 1.0,1.0,1.0
  specularWeight  : f32,     // default 1.0

  emissiveColor   : vec3f,   // default 0.0,0.0,0.0
  emissiveStrength: f32,     // default 1.0

  ior             : f32,     // default 1.5
  metallic        : f32,     // default 1.0
  roughness       : f32,     // default 1.0
  alphaClip       : f32,     // default 0.0

  textureMod      : mat4x4f, // default identity
};

struct SettingsBlock {
  useFog                 : u32,
  useIBL                 : u32,
  useLights              : u32,
  useBlend               : u32,
  useBaseMap             : u32,
  useNormalMap           : u32,
  useSpecularMap         : u32,
  useSmoothnessMap       : u32,
  useOcclusionMap        : u32,
  useEmissiveMap         : u32,
  useMetallicRoughnessMap: u32,
  useTextureMod          : u32,
  useVertexColor         : u32,
  useVertexTangent       : u32,
};

struct ShadeParams {
  V: vec3f, // View vector, Vector to eye (camPos - worldPos)
  L: vec3f, // Light vector, Vector to light
  I: vec3f, // Light intensity
};

struct SurfaceParams {
  diffuse: vec3f,
  specular: vec3f,
  specularWeight: f32,
  normal: vec3f,
  f0: vec3f,
  f90: vec3f,
  metallic: f32,
  roughness: f32,
  ior: f32,
};

// Helper return type for getLight (WGSL has no out/inout parameters).
struct LightResult {
  lightVec: vec3f,
  lightColor: vec3f,
};

@group(0) @binding(0) var<uniform> global: EnvBlock;
@group(0) @binding(1) var<uniform> ibl: IblBlock;
@group(1) @binding(0) var<uniform> view: ViewBlock;
@group(2) @binding(0) var<uniform> object: ObjectBlock;
@group(3) @binding(0) var<uniform> material: MaterialBlock;
@group(3) @binding(1) var<uniform> settings: SettingsBlock;

// @block ibl
@group(0) @binding(2) var brdfMapSampler: sampler;
// @block ibl
@group(0) @binding(3) var brdfMap: texture_2d<f32>;
// @block ibl
@group(0) @binding(4) var radianceMapSampler: sampler;
// @block ibl
@group(0) @binding(5) var radianceMap: texture_cube<f32>;
// @block ibl
@group(0) @binding(6) var irradianceMapSampler: sampler;
// @block ibl
@group(0) @binding(7) var irradianceMap: texture_cube<f32>;

// @block texture
@group(3) @binding(2) var baseMapSampler: sampler;
// @block texture
@group(3) @binding(3) var baseMap: texture_2d<f32>;
// @block texture
@group(3) @binding(4) var metallicRoughnessMapSampler: sampler;
// @block texture
@group(3) @binding(5) var metallicRoughnessMap: texture_2d<f32>;
// @block texture
@group(3) @binding(6) var normalMapSampler: sampler;
// @block texture
@group(3) @binding(7) var normalMap: texture_2d<f32>;
// @block texture
@group(3) @binding(8) var specularMapSampler: sampler;
// @block texture
@group(3) @binding(9) var specularMap: texture_2d<f32>;
// @block texture
@group(3) @binding(10) var smoothnessMapSampler: sampler;
// @block texture
@group(3) @binding(11) var smoothnessMap: texture_2d<f32>;
// @block texture
@group(3) @binding(12) var occlusionMapSampler: sampler;
// @block texture
@group(3) @binding(13) var occlusionMap: texture_2d<f32>;
// @block texture
@group(3) @binding(14) var emissiveMapSampler: sampler;
// @block texture
@group(3) @binding(15) var emissiveMap: texture_2d<f32>;

fn srgbToLinear(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.04045);
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), step(cutoff, c));
}

fn linearToSrgb(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.0031308);
  return mix(12.92 * c, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, step(cutoff, c));
}

fn getRangeAttenuation(range: f32, distance: f32) -> f32 {
  if (range <= 0.0) {
    // no range defined -> inverse square law attenuation
    return 1.0 / pow(distance, 2.0);
  }
  return max(min(1.0 - pow(distance / range, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

fn getLight(light: Light, type_: i32, position: vec3f) -> LightResult {
  var result: LightResult;

  switch (type_) {
    case 1: { // LIGHT_TYPE_DIRECTIONAL
      // directional lights are at infinite distance and are not attenuated
      result.lightColor = light.color.rgb;
      result.lightVec = normalize(-light.direction.xyz);
      return result;
    }
    case 2: { // LIGHT_TYPE_POINT
      var lightVec = light.position.xyz - position;
      let range = light.position.a;
      let distance = length(lightVec);
      let attenuation = getRangeAttenuation(range, distance);

      result.lightColor = light.color.rgb * attenuation;
      result.lightVec = normalize(lightVec);
      return result;
    }
    case 3: { // LIGHT_TYPE_SPOT
      var lightVec = light.position.xyz - position;
      let range = light.position.a;
      let distance = length(lightVec);
      var attenuation = getRangeAttenuation(range, distance);

      // spot cutoff
      let cosAngle = light.direction.w;
      attenuation *= smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightVec, normalize(-light.direction.xyz)));

      result.lightColor = light.color.rgb * attenuation;
      result.lightVec = normalize(lightVec);
      return result;
    }
    default: {
      result.lightColor = vec3f(0.0);
      result.lightVec = vec3f(0.0);
      return result;
    }
  }
}

fn roughnessToPower(rIn: f32) -> f32 {
  let r = max(rIn, 0.04);
  return 2.0 / (r * r) - 2.0;
}

fn smoothnessToRoughness(smoothness: f32) -> f32 {
  return clamp((1.0 - smoothness) * (1.0 - smoothness), 0.025, 1.0);
}

fn roughnessToSmoothness(roughness: f32) -> f32 {
  return 1.0 - sqrt(roughness);
}

fn decodeNormalRGFloat(xy: vec2f) -> vec3f {
  let z = sqrt(clamp(1.0 - dot(xy, xy), 0.0, 1.0));
  return normalize(vec3f(xy, z));
}

fn decodeNormalRGBInt(rgb: vec3f) -> vec3f {
  return normalize(rgb * 2.0 - vec3f(1.0)) * vec3f(1.0, -1.0, 1.0);
}

fn fresnelSchlick(f0: vec3f, f90: vec3f, VdotH: f32) -> vec3f {
  // f0 + (f90 - f0) * pow(1.0 - VdotH, 5.0);
  let p = clamp(1.0 - VdotH, 0.0, 1.0);
  let p2 = p * p;
  let p5 = p * p2 * p2;
  return f0 + (f90 - f0) * p5;
}

// Fragment-shader only (uses dpdx/dpdy).
fn getCotangentFrame(position: vec3f, normal: vec3f, uv: vec2f) -> mat3x3f {
  let posdx = dpdx(position);
  let posdy = dpdy(position);
  let uvdx = dpdx(uv);
  let uvdy = dpdy(uv);

  let q1perp = cross(posdy, normal);
  let q0perp = cross(normal, posdx);

  let tangent = q1perp * uvdx.x + q0perp * uvdy.x;
  let bitangent = q1perp * uvdx.y + q0perp * uvdy.y;

  let det = max(dot(tangent, tangent), dot(bitangent, bitangent));
  var scale = 0.0;
  if (det != 0.0) {
    scale = inverseSqrt(det);
  }

  return mat3x3f(
    tangent * scale,
    bitangent * scale,
    normal
  );
}

// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
// see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3
// see Real-Time Rendering. Page 331 to 336.
// see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)
fn V_GGX(NdotL: f32, NdotV: f32, roughness: f32) -> f32 {
  let rSq = roughness * roughness;

  let GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - rSq) + rSq);
  let GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - rSq) + rSq);

  let GGX = GGXV + GGXL;
  if (GGX > 0.0) {
    return 0.5 / GGX;
  }
  return 0.0;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
fn D_GGX(NdotH: f32, roughness: f32) -> f32 {
  let rSq = roughness * roughness;
  let f = (NdotH * NdotH) * (rSq - 1.0) + 1.0;
  return rSq / (PI * f * f);
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
fn BRDF_lambertian(diffuseColor: vec3f) -> vec3f {
  // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
  return (diffuseColor / PI);
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
fn BRDF_specularGGX(alphaRoughness: f32, NdotL: f32, NdotV: f32, NdotH: f32) -> vec3f {
  let Vis = V_GGX(NdotL, NdotV, alphaRoughness);
  let D = D_GGX(NdotH, alphaRoughness);

  return vec3f(Vis * D);
}

fn shadeLight(shade: ShadeParams, surface: SurfaceParams) -> vec3f {
  let I = shade.I;             // light intensity
  let L = shade.L;             // vector to light
  let V = shade.V;             // vector to eye
  let H = normalize(V + L);    // half vector
  let N = surface.normal.xyz;  // surface normal

  let NdotL = clamp(dot(N, L), 0.0, 1.0);
  let NdotV = clamp(dot(N, V), 0.0, 1.0);
  let NdotH = clamp(dot(N, H), 0.0, 1.0);
  let VdotH = clamp(dot(V, H), 0.0, 1.0);
  let alphaRoughness = surface.roughness * surface.roughness;

  let fresnelDielectric = fresnelSchlick(surface.f0 * surface.specularWeight, surface.f90, abs(VdotH));
  let fresnelMetallic = fresnelSchlick(surface.diffuse, vec3f(1.0), abs(VdotH));

  let diffuse = I * NdotL * BRDF_lambertian(surface.diffuse);

  let specularMetallic = I * NdotL * BRDF_specularGGX(alphaRoughness, NdotL, NdotV, NdotH);
  let specularDielectric = specularMetallic;

  let brdfMetallic = fresnelMetallic * specularMetallic;
  let brdfDielectric = mix(diffuse, specularDielectric, fresnelDielectric);

  return mix(brdfDielectric, brdfMetallic, surface.metallic);
}

fn accumulateLights(surface: SurfaceParams, viewVec: vec3f, worldPos: vec3f) -> vec3f {
  var color = vec3f(0.0);
  var shade: ShadeParams;
  shade.V = viewVec;

  for (var i: i32 = 0; i < LIGHT_COUNT; i++) {
    let light = global.lights[i];

    let type_ = i32(light.color.w);
    if (type_ <= 0) {
      break; // stop on first light that is off
    }

    let result = getLight(light, type_, worldPos.xyz);
    shade.L = result.lightVec;
    shade.I = result.lightColor;
    color += shadeLight(shade, surface);
  }

  return color;
}

fn getIBLRadianceGGX(n: vec3f, v: vec3f, roughness: f32) -> vec3f {
  let NdotV = clamp(dot(n, v), 0.0, 1.0);
  let lod = roughness * f32(ibl.mipCount - 1u);
  let reflection = normalize(reflect(-v, n));

  // TODO: fix rotation, mat3 upload
  // let specularLight = textureSampleLevel(radianceMap, radianceMapSampler, ibl.rotation * reflection, lod).rgb;
  var specularLight = textureSampleLevel(radianceMap, radianceMapSampler, reflection, lod).rgb;
  specularLight *= ibl.intensity;

  return specularLight;
}

fn getIBLGGXFresnel(n: vec3f, v: vec3f, roughness: f32, F0: vec3f, specularWeight: f32) -> vec3f {
  // see https://bruop.github.io/ibl/#single_scattering_results at Single Scattering Results
  // Roughness dependent fresnel, from Fdez-Aguera
  let NdotV = clamp(dot(n, v), 0.0, 1.0);
  let brdfSamplePoint = clamp(vec2f(NdotV, roughness), vec2f(0.0, 0.0), vec2f(1.0, 1.0));
  let f_ab = textureSample(brdfMap, brdfMapSampler, brdfSamplePoint).rg;
  let Fr = max(vec3f(1.0 - roughness), F0) - F0;
  let k_S = F0 + Fr * pow(1.0 - NdotV, 5.0);
  let FssEss = specularWeight * (k_S * f_ab.x + f_ab.y);

  // Multiple scattering, from Fdez-Aguera
  let Ems = (1.0 - (f_ab.x + f_ab.y));
  let F_avg = specularWeight * (F0 + (1.0 - F0) / 21.0);
  let FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);

  return FssEss + FmsEms;
}

fn shadeIbl(surface: SurfaceParams, viewVec: vec3f) -> vec3f {
  // TODO: fix rotation, mat3 upload
  // var diffuse = textureSample(irradianceMap, irradianceMapSampler, ibl.rotation * surface.normal).rgb;
  var diffuse = textureSample(irradianceMap, irradianceMapSampler, surface.normal).rgb;
  diffuse *= ibl.intensity;
  diffuse *= surface.diffuse.rgb;

  let specularMetallic = getIBLRadianceGGX(surface.normal, viewVec, surface.roughness);
  let specularDielectric = specularMetallic;

  let fresnelMetallic = getIBLGGXFresnel(
    surface.normal,
    viewVec,
    surface.roughness,
    surface.diffuse.rgb,
    1.0
  );
  let fresnelDielectric = getIBLGGXFresnel(
    surface.normal,
    viewVec,
    surface.roughness,
    surface.f0,
    surface.specularWeight
  );

  let brdfMetallic = specularMetallic * fresnelMetallic;
  let brdfDielectric = mix(diffuse, specularDielectric, fresnelDielectric);

  return mix(brdfDielectric, brdfMetallic, surface.metallic);
}

// ---------------------------------------------------------------------------
// Vertex stage
// ---------------------------------------------------------------------------

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) texture: vec2f,
  @location(2) normal: vec3f,
  @location(3) tangent: vec4f,
  @location(4) color: vec4f,
};

struct VertexOutput {
  @builtin(position) clipPosition: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) worldTangent: vec3f,
  @location(3) worldBitangent: vec3f,
  @location(4) color: vec4f,
  @location(5) uvBase: vec2f,
  @location(6) fogFactor: f32,
};

@vertex
fn vs_main(vert: VertexInput) -> VertexOutput {
  var out: VertexOutput;

  let modelMatrix = object.modelMatrix;
  let worldPos = modelMatrix * vec4f(vert.position.xyz, 1.0);
  let viewPos = view.viewMatrix * worldPos;
  let clipPos = view.projectionMatrix * viewPos;

  out.clipPosition = clipPos;
  out.worldPosition = worldPos.xyz;

  var rotMatrix = modelMatrix;
  rotMatrix[3] = vec4f(0.0, 0.0, 0.0, 1.0);
  out.worldNormal = normalize((rotMatrix * vec4f(vert.normal, 1.0)).xyz);

  out.worldTangent = vec3f(0.0);
  out.worldBitangent = vec3f(0.0);
  if (settings.useNormalMap == TRUE && settings.useVertexTangent == TRUE) {
    out.worldTangent = normalize((rotMatrix * vec4f(vert.tangent.xyz, 1.0)).xyz);
    out.worldBitangent = cross(out.worldNormal, out.worldTangent) * vert.tangent.a;
  }

  out.uvBase = vert.texture.xy;
  if (settings.useTextureMod == TRUE) {
    out.uvBase = (material.textureMod * vec4f(out.uvBase.xy, 0.0, 1.0)).xy;
  }

  out.fogFactor = 1.0;
  if (settings.useFog == TRUE) {
    let dist = length(viewPos.xyz);
    out.fogFactor = clamp((global.fogFar - dist) / (global.fogFar - global.fogNear), 0.0, 1.0);
  }

  out.color = vec4f(1.0);
  if (settings.useVertexColor == TRUE) {
    out.color = vert.color;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Fragment stage
// ---------------------------------------------------------------------------

struct FragmentInput {
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) worldTangent: vec3f,
  @location(3) worldBitangent: vec3f,
  @location(4) color: vec4f,
  @location(5) uvBase: vec2f,
  @location(6) fogFactor: f32,
};

@fragment
fn fs_main(frag: FragmentInput) -> @location(0) vec4f {

  let viewVec = normalize(view.cameraPosition - frag.worldPosition);

  var baseColor = frag.color * vec4f(material.baseColor, material.alpha);
  if (settings.useBaseMap == TRUE) {
    baseColor *= textureSample(baseMap, baseMapSampler, frag.uvBase);
  }

  var metallic = material.metallic;
  var roughness = material.roughness;
  if (settings.useMetallicRoughnessMap == TRUE) {
    let px = textureSample(metallicRoughnessMap, metallicRoughnessMapSampler, frag.uvBase);
    metallic *= px.b;
    roughness *= px.g;
  }

  var specular = material.specularColor; // linear color
  var specularWeight = material.specularWeight;
  if (settings.useSpecularMap == TRUE) {
    specular *= textureSample(specularMap, specularMapSampler, frag.uvBase).rgb;
  }
  if (settings.useSmoothnessMap == TRUE) {
    let px = textureSample(smoothnessMap, smoothnessMapSampler, frag.uvBase);
    if (material.ior == 0.0 && metallic == 0.0) {
      // specular glossiness flow
      roughness = 1.0 - ((1.0 - roughness) * px.a);
      specularWeight = 1.0;
    } else {
      // specular flow
      specularWeight *= px.a;
    }
  }

  var emissive = material.emissiveColor * material.emissiveStrength;
  if (settings.useEmissiveMap == TRUE) {
    emissive *= textureSample(emissiveMap, emissiveMapSampler, frag.uvBase).rgb;
  }

  var normal = normalize(frag.worldNormal);
  if (settings.useNormalMap == TRUE) {
    var tbn: mat3x3f;
    if (settings.useVertexTangent == TRUE) {
      tbn = mat3x3f(
        normalize(frag.worldTangent),
        normalize(frag.worldBitangent),
        normal
      );
    } else {
      tbn = getCotangentFrame(frag.worldPosition, normal, frag.uvBase);
    }

    let pixel = textureSample(normalMap, normalMapSampler, frag.uvBase).rgb;
    normal = normalize(tbn * decodeNormalRGBInt(pixel).rgb);
  }

  var alpha = baseColor.a;
  if (alpha < material.alphaClip) {
    discard;
  }

  if (settings.useBlend == FALSE) {
    alpha = 1.0;
  }

  let ior = material.ior;
  var f0 = vec3f(pow((ior - 1.0) / (ior + 1.0), 2.0));
  var f90 = vec3f(1.0);
  // specular flow
  f0 = min(f0 * specular.rgb, vec3f(1.0));
  f90 = vec3f(specularWeight);
  // specular flow end

  var surface: SurfaceParams;
  surface.diffuse = baseColor.rgb;
  surface.specular = specular.rgb;
  surface.specularWeight = specularWeight;
  surface.normal = normal.xyz;
  surface.ior = ior;
  surface.metallic = metallic;
  surface.roughness = roughness;
  surface.f0 = f0;
  surface.f90 = f90;

  var color = mix(surface.diffuse.rgb, vec3f(0.0), f32(settings.useLights));
  if (settings.useIBL == TRUE) {
    color = shadeIbl(surface, viewVec);
  }
  if (settings.useOcclusionMap == TRUE) {
    color *= textureSample(occlusionMap, occlusionMapSampler, frag.uvBase).r;
  }
  if (settings.useLights == TRUE) {
    color += accumulateLights(surface, viewVec, frag.worldPosition);
  }
  color += emissive;
  color = mix(global.fogColor, color.rgb, frag.fogFactor);

  // color = vec3f(frag.uvBase, 0.0);
  // color = surface.diffuse.rgb;
  // color = surface.specular.rgb;
  // color = emissive;
  // color = normalize(surface.normal) * 0.5 + vec3f(0.5);
  // color = normalize(frag.worldNormal) * 0.5 + vec3f(0.5);
  // color = normalize(frag.worldTangent) * 0.5 + vec3f(0.5);
  // color = viewVec * 0.5 + vec3f(0.5);
  // color = vec3f(surface.ior);
  // color = vec3f(surface.metallic);
  // color = vec3f(surface.roughness);
  // color = vec3f(surface.specularWeight);
  // color = f0;
  // color = f90;
  // color = normalize(frag.worldPosition) * 0.5 + vec3f(0.5);
  // color = normalize(view.cameraPosition) * 0.5 + vec3f(0.5);
  // color = vec3f(dot(surface.normal, viewVec));
  // color = textureSample(normalMap, normalMapSampler, frag.uvBase).rgb;
  // color = textureSample(baseMap, baseMapSampler, frag.uvBase).rgb;
  // color = textureSample(baseMap, baseMapSampler, frag.uvBase).aaa;
  // color = textureSample(specularMap, specularMapSampler, frag.uvBase).rgb;
  // color = textureSample(smoothnessMap, smoothnessMapSampler, frag.uvBase).aaa;
  // color = textureSample(metallicRoughnessMap, metallicRoughnessMapSampler, frag.uvBase).rgb;

  return vec4f(color, alpha);
}
`
