import { FULLSCREEN_WGSL_VS } from '../image/common.wgsl'

export const NISHITA_SKY_UTILS_WGSL = /* wgsl */ `
const PI: f32 = 3.141592653589793;

fn coordToHeightScale(t: f32) -> f32 {
  return exp(10.0 * (t - 1.0)) * t;
}

fn coordToCosAngle(t: f32) -> f32 {
  return 2.0 * t;
}

fn cosAngleToCoord(cosAngle: f32) -> f32 {
  return cosAngle * 0.5;
}

fn latLonToDir(
  latitude: f32,
  longitude: f32
) -> vec3f {
  let cosLat = cos(latitude);
  let sinLat = sin(latitude);
  let cosLon = cos(longitude);
  let sinLon = sin(longitude);
  return vec3f(
    sinLat * cosLon,
    sinLat * sinLon,
    cosLat
  );
}

fn uvToDir(uv: vec2f) -> vec3f {
  let latitude  = PI * 0.5 * uv.y;
  let longitude = PI * (1.0 - 2.0 * uv.x);
  return latLonToDir(latitude, longitude);
}

fn getMiePhase(g: f32, cosine: f32) -> f32 {
  let g2 = g * g;
  let miePart = 1.5 * (1.0 - g2) / (2.0 + g2);
  return miePart * (1.0 + (cosine * cosine)) / pow(1.0 + g2 - 2.0 * g * cosine, 1.5);
}

fn getRayleighPhase(cosine: f32) -> f32 {
  return 0.75 * (1.0 + cosine * cosine);
}

fn getOpticalScale(height: f32, avgDensityHeightInv: f32) -> f32 {
  return exp(-max(height, 0.0) * avgDensityHeightInv);
}

fn getOpticalDepth(
  viewHeight: f32,
  viewDir: vec3f,
  avgDensityHeightInv: f32,
  radius: f32,
  thickness: f32
) -> f32 {
  let viewPos = vec3f(0.0, viewHeight + radius, 0.0);

  // check if ray hits earth
  // compute B, and C of quadratic function (A=1, as looking direction is normalized)
  let B = 2.0 * dot(viewPos, viewDir);
  let B2 = B * B;
  let Cpart = dot(viewPos, viewPos);

  var C = Cpart - radius * radius;
  var det = B2 - 4.0 * C;

  if (det >= 0.0) {
    let sq = sqrt(det);
    let t1 = 0.5 * (-B - sq);
    let t2 = 0.5 * (-B + sq);
    if ((t1 > 1e-4) || (t2 > 1e-4)) {
      // ray hits earth
      return 60000.0; // half-float-safe sentinel
    }
  }

  // find intersection with atmosphere top
  C = Cpart - (radius + thickness) * (radius + thickness);
  det = B2 - 4.0 * C;
  let t = max(0.0, 0.5 * (-B + sqrt(det)));

  // integrate depth along ray from camera to atmosphere top
  // use Composite Simpson's 1/3 rule
  // https://en.wikipedia.org/wiki/Simpson%27s_rule#Composite_Simpson's_1/3_rule_2
  var depth = 0.0;
  let steps: i32 = 32;
  let h = t / f32(steps);
  for (var i: i32 = 0; i <= steps; i = i + 1) {
    let samplePos = viewPos + viewDir * (h * f32(i));
    let sampleHeight = length(samplePos) - radius;
    let density = getOpticalScale(sampleHeight, avgDensityHeightInv);
    var weight: f32 = 4.0;
    if (i == 0 || i == steps) {
      weight = 1.0;
    } else if ((i & 1) == 0) {
      weight = 2.0;
    }
    depth = depth + density * weight;
  }
  return depth * h / 3.0;
}

fn getOpticalValues(
  uv: vec2f,
  earthRadius: f32,
  atmosphereHeight: f32,
  mieScaleHeight: f32,
  rayleighScaleHeight: f32,
) -> vec4f {

  let viewHeight = coordToHeightScale(uv.y) * atmosphereHeight;
  let cosAngle   = coordToCosAngle(uv.x);
  let viewDir = vec3f(sqrt(max(1.0 - cosAngle * cosAngle, 0.0)), cosAngle, 0.0);

  let mieInv = 1.0 / mieScaleHeight;
  let rayInv = 1.0 / rayleighScaleHeight;

  let mieDepth = getOpticalDepth(viewHeight, viewDir, mieInv, earthRadius, atmosphereHeight);
  let rayDepth = getOpticalDepth(viewHeight, viewDir, rayInv, earthRadius, atmosphereHeight);
  let mieScale = getOpticalScale(viewHeight, mieInv);
  let rayScale = getOpticalScale(viewHeight, rayInv);

  return vec4f(mieDepth, rayDepth, mieScale, rayScale);
}
`

