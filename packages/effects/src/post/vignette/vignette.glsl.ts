export const VIGNETTE_GLSL_VERTEX: string = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  out vec2 uv;

  void main(void) {
    vec2 pos = vec2(
      (gl_VertexID == 2) ? 3.0 : -1.0,
      (gl_VertexID == 1) ? 3.0 : -1.0
    );

    gl_Position = vec4(pos, 0.0, 1.0);
    uv = pos * 0.5 + 0.5;
    //uv.y = 1.0 - uv.y; // Flip Y for WebGL
  }
`

const VIGNETTE_FRAGMENT_BASE = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  in vec2 uv;
  out vec4 fragColor;

  // @alias params
  uniform Uniforms {
    vec2 center;    // usually (0.5, 0.5)
    vec2 radius;    // ellipse radius
    float inner;    // inner untouched region (0–1)
    float strength; // intensity (0–1)
    float power;    // falloff shaping (>=1)
    float aspect;   // width / height
    vec3 color;     // typically vec3(0.0)
  } params;

  // @alias texture
  uniform sampler2D texture1Sampler;

  float computeMask(vec2 uv) {
    vec2 p = uv - params.center;

    // aspect correction
    p.x *= params.aspect;

    // elliptical distance
    float dist = length(p / params.radius);

    // inner/outer mapping
    float t = clamp(
      (dist - params.inner) / (1.0 - params.inner),
      0.0,
      1.0
    );

    // shaping
    float mask = pow(t, params.power);

    return mask;
  }

  vec3 applyVignette(vec2 uv, vec3 color) {
    float mask = computeMask(uv);

    // base attenuation
    float vignette = 1.0 - mask * params.strength;

    // --- highlight preservation (HDR-friendly) ---
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    float protect = smoothstep(0.5, 2.0, lum);
    vignette = mix(vignette, 1.0, protect * 0.5);

    // --- subtle saturation falloff ---
    float desat = mask * 0.25;
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), desat);

    // --- slight chromatic bias ---
    vec3 vignetteRGB = vec3(
      1.0 - mask * params.strength * 1.03,
      1.0 - mask * params.strength,
      1.0 - mask * params.strength * 0.97
    );

    color *= vignetteRGB;

    // --- final mix (filmic style) ---
    return mix(params.color, color, vignette);
  }
`

export const VIGNETTE_GLSL_FRAGMENT: string = /* glsl */ `
  ${VIGNETTE_FRAGMENT_BASE}

  void main() {
    vec3 color = texture(texture1Sampler, uv).rgb;
    vec3 result = applyVignette(uv, color);
    fragColor = vec4(result, 1.0);
  }
`

// export const VIGNETTE_GLSL_VERTEX: string = /* glsl */ `
//   #version 300 es
//   precision highp float;
//   precision highp int;

//   out vec2 uv;

//   void main(void) {
//     vec4 position = vec4(
//       float(gl_VertexID & 1) * 2.0 - 1.0,        // -> [-1:1]
//       float((gl_VertexID >> 1) & 1) * 2.0 - 1.0, // -> [-1:1]
//       0.0,
//       1.0
//     );
//     gl_Position = position;
//     uv = position.xy * 0.5 + 0.5;
//   }
// `
// export const VIGNETTE_GLSL_FRAGMENT = /* glsl */ `
//   #version 300 es
//   precision highp float;
//   precision highp int;

//   in vec2 uv;
//   out vec4 fragColor;

//   // @alias params
//   uniform Uniforms {
//     float centerX;
//     float centerY;
//     float roundness;
//     float stretch;
//     vec3 color;
//     float weight;
//   } params;

//   // @alias texture
//   uniform sampler2D textureSampler;

//   void main() {
//     // Center and stretch
//     vec2 centered = (uv - vec2(params.centerX, params.centerY)) * vec2(1.0, params.stretch);
//     // Distance from center, shaped by roundness
//     float dist = pow(dot(centered, centered), params.roundness);
//     // Vignette factor: 1.0 at center, decreases toward corners
//     float vignette = 1.0 - dist * params.weight;
//     vignette = clamp(vignette, 0.0, 1.0);
//     // Blend vignette color with white (or background)
//     vec3 base = texture(textureSampler, uv).rgb;
//     vec3 color = mix(params.color, base, vignette);
//     fragColor = vec4(color, 1.0);

//   }
// `
