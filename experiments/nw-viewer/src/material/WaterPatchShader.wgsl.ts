import { COMMON_WGSL } from './common.wgsl'

export const WATER_PATCH_SHADER = /* wgsl */ `
${COMMON_WGSL}

struct MaterialBlock {
  heightMapUvTransform : vec4<f32>,
  heightMapSize        : f32,
  mountainHeight       : f32,
  amplitude            : f32,
  wavelength           : f32,
  direction            : vec2<f32>,
  speed                : f32,
};

struct SettingsBlock {
  debug:           u32,
};

@group(0) @binding(0) var<uniform> object   : ObjectBlock;
@group(0) @binding(1) var<uniform> view     : ViewBlock;
@group(0) @binding(2) var<uniform> material : MaterialBlock;
@group(0) @binding(3) var<uniform> frame    : FrameBlock;
@group(0) @binding(4) var<uniform> settings : SettingsBlock;
@group(0) @binding(5) var<uniform> lights   : LightBlock;
@group(0) @binding(6) var<uniform> env      : EnvBlock;

@group(1) @binding(0) var heightMap : texture_2d<f32>;
@group(1) @binding(1) var heightMapSampler : sampler;

struct VertexInput {
  // @alias position
  @location(0) aPosition : vec3<f32>,
  // @alias normal
  @location(1) aNormal : vec3<f32>,
  // @alias texture
  @location(2) aTexture : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) height: f32,
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;

  var uv = input.aTexture;
  var tileUV = input.aTexture * material.heightMapUvTransform.xy + material.heightMapUvTransform.zw;
  let height = readHegiht(tileUV);

  let position = object.modelMatrix * vec4<f32>(input.aPosition.x, height, input.aPosition.z, 1.0);
  let wave  = water_deform(position.xz, frame.elapsedTime / 1000.0);
  let worldPos = vec4f(
    position.x + wave.offset.x,
    WATER_LEVEL + wave.offset.y ,
    position.z + wave.offset.z,
    1.0,
  );

  let viewPos = view.viewMatrix * worldPos;
  let viewPosWrap = paniniWarpCommon(viewPos);

  out.worldPos = worldPos.xyz;
  out.normal = normalize(wave.normal);
  out.clipPos = view.projectionMatrix * viewPosWrap;
  out.height = height;

  return out;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {

  let shading = water_shade(
    input.worldPos,
    normalize(input.normal),
    input.height,
    view.cameraPosition,
    env.sunDirection,
    env.sunColor,
  );

  if (settings.debug > 0u) {
    if (settings.debug == DEBUG_MATERIAL) {
      return vec4<f32>(shading.fresnel, shading.fresnel, shading.fresnel, 1.0);
    }
    if (settings.debug == DEBUG_NORMALS) {
      return vec4<f32>(normalize(input.normal).xyz * 0.5 + 0.5, 1.0);
    }
    // if (settings.debug == DEBUG_UVS) {
    //   return vec4<f32>(input.vTileUV, 0.0, 1.0);
    // }
  }

  return applyFog(shading.color.rgb, shading.color.a, input.worldPos, view.cameraPosition);
}

fn readHegiht(uv: vec2<f32>) -> f32 {
  return unpackHeight(textureSampleLevel(heightMap, heightMapSampler, uv, 0), material.mountainHeight);
}

fn unpackHeight(c: vec4<f32>, height: f32 ) -> f32 {
  // Convert normalized [0,1] → [0,255]
  let r: f32 = c.r * 255.0;
  let g: f32 = c.g * 255.0;
  let b: f32 = c.b * 255.0;

  // Reconstruct 24-bit integer
  let value: f32 = r * 65536.0 + g * 256.0 + b;

  // Map back to original range [0, 65535]
  return (value * (height / 16777215.0));
}

// ── TWEAKABLE CONSTANTS ──────────────────────────────────────
// (promote to uniforms when ready)

// --- Geometry / Waves ---
const WATER_LEVEL: f32       = 40.0;    // world-space Y of the undisturbed surface

// Layer A — dominant swell (long, slow, high amplitude)
const WAVE_A_DIR:   vec2f = vec2f(1.0, 0.6);
const WAVE_A_AMP:   f32   = 0.35;
const WAVE_A_LEN:   f32   = 31.0;
const WAVE_A_SPD:   f32   = 2.5;
const WAVE_A_STEEP: f32   = 0.4;

// Layer B — mid chop (cross-wind, shorter)
const WAVE_B_DIR:   vec2f = vec2f(-0.5, 1.0);
const WAVE_B_AMP:   f32   = 0.12;
const WAVE_B_LEN:   f32   = 17.0;
const WAVE_B_SPD:   f32   = 1.6;
const WAVE_B_STEEP: f32   = 0.35;

// Layer C — small surface ripple
const WAVE_C_DIR:   vec2f = vec2f(0.8, -0.7);
const WAVE_C_AMP:   f32   = 0.04;
const WAVE_C_LEN:   f32   = 7.0;
const WAVE_C_SPD:   f32   = 1.1;
const WAVE_C_STEEP: f32   = 0.2;

// --- Optical ---
const IOR_WATER:   f32       = 1.333;  // index of refraction
const FRESNEL_BIAS:f32       = 0.04;   // F0 for Schlick (air/water ≈ 0.02–0.04)

// --- Depth / colour ---
const DEPTH_MAX:   f32       = 10.0;    // depth (m) at which water is fully opaque
const SHALLOW_COL: vec3f     = vec3f(0.05, 0.45, 0.40);  // teal-green shallows
const DEEP_COL:    vec3f     = vec3f(0.01, 0.08, 0.22);  // dark-blue abyss
const EXTINCTION:  vec3f     = vec3f(0.60, 0.15, 0.08);  // per-channel absorption

// --- Reflection ---
const SKY_HORIZON: vec3f     = vec3f(0.55, 0.75, 0.95);  // horizon sky colour
const SKY_ZENITH:  vec3f     = vec3f(0.10, 0.35, 0.80);  // zenith sky colour
const SUN_GLARE:   f32       = 1.0;  // specular shininess (sun highlight)

// --- Foam ---
const FOAM_DEPTH:  f32       = 3.0;   // depth threshold for shoreline foam
const FOAM_COL:    vec3f     = vec3f(0.95, 0.97, 1.00);

// --- Refraction ---
const REFR_SCALE:  f32       = 0.04;   // how much the normal perturbs the refracted UV
//   (background buffer not wired yet; colour is computed analytically)



// ── HELPERS ─────────────────────────────────────────────────

/// Schlick Fresnel approximation
fn fresnel_schlick(dotLH: f32, f0: f32) -> f32 {
  return f0 + (1.0 - f0) * pow(1.0 - dotLH, 5.0);
}

/// Simple procedural sky: interpolate zenith→horizon by the reflected ray's Y
fn sky_colour(reflect_dir: vec3f) -> vec3f {
    let t = clamp(reflect_dir.y, 0.0, 1.0);
    return mix(SKY_HORIZON, SKY_ZENITH, t);
}

/// Beer–Lambert extinction over a given depth
fn water_extinction(depth: f32) -> vec3f {
    return exp(-EXTINCTION * depth);
}


// ── WAVE DEFORMATION ────────────────────────────────────────
//
// Returns a WaveResult with:
//   offset   — world-space displacement  (x, y, z)
//   normal   — analytic surface normal   (unnormalised, caller normalises)
//
struct WaveResult {
    offset: vec3f,
    normal: vec3f,
}

fn gerstner_wave(
    dir:    vec2f, // wave travel direction
    amp:    f32,   // wave amplitude (m)
    length: f32,   // wavelength (m)
    speed:  f32,   // phase speed (m/s)
    steep:  f32,   // steepness [0,1]
    p:      vec2f, // XZ world position
    time:   f32,   // current time (s)
) -> WaveResult {
  let k     = 2.0 * 3.14159265 / length;
  let omega = speed * k;
  let d     = normalize(dir);
  let phase = k * dot(d, p) - omega * time;
  let s     = sin(phase);
  let c     = cos(phase);
  let ka    = k * amp;
  let qka   = steep * ka;   // Q·k·a  (steepness factor)

  let disp = vec3f(
      steep * amp * d.x * c,
      amp * s,
      steep * amp * d.y * c,
  );

  // Tangent along px-axis
  let tx = vec3f(
      1.0 - qka * d.x * d.x * s,
      ka  * d.x * c,
      -qka * d.x * d.y * s,
  );
  // Tangent along pz-axis
  let tz = vec3f(
      -qka * d.x * d.y * s,
      ka  * d.y * c,
      1.0 - qka * d.y * d.y * s,
  );

  // Normal = cross(tz, tx) so it points upward
  let normal_contrib = cross(tz, tx);

  var result: WaveResult;
  result.offset = disp;
  result.normal = normal_contrib;
  return result;
}

/// Composite wave deformation — call this from your vertex shader.
/// Returns displaced world position and surface normal.
fn water_deform(world_xz: vec2f, time: f32) -> WaveResult {
    var total_offset = vec3f(0.0);
    var total_normal = vec3f(0.0, 1.0, 0.0);   // start with flat normal

    let wa = gerstner_wave(WAVE_A_DIR, WAVE_A_AMP, WAVE_A_LEN, WAVE_A_SPD, WAVE_A_STEEP, world_xz, time);
    let wb = gerstner_wave(WAVE_B_DIR, WAVE_B_AMP, WAVE_B_LEN, WAVE_B_SPD, WAVE_B_STEEP, world_xz, time);
    let wc = gerstner_wave(WAVE_C_DIR, WAVE_C_AMP, WAVE_C_LEN, WAVE_C_SPD, WAVE_C_STEEP, world_xz, time);

    total_offset += wa.offset + wb.offset + wc.offset;

    // Sum the XZ perturbations only, leave Y=1 as the base
    total_normal = normalize(wa.normal + wb.normal + wc.normal);

    var result: WaveResult;
    result.offset = total_offset;
    result.normal = total_normal;
    return result;
}


struct WaterShading {
  fresnel: f32,
  color: vec4f,
  sun_spec: f32,
}

fn water_shade(
    world_pos:  vec3f,
    normal:     vec3f,
    terrain_h:  f32,
    camera_pos: vec3f,
    sun_dir:    vec3f,
    sun_color:  vec3f,
) -> WaterShading {

    let V = normalize(camera_pos - world_pos);  // view vector
    let N = normal;
    let L = normalize(sun_dir);
    let H = normalize(V + L);                   // half-vector


    // ── 1. Depth ─────────────────────────────────────────────
    let surface_y = world_pos.y;
    let depth     = clamp(surface_y - terrain_h, 0.0, DEPTH_MAX);
    let depth01   = depth / DEPTH_MAX;          // 0 = shore, 1 = deep

    // ── 2. Base water colour (depth-driven) ───────────────────
    let water_base = mix(SHALLOW_COL, DEEP_COL, smoothstep(0.0, 1.0, depth01));

    // Beer–Lambert tint (light travels down and back up through water column)
    let extinct    = water_extinction(depth * 2.0);
    let refr_tint  = water_base * extinct;

    // ── 3. Fresnel ────────────────────────────────────────────
    let cos_v   = max(dot(N, V), 0.0);
    let fresnel = fresnel_schlick(cos_v, FRESNEL_BIAS);

    // ── 4. Reflection ─────────────────────────────────────────
    let R           = reflect(V, N);
    var refl_color  = sky_colour(R);

    // Sun specular on the reflection (Blinn-Phong on the reflected direction)
    let sun_spec    = pow(max(dot(R, L), 0.0), SUN_GLARE);
    refl_color     += sun_color * sun_spec;

    // ── 5. Refraction (analytic, no background buffer yet) ────
    //   Perturb the conceptual "bottom" lookup with the normal.
    //   For now we just tint the water body colour by the normal offset —
    //   swap refr_color for an actual background sample once available.
    let refr_offset = vec2f(N.x, N.z) * REFR_SCALE;
    // placeholder: we encode the offset into a subtle hue shift on the tint
    let refr_color  = refr_tint + vec3f(refr_offset.x, 0.0, refr_offset.y) * 0.05;

    // ── 6. Combine reflection + refraction via Fresnel ────────
    var surface_color = mix(refr_color, refl_color, fresnel);

    // ── 7. Sun diffuse scatter (subsurface-ish rim) ───────────
    let NdotL    = max(dot(N, L), 0.0);
    let scatter  = NdotL * 0.15 * sun_color * SHALLOW_COL * (1.0 - depth01);
    surface_color += scatter;

    // ── 8. Foam at the shoreline ──────────────────────────────
    let foam_t   = 1.0 - smoothstep(0.0, FOAM_DEPTH, depth);
    surface_color = mix(surface_color, FOAM_COL, foam_t * 0.85);

    // ── 9. Opacity ───────────────────────────────────────────
    //   Shallow water is more transparent, deep water is opaque.
    //   Fresnel also pushes opacity up at grazing angles.
    let base_alpha  = smoothstep(0.0, 1.0, depth01);              // depth opacity
    let total_alpha = clamp(mix(base_alpha, 1.0, fresnel) + foam_t * 0.25, 0.0, 1.0);

    let shore_fade  = smoothstep(0.0, 0.1, depth);

    var result: WaterShading;
    result.fresnel = fresnel;
    result.color = vec4f(surface_color, total_alpha * shore_fade);
    return result;
}
`
