import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * WGSL port of XeGTAO (https://github.com/GameTechDev/XeGTAO, MIT License, Copyright (C) 2016-2021, Intel Corporation)
 *
 * Differences to the reference implementation:
 * - fragment shaders instead of compute shaders (one fullscreen draw per step)
 * - input is linear view space depth (RenderChannel.LinearDepth), no depth unpacking
 * - normals are always generated in place from depth (XE_GTAO_GENERATE_NORMALS_INPLACE)
 * - depth is read with textureLoad (point sampling, clamp to edge) instead of samplers
 * - edges are stored unpacked in rgba8unorm instead of 2 bit packed
 * - no bent normals
 */

export const XE_GTAO_DEPTH_MIP_LEVELS = 5
export const XE_GTAO_OCCLUSION_TERM_SCALE = 1.5

const GTAO_PARAMS = /* wgsl */ `
struct GtaoParams {
  // width, height, 1/width, 1/height
  viewport    : vec4f,
  // NDCToViewMul.xy, NDCToViewAdd.xy
  ndcToView   : vec4f,
  // NDCToViewMul_x_PixelSize.xy, DepthMIPSamplingOffset, max depth (pixels beyond are not occluded)
  ndcToViewPx : vec4f,
  // EffectRadius * RadiusMultiplier, EffectFalloffRange, SampleDistributionPower, ThinOccluderCompensation
  effect      : vec4f,
  // SliceCount, StepsPerSlice, FinalValuePower, NoiseIndex
  quality     : vec4f,
};
`

/**
 * Converts linear depth into the first depth mip. Pixels without depth (cleared to 0) are pushed to the far range.
 */
export const XE_GTAO_PREFILTER_MIP0_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var sourceDepth: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  var depth = textureLoad(sourceDepth, vec2i(in.position.xy), 0).r;
  if (depth <= 0.0) {
    depth = 65000.0;
  }
  return vec4f(clamp(depth, 0.0, 65000.0), 0.0, 0.0, 1.0);
}
`

/**
 * Generates depth mip N from mip N-1 (XeGTAO_DepthMIPFilter)
 */
export const XE_GTAO_PREFILTER_MIPN_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${GTAO_PARAMS}

@group(0) @binding(0) var<uniform> params: GtaoParams;
@group(0) @binding(1) var sourceDepth: texture_2d<f32>;

fn depthMipFilter(d0: f32, d1: f32, d2: f32, d3: f32) -> f32 {
  let maxDepth = max(max(d0, d1), max(d2, d3));

  const depthRangeScaleFactor = 0.75; // found empirically :)
  let effectRadius = depthRangeScaleFactor * params.effect.x;
  let falloffRange = params.effect.y * effectRadius;
  let falloffFrom = effectRadius * (1.0 - params.effect.y);
  let falloffMul = -1.0 / falloffRange;
  let falloffAdd = falloffFrom / falloffRange + 1.0;

  let weight0 = saturate((maxDepth - d0) * falloffMul + falloffAdd);
  let weight1 = saturate((maxDepth - d1) * falloffMul + falloffAdd);
  let weight2 = saturate((maxDepth - d2) * falloffMul + falloffAdd);
  let weight3 = saturate((maxDepth - d3) * falloffMul + falloffAdd);

  let weightSum = weight0 + weight1 + weight2 + weight3;
  return (weight0 * d0 + weight1 * d1 + weight2 * d2 + weight3 * d3) / weightSum;
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let px = vec2i(in.position.xy) * 2;
  let last = vec2i(textureDimensions(sourceDepth, 0)) - 1;
  let d0 = textureLoad(sourceDepth, min(px + vec2i(0, 0), last), 0).r;
  let d1 = textureLoad(sourceDepth, min(px + vec2i(1, 0), last), 0).r;
  let d2 = textureLoad(sourceDepth, min(px + vec2i(0, 1), last), 0).r;
  let d3 = textureLoad(sourceDepth, min(px + vec2i(1, 1), last), 0).r;
  return vec4f(depthMipFilter(d0, d1, d2, d3), 0.0, 0.0, 1.0);
}
`

/**
 * XeGTAO_MainPass. Outputs the working AO term (scaled by 1/OCCLUSION_TERM_SCALE) and the depth edges
 */
export const XE_GTAO_MAIN_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${GTAO_PARAMS}

@group(0) @binding(0) var<uniform> params: GtaoParams;
@group(0) @binding(1) var depthMips: texture_2d<f32>;

