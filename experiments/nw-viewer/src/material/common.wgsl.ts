export const COMMON_WGSL = /* wgsl */ `

const TRUE: u32 = 1u;
const FALSE: u32 = 0u;
const LIGHT_TYPE_OFF:         u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT:       u32 = 2u;
const LIGHT_TYPE_SPOT:        u32 = 3u;
const LIGHT_TYPE_AREA:        u32 = 4u;
const FLOAT_EPSILON = 1e-10;
const MIN_ROUGHNESS = 0.05;// 0.001;

// #region --- Debug Flags ---
const DEBUG_OFF:                 u32 = 0u;
// Material
const DEBUG_MTL_ALBEDO:          u32 = 1u; // base color
const DEBUG_MTL_SPECULAR:        u32 = 2u;
const DEBUG_MTL_METALLIC:        u32 = 3u;
const DEBUG_MTL_ROUGHNESS:       u32 = 4u;
const DEBUG_MTL_IOR:             u32 = 5u;
const DEBUG_MTL_EMISSIVE:        u32 = 6u;
const DEBUG_MTL_AO:              u32 = 7u; // ambient occlusion
const DEBUG_MTL_OPACITY:         u32 = 8u; // alpha
const DEBUG_MTL_HEIGHT:          u32 = 9u;
const DEBUG_MTL_NOISE:           u32 = 10u;

// Geometry / vectors
const DEBUG_GV_NORMAL:           u32 = 100u;
const DEBUG_GV_TANGENT:          u32 = 101u;
const DEBUG_GV_BITANGENT:        u32 = 102u;
const DEBUG_GV_SHADE_NORMAL:     u32 = 103u;
const DEBUG_GV_POSITION_WS:      u32 = 104u;
const DEBUG_GV_DEPTH:            u32 = 105u;

// Vertex attributes
const DEBUG_V_COLOR0:            u32 = 200u;
const DEBUG_V_COLOR1:            u32 = 201u;
const DEBUG_V_UV0:               u32 = 202u;
const DEBUG_V_UV1:               u32 = 203u;
const DEBUG_V_UV3:               u32 = 204u;
const DEBUG_V_UV4:               u32 = 205u;
const DEBUG_V_UV5:               u32 = 206u;
const DEBUG_V_DEFORM:            u32 = 207u;

// Shading components
const DEBUG_SH_DIFFUSE:          u32 = 300u;
const DEBUG_SH_SPECULAR:         u32 = 301u;
const DEBUG_SH_SHADOW:           u32 = 302u;
const DEBUG_SH_AMBIENT:          u32 = 303u;
const DEBUG_SH_REFLECTION:       u32 = 304u;
const DEBUG_SH_FRESNEL:          u32 = 305u;
const DEBUG_SH_COUNT:            u32 = 306u; // heatmap of overlapping lights/clusters

// Misc / engine
// const DEBUG_MIP_LEVEL:     u32 = 29u;
// const DEBUG_UV_CHECKER:    u32 = 30u;
// const DEBUG_WIREFRAME:     u32 = 31u;
// const DEBUG_OVERDRAW:      u32 = 32u;
// const DEBUG_LOD:           u32 = 33u;
// const DEBUG_MOTION_VECTORS:u32 = 34u;
// const DEBUG_INSTANCE_ID:   u32 = 35u;
// const DEBUG_MATERIAL_ID:   u32 = 36u;
// #endregion

// #region --- Feature toggles ---

  override ALLOW_SILHOUETTE_POM = false;
  override ALLOW_SPECULAR_ANTIALIASING = false;
  override ALLOW_TESSELATION = false;
  override ALPHAMASK_DETAILMAP = false;
  override ANISO_SPECULAR = false;
  override APPLY_FOG_COLOR = false;
  override APPLY_SUN_COLOR = false;
  override BILINEAR_FP16 = false;
  override BLENDLAYER = false;
  override BLENDLAYER_UV_SET_2 = false;
  override BLUR_REFRACTION = false;
  override BUMP_MAP = false;
  override COLOR_LOOKUP = false;
  override COLOR_SAMPLER_OVERLAY_MASK = false;
  override DECAL = false;
  override DECAL_MAP = false;
  override DEFORMATION = false;
  override DEPTH_FIXUP = false;
  override DEPTH_FOG = false;
  override DETAIL_BENDING = false;
  override DETAIL_MAPPING = false;
  override DIFFUSE_MAP_2 = false;
  override DIFFUSE_MAP_3 = false;
  override DIFFUSE_MAP_4 = false;
  override DIRECTION_MAP = false;
  override DIRT_MAP = false;
  override DIRTLAYER = false;
  override DISPLACEMENT_MAPPING = false;
  override EMISSIVE_DECAL = false;
  override EMITTANCE_MAP = false;
  override EMITTANCE_MAP_UV_SET_2 = false;
  override ENABLE_FADEOUT = false;
  override ENFORCE_TILED_SHADING = false;
  override ENVIRONMENT_MAP = false;
  override FLOW = false;
  override FLOW_MAP = false;
  override FOAM = false;
  override FX_ADVANCED_SS = false;
  override FX_DISSOLVE = false;
  override FX_SS_CUSTOM_DIR = false;
  override GLOW_FRESNEL = false;
  override GLOW_MAP = false;
  override GRADIENT_ALPHA = false;
  override GRASS = false;
  override HAIR_PASS = false;
  override HAS_DECAL_LAYERS = false;
  override IS_GDE_IMPOSTOR = false;
  override IS_POI_IMPOSTOR = false;
  override LEAVES = false;
  override NOISE = false;
  override NORMAL_MAP = false;
  override OCCLUSION_MAP = false;
  override OFFSET_BUMP_MAPPING = false;
  override OVERLAY_MASK = false;
  override PARALLAX_OCCLUSION_MAPPING = false;
  override PHONG_TESSELLATION = false;
  override PN_TESSELLATION = false;
  override RECEIVE_SHADOWS = false;
  override REFRACTION = false;
  override REFRACTION_TINTING = false;
  override RIM_BLEND = false;
  override RIM_DIFFUSE_LIGHTING = false;
  override RIM_SPEC_LIGHTING = false;
  override SAA_FILTERING = false;
  override SCREEN_SPACE_DEFORMATION = false;
  override SIGNED_DISTANCE_FIELD_2D = false;
  override SILHOUETTE_PARALLAX_OCCLUSION_MAPPING = false;
  override SIMPLE = false;
  override SOFT_PARTICLE = false;
  override SOLID_HAIR = false;
  override SPEC_MAP = false;
  override SPECULAR_LIGHTING = false;
  override SPECULAR_MAP = false;
  override SPRITESHEET_MATERIAL = false;
  override SSREFL = false;
  override SUBSURFACE_SCATTERING = false;
  override SUBSURFACE_SCATTERING_MASK = false;
  override SUN_SHINE = false;
  override SUN_SPECULAR = false;
  override TEMP_SKIN = false;
  override TEMP_TERRAIN = false;
  override TEMP_VEGETATION = false;
  override THIN_HAIR = false;
  override TINT_COLOR_MAP = false;
  override TINT_MAP = false;
  override TRANSMITTANCE = false;
  override TRANSPARENT_ZPREPASS = false;
  override UNLIT = false;
  override USE_ADVANCED_DISSOLVE = false;
  override USE_AS_BEAMPROC = false;
  override USE_COMPLEX_COL = false;
  override USE_COMPLEX_COL_DODGE = false;
  override USE_COMPLEX_COL_OVERLAY = false;
  override USE_FRESNEL_DISSOLVE_MASK = false;
  override USE_FX_NORMAL_PARAMS = false;
  override USE_GLOW_FRESNEL = false;
  override USE_INSIDE_FRESNEL_ALPHA = false;
  override USE_INTERSECTION_FADE = false;
  override USE_INTERSECTION_GLOW = false;
  override USE_OUTSIDE_FRESNEL_ALPHA = false;
  override USE_PALETTE_MAP = false;
  override USE_PROC_GRADS = false;
  override USE_SDF_2D = false;
  override USE_STENCIL_DISSOLVE_MASK = false;
  override UV_VIGNETTING = false;
  override VERT_DEFORM_SINWAVE = false;
  override VERTCOLORS = false;
  override VERTICAL_GRADIENT = false;
  override WATER_TESSELLATION_DX11 = false;
// #endregion

const MICRO_DETAIL_QUALITY_DEF: u32 = 0u; // default
const MICRO_DETAIL_QUALITY_OBM: u32 = 1u; // offset bump mapping
const MICRO_DETAIL_QUALITY_POM: u32 = 2u; // parallax occlusion mapping
const MICRO_DETAIL_QUALITY_SPM: u32 = 3u; // silhouette parallax occlusion mapping

const LIGHT_UNIT_SCALE: f32 = 10000.0;
const EMITTANCE_TO_ENGINE_LIGHT_SCALE: f32 = (1000.0 / LIGHT_UNIT_SCALE);

struct GlobalBlock {
  sunColor         : vec4f, // xyz = color, a = specular multiplier
  sunDirection     : vec3f,
  cloudShadingCustomSunColor  : vec3f,
  cloudShadingCustomSkyColor  : vec3f,

  bottomFogColor   : vec4f,
  bottomFogHeight  : f32,
  bottomFogDensity : f32,

  topFogColor      : vec4f,
  topFogHeight     : f32,
  topFogDensity    : f32,

  volumetricFogParams             : vec4f,
  volumetricFogRampParams         : vec4f,
  volumetricFogColorGradientParams: vec4f,
  volumetricFogColorGradientRadial: vec4f,
  volumetricFogColorGradientBase  : vec4f,
  volumetricFogColorGradientDelta : vec4f,

  fogHeightOffset  : f32,
  debug            : u32,
  // 1 while rendering opaque geometry, fog is then applied in a deferred fog pass
  skipFog          : u32,

};

struct ObjectBlock {
  modelMatrix: mat4x4f,
};

struct ViewBlock {
  viewMatrix:       mat4x4f,
  projectionMatrix: mat4x4f,
  inverseViewProjectionMatrix: mat4x4f,
  cameraPosition:   vec3f,
  cameraDirection:  vec3f,
  near:             f32,
  far:              f32,
  viewportSize:     vec2f,
};

struct FrameBlock {
  elapsedTime: f32,
  deltaTime: f32,
  index: f32,
};

// Forward+ cluster parameters, written each frame by the LightSystem
struct LightBlock {
  // xyz = cluster grid dimensions, w = number of lights in lightList
  clusterGrid  : vec4f,
  // x = near, y = far, z = slice scale, w = slice bias
  // slice = floor(log(viewDepth) * scale + bias)
  clusterDepth : vec4f,
};

// A single scene light as stored in the light storage buffer
struct Light {
  position : vec4f, // xyz = world position, w = range
  color    : vec4f, // rgb = diffuse color (intensity applied), w = specular multiplier
  direction: vec4f, // xyz = emit direction (projector, area), w = light type
  tangent  : vec4f, // xyz = area light width axis, w = attenuation bulb size
  params   : vec4f, // x = area half width, y = area half height, z = cos outer cone, w = cos inner cone
  bounds   : vec4f, // xyz = world bounding sphere center, w = radius
};

// Offset and count into lightIndices, one entry per cluster
struct LightCluster {
  offset: u32,
  count : u32,
};

// Index into lightList. Wrapped in a struct, so the meta codegen yields a named slot
struct LightIndex {
  light: u32,
};

// Shared light buffers, fed by the LightSystem through the 'lights' input block.
// Declared with a single element, the bound buffers are larger (same approach as the per instance object buffer).
// @private
// @block lights
@group(0) @binding(8)  var<storage, read> lightList    : array<Light, 1>;
// @private
// @block lights
@group(0) @binding(9)  var<storage, read> lightClusters: array<LightCluster, 1>;
// @private
// @block lights
@group(0) @binding(10) var<storage, read> lightIndices : array<LightIndex, 1>;

struct LightParams {
  Color: vec4f,
  Position: vec4f,
  Direction: vec4f,
};

struct ShadeParams {
  V: vec3f, // View direction
  L: vec3f, // Light direction
  Kd: vec3f, // diffuse light intensity
  Kr: vec3f, // specular light intensity
};

struct ShadeOutput {
  ambient: vec3f,
  diffuse: vec3f,
  specular: vec3f,
  diffuseBack: vec3f, // transmittance
  specularRoughness: f32, // specular anti-aliased roughness, use for environment reflections
}

struct SurfaceParams {
  Transmittance : vec4f, // .rgb=back color, .a=normalViewDependency factor
  Diffuse       : vec3f,
  Alpha         : f32,
  Specular      : vec3f,
  Roughness     : f32,
  Normal        : vec4f,
};

struct LightResult {
  direction : vec3f,
  diffuse   : vec3f,
  specular  : vec3f,
  falloff   : f32,
  specularDirection: vec3f, // optional direction for specular (area lights), zero if unused
};

struct FragmentOutput {
  @location(0) color: vec4f,
  @location(1) depth: f32,
};

fn getLight(light: LightParams, lightType: u32, position: vec3f) -> LightResult {
  var result: LightResult;
  if (lightType == LIGHT_TYPE_DIRECTIONAL) {
    result.direction = normalize(-light.Direction.xyz);
    result.diffuse = light.Color.rgb;
    result.specular = light.Color.rgb * light.Color.a;
    result.falloff = 1.0;
    return result;
  }
  return result;
}

fn getPhysicalLightAttenuation(fDist : f32, fInvRadius : f32, fAttenuationBulbSize : f32) -> f32 {
    let radius = 1.0 / fInvRadius;
    var d = fDist;

    // Fadeout last 20% of radius
    let fadeoutFactor = saturate((radius - d) * (fInvRadius / 0.2));

    // Light attenuation model: 1 / (1 + d/lightsize)^2
    d = max(d - fAttenuationBulbSize, 0.0);
    let denom = 1.0 + d / fAttenuationBulbSize;
    let fAttenuation = fadeoutFactor * fadeoutFactor / (denom * denom);

    return fAttenuation;
}

fn closestPointOnRect(p: vec3f, center: vec3f, axisX: vec3f, axisY: vec3f, halfW: f32, halfH: f32) -> vec3f {
  let d = p - center;
  let x = clamp(dot(d, axisX), -halfW, halfW);
  let y = clamp(dot(d, axisY), -halfH, halfH);
  return center + axisX * x + axisY * y;
}

fn getClusterLight(light: Light, position: vec3f, reflectDir: vec3f) -> LightResult {
  var result: LightResult;
  let lightType = u32(light.direction.w);
  let range = max(light.position.w, 0.0001);
  let bulb = light.tangent.w;
  let dir = light.direction.xyz;

  result.diffuse = light.color.rgb;
  result.specular = light.color.rgb * light.color.w;

  if (lightType == LIGHT_TYPE_POINT) {
    let toLight = light.position.xyz - position;
    let dist = length(toLight);
    result.direction = toLight / max(dist, 1e-5);
    result.falloff = getPhysicalLightAttenuation(dist, 1.0/range, bulb);
    return result;
  }

  if (lightType == LIGHT_TYPE_SPOT) {
    let toLight = light.position.xyz - position;
    let dist = length(toLight);
    let L = toLight / max(dist, 1e-5);
    let cone = smoothstep(light.params.z, light.params.w, dot(-L, dir));
    result.direction = L;
    result.falloff = getPhysicalLightAttenuation(dist, 1.0/range, bulb) * cone;
    return result;
  }

  if (lightType == LIGHT_TYPE_AREA) {
    let axisX = light.tangent.xyz;
    let axisY = cross(dir, axisX);
    let halfW = light.params.x;
    let halfH = light.params.y;
    let center = light.position.xyz;

    // only the front side emits light
    if (dot(position - center, dir) <= 0.0) {
      result.falloff = 0.0;
      return result;
    }

    // diffuse: closest point on the rectangle
    let pDiffuse = closestPointOnRect(position, center, axisX, axisY, halfW, halfH);
    let toLight = pDiffuse - position;
    let dist = length(toLight);
    result.direction = toLight / max(dist, 1e-5);
    result.falloff = getPhysicalLightAttenuation(dist, 1.0/range, max(bulb, min(halfW, halfH)));

    // optional emission cone (disabled when cos outer <= -1)
    if (light.params.z > -1.0) {
      result.falloff *= smoothstep(light.params.z, light.params.w, dot(-result.direction, dir));
    }

    // specular: representative point where the reflection ray hits the light plane
    var pSpec = pDiffuse;
    let denom = dot(reflectDir, dir);
    if (denom < -1e-4) {
      let t = dot(center - position, dir) / denom;
      if (t > 0.0) {
        pSpec = closestPointOnRect(position + reflectDir * t, center, axisX, axisY, halfW, halfH);
      }
    }
    result.specularDirection = normalize(pSpec - position);
    return result;
  }

  result.falloff = 0.0;
  return result;
}

// Returns the Forward+ cluster index for a world position, or -1 if outside the cluster volume
fn getLightClusterIndex(lights: LightBlock, worldPos: vec3f) -> i32 {
  let grid = vec3u(lights.clusterGrid.xyz);
  if (grid.x == 0u || grid.y == 0u || grid.z == 0u || lights.clusterGrid.w < 1.0) {
    return -1;
  }
  let viewPos = view.viewMatrix * vec4f(worldPos, 1.0);
  let depth = -viewPos.z;
  if (depth <= 0.0 || depth > lights.clusterDepth.y) {
    return -1;
  }
  let clip = view.projectionMatrix * viewPos;
  let uv = saturate((clip.xy / clip.w) * 0.5 + 0.5);
  let tx = min(u32(uv.x * f32(grid.x)), grid.x - 1u);
  let ty = min(u32(uv.y * f32(grid.y)), grid.y - 1u);
  let slice = log(max(depth, lights.clusterDepth.x)) * lights.clusterDepth.z + lights.clusterDepth.w;
  let tz = min(u32(max(slice, 0.0)), grid.z - 1u);
  return i32(tx + ty * grid.x + tz * grid.x * grid.y);
}

fn shadeLight(output: ptr<function, ShadeOutput>, surface: SurfaceParams, toEye: vec3f, light: LightResult) {
  let V = toEye;
  let L = light.direction;
  let Kd = light.diffuse * light.falloff;
  let Kr = light.specular * light.falloff;

  let normal = surface.Normal.xyz;
  let roughness = surface.Roughness;
  let NdotL = saturate(dot(normal, L));
  let cDiffuse = Kd * diffuseBRDF(roughness, normal, V, L, NdotL);

  // area lights provide a separate representative direction for specular
  let Ls = select(L, light.specularDirection, dot(light.specularDirection, light.specularDirection) > 0.5);
  let NdotLs = saturate(dot(normal, Ls));
  let cSpecular = Kr * specularBRDF(roughness, normal, V, Ls, surface.Specular.rgb, 1.0);

  let ck = vec3(1.0); // pLight.fOcclShadow * pLight.fFallOff * pLight.cFilter;

  (*output).diffuse += cDiffuse * ck;
  if (length(surface.Transmittance.rgb) > 0.0) {
    let fTransmitance = pow(saturate(dot(-normal, L) * 0.6 + 0.4), 1 / (1 - surface.Transmittance.a));
    (*output).diffuse += fTransmitance * Kd * surface.Transmittance.rgb * ck;
  }
  (*output).specular += cSpecular * ck * NdotLs;
}

fn accumulateLight(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> vec3f {
  let shade = accumulateLightShade(lights, env, surface, toEye, worldPos);
  return composeShade(surface, shade);
}

fn accumulateLightShade(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> ShadeOutput {
  var output: ShadeOutput;

  // --- sun
  var sun: LightParams;
  sun.Color = env.sunColor.xyzw;
  sun.Position = vec4f(0.0);
  sun.Direction = vec4f(env.sunDirection, 0.0);
  shadeLight(&output, surface, toEye, getLight(sun, LIGHT_TYPE_DIRECTIONAL, worldPos));

  // --- clustered lights (Forward+)
  let clusterIndex = getLightClusterIndex(lights, worldPos);
  if (clusterIndex < 0) {
    return output;
  }
  let cluster = lightClusters[clusterIndex];
  let reflectDir = reflect(-toEye, surface.Normal.xyz);
  for (var i = 0u; i < cluster.count; i++) {
    let light = lightList[lightIndices[cluster.offset + i].light];
    let result = getClusterLight(light, worldPos, reflectDir);
    if (result.falloff > 0.0) {
      shadeLight(&output, surface, toEye, result);
    }
  }

  return output;
}

fn composeShade(surface: SurfaceParams, shade: ShadeOutput) -> vec3f {
  var diffuse = (shade.ambient + shade.diffuse) * surface.Diffuse.rgb;
  diffuse *= saturate(vec3f(1.0) - getLuminance(surface.Specular.rgb));

  // TODO: reflection

  var specular = shade.specular;

  return diffuse + specular;
}

const PI: f32 = 3.141592653589793;
const EPSILON: f32 = 1e-6;

// Geometric attenuation (G)
fn pbrGeometricOcclusion(dotNL: f32, dotNV: f32, r: f32) -> f32 {
  let rSq: f32 = r * r;
  let attenuationL: f32 = 2.0 * dotNL / (dotNL + sqrt(rSq + (1.0 - rSq) * (dotNL * dotNL)));
  let attenuationV: f32 = 2.0 * dotNV / (dotNV + sqrt(rSq + (1.0 - rSq) * (dotNV * dotNV)));
  return attenuationL * attenuationV;
}

// Microfacet distribution (D)
fn pbrMicrofacetDistribution(dotNH: f32, r: f32) -> f32 {
  let rSq: f32 = r * r;
  let f: f32 = (dotNH * rSq - dotNH) * dotNH + 1.0;
  return rSq / (PI * f * f);
}

fn roughnessToPower(r: f32) -> f32 {
  let rr = max(r, 0.04);
  return 2.0 / (rr * rr) - 2.0;
}

fn burleyBRDF(roughness: f32, NdotL: f32, NdotV: f32, VdotH: f32) -> f32 {
  let dotNV = saturate(max(NdotV, 0.1));  // Prevent overly dark edges

  // Burley BRDF with renormalization to conserve energy
  let energyBias = 0.5 * roughness;
  let energyFactor = mix(1, 1 / 1.51, roughness);
  let fd90 = energyBias + 2.0 * VdotH * VdotH * roughness;
  let scatterL = mix(1, fd90, pow(1 - NdotL, 5));
  let scatterV = mix(1, fd90, pow(1 - dotNV, 5));

  return scatterL * scatterV * energyFactor * NdotL;
}

fn diffuseBRDF( roughness: f32, N: vec3f, V: vec3f, L: vec3f, NdotL: f32) -> f32 {
  let VdotH = saturate(dot(V, normalize(V + L)));
  let NdotV = abs(dot(N, V)) + 1e-5;

  return burleyBRDF(roughness, NdotL, NdotV, VdotH);
}

fn specularBRDF( roughness: f32, N: vec3f, V: vec3f, L: vec3f, F0: vec3f, normalizationFactor: f32 ) -> vec3f {
  let m2 = roughness * roughness;
  let Hraw = V + L;
  let H = select(normalize(Hraw), N, dot(Hraw, Hraw) < 1e-8);
  // let H = normalize( V + L );

  // The PBR terms
  let NDF = NDF_GGX( N, H, m2, normalizationFactor);  // NDF
  let G = G_CorrelatedSmith(N, V, L, m2);             // G - Correlated Smith Visibility Term (including Cook-Torrance denominator)
  let fresnel = Fresnel(L, H, F0);                    // Fresnel (Schlick approximation + micro occlusion)

  // Final specular term - normalization factors 1 / ((N*V)*(N*L) accounted for in the G term.
  let  finalSpecular = NDF * G * fresnel;

  return finalSpecular;
}

fn getAverageQuadNormal(pixelPos: vec2i, n: vec3f) -> vec3f {
  var outN = n;
  outN -= dpdxFine(outN) * (f32(pixelPos.x & 1) - 0.5);
  outN -= dpdyFine(outN) * (f32(pixelPos.y & 1) - 0.5);
  return outN;
}

fn getKaplanyanFilteringRect(
  tbn: mat3x3f,
  pixelPos: vec2i,
  roughnessMaxFootprint: f32
) -> vec2<f32> {
    // Shading frame
    let T        = tbn[0];
    let ShFrameN = normalize(tbn[2]);
    let ShFrameS = normalize(T - ShFrameN * dot(ShFrameN, T));
    let ShFrameT = cross(ShFrameN, ShFrameS);

    var hppW = getAverageQuadNormal(pixelPos, ShFrameN);

    hppW /= dot(ShFrameN, hppW);
    let hpp = vec2<f32>(dot(hppW, ShFrameS), dot(hppW, ShFrameT));

    var filteringRect = (abs(dpdxFine(hpp)) + abs(dpdyFine(hpp))) * 0.5;
    return min(vec2f(roughnessMaxFootprint + 1e-5), filteringRect);
}

fn getKaplanyanRoughness(
  tbn : mat3x3f,
  pixelPos : vec2i,
  roughness : f32,
  roughnessBoost: f32,
  roughnessMaxFootprint: f32,
) -> f32 {
  let filteringRect = getKaplanyanFilteringRect(tbn, pixelPos, roughnessMaxFootprint);

  let covariance = filteringRect * filteringRect * 2.0 * roughnessBoost;
  let maxIsotropicEdge = max(covariance.x, covariance.y);

  return sqrt(roughness * roughness + maxIsotropicEdge);
}

fn getReflectColorRoughness(cubeMap: texture_cube<f32>, cubeSampler: sampler, reflection: vec3f, roughness: f32) -> vec3f {
  return getReflectColor(cubeMap, cubeSampler, reflection, roughnessToSmoothness(roughness));
}

fn getReflectColor(cubeMap: texture_cube<f32>, cubeSampler: sampler, reflection: vec3f, gloss: f32) -> vec3f {
  let reflectionLod = (1.0 - gloss) * f32(6 - 1u);
  return textureSampleLevel(cubeMap, cubeSampler, cryVecToGLTF(reflection), reflectionLod).rgb;
}

//-------------------------------------------------------------------------
// GGX NDF:
// Spec Cry (optimized) = NormFactor * rough2 / [cos2 * (rough2 - 1) + 1]^2
// Spec GGX =      NormFactor / [cos2 * rough2 + sin2]^2   AND  sin2 = 1 - cos2
//            -->  NormFactor / [cos2 * rough2 + 1 - cos2]^2
//            -->  NormFactor / [cos2 * (rough2 - 1) + 1]^2
//-------------------------------------------------------------------------
fn NDF_GGX(N: vec3f, H: vec3f, roughSq: f32, normalizationFactor: f32) -> f32 {
  let   NdotH = saturate(dot(N, H));
  var   SpecGGX = NdotH * (NdotH * roughSq - NdotH) + 1.0;
  SpecGGX = normalizationFactor * roughSq / max((SpecGGX * SpecGGX), FLOAT_EPSILON );

  return SpecGGX;
}

fn G_CorrelatedSmith(N: vec3f, V: vec3f, L: vec3f, m2: f32) -> f32 {
  let NdotL = saturate(dot(N, L));
  let NdotV = abs(dot(N, V));
  let Gv = NdotL * sqrt((-NdotV * m2 + NdotV) * NdotV + m2);
  let Gl = NdotV * sqrt((-NdotL * m2 + NdotL) * NdotL + m2);
  let SmithG = 0.5 / max(Gv + Gl, FLOAT_EPSILON);

  return SmithG;
}

fn Fresnel(L: vec3f, H: vec3f, F0: vec3f ) -> vec3f {
  let F90 = saturate(dot(F0, vec3f(0.33333)) / vec3f(0.02));
  let finalFresnel = mix(F0, F90, pow(1 - saturate(dot(L, H)), 5));

  return finalFresnel;
}

// Standard Fresnel Schlick approximation
fn fresnelSchlick(R: vec3f, dotLH: f32) -> vec3f {
  return R + (vec3f(1.0) - R) * pow(1.0 - dotLH, 5.0);
}

// Fresnel Schlick with f90 adjustment
fn fresnelSchlickf90(f0: vec3f, f90: vec3f, u: f32) -> vec3f {
  let clamped: f32 = clamp(1.0 - u, 0.0, 1.0);
  return f0 + (f90 - f0) * pow(clamped, 5.0);
}

fn smoothnessToRoughness(smoothness: f32) -> f32 {
  return max( (1.0 - smoothness) * (1.0 - smoothness), MIN_ROUGHNESS);
}

fn roughnessToSmoothness(roughness: f32) -> f32 {
  return 1.0 - sqrt(roughness);
}

fn decodeNormal(encoded: vec2f) -> vec3f {
  let xy = encoded;
  let z = sqrt(saturate(1.0 + dot(xy, -xy)));
  return normalize(vec3f(xy, z));
}

fn uvScaleOffset(uv: vec2f, scaleOffset: vec4f) -> vec2f {
  return uv * scaleOffset.xy + scaleOffset.zw;
}

fn srgbToLinear(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.04045);
  return select( c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), c > cutoff );
}

fn linearToSrgb(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.0031308);
  return select( 12.92 * c, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c > cutoff );
}

fn getLuminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

fn getOverlayBlend(base: vec3f, top: vec3f) -> vec3f {
  let out0 = 2.0 * base * top;
  let out1 = 1.0 - (2.0 * (1.0 - base) * (1.0 - top));
  return mix(out0, out1, step(vec3f(0.5), base));
}

fn cryVecToGLTF(v: vec3f) -> vec3f {
  return v.xzy * vec3(1.0, 1.0, -1.0);
}

fn getCotangentFrame(
  position: vec3f,
  normal: vec3f,
  uv: vec2f
) -> mat3x3<f32> {
  let posdx: vec3f = dpdx(position);
  let posdy: vec3f = dpdy(position);
  let uvdx: vec2f = dpdx(uv);
  let uvdy: vec2f = dpdy(uv);

  let q1perp: vec3f = cross(posdy, normal);
  let q0perp: vec3f = cross(normal, posdx);

  let tangent: vec3f =
      q1perp * uvdx.x + q0perp * uvdy.x;

  let bitangent: vec3f =
      q1perp * uvdx.y + q0perp * uvdy.y;

  let det: f32 = max(
      dot(tangent, tangent),
      dot(bitangent, bitangent)
  );

  let scale: f32 = select(
      inverseSqrt(det),
      0.0,
      det == 0.0
  );

  return mat3x3f(
    normalize(tangent * scale),
    normalize(bitangent * scale),
    normal
  );
}

// #region Scene Depth
// Converts clip-space position to projected screen coords for depth-buffer sampling.
// Y is flipped for WebGPU NDC convention.
// .w is preserved as-is (= clip.w = view-space Z for standard perspective).
fn clipPosToSceenUv(p: vec4f) -> vec4f {
  return vec4f(
    ( p.x + p.w) * 0.5,
    (-p.y + p.w) * 0.5,
    p.z,
    p.w,
  );
}

// Reads the linear view-space depth from the scene depth texture at screen UV.
// sceneDepthMap is expected to contain linear view-space depth.
fn sampleSceneDepth(screenProj: vec4f, sceneDepthMap: texture_2d<f32>) -> f32 {
  let uv      = screenProj.xy / screenProj.w;
  let dims    = vec2f(textureDimensions(sceneDepthMap, 0));
  let pxCoord = vec2i(uv * dims);
  return textureLoad(sceneDepthMap, pxCoord, 0).r;
}


fn linearizeDepthReversedZ(depth: f32, near: f32, far: f32) -> f32 {
  return (near * far) / (depth * (far - near) + near);
}
// #endregion

// #region Fog
fn applyFog(
  color:    vec3f,
  alpha:    f32,
  worldPos: vec3f,
  camPos:   vec3f,
) -> vec4f {
  if (global.skipFog != 0u) {
    return vec4f(color, alpha);
  }
  let factor    = getVolumetricFogDensity(worldPos);
  let fog_color = global.volumetricFogColorGradientBase.rgb;
  return vec4f(
      mix(fog_color, color, factor),
      mix(1.0,       alpha, factor),
  );
}

fn getVolumetricFogDensity(worldPos: vec3f) -> f32 {
  return computeVolumetricFogInternal(worldPos - view.cameraPosition.xyz);
}

fn computeVolumetricFogInternal(cameraToWorldPos: vec3f) -> f32  {
  let heightScale                 = global.volumetricFogParams.x;
  let volFogHeightDensityAtViewer = global.volumetricFogParams.y;
  let fogDensity                  = global.volumetricFogParams.z;
  let densityClamp                = global.volumetricFogParams.w;

  var fogInt = 1.0;
  var t = heightScale * cameraToWorldPos.z;
  if (abs(t) > 0.01) {
    fogInt *= (exp(t) - 1.0) / t;
  }

  // NOTE: volFogHeightDensityAtViewer = log2(e) * fogDensity * exp(heightScale * PerView_WorldViewPos.z + heightOffset);
  let l = length(cameraToWorldPos) * 1.0; // PerFrame_FogDistanceScale.x;
  let u = l * volFogHeightDensityAtViewer;
  fogInt *= u;

  var f = saturate(exp2(-fogInt));
  var r = saturate(l * global.volumetricFogRampParams.x + global.volumetricFogRampParams.y);
  r = r * (2 - r);
  r = r * global.volumetricFogRampParams.z + global.volumetricFogRampParams.w;

  f = (1.0 - f) * r;
  return max(1.0 - f, densityClamp);
}

fn getVolumetricFogColor(worldPos: vec3f) -> vec4f {
  return getVolumetricFogColorInternal(worldPos, worldPos - view.cameraPosition.xyz, 1.0, 1.0);
}

// RET.xyz = fog color (HDR)
// RET.w = fog factor to lerp scene/object color with (i.e. lerp(RET.xyz, sceneColor.xyz, RET.w))
fn getVolumetricFogColorInternal(worldPos: vec3f, cameraToWorldPos: vec3f, radialFogShadowInfluence: f32, ambientFogShadowInfluence: f32) -> vec4f {
	let heightGradScale  = global.volumetricFogColorGradientParams.x;
	let heightGradOffset = global.volumetricFogColorGradientParams.y;
	let radialSizeCtrl   = global.volumetricFogColorGradientParams.z;
	let radialLobeCtrl   = global.volumetricFogColorGradientParams.w;

	let radialColor = global.volumetricFogColorGradientRadial.xyz;
	let invZFar     = global.volumetricFogColorGradientRadial.w;

	let fog = computeVolumetricFogInternal(cameraToWorldPos);

	var h = saturate(worldPos.z * heightGradScale + heightGradOffset);
	h = h * (2 - h);

	var fogColor = (global.volumetricFogColorGradientBase.rgb + h * global.volumetricFogColorGradientDelta.rgb) * ambientFogShadowInfluence;

	let l = saturate(length(cameraToWorldPos) * invZFar);
	let radialLobe = pow(l, radialLobeCtrl);
	let radialSize = exp2(dot(normalize(cameraToWorldPos), -global.sunDirection.xyz) * -radialSizeCtrl + radialSizeCtrl); // exp2(-radialSizeCtrl * (1-cos(x))

	fogColor += radialLobe * radialSize * radialColor * radialFogShadowInfluence;

	return vec4f(fogColor, fog);
}
// #endregion









// #region Vertex Transform Modificators


// Vertex modificators

////////////////////////////////////////////////////////////////////////////////////////////////////
// Vertex modificator types (%_VT_TYPE):
// 1 (VTM_SINWAVE): Sinus wave deformations
// 2 (VTM_SINWAVE_VTXCOL): Sinus wave deformations using vertex color for phase/freq/amp control
// 3 (VTM_BULGE)  : Bulge wave deformations (depends on texture coordinates)
// 4 (VTM_SQUEEZE)  : Sinus squeeze wave deformations
// 5 (VTM_PERLIN2D) : Surface 2D perlin-noise deformations
// 6 (VTM_PERLIN3D) : Volume 3D perlin-noise deformations
// 7 (VTM_FROMCENTER) : Expanding from center
// 12 (VTM_FIXED_OFFSET) : Fixed 3D offset along vertex normal

// Vertex modificator flags (in order of applying):
// %_VT_WIND          : Wind deformations (uses for Cloth and Hair shaders)
// %_VT_DEPTH_OFFSET  : Depth offset (uses for decals)
// %_VT_DET_BEND      : Detail bending (uses for Vegetations and requires Color stream with specific weight info)
// %_VT_BEND          : General bending (engine depend)

// %_VT_TYPE_MODIF    : Specified if one or more of vertex modif. flags is existing
////////////////////////////////////////////////////////////////////////////////////////////////////

// Vertex modificator types
const VTM_SINWAVE        : u32 = 1u;
const VTM_SINWAVE_VTXCOL : u32 = 2u;
const VTM_BULGE          : u32 = 3u;
const VTM_SQUEEZE        : u32 = 4u;
const VTM_PERLIN2D       : u32 = 5u;
const VTM_PERLIN3D       : u32 = 6u;
const VTM_FROMCENTER     : u32 = 7u;
const VTM_BENDING        : u32 = 8u;
const VTM_FIXED_OFFSET   : u32 = 12u;

struct VertexMod {
  deformWave0 : vec4f, // .x = Frequency .y = Phase .z = Amplitude .w = Level
  deformWave1 : vec4f, // .x = 1.0 / DividerX
  position    : vec3f,
  normal      : vec3f,
  color       : vec3f,
  texture     : vec2f,
  time        : f32,
  typ         : u32,
};

fn vertexModify(vmod: VertexMod) -> vec3f {
  var outPos = vmod.position.xyz;

  let deformWave0 = vmod.deformWave0; // [0]: .x = Frequency .y = Phase .z = Amplitude .w = Level
  let deformWave1 = vmod.deformWave1; // [1]: .x = 1.0 / DividerX
  let timeValue = vmod.time * deformWave0.x + deformWave0.y;
  switch (vmod.typ) {
    case VTM_SINWAVE: {
      var f      = (outPos.x + outPos.y + outPos.z) * deformWave1.x;
          f      = (f + timeValue) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_SINWAVE_VTXCOL: {
      var f      = (outPos.x + outPos.y + outPos.z) * deformWave1.x * vmod.color.y;
          f      = (f + timeValue + vmod.color.x) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave * vmod.color.z;
    }
    case VTM_SQUEEZE: {
      var f      = timeValue * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_BULGE: {
      var f      = (vmod.texture.x + vmod.texture.y + outPos.x + outPos.y + outPos.z) * deformWave1.x;
          f      = (f + timeValue) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_FIXED_OFFSET: {
      let fOffset = deformWave0.w;
      outPos     += vmod.normal.xyz * fOffset;
    }
    default : {

    }
  }

  return outPos;
}

// #endregion
`

export function smoothnessToRoughness(smoothness: number): number {
  return Math.max((1.0 - smoothness) * (1.0 - smoothness), 0.002)
}
