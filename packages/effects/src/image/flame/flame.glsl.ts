export const FLAME_GLSL_FS = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  const int FLAME_STEPS = 24;
  // GL textures are bottom-left origin, so screen-up is +y in uv space
  const vec2 UP = vec2(0.0, 1.0);

  in vec2 uv;
  out vec4 fragColor;

  // @block params
  layout(std140) uniform Uniforms {
    vec3  colorCore;
    float time;
    vec3  colorEdge;
    float height;
    float intensity;
    float scale;
    float speed;
    float distortion;
    float turbulence;
    float occlusion;
    float refraction;
    float aspect;
  } params;

  // @alias colorMap
  uniform sampler2D colorMap;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * valueNoise(p);
      p = p * 2.02 + vec2(17.3, 9.1);
      amp *= 0.5;
    }
    return sum / 0.9375;
  }

  struct Flame {
    vec3 color;
    // uv offset for the heat haze behind the flame
    vec2 refraction;
  };

  Flame flame(vec2 uv) {
    // flame space: x aspect corrected, y pointing up the screen
    vec2 p = vec2(uv.x * params.aspect, dot(uv, UP));
    float t = params.time * params.speed;

    // low frequency noise bends the flame body sideways,
    // high frequency noise breaks it up into tongues. Both scroll upwards.
    float bend = fbm(vec2(p.x * params.scale, p.y * params.scale * 0.6 - t));
    float tongues = fbm(vec2(p.x * params.scale * 2.0, p.y * params.scale * 1.2 - t * 1.7) + 5.2);

    // gather heat from the silhouette below this pixel
    float heat = 0.0;
    for (int i = 1; i <= FLAME_STEPS; i++) {
      float s = float(i) / float(FLAME_STEPS);
      float y = p.y - s * params.height;
      // per tap sway, lets the tongues curl along their length
      float sway = valueNoise(vec2(p.x * params.scale * 1.5, y * params.scale - t * 1.3)) - 0.5;
      vec2 offset = vec2((bend - 0.5 + sway) * params.distortion * s, 0.0) - UP * (s * params.height);
      float source = textureLod(colorMap, uv + offset, 0.0).a;
      heat += source * (1.0 - s);
    }
    heat /= float(FLAME_STEPS - 1) * 0.5;
    float haze = clamp(heat, 0.0, 1.0);

    // erode the cooler parts of the flame
    heat -= (1.0 - tongues) * params.turbulence * (1.0 - heat);
    heat = clamp(heat, 0.0, 1.0);

    Flame result;
    vec3 color = mix(params.colorEdge, params.colorCore, smoothstep(0.35, 0.9, heat));
    result.color = color * pow(heat, 1.5) * params.intensity;
    vec2 wobble = (vec2(bend, tongues) - 0.5) * params.refraction * haze;
    result.refraction = vec2(wobble.x, 0.0) + UP * wobble.y;
    return result;
  }

  void main() {
    Flame f = flame(uv);
    vec4 scene = texture(colorMap, uv + f.refraction);
    vec3 fire = f.color * (1.0 - scene.a * params.occlusion);
    float alpha = max(scene.a, clamp(max(fire.r, max(fire.g, fire.b)), 0.0, 1.0));
    fragColor = vec4(scene.rgb + fire, alpha);
  }
`