const PI = 3.1415926535897932384626433832795;
const PI_HALF = 1.5707963267948966192313216916398;
const OCCLUSION_TERM_SCALE = ${XE_GTAO_OCCLUSION_TERM_SCALE.toFixed(1)};
const MAX_MIP = ${XE_GTAO_DEPTH_MIP_LEVELS - 1}.0;
const HILBERT_WIDTH = 64u;

struct MainOutput {
  @location(0) ao: vec4f,
  @location(1) edges: vec4f,
};

fn fastAcos(inX: f32) -> f32 {
  let x = abs(inX);
  var res = -0.156583 * x + PI_HALF;
  res *= sqrt(1.0 - x);
  return select(PI - res, res, inX >= 0.0);
}

fn loadDepth(px: vec2i, mip: i32) -> f32 {
  let last = vec2i(textureDimensions(depthMips, mip)) - 1;
  return textureLoad(depthMips, clamp(px, vec2i(0), last), mip).r;
}

fn sampleDepth(uv: vec2f, mip: i32) -> f32 {
  let dims = vec2f(textureDimensions(depthMips, mip));
  return loadDepth(vec2i(floor(uv * dims)), mip);
}

fn computeViewspacePosition(screenPos: vec2f, viewspaceDepth: f32) -> vec3f {
  return vec3f((params.ndcToView.xy * screenPos + params.ndcToView.zw) * viewspaceDepth, viewspaceDepth);
}

fn hilbertIndex(x: u32, y: u32) -> u32 {
  var posX = x % HILBERT_WIDTH;
  var posY = y % HILBERT_WIDTH;
  var index = 0u;
  for (var curLevel = HILBERT_WIDTH / 2u; curLevel > 0u; curLevel /= 2u) {
    let regionX = select(0u, 1u, (posX & curLevel) > 0u);
    let regionY = select(0u, 1u, (posY & curLevel) > 0u);
    index += curLevel * curLevel * ((3u * regionX) ^ regionY);
    if (regionY == 0u) {
      if (regionX == 1u) {
        posX = HILBERT_WIDTH - 1u - posX;
        posY = HILBERT_WIDTH - 1u - posY;
      }
      let temp = posX;
      posX = posY;
      posY = temp;
    }
  }
  return index;
}

fn spatioTemporalNoise(pixCoord: vec2u, temporalIndex: u32) -> vec2f {
  // Hilbert curve driving R2 (see https://www.shadertoy.com/view/3tB3z3)
  var index = hilbertIndex(pixCoord.x, pixCoord.y);
  index += 288u * (temporalIndex % 64u);
  // R2 sequence
  return fract(0.5 + f32(index) * vec2f(0.75487766624669276005, 0.5698402909980532659114));
}

fn calculateEdges(centerZ: f32, leftZ: f32, rightZ: f32, topZ: f32, bottomZ: f32) -> vec4f {
  // slope-sensitive depth-based edge detection
  var edgesLRTB = vec4f(leftZ, rightZ, topZ, bottomZ) - centerZ;
  let slopeLR = (edgesLRTB.y - edgesLRTB.x) * 0.5;
  let slopeTB = (edgesLRTB.w - edgesLRTB.z) * 0.5;
  let edgesLRTBSlopeAdjusted = edgesLRTB + vec4f(slopeLR, -slopeLR, slopeTB, -slopeTB);
  edgesLRTB = min(abs(edgesLRTB), abs(edgesLRTBSlopeAdjusted));
  return saturate(1.25 - edgesLRTB / (centerZ * 0.011));
}

fn calculateNormal(edgesLRTB: vec4f, center: vec3f, left: vec3f, right: vec3f, top: vec3f, bottom: vec3f) -> vec3f {
  let acceptedNormals = saturate(vec4f(
    edgesLRTB.x * edgesLRTB.z,
    edgesLRTB.z * edgesLRTB.y,
    edgesLRTB.y * edgesLRTB.w,
    edgesLRTB.w * edgesLRTB.x,
  ) + 0.01);

  let l = normalize(left - center);
  let r = normalize(right - center);
  let t = normalize(top - center);
  let b = normalize(bottom - center);

  let n = acceptedNormals.x * cross(l, t)
        + acceptedNormals.y * cross(t, r)
        + acceptedNormals.z * cross(r, b)
        + acceptedNormals.w * cross(b, l);
  return normalize(n);
}

