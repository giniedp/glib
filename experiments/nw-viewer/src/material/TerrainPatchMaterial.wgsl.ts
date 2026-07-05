import { COMMON_WGSL } from './common.wgsl'

export const TERRAIN_PATCH_SHADER = /* wgsl */ `

struct MaterialBlock {
  mountainHeight:  f32,
  lines:           f32,
};

struct InstanceBlock {
  transform:               mat4x4<f32>,

  // x: patch size (32, 64 etc.),
  // y: base factor (e.g. 2)
  // z: morphLod
  params1:                 vec4f,

  // x: fine layer color map index
  // y: coarse layer color map index
  // z: 1 = fine ready
  // w: 1 = coarse ready
  params2:                 vec4f,

  // x: this region's heightmap layer
  // y: +X neighbour, -1 if none
  // z: +Z neighbour, -1 if none
  // w: +X+Z neighbour, -1 if none
  params3:                 vec4f,

  colorUvTransform:        vec4f,
  colorUvTransformCoarse:  vec4f,
  heightUvTransform:       vec4f,
  heightUvTransformCoarse: vec4f,
};

@group(0) @binding(0) var<uniform> global:   GlobalBlock;
@group(0) @binding(1) var<uniform> view:     ViewBlock;
@group(0) @binding(2) var<uniform> object:   ObjectBlock;
@group(0) @binding(3) var<uniform> material: MaterialBlock;
@group(0) @binding(4) var<uniform> lights:   LightBlock;

// @block material
@group(1) @binding(0) var heightMapSampler: sampler;
// @block material
@group(1) @binding(1) var colorMapSampler:  sampler;

// @block material
@group(2) @binding(0) var heightMap: texture_2d_array<f32>;
// @block material
@group(2) @binding(1) var colorMap1: texture_2d_array<f32>;
// @block material
@group(2) @binding(2) var colorMap2: texture_2d_array<f32>;

@group(3) @binding(0) var<storage, read> instances: array<InstanceBlock, 1>;


struct VertexInput {
  @builtin(instance_index) instanceIndex: u32,
  // @alias position
  @location(0) aPosition: vec3f,
  // @alias normal
  @location(1) aNormal:   vec3f,
  // @alias texture
  @location(2) aTexture:  vec2f,
};

struct VertexOutput {
  @builtin(position) Position: vec4f,

  @location(0) vNormal:    vec3f,
  @location(1) vWorldPos:  vec3f,
  @location(2) vToEyeInWS: vec3f,
  @location(3) vTexCoord:  vec4f,
  @location(4) vMorph:     f32,
  @location(5) @interpolate(flat) iid:  u32,
  @location(6) vHmLayer: vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {

  let uv = vec2f(input.aTexture.x, 1.0 - input.aTexture.y);
  let instance = instances[input.instanceIndex];

  var output : VertexOutput;

  var worldPos = (instance.transform * object.modelMatrix * vec4f(input.aPosition, 1.0));

  let patchSize = f32(instance.params1.x);
  let baseFactor = f32(instance.params1.y);
  let morphLod = f32(instance.params1.z);
  let morph = lod_morph(
    input.aPosition.xy,         // raw grid position 0..64
    worldPos.xy,                // world space position
    view.cameraPosition.xy,
    patchSize,
    baseFactor,
    morphLod,
  );
  worldPos.x -= morph.offset.x;
  worldPos.y += morph.offset.y;

  let patchWorldSize = patchSize * exp2(morphLod);
  let uvDelta = -morph.offset / patchWorldSize;

  let heightMapUv = uvScaleOffset(uv + uvDelta, instance.heightUvTransform);
  let data        = readMapData(heightMapUv, instance.params3);
  var height      = data.a;
  var normal      = data.xyz;
  worldPos.z += height;

  output.vWorldPos = worldPos.xyz;
  output.vNormal = normalize((object.modelMatrix * vec4f(normal, 0.0)).xyz);

  output.vTexCoord = vec4f(uv, uv + uvDelta);
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  output.vMorph = morph.t;
  output.Position = view.projectionMatrix * view.viewMatrix * worldPos;
  output.iid = input.instanceIndex;

  let crossX = heightMapUv.x >= 1.0;
  let crossY = heightMapUv.y <= 0.0;

  var debugColor: vec3f;
  var debugLayer: i32;
  if !crossX && !crossY {
    debugLayer = i32(instance.params3.x);
  } else if crossX {
    debugLayer = i32(instance.params3.y);
  } else if crossY {
    debugLayer = i32(instance.params3.z);
  } else {
    debugLayer = i32(instance.params3.w);
  }
  if (debugLayer == 0) {
    debugColor = vec3f(1.0, 1.0, 1.0);
  }
  if (debugLayer == 1) {
    debugColor = vec3f(1.0, 0.0, 0.0);
  }
  if (debugLayer == 2) {
    debugColor = vec3f(0.0, 1.0, 0.0);
  }
  if (debugLayer == 3) {
    debugColor = vec3f(0.0, 0.0, 1.0);
  }


  output.vHmLayer = debugColor;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> FragmentOutput {
  let instance = instances[input.iid];

  let morphLod = f32(instance.params1.z);
  let toEye = normalize(view.cameraPosition - input.vWorldPos);

  let patchUv          = uvScaleOffset(input.vTexCoord.zw, instance.colorUvTransform);
  let patchUvCoarse    = uvScaleOffset(input.vTexCoord.zw, instance.colorUvTransformCoarse);
  let patchLayer       = i32(instance.params2.x);
  let patchLayerCoarse = i32(instance.params2.y);

  // tangent space view direction for POM
  let tbn = getCotangentFrame(input.vWorldPos, normalize(input.vNormal), patchUv);
  let viewTS = normalize(tbn * toEye);
  let pomUV = parallaxOcclusionMap(patchUv, patchLayer, viewTS, 8, 0.0078, 0.0);

  var sample1       = textureSampleLevel(colorMap1, colorMapSampler, pomUV,         patchLayer,       0.0);
  var sample2       = textureSampleLevel(colorMap2, colorMapSampler, pomUV,         patchLayer,       0.0);
  var coarseSample1 = textureSampleLevel(colorMap1, colorMapSampler, patchUvCoarse, patchLayerCoarse, 0.0);
  var coarseSample2 = textureSampleLevel(colorMap2, colorMapSampler, patchUvCoarse, patchLayerCoarse, 0.0);

  let fineParams = unpackParams(sample1, sample2);
  let coarseParams = unpackParams(coarseSample1, coarseSample2);

  // only blend when both fine and coarse are real distinct tiles
  let blend  = input.vMorph;
  let normal = normalize(mix(fineParams.normal, coarseParams.normal, blend));

  var surface: SurfaceParams;
  surface.BaseColor = vec4f(mix(fineParams.color, coarseParams.color, blend), 1.0);
  surface.Specular  = vec3f(mix(fineParams.specular, coarseParams.specular, blend)) ;
  surface.Roughness = mix(fineParams.roughness, coarseParams.roughness, blend);
  surface.Metallic  = 0.0;
  surface.Ior       = 0.0;
  surface.Normal    = vec4(normalize(tbn * normal), 1.0);

  var color = accumulateLight(lights, global, surface, toEye, input.vWorldPos);
  var out: FragmentOutput;
  out.color = applyFog(color, 1.0, input.vWorldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.Position.z, view.near, view.far);

  // let debug = global.debug;
  // if (debug > 0u) {
  //   if (debug == DEBUG_MTL_BASE) {
  //     out.color = vec4f(surface.BaseColor.rgb, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_MTL_SPEC) {
  //     out.color = vec4f(surface.Specular.rgb, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_MTL_PBR) {
  //     out.color = vec4f(surface.Metallic, surface.Roughness, surface.Ior, 1.0);
  //     return out;
  //   }

  //   if (debug == DEBUG_NORMALS) {
  //     out.color = vec4f(surface.Normal.xyz * 0.5 + 0.5, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_TANGENTS) {
  //     out.color = vec4f(0.0, 0.0, 0.0, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_BINORMALS) {
  //     out.color = vec4f(0.0, 0.0, 0.0, 1.0);
  //     return out;
  //   }

  //   if (debug == DEBUG_COLOR1) {
  //     out.color = vec4f(0.0, 0.0, 0.0, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_COLOR2) {
  //     out.color = vec4f(0.0, 0.0, 0.0, 1.0);
  //     return out;
  //   }

  //   if (debug == DEBUG_UV1) {
  //     out.color = vec4f(pomUV, 0.0, 1.0);
  //     return out;
  //   }
  //   if (debug == DEBUG_UV2) {
  //     out.color = vec4f(input.vMorph, input.vMorph, input.vMorph, 1.0);
  //     return out;
  //   }
  // }

  return out;
}

struct MtlParams {
  color: vec3f,
  normal: vec3f,
  roughness: f32,
  specular: f32,
  height: f32,
}

fn unpackParams(sample1: vec4f, sample2: vec4f) -> MtlParams {
  var params: MtlParams;

  let normalXY   = vec2f(sample1.a, sample2.b) * 2.0 - 1.0;
  let normalZ    = sqrt(max(0.0, 1.0 - dot(normalXY, normalXY)));
  params.normal    = normalize(vec3f(normalXY, normalZ));
  params.color     = sample1.rgb / 8.0; // BC3_BASE_COLOR_SCALE, applied in shader for better precision
  params.roughness = smoothnessToRoughness(sample2.r);
  params.specular  = sample2.g;
  params.height    = sample2.a;
  return params;
}

struct MorphInfo {
  offset:   vec2f, // world space offset to apply to the vertex position for morphing
  t:        f32,
}

// gridPos is the raw vertex position in grid space, e.g. 0..64
// worldPos is the vertex position in world space
fn lod_morph(
  gridPos: vec2f,
  worldPos: vec2f,
  cameraPos: vec2f,
  patchSize: f32,
  baseFactor: f32, // e.g. 2, used on CPU for LOD selection (AABB nearest distance check)
  morphLod: f32,
) -> MorphInfo {

  //
  // in world units
  //
  let spacing     = exp2(morphLod);      // e.g. 1, 2, 4, 8 etc
  let sizeInWorld = patchSize * spacing; // e.g. 64, 128, 256 etc

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

// UV → texel, accounting for 2049 vertices over 2048 texels
fn uvToTexel(uv: vec2f, dims: vec2i) -> vec2i {
  return vec2i(uv * vec2f(dims - vec2i(1)));
}

fn remapUV(params3: vec4f, uv: vec2f) -> vec3f {
  let crossX = uv.x >= 1.0;
  let crossY = uv.y <= 0.0;

  var layer    : i32;
  var sampleUV : vec2f;

  if crossX && crossY {
    // corner
    layer    = i32(params3.w);
    sampleUV = vec2f(uv.x - 1.0, 1.0);
  } else if crossX {
    // right
    layer    = i32(params3.y);
    sampleUV = vec2f(uv.x - 1.0, uv.y);
  } else if crossY {
    // bottom
    layer    = i32(params3.z);
    sampleUV = vec2f(uv.x, 1.0);
  } else {
    // this region
    layer    = i32(params3.x);
    sampleUV = uv;
  }

  if layer < 0 {
    layer    = i32(params3.x);
    sampleUV = clamp(uv, vec2f(0.0), vec2f(1.0));
  }

  return vec3f(sampleUV, f32(layer));
}

fn sampleHeight(params3: vec4f, uv: vec2f) -> f32 {
  let remapped = remapUV(params3, uv);
  return textureSampleLevel(heightMap, heightMapSampler, remapped.xy, i32(remapped.z), 0.0).r / 65535.0 * material.mountainHeight;
}

fn readMapData(uv: vec2f, params3: vec4f) -> vec4f {
  let dims = vec2i(textureDimensions(heightMap));
  let texelSize = 1.0 / vec2f(dims);

  let hpx = sampleHeight(params3, uv + vec2f( texelSize.x, 0.0));
  let hnx = sampleHeight(params3, uv + vec2f(-texelSize.x, 0.0));
  let hpy = sampleHeight(params3, uv + vec2f(0.0,  texelSize.y));
  let hny = sampleHeight(params3, uv + vec2f(0.0, -texelSize.y));

  let normal = normalize(vec3f(hnx - hpx, hpy - hny, 1.0));
  let h      = sampleHeight(params3, uv);
  return vec4f(normal, h);
}

fn samplePOMHeight(uv: vec2f, layer: i32) -> f32 {
  let clampedUV = clamp(uv, vec2f(0.0), vec2f(1.0));
  return textureSampleLevel(colorMap2, colorMapSampler, clampedUV, layer, 0.0).a;
}

// Parallax Occlusion Mapping
// uv         : base tile UV
// layer      : tile array layer
// viewTS     : view direction in tangent space (tbn * toEye)
// numSteps   : ray march steps, 8-16 is typical
// displacement: max height displacement in UV space, e.g. 0.03
// bias       : height bias, 0.5-0.7 typical
fn parallaxOcclusionMap(
  uv:           vec2f,
  layer:        i32,
  viewTS:       vec3f,
  numSteps:     i32,
  displacement: f32,
  bias:         f32,
) -> vec2f {

  // UV step per ray march iteration
  // xy of viewTS is the tangent space direction, z is depth
  // divide by z to get correct perspective-correct step
  let stepSize = 1.0 / f32(numSteps);
  // let uvDelta  = (viewTS.xy / viewTS.z) * displacement / f32(numSteps);
  let uvDelta  = (viewTS.xy) * displacement / f32(numSteps);

  // start position — offset by bias to reduce self-intersection
  var currentUV     = uv - (1.0 - bias) * f32(numSteps) * uvDelta;
  var currentHeight = 1.0 - stepSize;

  var prevSample = samplePOMHeight(currentUV, layer);
  currentUV     += uvDelta;
  var currSample = samplePOMHeight(currentUV, layer);

  // coarse ray march — find approximate intersection
  for (var i = 0; i < numSteps; i++) {
    if currSample >= currentHeight { break; }

    prevSample     = currSample;
    currentHeight -= stepSize;
    currentUV     += uvDelta;
    currSample     = samplePOMHeight(currentUV, layer);
  }

  // binary search refinement — narrow down exact intersection
  var t0     = currentHeight + stepSize;   // before intersection
  var t1     = currentHeight;              // after intersection
  var delta0 = t0 - prevSample;
  var delta1 = t1 - currSample;

  for (var i = 0; i < 10; i++) {
    let denom = delta1 - delta0;
    if abs(denom) < 0.0001 { break; }

    let t      = (t0 * delta1 - t1 * delta0) / denom;
    let uvBest = currentUV - (currentHeight - t) / stepSize * uvDelta;
    let hBest  = samplePOMHeight(uvBest, layer);
    let error  = t - hBest;

    if abs(error) <= 0.01 {
      currentUV = uvBest;
      break;
    }

    if (error < 0.0) {
      delta1 = error; t1 = t;
    } else {
      delta0 = error; t0 = t;
    }
  }

  return currentUV;
}

${COMMON_WGSL}
`
