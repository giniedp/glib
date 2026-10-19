const BASE = /* glsl */ `

  // @block view
  layout(std140) uniform ViewBlock {
    mat4 viewMatrix;
    mat4 projectionMatrix;
  } view;

  // @block settings
  layout(std140) uniform SettingsBlock {
    float alphaCutoff;
  } settings;

  // @alias colorMap
  uniform sampler2D colorMapSampler;
`

export const SPRITE_EFFECT_GLSL_VS = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

  const vec2 CORNERS[4] = vec2[](
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0)
  );

  // @alias origin
  layout(location = 0) in vec3 aOrigin;
  // @alias axisX
  layout(location = 1) in vec3 aAxisX;
  // @alias axisY
  layout(location = 2) in vec3 aAxisY;
  // @alias texcoord
  layout(location = 3) in vec4 aTexcoord;
  // @alias color
  layout(location = 4) in vec4 aColor;

  out vec2 vUV;
  out vec4 vColor;

  ${BASE}
  void main(void) {
    vec2 corner = CORNERS[gl_VertexID % 4];
    vec3 position = aOrigin + corner.x * aAxisX + corner.y * aAxisY;
    vUV = mix(aTexcoord.xy, aTexcoord.zw, corner);
    vColor = aColor;
    gl_Position = view.projectionMatrix * view.viewMatrix * vec4(position, 1.0);
  }
`

export const SPRITE_EFFECT_GLSL_FS = /* glsl */ `
  #version 300 es

  precision highp float;

  ${BASE}

  in vec2 vUV;
  in vec4 vColor;

  out vec4 fragColor;

  void main(void) {
    vec4 color = texture(colorMapSampler, vUV) * vColor;
    if (color.a < settings.alphaCutoff) {
      discard;
    }
    fragColor = color;
  }
`
