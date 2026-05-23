import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

${COMMON_WGSL}

const ENABLE_DAY_GRADIENT   : bool = true;
const ENABLE_MOON           : bool = false;
const ENABLE_NIGHT_GRADIENT : bool = false;
const RT_FOG                : bool = false;
const RT_VOLUMETRIC_FOG     : bool = false;


// ============================================================
// Bind group 0 — sky dome shader constants
// (all passed as uniforms; mirrors the scalar/vector globals
//  declared in the original .cfx)
// ============================================================

struct SkyDomeConstants {

    partial_mie_in_scattering       : vec3<f32>,
    _pad0                           : f32,      // pad to vec4 alignment
    partial_rayleigh_in_scattering  : vec3<f32>,
    _pad1                           : f32,      // pad to vec4 alignment
    phase_function_constants        : vec3<f32>, // x = miePart_g_2, y = miePart_g2_1, z = (unused)
    _pad2                           : f32,      // pad to vec4 alignment

    night_sky_col_base              : vec3<f32>,
    _pad3                           : f32,      // pad to vec4 alignment
    night_sky_col_delta             : vec3<f32>,
    _pad4                           : f32,      // pad to vec4 alignment
    night_sky_zenith_col_shift      : vec2<f32>,
    _pad5                           : f32,      // pad to vec4 alignment

    // Moon
    // night_moon_dir_size             : vec4<f32>,  // xyz = dir, w = size
    // night_moon_tex_gen_right        : vec3<f32>,
    // night_moon_tex_gen_up           : vec3<f32>,
    // night_moon_color                : vec3<f32>,
    // night_moon_inner_corona         : vec4<f32>,  // xyz = color, w = scale
    // night_moon_outer_corona         : vec4<f32>,  // xyz = color, w = scale
};

// ============================================================
// Bind group 0 — per-view / per-frame uniforms
// ============================================================

// struct PerViewUniforms {
//   world_view_pos       : vec4<f32>,   // PerView_WorldViewPos
//   view_basis_z         : vec4<f32>,   // PerView_ViewBasisZ
//   near_far_clip_dist   : vec4<f32>,   // PerView_NearFarClipDist
//   view_proj_zero_matr  : mat4x4<f32>, // PerView_ViewProjZeroMatr
// };

@group(0) @binding(0) var<uniform> global : GlobalBlock;
@group(0) @binding(1) var<uniform> view : ViewBlock;
@group(0) @binding(2) var<uniform> sky : SkyDomeConstants;

@group(1) @binding(0) var moon_tex     : texture_2d<f32>;
@group(1) @binding(1) var moon_sampler : sampler;
// Moon uses Border address mode with (0,0,0,0) border — configure on the
// WebGPU sampler descriptor: addressModeU/V = "clamp-to-edge" + set
// border via the GPUSamplerDescriptor if the extension is available,
// or clamp-to-edge as the closest fallback.


struct VertexInput {
  @location(0) position : vec4<f32>,
  @location(2) texture  : vec2<f32>,
};

struct FragmentInput {
  @builtin(position) position : vec4<f32>,

  // Packed sky/moon UVs.
  // - xy = uvBase
  // - zw = uvMoon
  @location(0) uvPacked : vec4<f32>,

  // direction to sky (normalized, in world space)
  @location(1) skyDir : vec3<f32>,

  // Fog: xyz = color, w = blend factor
  @location(2) fogColor: vec4<f32>,
};


