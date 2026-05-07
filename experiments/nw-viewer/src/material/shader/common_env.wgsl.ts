export const COMMON_ENV_WGSL = /* wgsl */ `

struct EnvBlock {
  sunColor:        vec3<f32>,
  sunDirection:    vec3<f32>,

  bottomFogColor:   vec4<f32>,
  bottomFogHeight:  f32,
  bottomFogDensity: f32,

  topFogColor:      vec4<f32>,
  topFogHeight:     f32,
  topFogDensity:    f32,

  fogHeightOffset:  f32,

};

fn computeFogFactor(world_pos: vec3<f32>, camera_pos: vec3<f32>) -> f32 {

    // height blend
    let height_t = saturate((world_pos.y - env.bottomFogHeight) / max(0.001, env.topFogHeight - env.bottomFogHeight));
    let density  = mix(env.bottomFogDensity, env.topFogDensity, height_t);

    let d = length(world_pos - camera_pos);
    let t = d * 0.01; // 100 units = 1 fog density step

    return 1.0 - exp2(-(density) * t * t);
}

fn fogColorAtHeight(height: f32) -> vec3<f32> {
    let t = saturate(
        (height - env.bottomFogHeight + env.fogHeightOffset)
        / max(0.001, env.topFogHeight - env.bottomFogHeight)
    );
    return mix(env.bottomFogColor.rgb, env.topFogColor.rgb, t);
}
fn applyFog(
    color:      vec3<f32>,
    alpha:      f32,
    world_pos:  vec3<f32>,
    camera_pos: vec3<f32>,
) -> vec4<f32> {
    let factor    = computeFogFactor(world_pos, camera_pos);
    let fog_color = fogColorAtHeight(world_pos.y);
    return vec4<f32>(
        mix(color, fog_color, factor),
        mix(alpha, 1.0,       factor),
    );
}

`