export const NISHITA_OPTICAL_LUT_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${NISHITA_SKY_UTILS_WGSL}

struct ParamsBlock {
  radius              : f32, // planet radius in km e.g. 6368.0 for earth
  thickness           : f32, // atmosphere thickness in km e.g. 100 for earth
  mieScaleHeight      : f32, // height in km where average aerosols density is found, e.g. 1.2 for earth
  rayleighScaleHeight : f32, // height in km where average air molecule density is found, e.g. 7.994 for earth
};
@group(0) @binding(0) var<uniform> params: ParamsBlock;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  return getOpticalValues(
    in.uv,
    params.radius,
    params.thickness,
    params.mieScaleHeight,
    params.rayleighScaleHeight
  );
}
`

export const NISHITA_SCATTERING_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${NISHITA_SKY_UTILS_WGSL}

struct ParamsBlock {
  waveLengthInv     : vec3f, // pow(waveLength * 0.001, -4.0)
  sunLatitude       : f32,
  sunLongitude      : f32,
  radius            : f32,
  thickness         : f32,
  mieScattering     : f32, // km
  rayleighScattering: f32, // kr
  phaseAsymmetry    : f32, // g
};
@group(0) @binding(0) var<uniform> params: ParamsBlock;
@group(0) @binding(1) var opticalLutMap: texture_2d<f32>;
@group(0) @binding(2) var opticalLutSampler: sampler;

struct PartialScattering {
  mie: vec3f,
  rayleigh: vec3f,
};

fn partialInScatteringAtHeight(
  outScatteringMie     : f32,
  outScatteringRayleigh: vec3f,
  osAtHeight           : vec2f, // x = mie, y = rayleigh
  odAtHeightSky        : vec2f, // x = mie, y = rayleigh
  odAtViewerSky        : vec2f, // x = mie, y = rayleigh
  odAtHeightSun        : vec2f  // x = mie, y = rayleigh
) -> PartialScattering {

  // mie out-scattering
  let sampleExpArgMie = outScatteringMie * (-odAtHeightSun.x - (odAtViewerSky.x - odAtHeightSky.x));

  // rayleigh out-scattering
  let sampleExpArgRayleigh = outScatteringRayleigh * (-odAtHeightSun.y - (odAtViewerSky.y - odAtHeightSky.y));

  // partial in-scattering sampling result
  let sampleRes = exp(vec3f(sampleExpArgMie, sampleExpArgMie, sampleExpArgMie) + sampleExpArgRayleigh);

  var result: PartialScattering;
  result.mie = osAtHeight.x * sampleRes;
  result.rayleigh = osAtHeight.y * sampleRes;
  return result;
}

struct FragmentOut {
  @location(0) colorMie: vec4f,
  @location(1) colorRayleigh: vec4f,
};

@fragment
fn fs_main(in: FragmentInput) -> FragmentOut {
  let skyDir = uvToDir(in.uv);
  let sunDir = latLonToDir(params.sunLatitude, params.sunLongitude);
  let km = params.mieScattering;
  let kr = params.rayleighScattering;

  let outScatteringMie      = 4.0 * PI * km;
  let outScatteringRayleigh = 4.0 * PI * kr * params.waveLengthInv;

  let upDir = vec3f(0.0, 0.0, 1.0);
  let viewPos = upDir * params.radius;
  var rayPos = viewPos;

  // to be reused by ray-sphere intersection code in loop below
  let B = 2.0 * dot(viewPos, skyDir);
  let B2 = B * B;
  let Cpart = dot(viewPos, viewPos);

  let sampleViewerSky = textureSample(opticalLutMap, opticalLutSampler, vec2f(cosAngleToCoord(dot(skyDir, upDir)), 0.0));
  let sampleViewerSun = textureSample(opticalLutMap, opticalLutSampler, vec2f(cosAngleToCoord(dot(sunDir, upDir)), 0.0));

  var current = partialInScatteringAtHeight(
    outScatteringMie,
    outScatteringRayleigh,
    sampleViewerSky.zw,
    sampleViewerSky.xy,
    sampleViewerSky.xy,
    sampleViewerSun.xy
  );

  var resultMie = vec3f(0.0, 0.0, 0.0);
  var resultRayleigh = vec3f(0.0, 0.0, 0.0);

  let steps: i32 = 32;
  let stepSize = 1.0 / f32(steps);
  for (var i: i32 = 1; i <= steps; i = i + 1) {
    let s = stepSize * f32(i);
    let height = params.radius + coordToHeightScale(s) * params.thickness;

    let C = Cpart - height * height;
    let det = B2 - 4.0 * C;
    let t = 0.5 * (-B + sqrt(det));

    let newRayPos = viewPos + t * skyDir;
    let newUp = normalize(newRayPos);

    let sampleHeightSky = textureSample(opticalLutMap, opticalLutSampler, vec2f(cosAngleToCoord(dot(skyDir, newUp)), s));
    let sampleHeightSun = textureSample(opticalLutMap, opticalLutSampler, vec2f(cosAngleToCoord(dot(sunDir, newUp)), s));
    let odHeightSky = min(sampleHeightSky.xy, sampleViewerSky.xy);

    let next = partialInScatteringAtHeight(
      outScatteringMie,
      outScatteringRayleigh,
      sampleHeightSky.zw,
      odHeightSky,
      sampleViewerSky.xy,
      sampleHeightSun.xy
    );

    let weight = length(newRayPos - rayPos) * 0.5;
    resultMie = resultMie + (current.mie + next.mie) * weight;
    resultRayleigh = resultRayleigh + (current.rayleigh + next.rayleigh) * weight;

    rayPos = newRayPos;
    current = next;
  }

  // clamp to safe half float value
  resultMie = min(resultMie, vec3f(60000.0));
  resultRayleigh = min(resultRayleigh, vec3f(60000.0));

  var out: FragmentOut;
  out.colorMie = vec4f(resultMie, 1.0);
  out.colorRayleigh = vec4f(resultRayleigh, 1.0);
  return out;
}
`

