import { COMMON_WGSL } from './common.wgsl'

export const TERRAIN_PATCH_SHADER = /* wgsl */ `

struct MaterialBlock {
  baseColor:        vec3f,
  specularColor:    vec3f,
  roughness:        f32,

  heightMapUvTransform:       vec4f,
  heightMapUvTransformCoarse: vec4f,
  colorMapUvTransform:        vec4f,
  colorMapUvTransformCoarse:  vec4f,

  mountainHeight:  f32,
  normalScale:     f32,
  heightMapSize:   f32,
  morphLod:        f32,

  patchSize:       f32, // world size of the patch, e.g. 32, 64 etc
  baseFactor:      f32, // distance factor for LOD, e.g. 2
  lines:           f32,
};

struct SettingsBlock {
  debug:           u32,
};

@group(0) @binding(0) var<uniform> object:   ObjectBlock;
@group(0) @binding(1) var<uniform> view:     ViewBlock;
@group(0) @binding(2) var<uniform> material: MaterialBlock;
@group(0) @binding(3) var<uniform> lights:   LightBlock;
@group(0) @binding(4) var<uniform> settings: SettingsBlock;
@group(0) @binding(5) var<uniform> env:      EnvBlock;

@group(1) @binding(0) var heightMapSampler: sampler;
@group(1) @binding(1) var colorMapSampler:  sampler;

@group(2) @binding(0) var heightMap: texture_2d<f32>;
@group(2) @binding(1) var colorMap1: texture_2d<f32>;
@group(2) @binding(2) var colorMap2: texture_2d<f32>;

@group(3) @binding(0) var heightMapCoarse: texture_2d<f32>;
@group(3) @binding(1) var colorMap1Coarse: texture_2d<f32>;
@group(3) @binding(2) var colorMap2Coarse: texture_2d<f32>;


struct VertexInput {
   @builtin(vertex_index) vertexIndex : u32,
  // @alias position
  @location(0) aPosition : vec3f,
  // @alias normal
  @location(1) aNormal : vec3f,
  // @alias texture
  @location(2) aTexture : vec2f,
};

struct VertexOutput {
  @builtin(position) Position : vec4f,

  @location(0) vNormal    : vec3f,
  @location(1) vWorldPos  : vec3f,
  @location(2) vToEyeInWS : vec3f,
  @location(3) vTexCoord  : vec4f,
  @location(4) vTileUV    : vec4f,
  @location(5) vMorph     : f32,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;

  var worldPos = (object.modelMatrix * vec4f(input.aPosition, 1.0));

  let morph = lod_morph(
    input.aPosition.xz,         // raw grid position 0..64
    worldPos.xz,                // world space position
    view.cameraPosition.xz
  );
  worldPos.x += morph.offset.x;
  worldPos.z += morph.offset.y;

  let patchWorldSize = material.patchSize * exp2(material.morphLod);
  let uvDelta = -morph.offset / patchWorldSize;

  let heightMapUv       = uvScaleOffset(input.aTexture + uvDelta, material.heightMapUvTransform);
  let heightMapUvCoarse = uvScaleOffset(input.aTexture + uvDelta, material.heightMapUvTransformCoarse);

  let dataFine     = readMapData(heightMapUv);
  let dataCoarse   = readMapDataCoarse(heightMapUvCoarse);

  var height       = dataFine.a;
  let heightCoarse = height; // dataCoarse.a;

  var normal       = dataFine.xyz;
  let normalCoarse = dataCoarse.xyz;

  let blend = morph.t;
  normal = normalize(mix(normal, normalCoarse, blend));
  worldPos.y += mix(height, heightCoarse, blend);

  let viewPos = view.viewMatrix * worldPos;
  let viewPosWrap = paniniWarpCommon(viewPos);

  output.vWorldPos = worldPos.xyz;
  output.vNormal = normalize((object.modelMatrix * vec4f(normal, 0.0)).xyz);

  output.vTexCoord = vec4f(input.aTexture, input.aTexture + uvDelta);
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  output.vTileUV = vec4f(heightMapUv, heightMapUvCoarse);
  output.vMorph = blend;
  output.Position = view.projectionMatrix * viewPosWrap;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  if (material.lines > 0.5) {
    if (material.morphLod < 1.0) {
      return vec4f(1.0, 0.0, 0.0, 1.0);
    }
    if (material.morphLod < 2.0) {
      return vec4f(1.0, 1.0, 0.0, 1.0);
    }
    if (material.morphLod < 3.0) {
      return vec4f(0.0, 1.0, 1.0, 1.0);
    }
    if (material.morphLod < 4.0) {
      return vec4f(1.0, 0.0, 1.0, 1.0);
    }
    if (material.morphLod < 5.0) {
      return vec4f(1.0, 1.0, 1.0, 1.0);
    }
    return vec4f(1.0, 1.0, 1.0, 1.0);
  }
  let toEye = normalize(view.cameraPosition - input.vWorldPos);
  var baseColor = vec4f(srgbToLinear(material.baseColor), 1.0);

  let patchUv       = uvScaleOffset(input.vTexCoord.zw, material.colorMapUvTransform);
  let patchUvCoarse = uvScaleOffset(input.vTexCoord.zw, material.colorMapUvTransformCoarse);

  var sample1 = textureSample(colorMap1, colorMapSampler, patchUv); // base.rgb + normal.a
  var sample2 = textureSample(colorMap2, colorMapSampler, patchUv); // spec, smooth, height in rgb + normal.a

  let coarseSample1 = textureSample(colorMap1Coarse, colorMapSampler, patchUvCoarse);
  let coarseSample2 = textureSample(colorMap2Coarse, colorMapSampler, patchUvCoarse);

  // unpack fine normals
  let fineNormalXY   = vec2f(sample1.a, sample2.a) * 2.0 - 1.0;
  let fineNormalZ    = sqrt(max(0.0, 1.0 - dot(fineNormalXY, fineNormalXY)));
  let fineNormal     = normalize(vec3f(fineNormalXY, fineNormalZ));

  // unpack coarse normals
  let coarseNormalXY = vec2f(coarseSample1.a, coarseSample2.a) * 2.0 - 1.0;
  let coarseNormalZ  = sqrt(max(0.0, 1.0 - dot(coarseNormalXY, coarseNormalXY)));
  let coarseNormal   = normalize(vec3f(coarseNormalXY, coarseNormalZ));

  let blend = input.vMorph;
  sample1 = mix(sample1, coarseSample1, blend);
  sample2 = mix(sample2, coarseSample2, blend);
  let blendedNormal = normalize(mix(fineNormal, coarseNormal, blend));
  let tbn = getCotangentFrame(input.vWorldPos, normalize(input.vNormal), patchUv);

  var surface: SurfaceParams;
  surface.BaseColor = vec4f(sample1.rgb, 1.0) * baseColor;
  surface.Specular  = vec3f(sample2.x); // TODO:
  surface.Roughness = smoothnessToRoughness(sample2.y);
  surface.Metallic  = 0.0;
  surface.Ior       = 0.0;
  surface.Normal    = vec4(normalize(tbn * blendedNormal), 1.0);

  if (settings.debug == DEBUG_COLOR) {
    if (material.morphLod < 1.0) {
      surface.BaseColor = vec4f(1.0, 0.0, 0.0, 1.0);
    } else if (material.morphLod < 2.0) {
      surface.BaseColor = vec4f(1.0, 1.0, 0.0, 1.0);
    } else if (material.morphLod < 3.0) {
      surface.BaseColor = vec4f(0.0, 1.0, 1.0, 1.0);
    } else if (material.morphLod < 4.0) {
      surface.BaseColor = vec4f(1.0, 0.0, 1.0, 1.0);
    } else if (material.morphLod < 5.0) {
      surface.BaseColor = vec4f(1.0, 1.0, 1.0, 1.0);
    }
  }

  var color = accumulateLight(lights, env, surface, toEye, input.vWorldPos);

  if (settings.debug > 0u) {
    if (settings.debug == DEBUG_MATERIAL) {
      return vec4f(surface.Metallic, surface.Roughness, surface.Ior, 1.0);
    }
    if (settings.debug == DEBUG_NORMALS) {
      return vec4f(surface.Normal.xyz * 0.5 + 0.5, 1.0);
    }
    if (settings.debug == DEBUG_UVS) {
      return vec4f(patchUv, input.vMorph, 1.0);
    }

  }

  // return vec4f(coarseSample1.rgb - sample1.rgb, 1.0); // debug: show coarse vs fine detail

  return applyFog(color, 1.0, input.vWorldPos, view.cameraPosition);
}

struct MorphInfo {
  offset:   vec2f, // world space offset to apply to the vertex position for morphing
  t:        f32,
}

fn lod_morph(gridPos: vec2f, worldPos: vec2f, cameraPos: vec2f) -> MorphInfo {
  // - gridPos is the raw vertex position in grid space, e.g. 0..64
  // - worldPos is the vertex position in world space

  //
  // in world units
  //
  let spacing     = exp2(material.morphLod);      // e.g. 1, 2, 4, 8 etc
  let sizeInWorld = material.patchSize * spacing; // e.g. 64, 128, 256 etc
  let baseFactor  = material.baseFactor;          // e.g. 2, used on CPU for LOD selection (AABB nearest distance check)

  // HINT: rangeFactor of 1.0 is too tight
  //
  // constants for tweaking, maybe should be material parameters
  let morphEnd     = sizeInWorld * baseFactor * 2.0;  // 2.0 hits right at the end of the patch
  let morphRange   = sizeInWorld * baseFactor * 0.3;

  let distance   = (distance(worldPos, cameraPos));
  let morphLerpK = 1.0 - clamp((morphEnd - distance)/morphRange, 0.0, 1.0);
  let morphLerp = fract(vec2f(gridPos.x, gridPos.y) * 0.5) * 2.0 * morphLerpK;

  var result: MorphInfo;
  result.offset   = morphLerp * spacing;
  result.t        = morphLerpK;

  return result;
}

fn readMapData(uv: vec2f) -> vec4f {
  let sample = textureSampleLevel(heightMap, heightMapSampler, uv, 0);
  return unpackHeightNormal(sample, material.mountainHeight);
}

fn readMapDataCoarse(uv: vec2f) -> vec4f {
  let sample = textureSampleLevel(heightMapCoarse, heightMapSampler, uv, 0);
  return unpackHeightNormal(sample, material.mountainHeight);
}

fn unpackHeightNormal(c: vec4f, mountainHeight: f32) -> vec4f {

  let r: f32 = c.r * 255.0;
  let g: f32 = c.g * 255.0;
  let h: f32 = ((r * 256.0 + g) / 65535.0) * mountainHeight;

  let nx: f32 = c.b * 2.0 - 1.0;
  let nz: f32 = c.a * 2.0 - 1.0;

  let normal = normalize(vec3f(nx, mountainHeight, -nz));

  return vec4f(normal, h);
}

fn getProceduralOffset(
  worldXZ: vec2f,
  lod: f32,
) -> f32 {

  let maxLod = 10.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  let seed = vec2f(0.0, 0.0);

  let w = lodWeight(lod, maxLod);
  let n = fbmCentered(worldXZ * frequency + seed);
  return n * amplitude * w;
}

fn lodWeight(lod: f32, maxLod: f32) -> f32 {
  let t = lod / maxLod;
  return 1.0 - t * t * (3.0 - 2.0 * t);
}

fn fbmCentered(xy: vec2f) -> f32 {
  return fbm(xy) * 2.0 - 1.0; // approx [-1, 1]
}

fn fbm(xy: vec2f) -> f32 {
  return
      noise(xy) * 0.5 +
      noise(xy * 2.0) * 0.25 +
      noise(xy * 4.0) * 0.125;
}

fn hash2(p: vec2f) -> f32 {
  let p3 = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  let p3_dot = dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(xy: vec2f) -> f32 {
  let i = floor(xy);
  let f = fract(xy);

  let a = hash2(i);
  let b = hash2(i + vec2f(1.0, 0.0));
  let c = hash2(i + vec2f(0.0, 1.0));
  let d = hash2(i + vec2f(1.0, 1.0));

  let u = f * f * (3.0 - 2.0 * f);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

${COMMON_WGSL}
`
