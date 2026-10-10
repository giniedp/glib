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

fn volFog2SchlickPhase(dotLE: f32, k: f32, oneMinusK2: f32) -> f32 {
  let h = -((k * dotLE) - 1.0);
  return oneMinusK2 / (4.0 * 3.14159265 * h * h);
}

// Returns rgb = in-scattered light, a = transmittance, apply as color * fog.a + fog.rgb
// sunDir points towards the sun (light)
fn volFog2Analytical(p: VolFog2Params, cameraToWorldPos: vec3f, sunDir: vec3f) -> vec4f {
  // lengthToTarget *= PerFrame_FogDistanceScale.x
  let d = max(length(cameraToWorldPos) * p.blend.z, 1e-4);
  let L = p.heightDensity.x;
  let M = cameraToWorldPos.z / d;
  let densityAtViewer = p.heightDensity.y;
  let scatterCoefficient = p.scattering.x;
  let extinctionCoefficient = p.scattering.y;
  let rampStart = p.ramp.x;
  let rampEnd = p.ramp.y;
  // fullSpan, there is no ray-marched volume near the camera
  let transitionDistance = 0.1;

  // sun in-scattering, two Schlick lobes (GetVolumetricFogInscatteringSun)
  // unit view direction, d is scaled by the fog distance scale
  let dotLE = dot(sunDir, normalize(cameraToWorldPos));
  let ins0 = volFog2SchlickPhase(dotLE, p.scattering.z, p.scattering.w) * p.color1.rgb;
  let ins1 = volFog2SchlickPhase(dotLE, p.color1.w, p.color2.w) * p.color2.rgb;
  var inscatter = ins0 * (1.0 - p.blend.x * p.blend.y) + ins1 * p.blend.x;
  inscatter *= scatterCoefficient / extinctionCoefficient;
  // global environment probe in-scattering (isotropic, added after the scattering scale as in the original)
  inscatter += p.ambient.rgb;

  var LM = L * M;
  LM = select(LM, 0.000001, abs(LM) < 0.000001);
  let cLM = -extinctionCoefficient * densityAtViewer / LM;

  let d2 = min(transitionDistance, d);
  let minD = min(d, select(transitionDistance, rampStart, transitionDistance < rampStart));
  let maxD = min(d, rampEnd);
  let sd = max(rampEnd, d2);

  var logeLM = 1.442695 * LM;
  let expLMd = exp2(logeLM * d);

  // transmittance from ramp end to the end of depth
  let T0 = saturate(exp2(cLM * (expLMd - exp2(logeLM * sd))));
  var fog = vec4f(0.0, 0.0, 0.0, T0);

  var trns = 1.0;
  if (rampEnd - rampStart > 1.0 && transitionDistance < rampEnd) {
    let LM2 = select(LM, 0.0001, abs(LM) < 0.0001);
    let logeLM2 = 1.442695 * LM2;
    let CC = 1.0 / (LM2 * LM2 * (rampStart - rampEnd));
    let cCC = -extinctionCoefficient * densityAtViewer * CC;
    let A0 = exp2(logeLM2 * maxD) * (LM2 * (rampStart - maxD) + 1.0);
    let A1 = exp2(logeLM2 * minD) * (LM2 * (rampStart - minD) + 1.0);

    // transmittance with depth based ramp from ramp start to ramp end
    trns = saturate(exp2(cCC * (A0 - A1)));
    fog.a *= trns;

    // in-scattering with depth based ramp
    let V = exp2(logeLM2 * rampStart);
    let rampIE = -exp2(cCC * (A0 - V));
    let rampIS = -exp2(cCC * (A1 - V));
    fog = vec4f(fog.rgb + inscatter * saturate(rampIE - rampIS), fog.a);
  }

  // in-scattering from ramp end to the end of depth
  fog = vec4f(fog.rgb + trns * inscatter * (1.0 - T0), fog.a);

  // zenith fade (end of GetVolumetricFogAnalyticalColor), view up from the scaled length like the original
  let zenithFade = volFog2ZenithFade(p.zenith.x, p.zenith.y, cameraToWorldPos.z / d);
  fog = vec4f(mix(fog.rgb, vec3f(0.0), zenithFade), mix(fog.a, 1.0, zenithFade));

  // ApplyVolumetricFogAnalytical: analytical fog visibility
  fog = vec4f(fog.rgb * p.heightDensity.z, fog.a);

  // ClampFinalFogDensity
  let clampTransmittance = p.heightDensity.w;
  fog = vec4f(fog.rgb * (1.0 - clampTransmittance), max(fog.a, clampTransmittance));
  return fog;
}
`