@vertex
fn vs_main(in: VertexInput) -> FragmentInput {
    var output : FragmentInput;

    // create rotation matrix by stripping translation from view matrix
    var view_rot = view.viewMatrix;
    view_rot[3]  = vec4<f32>(0.0, 0.0, 0.0, 1.0);

    output.position   = view.projectionMatrix * view_rot * vec4<f32>(in.position.xyz, 1.0);
    output.position.z = 0;// output.position.w; // push to far plane

    // ----- base (day sky) UV -----
    var uvBase = in.texture;

    // ----- moon UV -----
    var uvMoon = vec2<f32>(0.0);
    // if ENABLE_MOON {
    //     uvMoon = vec2<f32>(
    //         dot(sky.night_moon_tex_gen_right, vpos.xyz),
    //         dot(sky.night_moon_tex_gen_up,    vpos.xyz),
    //     ) * sky.night_moon_dir_size.w + 0.5;

    //     // Suppress duplicate moon on the opposite hemisphere
    //     let moon_cross = cross(sky.night_moon_tex_gen_right, sky.night_moon_tex_gen_up);
    //     if dot(moon_cross, vpos.xyz) < 0.0 {
    //         uvMoon *= 1.0e11;
    //     }
    // }

    // Pack both UV pairs: xy = baseTC, zw = moonTC
    output.uvPacked = vec4<f32>(uvBase, uvMoon.x, uvMoon.y);
    output.skyDir = normalize(in.position.xyz) ;

    // ----- fog -----
    // if RT_FOG {
    //     let view_dir_norm = in.position.xyz;
    //     let view_dir_corr = 1.0 / dot(view_dir_norm, -per_view.view_basis_z.xyz);
    //     let world_pos     = per_view.world_view_pos.xyz
    //                       + per_view.near_far_clip_dist.y * view_dir_norm * view_dir_corr;
    //     // TODO: replace with your fog implementation
    //     // output.fogColor = get_volumetric_fog_color(world_pos);
    //     output.fogColor = vec4<f32>(0.0);
    // }

    return output;
}

// ============================================================
// Fragment shaders
// ============================================================

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4<f32> {
    var color = vec4<f32>(0.0);

    let uvBase = in.uvPacked.xy;
    let uvMoon = in.uvPacked.zw;
    let skyDir = normalize(in.skyDir);

    // ---- day sky scattering ----
    // if ENABLE_DAY_GRADIENT {
        let cos_view_zenith = skyDir.z;   // skyDir is normalised; z = cos(angle to zenith)
        let color_mie       = vec4<f32>(sample_mie(cos_view_zenith),      1.0);
        let color_rayleigh  = vec4<f32>(sample_rayleigh(cos_view_zenith), 1.0);

        let mie_part_g_2  = sky.phase_function_constants.x;  // pow(miePart,-2/3) * (-2g)
        let mie_part_g2_1 = sky.phase_function_constants.y;  // pow(miePart,-2/3) * (1+g²)

        let cosine  = -dot(global.sunDirection, skyDir);
        let cosine2 = cosine * cosine;

        let mie_phase      = (1.0 + cosine2)
                           * pow(mie_part_g2_1 + mie_part_g_2 * cosine, -1.5);
        let rayleigh_phase = 0.75 * (1.0 + cosine2);

        color.x += dot(color_mie.rgb, sky.partial_mie_in_scattering) * mie_phase;
        color.y += dot(color_mie.rgb, sky.partial_mie_in_scattering) * mie_phase;
        color.z += dot(color_mie.rgb, sky.partial_mie_in_scattering) * mie_phase;

        // Correct vectorised form (matches original component-wise multiply):
        color = vec4<f32>(
            color_mie.rgb      * sky.partial_mie_in_scattering      * mie_phase
          + color_rayleigh.rgb * sky.partial_rayleigh_in_scattering * rayleigh_phase,
            1.0,
        );
    // }

    // ---- night sky horizontal gradient ----
    if ENABLE_NIGHT_GRADIENT {
        var gr = saturate(skyDir.z * sky.night_sky_zenith_col_shift.x
                        + sky.night_sky_zenith_col_shift.y);
        gr = gr * (2.0 - gr);   // smooth Hermite-like remap
        color = vec4<f32>(color.rgb + sky.night_sky_col_base + sky.night_sky_col_delta * gr, color.a);
    }

    // ---- moon ----
    // if ENABLE_MOON {
    //     let moon_albedo = textureSample(moon_tex, moon_sampler, uvMoon);
    //     color = vec4<f32>(
    //         color.rgb + sky.night_moon_color * moon_albedo.rgb * moon_albedo.a,
    //         color.a,
    //     );

    //     // Inner and outer corona
    //     let m = 1.0 - dot(skyDir, sky.night_moon_dir_size.xyz);
    //     color = vec4<f32>(
    //         color.rgb
    //       + sky.night_moon_inner_corona.rgb * (1.0 / (1.05 + m * sky.night_moon_inner_corona.w))
    //       + sky.night_moon_outer_corona.rgb * (1.0 / (1.05 + m * sky.night_moon_outer_corona.w)),
    //         color.a,
    //     );
    // }

    // ---- HDR clamp ----
    color = vec4<f32>(min(color.rgb, vec3<f32>(16384.0)), color.a);

    // ---- fog ----
    // if RT_FOG {
    //     if !RT_VOLUMETRIC_FOG {
    //         // Simple analytical fog blend
    //         color = vec4<f32>(
    //             mix(in.fogColor.rgb, color.rgb, in.fogColor.w),
    //             color.a,
    //         );
    //     } else {
    //         // TODO: replace with your volumetric fog lookup + apply
    //         // let vtc = get_volumetric_fog_texcoord(in.position);
    //         // let vf  = get_volumetric_fog_value(vtc);
    //         // color.rgb = apply_volumetric_fog(vf, in.fogColor, vtc, color.rgb);
    //     }
    // }


    let exposed = color.rgb * 0.02;
    color = vec4<f32>(exposed / (exposed + vec3<f32>(1.0)), 1.0);

    let horizon = 1.0 - saturate(skyDir.z);  // 0 at zenith, 1 at horizon
    let fog_blend = pow(horizon, 4.0);        // sharpen the falloff, tweak exponent

    color = vec4<f32>(
        mix(color.rgb, global.bottomFogColor.rgb, fog_blend),
        1.0,
    );

    return color;
    // return color;
}






