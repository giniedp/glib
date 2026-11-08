/**
 * Environment lighting from the baked probes. Materials call these functions and do not know where the light comes from.
 *
 * Expects `global` and `envMap` to be declared by the material, `envMap` is the dynamic sky cube of the A/B mode.
 * `probeSpecularCubes` is declared in common.wgsl, the fog reads it too.
 *
 * Baked cubes are sampled with the plain world direction like the engine (TiledShading.cfi), the sky cube is not
 * baked in that space and needs the conversion in getReflectColor.
 */
export const PROBES_WGSL = /* wgsl */ `
// @block global
// @private
@group(0) @binding(12) var probeDiffuseCubes  : texture_cube_array<f32>;

// TILED_SHADING_SPECPROBE_MAXMIP, the cubes have 7 mips
const PROBE_SPECULAR_MAX_LOD: f32 = 6.0;

fn environmentSpecular(cubeSampler: sampler, reflection: vec3f, gloss: f32) -> vec3f {
  if (global.probeGlobal.y < 0.5) {
    return getReflectColor(envMap, cubeSampler, reflection, gloss);
  }
  let lod = PROBE_SPECULAR_MAX_LOD * (1.0 - gloss);
  let slot = i32(global.probeGlobal.x);
  return textureSampleLevel(probeSpecularCubes, cubeSampler, reflection, slot, lod).rgb * global.probeSpecularColor.rgb;
}

// GetEnvmapFresnel (shadelib.cfi), the environment Fresnel of the cluster forward path (ApplyClusterForward_Lights):
// empirical reduced gain at grazing angles for rough materials
fn environmentFresnel(specCol0: vec3f, gloss: f32, NdotE: f32) -> vec3f {
  return mix(specCol0, vec3f(1.0), pow(1.0 - saturate(NdotE), 5.0) / (40.0 - 39.0 * gloss));
}

fn environmentDiffuse(cubeSampler: sampler, normal: vec3f) -> vec3f {
  if (global.probeGlobal.y < 0.5) {
    return getReflectColor(envMap, cubeSampler, normal, 0.0);
  }
  let slot = i32(global.probeGlobal.x);
  return textureSampleLevel(probeDiffuseCubes, cubeSampler, normal, slot, 0.0).rgb * global.probeDiffuseColor.rgb;
}
`
