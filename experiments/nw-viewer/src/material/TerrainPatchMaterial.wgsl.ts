import { COMMON_WGSL } from './common.wgsl'

export const TERRAIN_PATCH_SHADER = /* wgsl */ `

// terrain virtual texture, see constants.ts VT_* and coatlicue-terrain.cfx SampleVirtualTextures
const VT_TEXELS_PER_METER: f32 = 256.0;
const VT_PAGE_SIZE: f32 = 512.0;
const VT_PAGE_WORLD_SIZE: f32 = 2.0;
const VT_MIP_COUNT: i32 = 8;
const VT_MAX_ANISOTROPY: f32 = 4.0;
// beyond this distance only the region macro maps are used (g_terrainMaterialParams in the capture)
const MACRO_VIEW_DISTANCE: f32 = 1000.0;
const MACRO_BLEND_DISTANCE: f32 = 100.0;

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

  // x: region layer of the indirection and macro arrays, -1 if none
  // y: 1 = macro maps available
  // z: macro normal scale
  // w: macro specular reflectance
  params2:                 vec4f,

  // x: this region's heightmap layer
  // y: +X neighbour, -1 if none
  // z: +Z neighbour, -1 if none
  // w: +X+Z neighbour, -1 if none
  params3:                 vec4f,

  // xy: region origin in world units, z: region size
  regionParams:            vec4f,
  // rgb: macro color multiplier (linear), w: macro gloss scale
  macroColor:              vec4f,
  heightUvTransform:       vec4f,
  heightUvTransformCoarse: vec4f,
};

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// @private
@group(0) @binding(3) var<uniform>       lights  : LightBlock;
// @private
// @block global
@group(0) @binding(4) var envMap                 : texture_cube<f32>;

@group(1) @binding(0) var<uniform> object:   ObjectBlock;
@group(1) @binding(1) var<uniform> material: MaterialBlock;
// @block material
@group(1) @binding(2) var heightMapSampler: sampler;
// @block material
@group(1) @binding(3) var colorMapSampler:  sampler;

// @block material
@group(1) @binding(4) var heightMap: texture_2d_array<u32>;
// @block material
@group(1) @binding(5) var pageMap1: texture_2d_array<f32>;
// @block material
@group(1) @binding(6) var pageMap2: texture_2d_array<f32>;
// @block material
@group(1) @binding(7) var indirectionMap: texture_2d_array<f32>;
// @block material
@group(1) @binding(8) var macroColorMap: texture_2d_array<f32>;
// @block material
@group(1) @binding(9) var macroNormalMap: texture_2d_array<f32>;
// @block material
@group(1) @binding(10) var macroGlossMap: texture_2d_array<f32>;

@group(2) @binding(0) var<storage, read> instances: array<InstanceBlock, 1>;


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

  @location(0) @interpolate(perspective, centroid) vNormal:    vec3f,
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

  let toEye = normalize(view.cameraPosition - input.vWorldPos);

  let layer      = i32(instance.params2.x);
  let regionSize = instance.regionParams.z;
  // region local position in world units, kept inside the region so page lookups stay in range
  let local      = clamp(input.vWorldPos.xy - instance.regionParams.xy, vec2f(0.0), vec2f(regionSize * 0.999999));

  // tangent frame, page uv runs along +x and -y
  let tbn = getCotangentFrame(input.vWorldPos, normalize(input.vNormal), vec2f(local.x, -local.y));

  // virtual texture
  let vt = vtSample(local, max(layer, 0));
  let vtParams = unpackParams(vt.map1, vt.map2);
  var vtValid = vt.valid;
  if (layer < 0) {
    vtValid = 0.0;
  }

  // macro maps, also the fallback where no page is resident
  let regionUv     = vec2f(local.x / regionSize, 1.0 - local.y / regionSize);
  let macroAlbedo  = textureSample(macroColorMap, colorMapSampler, regionUv, max(layer, 0)).rgb * instance.macroColor.rgb;
  let macroNormalS = textureSample(macroNormalMap, colorMapSampler, regionUv, max(layer, 0)).xy;
  let macroGloss   = textureSample(macroGlossMap, colorMapSampler, regionUv, max(layer, 0)).r * instance.macroColor.w;
  let macroNormal  = normalize(vec3f(macroNormalS, 1.0 / max(instance.params2.z, 0.001)));
  let macroValid   = instance.params2.y;

  let viewDistance = distance(view.cameraPosition, input.vWorldPos);
  var macroWeight  = max(smoothstep(MACRO_VIEW_DISTANCE - MACRO_BLEND_DISTANCE, MACRO_VIEW_DISTANCE, viewDistance), 1.0 - vtValid);
  if (global.debug == DEBUG_VT_NO_MACRO) {
    macroWeight = 0.0;
  }
  macroWeight *= macroValid;

  // neither pages nor macro maps, neutral ground
  let missing  = (1.0 - vtValid) * (1.0 - macroValid);
  let vtAlbedo = mix(vtParams.color, vec3f(0.18), missing);

  let normal = normalize(tbn * normalize(mix(vtParams.normal, macroNormal, macroWeight)));
  let albedo = mix(vtAlbedo, macroAlbedo, macroWeight);
  let alpha = 1.0;
  var specular = vec3f(mix(vtParams.specular, instance.params2.w, macroWeight));
  let authoredRoughness = mix(vtParams.roughness, smoothnessToRoughness(macroGloss), macroWeight);
  // specular antialiasing, the game filters the gbuffer of all opaque surfaces (FilterGBufferPS)
  let saa = getNormalVarianceSmoothness(
    normal,
    vec2i(floor(input.Position.xy)),
    linearizeDepthReversedZ(input.Position.z, view.near, view.far),
    roughnessToSmoothness(authoredRoughness),
    specular,
  );
  let gloss = saa.smoothness;
  let roughness = smoothnessToRoughness(gloss);
  specular *= saa.specularScale;

  let reflectVec = normalize(reflect(-toEye, normal));
  var reflectColor = getReflectColor(envMap, colorMapSampler, reflectVec, gloss).rgb;

  var surface: SurfaceParams;
  surface.Diffuse   = albedo;
  surface.Alpha     = alpha;
  surface.Specular  = specular;
  surface.Roughness = roughness;
  surface.Normal    = vec4(normal, 1.0);

  var shade = accumulateLightShade(lights, global, surface, toEye, input.vWorldPos);

  let ambient = vec3f(1.0);
  shade.ambient += getReflectColor(envMap, colorMapSampler, normal, 0.0).xyz * ambient;
  shade.specular += reflectColor * ambient * surface.Specular.rgb * shade.ambientScale;
  var color = composeShade(surface, shade);

  var out: FragmentOutput;
  out.color = applyFog(color, 1.0, input.vWorldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.Position.z, view.near, view.far);

  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(surface.Diffuse.rgb, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      out.color = vec4f(surface.Specular.rgb, 1.0);
    }
    case DEBUG_MTL_METALLIC: {
      out.color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      out.color = vec4f(vec3f(surface.Roughness), 1.0);
    }
    case DEBUG_SH_SPECULAR_AA: {
      out.color = vec4f((surface.Roughness - authoredRoughness) * 4.0, authoredRoughness * 0.25, 0.0, 1.0);
    }
    case DEBUG_MTL_IOR: {
      out.color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      // out.color = vec4f(vec3f(emittance), 1.0);
    }
    case DEBUG_MTL_AO: {
      // out.color = vec4f(vec3f(ao), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(alpha), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      out.color = vec4f(vec3f(gloss), 1.0);
    }
    case DEBUG_MTL_NOISE: {
      //
    }
    // #endregion


    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {
      out.color = vec4f(tbn[2].xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_TANGENT: {
      out.color = vec4f(tbn[0].xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_BITANGENT: {
      out.color = vec4f(tbn[1].xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_SHADE_NORMAL: {
      out.color = vec4f(surface.Normal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_POSITION_WS: {
      out.color = vec4f(fract(input.vWorldPos.xyz), 1.0);
    }
    case DEBUG_GV_DEPTH: {
      out.color = vec4f(vec3f(fract(out.depth)), 1.0);
    }
    // #endregion

    // #region Debug Vertex attributes
    case DEBUG_V_COLOR0: {
      out.color = vec4f(vec3f(input.vMorph), 1.0);
    }
    case DEBUG_V_COLOR1: {
      // out.color = vec4f(cDetailMap.rgb, 1.0);
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(local / VT_PAGE_WORLD_SIZE), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(regionUv, 0.0, 1.0);
    }
    case DEBUG_VT_MIP: {
      let shade = 0.5 + 0.5 * max(dot(normal, normalize(vec3f(0.3, 0.3, 0.9))), 0.0);
      out.color = vec4f(mix(vtMipColor(vt.mip), vec3f(1.0, 0.0, 0.0), 1.0 - vtValid) * shade, 1.0);
    }
    case DEBUG_V_UV3: {
      // out.color = vec4f(fract(uvEmittance.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV4: {
      // out.color = vec4f(fract(uvEmissiveIntensity.xy), 0.0, 1.0);
    }
    case DEBUG_V_DEFORM: {
      //
    }
    // #endregion
    default: {

    }
  }
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
  params.color     = sample1.rgb * sample1.rgb; // stored as sqrt for precision in the darks
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

// heightMap is r16uint (raw samples, float16 can not hold them exactly), so filter by hand.
// Same as a linear clamp sampler: texel centers at +0.5, edge texels clamped
fn sampleHeight(params3: vec4f, uv: vec2f) -> f32 {
  let remapped = remapUV(params3, uv);
  let layer = i32(remapped.z);
  let dims  = vec2i(textureDimensions(heightMap));
  let p     = remapped.xy * vec2f(dims) - 0.5;
  let f     = fract(p);
  let i0    = clamp(vec2i(floor(p)), vec2i(0), dims - 1);
  let i1    = min(i0 + 1, dims - 1);
  let h00   = f32(textureLoad(heightMap, i0, layer, 0).r);
  let h10   = f32(textureLoad(heightMap, vec2i(i1.x, i0.y), layer, 0).r);
  let h01   = f32(textureLoad(heightMap, vec2i(i0.x, i1.y), layer, 0).r);
  let h11   = f32(textureLoad(heightMap, i1, layer, 0).r);
  let h     = mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);
  return h / 65535.0 * material.mountainHeight;
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

struct VtSample {
  map1:  vec4f,
  map2:  vec4f,
  valid: f32,
  // page mip of the finer valid sample
  mip:   f32,
}

// resolves the page for the requested level through the indirection and samples it (ResolvePhysicalUV)
fn vtSampleLevel(local: vec2f, layer: i32, level: i32) -> VtSample {
  var result: VtSample;
  let dims  = vec2i(textureDimensions(indirectionMap, level));
  let cell  = clamp(vec2i(floor(local / (VT_PAGE_WORLD_SIZE * exp2(f32(level))))), vec2i(0), dims - vec2i(1));
  let entry = textureLoad(indirectionMap, cell, layer, level);
  let slot  = i32(round(entry.r * 255.0)) + i32(round(entry.g * 255.0)) * 256;
  let mip   = round(entry.b * 255.0);

  // position inside the referenced page, which may be coarser than the requested level
  let pagePos = local / (VT_PAGE_WORLD_SIZE * exp2(mip));
  let f = clamp(pagePos - floor(pagePos), vec2f(0.0), vec2f(1.0));
  // shared edges: texel centers 0 and N-1 lie on the page border, rows run from max y down
  let uv = (vec2f(0.5) + vec2f(f.x, 1.0 - f.y) * (VT_PAGE_SIZE - 1.0)) / VT_PAGE_SIZE;

  result.map1  = textureSampleLevel(pageMap1, colorMapSampler, uv, slot, 0.0);
  result.map2  = textureSampleLevel(pageMap2, colorMapSampler, uv, slot, 0.0);
  result.valid = step(0.5, entry.a);
  result.mip   = mip;
  return result;
}

// software trilinear filtering between two virtual texture mips (SampleVirtualTextures)
fn vtSample(local: vec2f, layer: i32) -> VtSample {
  let texel = local * VT_TEXELS_PER_METER;
  let lx    = length(dpdx(texel));
  let ly    = length(dpdy(texel));
  let ddMax = max(lx, ly);
  let ddMin = max(min(lx, ly), 1e-6);
  let ratio = min(ceil(ddMax / ddMin), VT_MAX_ANISOTROPY);
  let level = clamp(log2(max(ddMax / ratio, 1e-6)), 0.0, f32(VT_MIP_COUNT - 1));

  let level0 = i32(floor(level));
  let level1 = min(level0 + 1, VT_MIP_COUNT - 1);
  let a = vtSampleLevel(local, layer, level0);
  let b = vtSampleLevel(local, layer, level1);

  // a level without page does not contribute
  let t   = fract(level);
  let wa  = a.valid * (1.0 - t);
  let wb  = b.valid * t;
  let sum = wa + wb;

  var result: VtSample;
  result.valid = max(a.valid, b.valid);
  if (sum > 0.0) {
    result.map1 = (a.map1 * wa + b.map1 * wb) / sum;
    result.map2 = (a.map2 * wa + b.map2 * wb) / sum;
  } else {
    result.map1 = mix(a.map1, b.map1, b.valid);
    result.map2 = mix(a.map2, b.map2, b.valid);
  }
  result.mip = select(b.mip, a.mip, a.valid > 0.5);
  return result;
}

fn vtMipColor(mip: f32) -> vec3f {
  switch (i32(mip)) {
    case 0: { return vec3f(1.0, 0.1, 0.1); }
    case 1: { return vec3f(1.0, 0.5, 0.0); }
    case 2: { return vec3f(1.0, 1.0, 0.0); }
    case 3: { return vec3f(0.2, 1.0, 0.2); }
    case 4: { return vec3f(0.0, 0.9, 0.9); }
    case 5: { return vec3f(0.2, 0.4, 1.0); }
    case 6: { return vec3f(0.6, 0.2, 1.0); }
    default: { return vec3f(1.0, 0.3, 0.8); }
  }
}

${COMMON_WGSL}
`
