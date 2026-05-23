export const COMMON_ENV_WGSL = /* wgsl */ `

fn computeFogFactor(world_pos: vec3<f32>, camera_pos: vec3<f32>) -> f32 {

    // height blend
    let height_t = saturate((world_pos.y - global.bottomFogHeight) / max(0.001, global.topFogHeight - global.bottomFogHeight));
    let density  = mix(global.bottomFogDensity, global.topFogDensity, height_t);

    let d = length(world_pos - camera_pos);
    let t = d * 0.01; // 100 units = 1 fog density step

    return 1.0 - exp2(-(density) * t * t);
}

fn fogColorAtHeight(height: f32) -> vec3<f32> {
    let t = saturate(
        (height - global.bottomFogHeight + global.fogHeightOffset)
        / max(0.001, global.topFogHeight - global.bottomFogHeight)
    );
    return mix(global.bottomFogColor.rgb, global.topFogColor.rgb, t);
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
