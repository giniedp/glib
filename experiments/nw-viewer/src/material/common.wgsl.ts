import { Vec4 } from '@gglib/math'
import { COMMON_ENV_WGSL } from './shader/common_env.wgsl'

export const COMMON_WGSL = /* wgsl */ `

${COMMON_ENV_WGSL}

const LIGHT_COUNT:            u32 = 4u;
const LIGHT_TYPE_OFF:         u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT:       u32 = 2u;
const LIGHT_TYPE_SPOT:        u32 = 3u;
const LIGHT_TYPE_AREA:        u32 = 4u;

const DEBUG_NONE:     u32 = 0u;
const DEBUG_MATERIAL: u32 = 1u;
const DEBUG_NORMALS:  u32 = 2u;
const DEBUG_UVS:      u32 = 3u;
const DEBUG_COLOR:    u32 = 4u;

struct ObjectBlock {
  modelMatrix: mat4x4<f32>,
};

struct ViewBlock {
  viewMatrix:       mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  cameraPosition:   vec3f,
  paniniBlend:      f32,
  paniniDistance:   f32,
  paniniScale:      f32,
};

struct FrameBlock {
  elapsedTime: f32,
};

struct LightBlock {
  color:     array<vec4f, LIGHT_COUNT>,
  position:  array<vec4f, LIGHT_COUNT>,
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

struct SurfaceParams {
  Normal:    vec4f,
  BaseColor: vec4f,
  Specular:  vec3f,
  Metallic:  f32,
  Roughness: f32,
  Ior:       f32,
};

struct LightResult {
  lightDir:   vec3f,
  lightColor: vec3f,
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

fn accumulateLight(lights: LightBlock, env: EnvBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> vec3f {
  var color = vec3f(0.0, 0.0, 0.0);
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
    color = color + shadePbr(shade, surface);
    i = i + 1;
  }
  return color;
}

// PBR shading function
fn shadePbr( shade: ShadeParams, surface: SurfaceParams ) -> vec3f {

  let metallic: f32 = surface.Metallic;
  let roughness: f32 = surface.Roughness;

  let f0: vec3f = getF0Dielectric(surface);
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

  let F: vec3f = fresnelSchlickf90(R0, vec3f(reflectance90), dotVH);
  let G: f32 = pbrGeometricOcclusion(dotNL, dotNV, roughness * roughness);
  let D: f32 = pbrMicrofacetDistribution(dotNH, roughness * roughness);
  let Fd: vec3f = (vec3f(1.0) - F) * diffuseColor;
  let Fr: vec3f = (D * G) * F / (4.0 * dotNV * dotNL);

  return (Fr + Fd) * dotNL * I;
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

fn smoothnessToRoughness(smoothness: f32) -> f32 {
  return max( (1.0 - smoothness) * (1.0 - smoothness), 0.001);
}

fn roughnessToSmoothness(roughness: f32) -> f32 {
  return 1.0 - sqrt(roughness);
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

fn paniniWarpCommon(p : vec4f) -> vec4f {
  let blend = view.paniniBlend;
  let distance = view.paniniDistance;
  let scale = view.paniniScale;
  // return paniniWarpAspectInvariant(p, blend, distance, scale);
  return paniniWarp(p, blend, distance, scale);
  // return paniniWarpRay(p, blend, distance, scale);
  // return paniniWarp(p, 0.3, 1, 0.15);
  // return paniniWarpAspectInvariant(p, 0.3, 1, 0.15);
  // return paniniWarpRay(p, 0.05, 1.6, 0.05);
}

fn paniniWarp(p : vec4f, blend: f32, d: f32, s: f32) -> vec4f {
  // early out → zero cost when disabled
  if (blend <= 0.0) {
    return p;
  }
  if (p.z >= -1e-4) {
    // push it far away so it clips
    return vec4f(0.0, 0.0, 1.0, 0.0);
  }

  // --- Panini ---
  let theta = atan2(p.x, -p.z);
  let r = length(vec2f(p.x, p.z));

  // avoid division issues near camera axis
  let safeR = max(r, 1e-5);

  let denom = cos(theta) + d;

  let x_panini = sin(theta) / denom;
  let z_panini = safeR / denom;

  let y_cyl = (p.y / safeR) * z_panini;
  let y_panini = mix(y_cyl, p.y, s);

  let panini = vec3f(
    x_panini,
    y_panini,
    -z_panini
  );

  // --- blend ---
  return vec4f(mix(p.xyz, panini, blend), p.w);
}

fn paniniWarpAspectInvariant(p : vec4f, blend: f32, d: f32, s: f32) -> vec4f {
  // early out → zero cost when disabled
  if (blend <= 0.0) {
    return p;
  }
  if (p.z >= -1e-4) {
    // push it far away so it clips
    return vec4f(0.0, 0.0, 1.0, 0.0);
  }

  let dir = normalize(p.xyz);

  // angular coordinates (aspect-free)
  let thetaX = atan2(dir.x, -dir.z);
  let thetaY = atan2(dir.y, -dir.z);

  let rX = tan(thetaX);
  let rY = tan(thetaY);

  // Panini-style denominator (view-angle based)
  let denom = 1.0 + d * abs(dir.z);

  let x = rX / denom;
  let z = 1.0 / denom;

  let y_cyl = rY / denom;
  let y = mix(y_cyl, rY, s);

  let panini = vec3f(x, y, -z);

  // --- blend ---
  return vec4f(mix(p.xyz, panini, blend), p.w);
}

fn paniniWarpRay(p : vec4f, blend: f32, d: f32, s: f32) -> vec4f {
  // early out → zero cost when disabled
  if (blend <= 0.0) {
    return p;
  }
  if (p.z >= -1e-4) {
    // push it far away so it clips
    return vec4f(0.0, 0.0, 1.0, 0.0);
  }

  // --- ray decomposition ---
  let depth = -p.z; // forward depth (stable in view space)
  let dir = normalize(p.xyz);

  // --- angular representation (aspect-free) ---
  let thetaX = atan2(dir.x, -dir.z);
  let thetaY = atan2(dir.y, -dir.z);

  let rX = tan(thetaX);
  let rY = tan(thetaY);

  // --- Panini mapping on ray direction ---
  let denom = 1.0 + d * abs(dir.z);

  let x = rX / denom;
  let y = mix(rY / denom, rY, s);

  let warpedDir = normalize(vec3f(x, y, -1.0));

  // --- reconstruct position along original depth ---
  let warpedPos = warpedDir * depth;

  return vec4f(mix(p.xyz, warpedPos, 1.0), p.w);
}


`

export function parseColorParam(value: string) {
  if (!value) {
    return null
  }
  const color = value.split(',').map((it) => Number(it.trim()))
  if (color.some((it) => isNaN(it) || !isFinite(it))) {
    console.warn(`Invalid color value: ${value}`)
    return null
  }
  if (color.length === 3) {
    return Vec4.create(color[0], color[1], color[2], 1)
  }
  if (color.length === 4) {
    return Vec4.create(color[0], color[1], color[2], color[3])
  }
  console.warn(`Invalid color value: ${value}`)
  return null
}

export function parseNumberParam(value: string | number) {
  if (value == null) {
    return null
  }
  if (typeof value === 'number') {
    return value
  }
  const num = Number(value.trim())
  if (isNaN(num) || !isFinite(num)) {
    console.warn(`Invalid number value: ${value}`)
    return null
  }
  return num
}

export function smoothnessToRoughness(smoothness: number): number {
  return Math.max((1.0 - smoothness) * (1.0 - smoothness), 0.001)
}

export function roughnessToSmoothness(roughness: number): number {
  return 1.0 - Math.sqrt(roughness)
}
