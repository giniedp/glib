import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const FXAA_WGSL = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

const ITERATIONS: u32 = 12u;
var<private> QUALITY: array<f32, 12> = array<f32, 12>(
  1.0, 1.0, 1.0, 1.0, 1.0, 1.5, 2.0, 2.0, 2.0, 2.0, 4.0, 8.0
);

struct Uniforms {
  thresholdMin: f32,
  thresholdMax: f32,
  quality: f32,
};

// @block params
@group(0) @binding(0) var<uniform> params : Uniforms;
@group(0) @binding(1) var colorMap        : texture_2d<f32>;
@group(0) @binding(2) var colorMapSampler : sampler; // linear, clamp-to-edge

fn luma(c: vec3f) -> f32 {
  return dot(c, vec3f(0.299, 0.587, 0.114));
}

fn L(uv: vec2f) -> f32 {
  return luma(textureSampleLevel(colorMap, colorMapSampler, uv, 0.0).rgb);
}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  let px = 1.0 / vec2f(textureDimensions(colorMap));
  let uv = in.uv;

  let center = textureSampleLevel(colorMap, colorMapSampler, uv, 0.0);
  let lC = luma(center.rgb);
  let lU = L(uv + vec2f(0.0, -px.y));
  let lD = L(uv + vec2f(0.0,  px.y));
  let lL = L(uv + vec2f(-px.x, 0.0));
  let lR = L(uv + vec2f( px.x, 0.0));

  let lMin = min(lC, min(min(lU, lD), min(lL, lR)));
  let lMax = max(lC, max(max(lU, lD), max(lL, lR)));
  let range = lMax - lMin;

  // Not an edge: keep pixel.
  if (range < max(params.thresholdMin, lMax * params.thresholdMax)) {
    return center;
  }

  let lUL = L(uv + vec2f(-px.x, -px.y));
  let lUR = L(uv + vec2f( px.x, -px.y));
  let lDL = L(uv + vec2f(-px.x,  px.y));
  let lDR = L(uv + vec2f( px.x,  px.y));

  let lUD = lU + lD;
  let lLR = lL + lR;
  let lLeftCorners  = lUL + lDL;
  let lRightCorners = lUR + lDR;
  let lUpCorners    = lUL + lUR;
  let lDownCorners  = lDL + lDR;

  // Edge direction.
  let edgeH = abs(-2.0 * lL + lLeftCorners) + abs(-2.0 * lC + lUD) * 2.0 + abs(-2.0 * lR + lRightCorners);
  let edgeV = abs(-2.0 * lU + lUpCorners)   + abs(-2.0 * lC + lLR) * 2.0 + abs(-2.0 * lD + lDownCorners);
  let isHorizontal = edgeH >= edgeV;

  // Neighbors across the edge (1 = negative side, 2 = positive side).
  let l1 = select(lL, lU, isHorizontal);
  let l2 = select(lR, lD, isHorizontal);
  let g1 = l1 - lC;
  let g2 = l2 - lC;
  let is1Steepest = abs(g1) >= abs(g2);
  let gScaled = 0.25 * max(abs(g1), abs(g2));

  var stepLen = select(px.x, px.y, isHorizontal);
  var lLocalAvg = 0.5 * (l2 + lC);
  if (is1Steepest) {
    stepLen = -stepLen;
    lLocalAvg = 0.5 * (l1 + lC);
  }

  // Move to the edge center.
  var cUV = uv;
  if (isHorizontal) {
    cUV.y += stepLen * 0.5;
  } else {
    cUV.x += stepLen * 0.5;
  }

  // Search along the edge in both directions.
  let offset = select(vec2f(0.0, px.y), vec2f(px.x, 0.0), isHorizontal);
  var uv1 = cUV - offset;
  var uv2 = cUV + offset;
  var lEnd1 = L(uv1) - lLocalAvg;
  var lEnd2 = L(uv2) - lLocalAvg;
  var reached1 = abs(lEnd1) >= gScaled;
  var reached2 = abs(lEnd2) >= gScaled;

  for (var i = 0u; i < ITERATIONS; i++) {
    if (reached1 && reached2) { break; }
    if (!reached1) {
      uv1 -= offset * QUALITY[i];
      lEnd1 = L(uv1) - lLocalAvg;
      reached1 = abs(lEnd1) >= gScaled;
    }
    if (!reached2) {
      uv2 += offset * QUALITY[i];
      lEnd2 = L(uv2) - lLocalAvg;
      reached2 = abs(lEnd2) >= gScaled;
    }
  }

  let d1 = select(uv.y - uv1.y, uv.x - uv1.x, isHorizontal);
  let d2 = select(uv2.y - uv.y, uv2.x - uv.x, isHorizontal);
  let isDir1 = d1 < d2;
  let dFinal = min(d1, d2);
  let edgeLen = d1 + d2;
  let pxOffset = -dFinal / edgeLen + 0.5;

  // Only blend if the edge end has the expected luma variation.
  let isCenterSmaller = lC < lLocalAvg;
  let correctVariation = select(lEnd2 < 0.0, lEnd1 < 0.0, isDir1) != isCenterSmaller;
  var finalOffset = select(0.0, pxOffset, correctVariation);

  // Subpixel AA.
  let lAvg = (1.0 / 12.0) * (2.0 * (lUD + lLR) + lLeftCorners + lRightCorners);
  let sub1 = saturate(abs(lAvg - lC) / range);
  let sub2 = (-2.0 * sub1 + 3.0) * sub1 * sub1;
  let subOffset = sub2 * sub2 * params.quality;
  finalOffset = max(finalOffset, subOffset);

  var fUV = uv;
  if (isHorizontal) {
    fUV.y += finalOffset * stepLen;
  } else {
    fUV.x += finalOffset * stepLen;
  }

  return vec4f(textureSampleLevel(colorMap, colorMapSampler, fUV, 0.0).rgb, center.a);
}
`
