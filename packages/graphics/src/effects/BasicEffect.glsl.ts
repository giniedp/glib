const BLOCKS = /* glsl */ `

#define LIGHT_COUNT 4
#define LIGHT_TYPE_OFF 0
#define LIGHT_TYPE_DIRECTIONAL 1
#define LIGHT_TYPE_POINT 2
#define LIGHT_TYPE_SPOT 3
#define LIGHT_TYPE_AREA 4

// @alias object
layout(std140) uniform ObjectBlock {
  mat4 modelMatrix;
} object;

// @alias view
layout(std140) uniform ViewBlock {
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 cameraPosition;
} view;

// @alias material
layout(std140) uniform MaterialBlock {
  vec3 baseColor;
  float alpha;
  vec3 emissiveColor;
  float roughness;
  vec3 specularColor;
  float alphaClip;
  vec4 textureScaleOffset;
} material;

// @alias lights
layout(std140) uniform LightBlock {
  vec4 color[LIGHT_COUNT];
  vec4 position[LIGHT_COUNT];
  vec4 direction[LIGHT_COUNT];
//              | Directional   | Point Light | Spot Light | Area Light
// color     R  | color         | color       | color      | color
// color     G  | color         | color       | color      | color
// color     B  | color         | color       | color      | color
// color     A  | type: 1       | type: 2     | type: 3    | type: 4
//              |               |             |            |
// position  R  | -             | pos         | pos        | pos
// position  G  | -             | pos         | pos        | pos
// position  B  | -             | pos         | pos        | pos
// position  A  | -             | range       | range      | width
//              |               |             |            |
// direction R  | direction     | -           | direction  | direction
// direction G  | direction     | -           | direction  | direction
// direction B  | direction     | -           | direction  | direction
// direction A  | -             | -           | angle      | height
} lights;

// @alias settings
layout(std140) uniform SettingsBlock {
  uint textureEnabled;
  uint lightingEnabled;
  uint fogEnabled;
} settings;

// @alias fog
layout(std140) uniform FogBlock {
  vec3 color;
  float start;
  float end;
} fog;

`

export const BASIC_EFFECT_GLSL_VS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

// @alias position
layout(location = 0) in vec3 aPosition;
// @alias normal
layout(location = 1) in vec3 aNormal;
// @alias texture
layout(location = 2) in vec2 aTexture;

${BLOCKS}

out vec3 vNormal;
out vec3 vWorldPos;
out vec2 vTexCoord;
out vec3 vToEyeInWS;
out float vFogFactor;