@fragment
fn fs_main(in: FragmentInput) -> MainOutput {
  let pixCoord = vec2i(in.position.xy);
  let pixelSize = params.viewport.zw;
  let normalizedScreenPos = (vec2f(pixCoord) + 0.5) * pixelSize;

  var viewspaceZ = loadDepth(pixCoord, 0);
  let pixLZ = loadDepth(pixCoord + vec2i(-1, 0), 0);
  let pixRZ = loadDepth(pixCoord + vec2i(1, 0), 0);
  let pixTZ = loadDepth(pixCoord + vec2i(0, -1), 0);
  let pixBZ = loadDepth(pixCoord + vec2i(0, 1), 0);

  let edgesLRTB = calculateEdges(viewspaceZ, pixLZ, pixRZ, pixTZ, pixBZ);

  var out: MainOutput;
  out.edges = edgesLRTB;

  if (viewspaceZ >= params.ndcToViewPx.w) {
    out.ao = vec4f(1.0 / OCCLUSION_TERM_SCALE);
    return out;
  }

  // XE_GTAO_GENERATE_NORMALS_INPLACE
  let CENTER = computeViewspacePosition(normalizedScreenPos, viewspaceZ);
  let LEFT   = computeViewspacePosition(normalizedScreenPos + vec2f(-1.0,  0.0) * pixelSize, pixLZ);
  let RIGHT  = computeViewspacePosition(normalizedScreenPos + vec2f( 1.0,  0.0) * pixelSize, pixRZ);
  let TOP    = computeViewspacePosition(normalizedScreenPos + vec2f( 0.0, -1.0) * pixelSize, pixTZ);
  let BOTTOM = computeViewspacePosition(normalizedScreenPos + vec2f( 0.0,  1.0) * pixelSize, pixBZ);
  let viewspaceNormal = calculateNormal(edgesLRTB, CENTER, LEFT, RIGHT, TOP, BOTTOM);

  // Move center pixel slightly towards camera to avoid imprecision artifacts due to depth buffer imprecision (FP16 depth)
  viewspaceZ *= 0.99920;

  let pixCenterPos = computeViewspacePosition(normalizedScreenPos, viewspaceZ);
  let viewVec = normalize(-pixCenterPos);

  let sliceCount = params.quality.x;
  let stepsPerSlice = params.quality.y;
  let effectRadius = params.effect.x;
  let sampleDistributionPower = params.effect.z;
  let thinOccluderCompensation = params.effect.w;
  let falloffRange = params.effect.y * effectRadius;
  let falloffFrom = effectRadius * (1.0 - params.effect.y);

  // fadeout precompute optimisation
  let falloffMul = -1.0 / falloffRange;
  let falloffAdd = falloffFrom / falloffRange + 1.0;

  var visibility = 0.0;

  let localNoise = spatioTemporalNoise(vec2u(pixCoord), u32(params.quality.w));
  let noiseSlice = localNoise.x;
  let noiseSample = localNoise.y;

  // if the offset is under approx pixel size (pixelTooCloseThreshold), push it out to the minimum distance
  const pixelTooCloseThreshold = 1.3;

  // approx viewspace pixel size at pixCoord
  let pixelDirRBViewspaceSizeAtCenterZ = viewspaceZ * params.ndcToViewPx.xy;
  let screenspaceRadius = effectRadius / pixelDirRBViewspaceSizeAtCenterZ.x;

  // fade out for small screen radii
  visibility += saturate((10.0 - screenspaceRadius) / 100.0) * 0.5;

  // this is the min distance to start sampling from to avoid sampling from the center pixel
  let minS = pixelTooCloseThreshold / screenspaceRadius;

  for (var slice = 0.0; slice < sliceCount; slice += 1.0) {
    let sliceK = (slice + noiseSlice) / sliceCount;
    // lines 5, 6 from the paper
    let phi = sliceK * PI;
    let cosPhi = cos(phi);
    let sinPhi = sin(phi);
    // convert to screen units (pixels) for later use
    let omega = vec2f(cosPhi, -sinPhi) * screenspaceRadius;

    // line 8 from the paper
    let directionVec = vec3f(cosPhi, sinPhi, 0.0);
    // line 9 from the paper
    let orthoDirectionVec = directionVec - (dot(directionVec, viewVec) * viewVec);
    // axisVec is orthogonal to directionVec and viewVec, used to define projectedNormal
    let axisVec = normalize(cross(orthoDirectionVec, viewVec));
    // line 10 from the paper
    let projectedNormalVec = viewspaceNormal - axisVec * dot(viewspaceNormal, axisVec);
    // line 11 from the paper
    let signNorm = sign(dot(orthoDirectionVec, projectedNormalVec));
    // line 12 from the paper
    var projectedNormalVecLength = length(projectedNormalVec);
    let cosNorm = saturate(dot(projectedNormalVec, viewVec) / projectedNormalVecLength);
    // line 13 from the paper
    let n = signNorm * fastAcos(cosNorm);

    // this is a lower weight target; not using -1 as in the original paper because it is under horizon
    let lowHorizonCos0 = cos(n + PI_HALF);
    let lowHorizonCos1 = cos(n - PI_HALF);

    // lines 17, 18 from the paper, manually unrolled the 'side' loop
    var horizonCos0 = lowHorizonCos0;
    var horizonCos1 = lowHorizonCos1;

    for (var stepIndex = 0.0; stepIndex < stepsPerSlice; stepIndex += 1.0) {
      // R1 sequence
      let stepBaseNoise = (slice + stepIndex * stepsPerSlice) * 0.6180339887498948482;
      let stepNoise = fract(noiseSample + stepBaseNoise);

      // approx line 20 from the paper, with added noise
      var s = (stepIndex + stepNoise) / stepsPerSlice;
      // additional distribution modifier
      s = pow(s, sampleDistributionPower);
      // avoid sampling center pixel
      s += minS;

      // approx lines 21-22 from the paper, unrolled
      var sampleOffset = s * omega;
      let sampleOffsetLength = length(sampleOffset);

      let mipLevel = i32(round(clamp(log2(sampleOffsetLength) - params.ndcToViewPx.z, 0.0, MAX_MIP)));

      // snap to pixel center
      sampleOffset = round(sampleOffset) * pixelSize;

      let sampleScreenPos0 = normalizedScreenPos + sampleOffset;
      let SZ0 = sampleDepth(sampleScreenPos0, mipLevel);
      let samplePos0 = computeViewspacePosition(sampleScreenPos0, SZ0);

      let sampleScreenPos1 = normalizedScreenPos - sampleOffset;
      let SZ1 = sampleDepth(sampleScreenPos1, mipLevel);
      let samplePos1 = computeViewspacePosition(sampleScreenPos1, SZ1);

      let sampleDelta0 = samplePos0 - pixCenterPos;
      let sampleDelta1 = samplePos1 - pixCenterPos;
      let sampleDist0 = length(sampleDelta0);
      let sampleDist1 = length(sampleDelta1);

      // approx lines 23, 24 from the paper, unrolled
      let sampleHorizonVec0 = sampleDelta0 / sampleDist0;
      let sampleHorizonVec1 = sampleDelta1 / sampleDist1;

      // thickness heuristic, discards samples behind the center sooner
      let falloffBase0 = length(vec3f(sampleDelta0.xy, sampleDelta0.z * (1.0 + thinOccluderCompensation)));
      let falloffBase1 = length(vec3f(sampleDelta1.xy, sampleDelta1.z * (1.0 + thinOccluderCompensation)));
      let weight0 = saturate(falloffBase0 * falloffMul + falloffAdd);
      let weight1 = saturate(falloffBase1 * falloffMul + falloffAdd);

      // sample horizon cos
      var shc0 = dot(sampleHorizonVec0, viewVec);
      var shc1 = dot(sampleHorizonVec1, viewVec);

      // discard unwanted samples
      shc0 = mix(lowHorizonCos0, shc0, weight0);
      shc1 = mix(lowHorizonCos1, shc1, weight1);

      horizonCos0 = max(horizonCos0, shc0);
      horizonCos1 = max(horizonCos1, shc1);
    }

    // fudge for slight overdarkening on high slopes
    projectedNormalVecLength = mix(projectedNormalVecLength, 1.0, 0.05);

    // line ~27, unrolled
    let h0 = -fastAcos(horizonCos1);
    let h1 = fastAcos(horizonCos0);
    let iarc0 = (cosNorm + 2.0 * h0 * sin(n) - cos(2.0 * h0 - n)) / 4.0;
    let iarc1 = (cosNorm + 2.0 * h1 * sin(n) - cos(2.0 * h1 - n)) / 4.0;
    let localVisibility = projectedNormalVecLength * (iarc0 + iarc1);
    visibility += localVisibility;
  }

  visibility /= sliceCount;
  visibility = pow(max(visibility, 0.0), params.quality.z);
  // disallow total occlusion
  visibility = max(0.03, visibility);

  out.ao = vec4f(saturate(visibility / OCCLUSION_TERM_SCALE));
  return out;
}
`

/**
 * XeGTAO_Denoise. Edge aware 3x3 blur, one pixel per invocation
 */
export const XE_GTAO_DENOISE_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct DenoiseParams {
  // blurAmount, output scale (OCCLUSION_TERM_SCALE on final apply, otherwise 1)
  values: vec4f,
};

@group(0) @binding(0) var<uniform> params: DenoiseParams;
@group(0) @binding(1) var aoTerm: texture_2d<f32>;
@group(0) @binding(2) var edgesMap: texture_2d<f32>;

fn loadAo(px: vec2i) -> f32 {
  let last = vec2i(textureDimensions(aoTerm, 0)) - 1;
  return textureLoad(aoTerm, clamp(px, vec2i(0), last), 0).r;
}

fn loadEdges(px: vec2i) -> vec4f {
  let last = vec2i(textureDimensions(edgesMap, 0)) - 1;
  return textureLoad(edgesMap, clamp(px, vec2i(0), last), 0);
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let px = vec2i(in.position.xy);
  let blurAmount = params.values.x;
  const diagWeight = 0.85 * 0.5;

  let edgesL_LRTB = loadEdges(px + vec2i(-1, 0));
  let edgesT_LRTB = loadEdges(px + vec2i(0, -1));
  let edgesR_LRTB = loadEdges(px + vec2i(1, 0));
  let edgesB_LRTB = loadEdges(px + vec2i(0, 1));
  var edgesC_LRTB = loadEdges(px);

  // enforce edge symmetry
  edgesC_LRTB *= vec4f(edgesL_LRTB.y, edgesR_LRTB.x, edgesT_LRTB.w, edgesB_LRTB.z);

  // allow some small amount of AO leaking from neighbours if there are 3 or 4 edges
  const leakThreshold = 2.5;
  const leakStrength = 0.5;
  let edginess = (saturate(4.0 - leakThreshold - dot(edgesC_LRTB, vec4f(1.0))) / (4.0 - leakThreshold)) * leakStrength;
  edgesC_LRTB = saturate(edgesC_LRTB + edginess);

  let weightTL = diagWeight * (edgesC_LRTB.x * edgesL_LRTB.z + edgesC_LRTB.z * edgesT_LRTB.x);
  let weightTR = diagWeight * (edgesC_LRTB.z * edgesT_LRTB.y + edgesC_LRTB.y * edgesR_LRTB.z);
  let weightBL = diagWeight * (edgesC_LRTB.w * edgesB_LRTB.x + edgesC_LRTB.x * edgesL_LRTB.w);
  let weightBR = diagWeight * (edgesC_LRTB.y * edgesR_LRTB.w + edgesC_LRTB.w * edgesB_LRTB.y);

  var sumWeight = blurAmount;
  var sum = loadAo(px) * sumWeight;

  sum += loadAo(px + vec2i(-1, 0)) * edgesC_LRTB.x;
  sum += loadAo(px + vec2i(1, 0)) * edgesC_LRTB.y;
  sum += loadAo(px + vec2i(0, -1)) * edgesC_LRTB.z;
  sum += loadAo(px + vec2i(0, 1)) * edgesC_LRTB.w;
  sum += loadAo(px + vec2i(-1, -1)) * weightTL;
  sum += loadAo(px + vec2i(1, -1)) * weightTR;
  sum += loadAo(px + vec2i(-1, 1)) * weightBL;
  sum += loadAo(px + vec2i(1, 1)) * weightBR;
  sumWeight += dot(edgesC_LRTB, vec4f(1.0)) + weightTL + weightTR + weightBL + weightBR;

  let visibility = saturate((sum / sumWeight) * params.values.y);
  return vec4f(visibility, 0.0, 0.0, 1.0);
}
`

/**
 * Multiplies the target with the ambient occlusion term. Meant to be used with multiply blending
 */
export const XE_GTAO_APPLY_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct ApplyParams {
  // strength
  values: vec4f,
};

@group(0) @binding(0) var<uniform> params: ApplyParams;
@group(0) @binding(1) var aoMap: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let ao = mix(1.0, textureLoad(aoMap, vec2i(in.position.xy), 0).r, params.values.x);
  return vec4f(ao, ao, ao, 1.0);
}
`
