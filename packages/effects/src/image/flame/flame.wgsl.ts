import { FULLSCREEN_WGSL_VS } from '../common.wgsl'

export const FLAME_WGSL_FS = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}

  const FLAME_STEPS: i32 = 24;
  // uv is top-left origin, so screen-up is -y in uv space
  const UP: vec2f = vec2f(0.0, -1.0);

  struct Uniforms {
    colorCore: vec3f,
    time: f32,
    colorEdge: vec3f,
    height: f32,
    intensity: f32,
    scale: f32,
    speed: f32,
    distortion: f32,
    turbulence: f32,
    occlusion: f32,
    refraction: f32,
    aspect: f32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias colorMap
  @group(0) @binding(1) var colorMap: texture_2d<f32>;
  @group(0) @binding(2) var colorMapSampler: sampler;

  fn hash12(p: vec2f) -> f32 {
    var p3 = fract(vec3f(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  fn valueNoise(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    let a = hash12(i);
    let b = hash12(i + vec2f(1.0, 0.0));
    let c = hash12(i + vec2f(0.0, 1.0));
    let d = hash12(i + vec2f(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  fn fbm(pIn: vec2f) -> f32 {
    var p = pIn;
    var sum = 0.0;
    var amp = 0.5;
    for (var i = 0; i < 4; i++) {
      sum += amp * valueNoise(p);
      p = p * 2.02 + vec2f(17.3, 9.1);
      amp *= 0.5;
    }
    return sum / 0.9375;
  }

  struct Flame {
    color: vec3f,
    // uv offset for the heat haze behind the flame
    refraction: vec2f,
  };

  fn flame(uv: vec2f) -> Flame {
    // flame space: x aspect corrected, y pointing up the screen
    let p = vec2f(uv.x * params.aspect, dot(uv, UP));
    let t = params.time * params.speed;

    // low frequency noise bends the flame body sideways,
    // high frequency noise breaks it up into tongues. Both scroll upwards.
    let bend = fbm(vec2f(p.x * params.scale, p.y * params.scale * 0.6 - t));
    let tongues = fbm(vec2f(p.x * params.scale * 2.0, p.y * params.scale * 1.2 - t * 1.7) + 5.2);

    // gather heat from the silhouette below this pixel
    var heat = 0.0;
    for (var i = 1; i <= FLAME_STEPS; i++) {
      let s = f32(i) / f32(FLAME_STEPS);
      let y = p.y - s * params.height;
      // per tap sway, lets the tongues curl along their length
      let sway = valueNoise(vec2f(p.x * params.scale * 1.5, y * params.scale - t * 1.3)) - 0.5;
      let offset = vec2f((bend - 0.5 + sway) * params.distortion * s, 0.0) - UP * (s * params.height);
      let source = textureSampleLevel(colorMap, colorMapSampler, uv + offset, 0.0).a;
      heat += source * (1.0 - s);
    }
    heat /= f32(FLAME_STEPS - 1) * 0.5;
    let haze = clamp(heat, 0.0, 1.0);

    // erode the cooler parts of the flame
    heat -= (1.0 - tongues) * params.turbulence * (1.0 - heat);
    heat = clamp(heat, 0.0, 1.0);

    var result: Flame;
    let color = mix(params.colorEdge, params.colorCore, smoothstep(0.35, 0.9, heat));
    result.color = color * pow(heat, 1.5) * params.intensity;
    let wobble = (vec2f(bend, tongues) - 0.5) * params.refraction * haze;
    result.refraction = vec2f(wobble.x, 0.0) + UP * wobble.y;
    return result;
  }

  @fragment
  fn main(in: FragmentInput) -> @location(0) vec4f {
    let f = flame(in.uv);
    let scene = textureSampleLevel(colorMap, colorMapSampler, in.uv + f.refraction, 0.0);
    let fire = f.color * (1.0 - scene.a * params.occlusion);
    let alpha = max(scene.a, clamp(max(fire.r, max(fire.g, fire.b)), 0.0, 1.0));
    return vec4f(scene.rgb + fire, alpha);
  }
`