void main() {
  vec4 worldPos = object.modelMatrix * vec4(aPosition, 1.0);
  vec4 viewPos = view.viewMatrix * worldPos;

  vWorldPos = worldPos.xyz;
  vNormal = normalize(mat3(object.modelMatrix) * aNormal);
  vTexCoord = aTexture;
  vToEyeInWS = view.cameraPosition - worldPos.xyz;
  vFogFactor = 1.0;
  gl_Position = view.projectionMatrix * viewPos;

  if (settings.fogEnabled == 1u) {
    float dist = length(viewPos.xyz);
    vFogFactor = clamp((fog.end - dist) / (fog.end - fog.start), 0.0, 1.0);
  }
}
`

export const BASIC_EFFECT_GLSL_FS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

${BLOCKS}

uniform sampler2D baseColorMap;

in vec3 vNormal;
in vec3 vWorldPos;
in vec2 vTexCoord;
in vec3 vToEyeInWS;
in float vFogFactor;
out vec4 fragColor;


struct LightParams {
  vec4 Color;
  vec4 Position;
  vec4 Direction;
};

struct ShadeParams {
  vec3 V; // Vector to eye (camPos - worldPos)
  vec3 L; // Vector to light
  vec3 I; // Light intensity
};

struct SurfaceParams {
  vec4 Normal;     // xyz = normal, w = depth
  vec4 BaseColor;  // rgb = albedo, a = alpha
  vec3 Specular;   // rgb = specular color
  // vec3 Emission;   // rgb = emission color
  // float Metallic;  // metallic factor
  float Roughness; // roughness factor
  // float Ior;
};

// sRGB → Linear
vec3 srgbToLinear(vec3 c) {
  vec3 cutoff = vec3(0.04045);
  return mix( c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(cutoff, c) );
}

// Linear → sRGB
vec3 linearToSrgb(vec3 c) {
  vec3 cutoff = vec3(0.0031308);
  return mix( 12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(cutoff, c) );
}

void getLight(in LightParams light, int type, in vec3 position, out vec3 lightDir, out vec3 lightColor) {
  #ifdef LIGHT_TYPE_DIRECTIONAL
  // directional light (constant attenuation)
  if (type == LIGHT_TYPE_DIRECTIONAL)
  {
    lightDir = normalize(-light.Direction.xyz);
    lightColor = light.Color.rgb;
    return;
  }
  #endif

  #ifdef LIGHT_TYPE_POINT
  // point light (radial linear attenuation)
  if (type == LIGHT_TYPE_POINT)
  {
    float range = max(0.00001, light.Position.a);
    vec3 toLight = light.Position.xyz - position;
    lightDir = normalize(toLight);
    float lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    lightColor = light.Color.rgb * lightAtt;
    return;
  }
  #endif

  #ifdef LIGHT_TYPE_SPOT
  // spot light (cone and linear attenuation)
  if (type == LIGHT_TYPE_SPOT)
  {
    // same as point light
    float range = max(0.00001, light.Position.a);
    vec3 toLight = light.Position.xyz - position;
    lightDir = normalize(toLight);
    float lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    // spot cutoff
    float cosAngle = light.Direction.w;
    lightAtt *= smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightDir, normalize(-light.Direction.xyz)));

    lightColor = light.Color.rgb * lightAtt;
    return;
  }
  #endif

  lightColor = vec3(0.0);
  return;
}

float roughnessToPower(float r) {
  r = max(r, 0.04);
  return 2.0 / (r*r) - 2.0;
}
vec3 fresnelSchlick(vec3 R, float dotLH) {
  return R + (1.0 - R) * pow(1.0 - dotLH, 5.0);
}
vec3 shadeLight(
  in ShadeParams shade,
  in SurfaceParams surface
) {
  vec3 V = shade.V; // Vector to eye
  vec3 N = surface.Normal.xyz; // surface normal
  vec3 L = normalize(shade.L); // Vector to light
  vec3 I = shade.I; // Light intensity
  vec3 H = normalize(V + L);

  float dotNL = max(dot(N,L),0.0);
  if (dotNL <= 0.0) {
    return vec3(0.0);
  }
  float dotNH = max(dot(N,H),0.0);
  float dotLH = max(dot(L,H),0.0);

  float D = pow(dotNH, roughnessToPower(surface.Roughness));
  vec3  F = fresnelSchlick(surface.Specular.rgb, dotLH);
  vec3  Fr = (D * F) / (4.0 * dotLH * dotLH);
  float Fd = dotNL;

  return (Fr * surface.Specular.rgb + Fd * surface.BaseColor.rgb) * I;
}

void main() {

  vec3 toEye = normalize(view.cameraPosition - vWorldPos);
  vec4 baseColor = vec4(1.0);

  if (settings.textureEnabled == 1u) {
    baseColor = texture(baseColorMap, vTexCoord * material.textureScaleOffset.xy + material.textureScaleOffset.zw);
  }
  float alpha = baseColor.a * material.alpha;
  if (alpha < material.alphaClip) {
    discard;
  }

  SurfaceParams surface;
  surface.Normal = vec4(normalize(vNormal), 1.0);
  surface.BaseColor = vec4(baseColor.rgb * srgbToLinear(material.baseColor), baseColor.a);
  surface.Specular = srgbToLinear(material.specularColor);
  surface.Roughness = material.roughness;

  vec3 color = vec3(0.0, 0.0, 0.0);
  if (settings.lightingEnabled == 1u) {
    for(int i = 0; i < LIGHT_COUNT; i++) {
      LightParams lightParams;
      lightParams.Color = lights.color[i];
      lightParams.Position = lights.position[i];
      lightParams.Direction = lights.direction[i];

      int type = int(lightParams.Color.w);
      if (type <= 0) {
        break; // stop on first light that is off
      }

      ShadeParams shade;
      shade.V = toEye;
      getLight(lightParams, type, vWorldPos.xyz, shade.L, shade.I);
      color.rgb += shadeLight(shade, surface).rgb;
    }
    color += material.emissiveColor;
  } else {
    color = surface.BaseColor.rgb;
  }

  fragColor.rgb = mix(fog.color, color.rgb, vFogFactor);
  fragColor.a = surface.BaseColor.a * material.alpha;
  // fragColor.rgb = vNormal.xyz * 0.5 + 0.5; // normal visualization
  // fragColor.rg = vTexCoord.xy;
  // fragColor = vec4(vec3(gl_FragCoord.z), 1.0);
}
`