export const NISHITA_PANORAMA_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${NISHITA_SKY_UTILS_WGSL}

struct ParamsBlock {
  groundColor       : vec3f,
  waveLengthInv     : vec3f, // pow(waveLength * 0.001, -4.0)
  sunIntensity      : vec3f,
  sunLatitude       : f32,
  sunLongitude      : f32,
  mieScattering     : f32, // km
  rayleighScattering: f32, // kr
  phaseAsymmetry    : f32, // g
  nightSkyColorBase   : vec3f,
  nightSkyColorDelta  : vec3f,
  nightSkyColorShift  : vec2f,
};
@group(0) @binding(0) var<uniform> params: ParamsBlock;
@group(0) @binding(1) var mieScatteringMap: texture_2d<f32>;
@group(0) @binding(2) var mieScatteringSampler: sampler;
@group(0) @binding(3) var rayleighScatteringMap: texture_2d<f32>;
@group(0) @binding(4) var rayleighScatteringSampler: sampler;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  var uv = in.uv;
  // expand uv.y to cover lower hemisphere
  // which will receive the ground color below
  uv.y = 2.0 * uv.y;

  let skyDir = uvToDir(uv);
  let sunDir = latLonToDir(params.sunLatitude, params.sunLongitude);
  let km = params.mieScattering;
  let kr = params.rayleighScattering;
  let g = params.phaseAsymmetry;
  let ground = params.groundColor;

  let mieColor      = textureSample(mieScatteringMap, mieScatteringSampler, uv).rgb;
  let rayleighColor = textureSample(rayleighScatteringMap, rayleighScatteringSampler, uv).rgb;

  let cosAngle      = dot(skyDir, -sunDir);
  let miePhase      = getMiePhase(g, cosAngle);
  let rayleighPhase = getRayleighPhase(cosAngle);

  let partialMieConst      = params.sunIntensity * km;
  let partialRayleighConst = params.sunIntensity * kr * params.waveLengthInv;

  var color = vec3(0.0);
  if (uv.y <= 1.0) {
    // upper hemisphere
    color += rayleighColor * partialRayleighConst * rayleighPhase;
    color += mieColor * partialMieConst * miePhase;
  } else {
    // lower hemisphere, ground color contribution
    color = rayleighColor * partialRayleighConst * rayleighPhase * ground;
  }

  var gr = saturate(skyDir.z * params.nightSkyColorShift.x + params.nightSkyColorShift.y);
      gr = gr * (2.0 - gr);
  color += params.nightSkyColorBase.rgb;
  color += params.nightSkyColorDelta.rgb * gr;
  color = min(color, vec3f(60000.0));

  return vec4f(color, 1.0);
}
`
