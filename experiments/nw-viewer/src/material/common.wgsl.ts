import { Vec4 } from '@gglib/math'

export const COMMON_WGSL = /* wgsl */ `

const TRUE: u32 = 1u;
const FALSE: u32 = 0u;
const LIGHT_COUNT:            u32 = 4u;
const LIGHT_TYPE_OFF:         u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT:       u32 = 2u;
const LIGHT_TYPE_SPOT:        u32 = 3u;
const LIGHT_TYPE_AREA:        u32 = 4u;

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
  sunColor         : vec3f,
  sunDirection     : vec3f,
  cloudShadingCustomSunColor  : vec3f,
  cloudShadingCustomSkyColor  : vec3f,

  bottomFogColor   : vec4f,
  bottomFogHeight  : f32,
  bottomFogDensity : f32,

  topFogColor      : vec4f,
  topFogHeight     : f32,
  topFogDensity    : f32,

  fogHeightOffset  : f32,
  debug            : u32,

};

struct ObjectBlock {
  modelMatrix: mat4x4f,
};

struct ViewBlock {
  viewMatrix:       mat4x4f,
  projectionMatrix: mat4x4f,
  cameraPosition:   vec3f,
  cameraDirection:  vec3f,
  near:             f32,
  far:              f32,
};

struct FrameBlock {
  elapsedTime: f32,
  deltaTime: f32,
  index: f32,
};

struct LightBlock {
  // @alias lightColor
  color:     array<vec4f, LIGHT_COUNT>,
  // @alias lightPosition
  position:  array<vec4f, LIGHT_COUNT>,
  // @alias lightDirection
  direction: array<vec4f, LIGHT_COUNT>,
};

struct LightParams {
  Color: vec4f,
  Position: vec4f,
  Direction: vec4f,
};

struct ShadeParams {
  V: vec3f,
  L: vec3f,
  I: vec3f,
};

struct ShadeOutput {
  ambient: vec3f,
  diffuse: vec3f,
  specular: vec3f,
  diffuseBack: vec3f, // transmittance
}

struct SurfaceParams {
  Transmittance : vec4f, // .rgb=back color, .a=normalViewDependency factor
  Normal        : vec4f,
  BaseColor     : vec4f,
  Specular      : vec3f,
  Metallic      : f32,
  Roughness     : f32,
  Ior           : f32,
};

struct LightResult {
  lightDir  : vec3f,
  lightColor: vec3f,
};

struct FragmentOutput {
  @location(0) color: vec4f,
  @location(1) depth: f32,
};

fn getLight(light: LightParams, lightType: u32, position: vec3f) -> LightResult {
  var result: LightResult;
  if (lightType == LIGHT_TYPE_DIRECTIONAL) {
    result.lightDir = normalize(-light.Direction.xyz);
    result.lightColor = light.Color.rgb;
    return result;
  }
  if (lightType == LIGHT_TYPE_POINT) {
    let range = max(0.00001, light.Position.w);
    let toLight = light.Position.xyz - position;
    let lightDir = normalize(toLight);
    let lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    result.lightDir = lightDir;
    result.lightColor = light.Color.rgb * lightAtt;
    return result;
  }
  if (lightType == LIGHT_TYPE_SPOT) {
    let range = max(0.00001, light.Position.w);
    let toLight = light.Position.xyz - position;
    let lightDir = normalize(toLight);
    var lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    let cosAngle = light.Direction.w;
    lightAtt = lightAtt * smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightDir, normalize(-light.Direction.xyz)));
    result.lightDir = lightDir;
    result.lightColor = light.Color.rgb * lightAtt;
    return result;
  }
  return result;
}

fn accumulateLight(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> vec3f {
  let out = accumulateLightOut(lights, env, surface, toEye, worldPos);
  return out.ambient + out.diffuseBack + out.diffuse + out.specular;
}

fn accumulateLightOut(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> ShadeOutput {
  var output: ShadeOutput;
  var i : i32 = -1;
  loop {
    if (i >=0 && u32(i) >= LIGHT_COUNT) {
      break;
    }
    var lightType: u32 = 1u;
    var lightParams: LightParams;

    if (i < 0) {
      lightType = LIGHT_TYPE_DIRECTIONAL;
      lightParams = LightParams(
        vec4f(env.sunColor, 1.0),
        vec4f(0.0),
        vec4f(env.sunDirection, 0.0)
      );
    } else {
      lightType = u32(lights.color[i].w);
      lightParams = LightParams(
        lights.color[i],
        lights.position[i],
        lights.direction[i]
      );
    }
    if (lightType <= 0u) {
      break;
    }

    var shade : ShadeParams;
    shade.V = toEye;
    let lightResult = getLight(lightParams, lightType, worldPos);
    shade.L = lightResult.lightDir;
    shade.I = lightResult.lightColor;

    let shadeOut = shadePbrOut(shade, surface);
    output.diffuse += shadeOut.diffuse;
    output.specular += shadeOut.specular;

    if (length(surface.Transmittance.rgb) > 0.0) {
      let fTransmitance = pow(saturate(dot(-surface.Normal.xyz, shade.L) * 0.6 + 0.4), 1 / (1 - surface.Transmittance.a));
      output.diffuseBack += fTransmitance * shade.I * surface.Transmittance.rgb * surface.BaseColor.rgb;
    }

    i = i + 1;
  }
  return output;
}

// PBR shading function
fn shadePbr( shade: ShadeParams, surface: SurfaceParams ) -> vec3f {
  let out = shadePbrOut(shade, surface);
  return out.diffuse + out.specular;
}

fn shadePbrOut( shade: ShadeParams, surface: SurfaceParams ) -> ShadeOutput {

  let metallic: f32 = surface.Metallic;
  let roughness: f32 = surface.Roughness;

  let f0: vec3f  = getF0Dielectric(surface);
  let f90: vec3f = getSpecularWeight(surface);

  let diffuseColor:  vec3f = mix(surface.BaseColor.rgb * (vec3f(1.0) - f0), vec3f(0.0), metallic);
  let specularColor: vec3f = mix(f0, surface.BaseColor.rgb, metallic);

  let reflectance:   f32 = max(max(specularColor.r, specularColor.g), specularColor.b);
  let reflectance90: f32 = clamp(reflectance * 25.0, 0.0, 1.0);

  let R0: vec3f = specularColor;

  let V: vec3f = shade.V;
  let N: vec3f = surface.Normal.xyz;
  let L: vec3f = shade.L;
  let H: vec3f = normalize(V + L);
  let I: vec3f = shade.I;

  let dotNL: f32 = clamp(dot(N, L), 0.001, 1.0);
  let dotNH: f32 = clamp(dot(N, H), 0.0, 1.0);
  let dotNV: f32 = clamp(abs(dot(N, V)), 0.001, 1.0);
  let dotVH: f32 = clamp(dot(V, H), 0.0, 1.0);

  let F: vec3f  = fresnelSchlickf90(R0, vec3f(reflectance90), dotVH);
  let G: f32    = pbrGeometricOcclusion(dotNL, dotNV, roughness);
  let D: f32    = pbrMicrofacetDistribution(dotNH, roughness);
  let Fd: vec3f = (vec3f(1.0) - F) * diffuseColor;
  let Fr: vec3f = (D * G) * F / (4.0 * dotNV * dotNL);

  var output: ShadeOutput;
  output.diffuse = Fd * dotNL * I;
  output.specular = Fr * dotNL * I;
  return output;
}

fn getF0Dielectric(surface: SurfaceParams) -> vec3f {
  // for specular flow the surface.Ior can be 0 to allow full control over the specular color
  let ior: f32 = (surface.Ior - 1.0) / (surface.Ior + 1.0);
  return min((ior * ior) * surface.Specular.rgb, vec3(1.0));
}

fn getSpecularWeight(surface: SurfaceParams ) -> vec3f {
  // TODO:
  // #if defined(METALLIC) || defined(METALLIC_ROUGHNESS_MAP)
  //   // pure metallic workflow
  //   return vec3(1.0);
  // #else
  // #endif
  return vec3(1.0 - surface.Roughness);
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
  return clamp( (1.0 - smoothness) * (1.0 - smoothness), 0.025, 1.0);
}

fn roughnessToSmoothness(roughness: f32) -> f32 {
  return 1.0 - sqrt(roughness);
}

fn decodeNormal(encoded: vec2f) -> vec3f {
  let xy = encoded;
  let z = sqrt(clamp(1.0 - dot(xy, xy), 0.0, 1.0));
  return normalize(vec3f(xy, z));
}

fn uvScaleOffset(uv: vec2f, scaleOffset: vec4f) -> vec2f {
  return uv * scaleOffset.xy + scaleOffset.zw;
}

// sRGB → Linear
fn srgbToLinear(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.04045);
  return select( c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), c > cutoff );
}

// Linear → sRGB
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

  return mat3x3<f32>(
      tangent * scale,
      bitangent * scale,
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
fn computeFogFactor(worldPos: vec3f, camPos: vec3f) -> f32 {
  // height blend
  let height_t = saturate((worldPos.y - global.bottomFogHeight) / max(0.001, global.topFogHeight - global.bottomFogHeight));
  let density  = mix(global.bottomFogDensity, global.topFogDensity, height_t);

  let d = length(worldPos - camPos);
  let t = d * 0.01; // 100 units = 1 fog density step

  return 1.0 - exp2(-(density) * t * t);
}

fn fogColorAtHeight(height: f32) -> vec3f {
  let t = saturate(
      (height - global.bottomFogHeight + global.fogHeightOffset)
      / max(0.001, global.topFogHeight - global.bottomFogHeight)
  );
  return mix(global.bottomFogColor.rgb, global.topFogColor.rgb, t);
}
fn applyFog(
  color:    vec3f,
  alpha:    f32,
  worldPos: vec3f,
  camPos:   vec3f,
) -> vec4<f32> {
  let factor    = computeFogFactor(worldPos, camPos);
  let fog_color = fogColorAtHeight(worldPos.y);
  return vec4<f32>(
      mix(color, fog_color, factor),
      mix(alpha, 1.0,       factor),
  );
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
