export const DISTANCE_CLOUDS_SHADER = /* wgsl */ `

const IS_LOCAL_WEATHER : bool = false;
const IS_REVERSE_DEPTH : bool = true;
const IS_HIGH_QUALITY  : bool = true;   // used by DistanceCloudsAdvancedPS

// ============================================================
// Bind group 0 — per-frame / per-view uniforms
// (mirrors PerFrame_* and PerView_* registers)
// ============================================================

struct ObjectBlock {
  modelMatrix : mat4x4<f32>,
};

struct ViewBlock {
  viewMatrix:       mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  cameraPosition:   vec3<f32>,
  paniniBlend:      f32,
  paniniDistance:   f32,
  paniniScale:      f32,
};

struct FrameBlock {
  elapsedTime : f32,
};

struct EnvBlock {
  sunColor: vec3<f32>,
  sunDirection: vec3<f32>,
  fogColor: vec3<f32>,
  fogDensity: f32,

  cloudColorSky: vec3<f32>,
  cloudColorSun: vec3<f32>,
};

struct PerFrameUniforms {
  sun_direction         : vec4<f32>,   // PerFrame_SunDirection
  cloud_color_sky       : vec4<f32>,   // PerFrame_CloudShadingColorSky
  cloud_color_sun       : vec4<f32>,   // PerFrame_CloudShadingColorSun
  time                  : vec4<f32>,   // PerFrame_Time  (.x = current time)
  world_view_pos        : vec4<f32>,   // PerView_WorldViewPos
};

@group(0) @binding(0) var<uniform> view : ViewBlock;
// @group(0) @binding(0) var<uniform> per_frame : PerFrameUniforms;

// ============================================================
// Bind group 1 — per-material uniforms
// Registers are kept as comments for traceability.
// Which fields are active depends on the IS_* constants above.
// ============================================================

struct PerMaterialUniforms {
    // --- ADVANCED variant (PER_MATERIAL_0/1) ---
    alpha_multiplier   : f32,   // PER_MATERIAL_0.x
    alpha_saturation_a : f32,   // PER_MATERIAL_0.y  (ADVANCED)
    cloud_height       : f32,   // PER_MATERIAL_0.z
    density_sun        : f32,   // PER_MATERIAL_0.w
    density_sky        : f32,   // PER_MATERIAL_1.x

    // --- default (non-ADVANCED, non-SIMPLE) variant ---
    attenuation           : f32,   // PER_MATERIAL_0.x
    step_size             : f32,   // PER_MATERIAL_0.y
    alpha_saturation_b    : f32,   // PER_MATERIAL_0.z
    sun_color_multiplier  : f32,   // PER_MATERIAL_0.w
    sky_color_multiplier  : f32,   // PER_MATERIAL_1.x

    // --- SIMPLE variant ---
    opacity  : f32,   // PER_MATERIAL_0.x
    exposure : f32,   // PER_MATERIAL_0.y

    // --- shared / shadow ---
    diffuse_color         : vec4<f32>,   // PerMaterial_DiffuseColor
    instance_opacity      : f32,         // GetInstance_Opacity()

    shadow_skydome_size   : f32,   // PER_MATERIAL_5.z
    min_shadow_density    : f32,   // PER_MATERIAL_6.x
    max_shadow_density    : f32,   // PER_MATERIAL_6.y
    shadow_power          : f32,   // PER_MATERIAL_6.z
    shadow_fading_radius_factor      : f32,   // PER_MATERIAL_6.w
    shadow_fading_inclination_factor : f32,   // PER_MATERIAL_7.x

    // --- LOCAL_WEATHER variant ---
    sky_height              : f32,   // PER_MATERIAL_4.x
    weather_radius          : f32,   // PER_MATERIAL_4.y
    weather_smooth_radius   : f32,   // PER_MATERIAL_4.z
    horizon_bending_height  : f32,   // PER_MATERIAL_4.w
    fading_noise_tiling_size: f32,   // PER_MATERIAL_5.x
    fading_noise_offset     : f32,   // PER_MATERIAL_5.y
};

@group(0) @binding(1) var<uniform> mat : PerMaterialUniforms;

@group(1) @binding(0) var baseColorMap     : texture_2d<f32>;
@group(1) @binding(1) var baseColorSampler : sampler;


struct VertexInput {
  @location(0) position : vec4<f32>,
  @location(1) texture  : vec2<f32>,
  @location(2) tangent  : vec4<f32>,
  //@location(4) binormal : vec4<f32>,
};

struct FragmentInput {
    @builtin(position) position : vec4<f32>,

    @location(0) vTexture : vec2<f32>,

    @location(1) vToSun : vec3<f32>,
    // LOCAL_WEATHER extras — always present in the struct;
    // only populated / used when IS_LOCAL_WEATHER == true
    // @location(3) local_pos       : vec3<f32>,
    // @location(4) weather_center  : vec3<f32>,
};

fn getCloudTexture(uv: vec2<f32>) -> vec4<f32> {
    return textureSample(baseColorMap, baseColorSampler, uv);
}

// fn get_local_weather_alpha_v2f(
//     local_pos      : vec3<f32>,
//     weather_center : vec3<f32>,
// ) -> f32 {
//     var lp = normalize(local_pos);
//     lp.z = abs(lp.z);

//     let horizon_factor = saturate(lp.z / max(0.0001, mat.horizon_bending_height));
//     let sky_height_scaled = mat.sky_height * horizon_factor;

//     let world_pos = per_frame.world_view_pos.xyz
//                   + lp * sky_height_scaled / max(0.0001, lp.z);

//     let dist   = length(weather_center.xy - world_pos.xy);
//     let out_r  = max(0.0, mat.weather_smooth_radius);
//     var alpha  = saturate(
//         (out_r - dist + mat.weather_radius) / abs(mat.weather_smooth_radius)
//     );

//     let bent_pos  = world_pos + lp * (1.0 - horizon_factor) * mat.fading_noise_tiling_size;
//     let noise_uv  = (bent_pos.xy + mat.fading_noise_offset) / mat.fading_noise_tiling_size;
//     let noise_val = textureSampleLevel(pnoise_tex, pnoise_sampler, noise_uv, 0.0).r;
//     let noise_mod = noise_val * saturate((horizon_factor - 0.5) / 0.5);

//     alpha = pow(alpha, 1.0 + noise_mod * 5.0);
//     return alpha;
// }

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  var output : FragmentInput;

  var view_rot = view.viewMatrix;
  view_rot[3]  = vec4<f32>(0.0, 0.0, 0.0, 1.0);

  output.position   = view.projectionMatrix * view_rot * vec4<f32>(input.position.xyz, 1.0);
  output.position.z = 0;// output.position.w; // push to far plane
  // output.skyDir = normalize(in.position.xyz) ;

  // TODO:
  // let t  = in.tangent.xyz;
  // let b  = in.binormal.xyz;
  // let n  = normalize(cross(t, b)) * in.tangent.w;
  // // objToTangentSpace rows: t, b, n
  // let to_sun_obj = env.sunDirection.xyz;
  // out.to_sun = vec3<f32>(
  //     dot(t, to_sun_obj),
  //     dot(b, to_sun_obj),
  //     dot(n, to_sun_obj),
  // );

  output.vTexture = input.texture;

  // if IS_LOCAL_WEATHER {
  //     out.local_pos = in.position.xyz;
  //     out.weather_center = vec3<f32>(
  //         inst_matrix[0].w,
  //         inst_matrix[1].w,
  //         inst_matrix[2].w,
  //     );
  // }

  return output;
}

// ============================================================
// Fragment shaders
// ============================================================

// ---------- non-SIMPLE, non-ADVANCED ("default") ----------

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
    const NUM_SAMPLES : i32 = 8;

    let color = getCloudTexture(input.vTexture);
    return color;

    // let to_sun   = normalize(env.sunDirection.xyz);
    // let sample_dir = to_sun.xy * mat.step_size;

    // var opacity = getCloudTexture(input.vTexture).x;

    // if IS_LOCAL_WEATHER {
    //     opacity *= get_local_weather_alpha_v2f(in.local_pos, in.weather_center);
    // }

    // if opacity < 0.001 {
    //   discard;
    // }

    // var density : f32 = 0.0;
    // for (var i = 0; i < NUM_SAMPLES; i++) {
    //   let t = getCloudTexture(in.base_tc + f32(i) * sample_dir).x;
    //   density += t;
    // }

    // let c   = exp2(-mat.attenuation * density);
    // var a   = pow(opacity, mat.alpha_saturation_b);
    // let col = mix(
    //     mat.sky_color_multiplier  * env.cloudColorSky.xyz,
    //     mat.sun_color_multiplier  * env.cloudColorSun.xyz,
    //     c,
    // );

    // let mo = mat.instance_opacity;
    // a = pow(a, 1.0 / (mo + 0.01)) * sqrt(mo) - (1.0 - mo) * 0.01;
    // a = saturate(a);

    // return vec4<f32>(col * in.color.rgb, a);
}

// ---------- ADVANCED ----------

// fn get_num_samples() -> i32 {
//     if IS_HIGH_QUALITY { return 32; }
//     return 24;
// }

// @fragment
// fn distance_clouds_advanced_ps(in: FragmentInput) -> @location(0) vec4<f32> {
//     let num_samples = get_num_samples();

//     var height = getCloudTexture(in.base_tc).x;

//     // if IS_LOCAL_WEATHER {
//     //     height *= get_local_weather_alpha_v2f(in.local_pos, in.weather_center);
//     // }

//     if height < 0.0001 { discard; }

//     var cur_trace_pos = vec3<f32>(in.base_tc, height * mat.cloud_height);
//     let to_sun        = normalize(in.to_sun);

//     // Ray-AABB intersection (slabs) against [0,1] x [0,1] x [-ch,+ch]
//     let safe_to_sun = select(to_sun, vec3<f32>(0.00001, 0.00001, 0.00001), to_sun == vec3<f32>(0.0));
//     let inv_to_sun  = 1.0 / safe_to_sun;

//     let tbottom = (vec3<f32>(0.0, 0.0, -mat.cloud_height) - cur_trace_pos) * inv_to_sun;
//     let ttop    = (vec3<f32>(1.0, 1.0,  mat.cloud_height) - cur_trace_pos) * inv_to_sun;
//     let tmax    = max(ttop, tbottom);
//     let t0      = min(tmax.xx, tmax.yz);
//     let dist_aabb = min(t0.x, t0.y);

//     let sample_dir = to_sun * dist_aabb / f32(num_samples);

//     var density : f32 = 0.0;
//     for (var i = 0; i < num_samples; i++) {
//         cur_trace_pos += sample_dir;
//         let h2 = getCloudTexture(cur_trace_pos.xy).x * mat.cloud_height;
//         density += select(0.0, h2, abs(cur_trace_pos.z) < h2);
//     }
//     density *= 64.0 / f32(num_samples);

//     let scattering_sky = exp(-height * mat.cloud_height * mat.density_sky);
//     let scattering_sun = exp(-mat.density_sun * density);

//     let col   = env.cloudColorSky.xyz * scattering_sky
//               + env.cloudColorSun.xyz * scattering_sun;
//     let alpha = pow(saturate(height * mat.alpha_multiplier), mat.alpha_saturation_a);

//     return vec4<f32>(col, alpha) * in.color;
// }

// // ---------- SIMPLE ----------

// @fragment
// fn distance_clouds_simple_ps(in: FragmentInput) -> @location(0) vec4<f32> {
//     var col = getCloudTexture(in.base_tc);

//     // if IS_LOCAL_WEATHER {
//     //     col *= get_local_weather_alpha_v2f(in.local_pos, in.weather_center);
//     // }

//     var result = vec4<f32>(
//         mat.diffuse_color.xyz * col.xyz,
//         col.w * mat.opacity,
//     ) * in.color;

//     result = vec4<f32>(result.rgb * mat.exposure, result.a);
//     return result;
// }

// // GetLinearDepth helper stub — implement with your depth reconstruction
// fn get_linear_depth(uv: vec2<f32>) -> f32 {
//     return textureSample(scene_depth_tex, baseColorSampler, uv).r;
// }

// @fragment
// fn distance_clouds_shadow_ps(in: FragmentInput) -> @location(0) vec4<f32> {
//     // --- world position of scene pixel ---
//     let scene_depth = get_linear_depth(in.base_tc);
//     let world_pos   = per_frame.world_view_pos.xyz + in.ws_view_vect * scene_depth;

//     // --- project onto cloud plane along sun direction ---
//     let sun_dir = per_frame.sun_direction.xyz;
//     let pos_in_cloud = world_pos
//                      + sun_dir * mat.sky_height / max(0.0001, sun_dir.z);

//     // --- cloud UV (skydome projection) ---
//     // _TCMMatrixDiffuse1 transform omitted; supply your own UV matrix here
//     let skydome_uv = pos_in_cloud.xy / mat.shadow_skydome_size;

//     let thickness_raw = getCloudTexture(skydome_uv).x * mat.diffuse_color.a;

//     // --- density remap ---
//     var thickness = mix(
//         mat.min_shadow_density,
//         mat.max_shadow_density,
//         pow(thickness_raw, mat.shadow_power),
//     );
//     thickness = pow(thickness, 1.0 / 2.2);   // gamma correction

//     // --- radial fading from weather center ---
//     let shadow_fading_radius = mat.weather_smooth_radius * mat.shadow_fading_radius_factor;
//     let dist_cloud = length(in.weather_center.xy - pos_in_cloud.xy);
//     let out_r      = max(0.0, shadow_fading_radius);
//     var alpha      = saturate(
//         (out_r - dist_cloud + mat.weather_radius) / abs(shadow_fading_radius)
//     );

//     // --- sun-inclination fading (avoids long low-sun shadows) ---
//     let min_radius = min(mat.weather_radius, mat.weather_radius + mat.weather_smooth_radius);
//     let dist_world = length(in.weather_center.xy - world_pos.xy);
//     let incl_edge0 = min_radius + abs(mat.weather_smooth_radius * mat.shadow_fading_inclination_factor);
//     alpha *= saturate(smoothstep(incl_edge0, min_radius, dist_world));

//     // --- noise-distorted fading ---
//     let noise_uv  = (pos_in_cloud.xy + mat.fading_noise_offset) / mat.fading_noise_tiling_size;
//     let noise_val = textureSampleLevel(pnoise_tex, pnoise_sampler, noise_uv, 0.0).r;

//     alpha = saturate(pow(alpha, 1.0 + noise_val * 5.0));
//     alpha *= thickness;
//     alpha = smoothstep(0.0, 1.0, alpha);

//     return vec4<f32>(alpha, 0.0, 0.0, 1.0);
// }

`