// ============================================================
// Atmospheric scattering
// ============================================================

const R_EARTH    : f32 = 6371000.0; // Earth radius, standard geodetic value
const R_ATMOS    : f32 = 6471000.0; //  Earth radius + 100km atmosphere thickness
const H_RAYLEIGH : f32 = 8000.0; // Rayleigh scale height, from Nishita
const H_MIE      : f32 = 1200.0; // Mie scale height, from Nishita
// standard sea-level Rayleigh scattering coefficients for red, green, blue wavelengths
const BETA_R     : vec3<f32> = vec3<f32>(
  5.8e-6,
  13.5e-6,
  33.1e-6
);
const BETA_M     : f32 = 21e-6; // guessed
const NUM_STEPS  : i32 = 16;   // raise for quality, lower for performance

fn optical_depth(cos_zenith: f32, scale_height: f32) -> f32 {
    // clamp to upper hemisphere — no atmosphere below the horizon
    let cz = max(0.0, cos_zenith);

    let sin_zenith = sqrt(1.0 - cz * cz);
    let b          = R_EARTH * cz;
    let c          = R_EARTH * R_EARTH - R_ATMOS * R_ATMOS;
    let ray_len    = -b + sqrt(max(0.0, b * b - c));

    let dt = ray_len / f32(NUM_STEPS);
    var t  = 0.0;

    for (var i = 0; i < NUM_STEPS; i++) {
        let s      = (f32(i) + 0.5) * dt;
        let height = sqrt(
            pow(R_EARTH + s * cz, 2.0) +
            pow(s * sin_zenith, 2.0)
        ) - R_EARTH;

        t += exp(-max(0.0, height) / scale_height) * dt;
    }

    return t;
}

fn sample_rayleigh(cos_view_zenith: f32) -> vec3<f32> {
    let od = optical_depth(cos_view_zenith, H_RAYLEIGH);
    return exp(-BETA_R * od);
}

fn sample_mie(cos_view_zenith: f32) -> vec3<f32> {
    let od = optical_depth(cos_view_zenith, H_MIE);
    let t  = exp(-BETA_M * od);
    return vec3<f32>(t);
}
`
