/**
 * Analytical volumetric fog 2 (GetVolumetricFogAnalyticalColor in VolumetricFog.cfi).
 *
 * New World renders fog with volumetric fog 2: ray-marched froxels near the camera and this analytical solution
 * beyond. The viewer has no froxel volume, the analytical solution covers the full span (fullSpan in the original).
 *
 * Parameters are computed like the sGetVolumetricFog* functions in D3DHWShader.cpp, see TimeOfDay.
 * The global environment probe in-scattering is replaced by a constant ambient color (no probes).
 * Includes the New World zenith fade (GetZenithFadeAmount), which thins the fog when looking up.
 */
export const VOLUMETRIC_FOG_2_WGSL = /* wgsl */ `
struct VolFog2Params {
  // x = height scale, y = log2(e) * density at viewer height, z = analytical fog visibility, w = final density clamp
  heightDensity: vec4f,
  // x = ramp start, y = ramp end
  ramp         : vec4f,
  // x = in-scattering, y = extinction, z = anisotropy k (atmosphere), w = 1 - k * k
  scattering   : vec4f,
  // x = blend factor of the sun radial lobes, y = blend mode, z = fog distance scale (PerFrame_FogDistanceScale.x)
  blend        : vec4f,
  // rgb = sun color * fog albedo (atmosphere), w = anisotropy k (sun radial)
  color1       : vec4f,
  // rgb = sun color * fog albedo (sun radial), w = 1 - k * k (sun radial)
  color2       : vec4f,
  // rgb = isotropic ambient in-scattering, stands in for the global environment probe of the original
  ambient      : vec4f,
  // x = zenith fade factor, y = zenith fade curve (exponent), PerFrame_VolumetricFogDistributionParams.xw
  // z = ray-marching range, the froxel volume of the original (PerFrame_VolumetricFogDistanceParams.w)
  zenith       : vec4f,
};

// GetZenithFadeAmount: amount of fog removed when looking up, 0 at and below the horizon
fn volFog2ZenithFade(factor: f32, curve: f32, viewUp: f32) -> f32 {
  if (viewUp < 0.0 || factor <= 0.0) {
    return 0.0;
  }
  // pushes the fog up from the horizon for a smoother transition
  let up = pow(min(1.0, viewUp), 2.0);
  let fade = pow(saturate(1.0 - up), curve);
  return factor - factor * fade;
}

// (e^x - 1) / x, stable near 0
fn volFog2Expm1OverX(x: f32) -> f32 {
  if (abs(x) < 0.05) {
    return 1.0 + x * (1.0 / 2.0 + x * (1.0 / 6.0 + x * (1.0 / 24.0 + x / 120.0)));
  }
  return (exp(x) - 1.0) / x;
}

// (e^x * (x - 1) + 1) / x^2, stable near 0. s^2 * phi(LM * s) = integral of u * e^(LM * u) du over [0, s]
fn volFog2RampPhi(x: f32) -> f32 {
  if (abs(x) < 0.1) {
    return 1.0 / 2.0 + x * (1.0 / 3.0 + x * (1.0 / 8.0 + x * (1.0 / 30.0 + x / 144.0)));
  }
  return (exp(x) * (x - 1.0) + 1.0) / (x * x);
}

fn volFog2SchlickPhase(dotLE: f32, k: f32, oneMinusK2: f32) -> f32 {
  let h = -((k * dotLE) - 1.0);
  return oneMinusK2 / (4.0 * 3.14159265 * h * h);
}

// Fog of the ray segment from transitionDistance to d (distances scaled by the fog distance scale), the body of
// GetVolumetricFogAnalyticalColor without the zenith fade. densityScale scales the extinction (froxel zenith fade).
// Returns rgb = in-scattered light, a = transmittance
fn volFog2Segment(p: VolFog2Params, LM: f32, d: f32, transitionDistance: f32, densityScale: f32, inscatter: vec3f) -> vec4f {
  let rampStart = p.ramp.x;
  let rampEnd = p.ramp.y;

  // The original divides differences of nearly equal exponentials by LM (and LM^2 in the ramp), clamping LM away
  // from 0. Close to the horizon (LM -> 0) that cancels catastrophically in f32 and the clamp flips the sign,
  // which shows as a line along the horizon. Same integrals here, factored into forms that are stable at LM = 0.
  let extDensity = p.scattering.y * p.heightDensity.y * densityScale;

  let d2 = min(transitionDistance, d);
  let minD = min(d, select(transitionDistance, rampStart, transitionDistance < rampStart));
  let maxD = min(d, rampEnd);
  let sd = max(rampEnd, d2);

  // transmittance from ramp end to the end of depth
  // original: exp2(-extDensity / LM * (e^(LM * d) - e^(LM * sd)))
  let T0 = saturate(exp2(-extDensity * exp(LM * sd) * (d - sd) * volFog2Expm1OverX(LM * (d - sd))));
  var fog = vec4f(0.0, 0.0, 0.0, T0);

  var trns = 1.0;
  if (rampEnd - rampStart > 1.0 && transitionDistance < rampEnd) {
    // optical depth of the ramped density from ramp start to t: extDensity * integral of e^(LM * u) * (u - rampStart) / (rampEnd - rampStart)
    // original: cCC * (A(t) - A(rampStart)) with A(t) = e^(LM * t) * (LM * (rampStart - t) + 1), cCC = -extDensity / (LM^2 * (rampStart - rampEnd))
    let rampScale = extDensity * exp(LM * rampStart) / (rampEnd - rampStart);
    let sMax = maxD - rampStart;
    let sMin = minD - rampStart;
    let tauMax = rampScale * sMax * sMax * volFog2RampPhi(LM * sMax);
    let tauMin = rampScale * sMin * sMin * volFog2RampPhi(LM * sMin);

    // transmittance with depth based ramp from ramp start to ramp end
    trns = saturate(exp2(tauMin - tauMax));
    fog.a *= trns;

    // in-scattering with depth based ramp
    fog = vec4f(fog.rgb + inscatter * saturate(exp2(-tauMin) - exp2(-tauMax)), fog.a);
  }

  // in-scattering from ramp end to the end of depth
  return vec4f(fog.rgb + trns * inscatter * (1.0 - T0), fog.a);
}

// Returns rgb = in-scattered light, a = transmittance, apply as color * fog.a + fog.rgb
// sunDir points towards the sun (light)
//
// The game ray-marches froxels up to the ray-marching range and continues analytically beyond (FogPassPS:
// BlendVolumetricFogWithGlobalFog). The viewer evaluates the near segment analytically as well, but fades it
// like the froxels: the zenith fade scales the density (GetExponentialHeightFogDensity) instead of blending
// the result towards no fog, and the analytical visibility does not apply.
fn volFog2Analytical(p: VolFog2Params, cameraToWorldPos: vec3f, sunDir: vec3f) -> vec4f {
  let len = max(length(cameraToWorldPos), 1e-4);
  // lengthToTarget *= PerFrame_FogDistanceScale.x
  let distanceScale = p.blend.z;
  let d = len * distanceScale;
  let LM = p.heightDensity.x * cameraToWorldPos.z / d;
  let range = p.zenith.z;

  // sun in-scattering, two Schlick lobes (GetVolumetricFogInscatteringSun)
  let dotLE = dot(sunDir, cameraToWorldPos / len);
  let ins0 = volFog2SchlickPhase(dotLE, p.scattering.z, p.scattering.w) * p.color1.rgb;
  let ins1 = volFog2SchlickPhase(dotLE, p.color1.w, p.color2.w) * p.color2.rgb;
  var inscatter = ins0 * (1.0 - p.blend.x * p.blend.y) + ins1 * p.blend.x;
  inscatter *= p.scattering.x / p.scattering.y;
  // global environment probe in-scattering (isotropic, added after the scattering scale as in the original)
  inscatter += p.ambient.rgb;

  // near segment (froxels in the game), view up from the linear depth like the froxels
  let nearFade = volFog2ZenithFade(p.zenith.x, p.zenith.y, cameraToWorldPos.z / len);
  var fog = volFog2Segment(p, LM, min(len, range) * distanceScale, 0.1, 1.0 - nearFade, inscatter);

  if (len > range) {
    // far segment (GetVolumetricFogAnalyticalColor with the ray-marching range as transition distance)
    var far = volFog2Segment(p, LM, d, range * distanceScale, 1.0, inscatter);
    // zenith fade (end of GetVolumetricFogAnalyticalColor), view up from the scaled length like the original
    let zenithFade = volFog2ZenithFade(p.zenith.x, p.zenith.y, cameraToWorldPos.z / d);
    far = vec4f(mix(far.rgb, vec3f(0.0), zenithFade), mix(far.a, 1.0, zenithFade));
    // BlendVolumetricFogWithGlobalFog: analytical fog visibility, behind the near segment
    fog = vec4f(fog.rgb + p.heightDensity.z * fog.a * far.rgb, fog.a * far.a);
  }

  // ClampFinalFogDensity
  let clampTransmittance = p.heightDensity.w;
  fog = vec4f(fog.rgb * (1.0 - clampTransmittance), max(fog.a, clampTransmittance));
  return fog;
}
`
