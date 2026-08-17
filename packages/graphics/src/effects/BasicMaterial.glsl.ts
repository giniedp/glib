const BASE = /* glsl */ `
#define TRUE 1u
#define FALSE 0u
#define PI 3.141592653589793

// @block global
layout(std140) uniform GlobalBlock {
  vec3 ambientColor;     // default 1.0,1.0,1.0
  vec3 ambientColorTop;  // default 1.0,1.0,1.0
  vec3 ambientDirection; // default 0.0,1.0,0.0
} global;

// @block view
layout(std140) uniform ViewBlock {
  mat4 viewMatrix;
  mat4 projectionMatrix;
} view;

// @block object
layout(std140) uniform ObjectBlock {
  mat4 modelMatrix;
} object;

// @block material
layout(std140) uniform MaterialBlock {
  vec3 baseColor;         // default 1.0,1.0,1.0
  float alpha;            // default 1.0
  float alphaClip;        // default 0.0
  mat4 textureMod;        // default identity
} material;

// @block settings
layout(std140) uniform SettingsBlock {
  uint useFog;         // enables fog
  uint useSun;         // enables sun light
  uint useBlend;       // indicates that alpha blending is used
  uint useBaseMap;     // enables base color texture
  uint useVertexColor; // enables vertex color tint
} settings;

#if defined(VERTEX_SHADER)
  // @alias position
  layout(location = 0) in vec3 aPosition;
  // @alias texture
  layout(location = 1) in vec2 aTexture;
  // @alias normal
  layout(location = 2) in vec3 aNormal;
  // @alias color
  layout(location = 3) in vec4 aColor;

  out vec3 vWorldNormal;
  out vec4 vColor;
  out vec2 vUvBase;
#endif

#if defined(FRAGMENT_SHADER)
  // @block texture
  // @alias baseMap
  uniform sampler2D baseMapSampler;

  in vec3 vWorldNormal;
  in vec4 vColor;
  in vec2 vUvBase;
  out vec4 fragColor;
#endif
`

export const BASIC_EFFECT_GLSL_VS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

#define VERTEX_SHADER
${BASE}

void main() {
  mat4 modelMatrix = object.modelMatrix;
  vec4 worldPos = modelMatrix * vec4(aPosition.xyz, 1.0);
  vec4 viewPos = view.viewMatrix * worldPos;
  vec4 clipPos = view.projectionMatrix * viewPos;

  gl_Position = clipPos;

  mat4 rotMatrix = modelMatrix;
  rotMatrix[3] = vec4(0.0, 0.0, 0.0, 1.0);

  vec3 normal = aNormal;
  if (length(normal) == 0.0) {
    // assume, normal stream not given and project position instead
    normal = normalize(aPosition);
  }
  vWorldNormal = normalize((rotMatrix * vec4(normal, 1.0)).xyz);

  vUvBase = (material.textureMod * vec4(aTexture.xy, 0.0, 1.0)).xy;

  vColor = vec4(1.0);
  if (settings.useVertexColor == TRUE) {
    vColor = aColor;
  }
}
`

export const BASIC_EFFECT_GLSL_FS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

#define FRAGMENT_SHADER
${BASE}

void main() {

  vec4 baseColor = vColor * vec4(material.baseColor, material.alpha);
  if (settings.useBaseMap == TRUE) {
    baseColor *= texture(baseMapSampler, vUvBase);
  }

  vec3 normal = normalize(vWorldNormal);

  if (baseColor.a < material.alphaClip) {
    discard;
  }
  if (settings.useBlend == FALSE) {
    baseColor.a = 1.0;
  }


  vec3 light = mix(global.ambientColor, global.ambientColorTop, dot(global.ambientDirection, normal) * 0.5 + 0.5);
  fragColor.rgb = baseColor.rgb * light;
  fragColor.a = baseColor.a;
}
`
