const BLOCKS = /* glsl */ `

#define LIGHT_COUNT 8
#define LIGHT_TYPE_OFF 0
#define LIGHT_TYPE_DIRECTIONAL 1
#define LIGHT_TYPE_POINT 2
#define LIGHT_TYPE_SPOT 3
#define TRUE 1u
#define FALSE 0u
#define PI 3.141592653589793

//              | Directional   | Point Light | Spot Light
// color     R  | color         | color       | color
// color     G  | color         | color       | color
// color     B  | color         | color       | color
// color     A  | type: 1       | type: 2     | type: 3
//              |               |             |
// position  R  | -             | pos         | pos
// position  G  | -             | pos         | pos
// position  B  | -             | pos         | pos
// position  A  | -             | range       | range
//              |               |             |
// direction R  | direction     | -           | direction
// direction G  | direction     | -           | direction
// direction B  | direction     | -           | direction
// direction A  | -             | -           | fov

struct Light {
  vec4 color;
  vec4 position;
  vec4 direction;
};

// @block global
layout(std140) uniform EnvBlock {
  Light lights[LIGHT_COUNT];
  vec3 fogColor;
  float fogNear;
  float fogFar;
} global;

// @block ibl
layout(std140) uniform IblBlock {
  mat3x3 rotation;
  float intensity;
  uint mipCount;
} ibl;

// @block view
layout(std140) uniform ViewBlock {
  mat4 viewMatrix;
  mat4 projectionMatrix;
  vec3 cameraPosition;
} view;

// @block object
layout(std140) uniform ObjectBlock {
  mat4 modelMatrix;
} object;

// @block material
layout(std140) uniform MaterialBlock {
  vec3 baseColor;         // default 1.0,1.0,1.0
  float alpha;            // default 1.0

  vec3 specularColor;     // default 1.0,1.0,1.0
  float specularWeight;   // default 1.0

  vec3 emissiveColor;     // default 0.0,0.0,0.0
  float emissiveStrength; // default 1.0

  float ior;              // default 1.5
  float metallic;         // default 1.0
  float roughness;        // default 1.0
  float alphaClip;        // default 0.0

  mat4 textureMod;        // default identity
} material;

// @block settings
layout(std140) uniform SettingsBlock {
  uint useFog;
  uint useIBL;
  uint useLights;
  uint useBlend;
  uint useBaseMap;
  uint useNormalMap;
  uint useSpecularMap;
  uint useSmoothnessMap;
  uint useOcclusionMap;
  uint useEmissiveMap;
  uint useMetallicRoughnessMap;
  uint useTextureMod;
  uint useVertexColor;
  uint useVertexTangent;
} settings;


struct ShadeParams {
  vec3 V; // View vector, Vector to eye (camPos - worldPos)
  vec3 L; // Light vector, Vector to light
  vec3 I; // Light intensity
};

struct SurfaceParams {
  vec3 diffuse;
  vec3 specular;
  float specularWeight;
  vec3 normal;
  vec3 f0;
  vec3 f90;
  float metallic;
  float roughness;
  float ior;
};

vec3 srgbToLinear(vec3 c) {
  vec3 cutoff = vec3(0.04045);
  return mix( c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(cutoff, c) );
}

vec3 linearToSrgb(vec3 c) {
  vec3 cutoff = vec3(0.0031308);
  return mix( 12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(cutoff, c) );
}

float getRangeAttenuation(float range, float distance) {
  if (range <= 0.0) {
    // no range defined -> inverse square law attenuation
    return 1.0 / pow(distance, 2.0);
  }
  return max(min(1.0 - pow(distance / range, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

void getLight(in Light light, int type, in vec3 position, out vec3 lightVec, out vec3 lightColor) {
  switch (type) {
    case LIGHT_TYPE_DIRECTIONAL: {
      // directional lights are at infinite distance and are not attenuated
      lightColor = light.color.rgb;
      lightVec = normalize(-light.direction.xyz);
      return;
    }
    case LIGHT_TYPE_POINT: {
      lightVec = light.position.xyz - position;
      float range = light.position.a;
      float distance = length(lightVec);
      float attenuation = getRangeAttenuation(range, distance);

      lightColor = light.color.rgb * attenuation;
      lightVec = normalize(lightVec);
      return;
    }
    case LIGHT_TYPE_SPOT: {
      lightVec = light.position.xyz - position;
      float range = light.position.a;
      float distance = length(lightVec);
      float attenuation = getRangeAttenuation(range, distance);

      // spot cutoff
      float cosAngle = light.direction.w;
      attenuation *= smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightVec, normalize(-light.direction.xyz)));

      lightColor = light.color.rgb * attenuation;
      lightVec = normalize(lightVec);
      return;
    }
    default: {
      lightColor = vec3(0.0);
      return;
    }
  }
}

float roughnessToPower(float r) {
  r = max(r, 0.04);
  return 2.0 / (r*r) - 2.0;
}

float smoothnessToRoughness(float smoothness) {
  return clamp( (1.0 - smoothness) * (1.0 - smoothness), 0.025, 1.0);
}

float roughnessToSmoothness(float roughness) {
  return 1.0 - sqrt(roughness);
}


vec3 decodeNormalRGFloat(vec2 xy) {
  float z = sqrt(clamp(1.0 - dot(xy, xy), 0.0, 1.0));
  return normalize(vec3(xy, z));
}

vec3 decodeNormalRGBInt(vec3 rgb) {
  return normalize(rgb * 2.0 - vec3(1.0)) * vec3(1.0, -1.0, 1.0);
}

vec3 fresnelSchlick(vec3 f0, vec3 f90, float VdotH) {
  // f0 + (f90 - f0) * pow(1.0 - VdotH, 5.0);
  float p = clamp(1.0 - VdotH, 0.0, 1.0);
  float p2 = p * p;
  float p5 = p * p2 * p2;
  return f0 + (f90 - f0) * p5;
}

#if defined(FRAGMENT_SHADER)
mat3 getCotangentFrame(vec3 position, vec3 normal, vec2 uv) {

  vec3 posdx = dFdx(position);
  vec3 posdy = dFdy(position);
  vec2 uvdx = dFdx(uv);
  vec2 uvdy = dFdy(uv);

  vec3 q1perp = cross(posdy, normal);
  vec3 q0perp = cross(normal, posdx);

  vec3 tangent = q1perp * uvdx.x + q0perp * uvdy.x;
  vec3 bitangent = q1perp * uvdx.y + q0perp * uvdy.y;

  float det = max( dot( tangent, tangent ), dot( bitangent, bitangent ) );
  float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

  return mat3(
    tangent * scale,
    bitangent * scale,
    normal
  );
}
#endif

// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
// see Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs. Journal of Computer Graphics Techniques, 3
// see Real-Time Rendering. Page 331 to 336.
// see https://google.github.io/filament/Filament.md.html#materialsystem/specularbrdf/geometricshadowing(specularg)
float V_GGX(float NdotL, float NdotV, float roughness) {
  float rSq = roughness * roughness;

  float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - rSq) + rSq);
  float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - rSq) + rSq);

  float GGX = GGXV + GGXL;
  if (GGX > 0.0) {
    return 0.5 / GGX;
  }
  return 0.0;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float D_GGX(float NdotH, float roughness) {
  float rSq = roughness * roughness;
  float f = (NdotH * NdotH) * (rSq - 1.0) + 1.0;
  return rSq / (PI * f * f);
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_lambertian(vec3 diffuseColor) {
  // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
  return (diffuseColor / PI);
}

//  https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_specularGGX(float alphaRoughness, float NdotL, float NdotV, float NdotH) {
  float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
  float D = D_GGX(NdotH, alphaRoughness);

  return vec3(Vis * D);
}

vec3 shadeLight(
  in ShadeParams shade,
  in SurfaceParams surface
) {

  vec3 I = shade.I;            // light intensity
  vec3 L = shade.L;            // vector to light
  vec3 V = shade.V;            // vector to eye
  vec3 H = normalize(V + L);   // half vector
  vec3 N = surface.normal.xyz; // surface normal

  float NdotL = clamp(dot(N, L), 0.0, 1.0);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float NdotH = clamp(dot(N, H), 0.0, 1.0);
  float VdotH = clamp(dot(V, H), 0.0, 1.0);
  float alphaRoughness = surface.roughness * surface.roughness;

  vec3 fresnelDielectric = fresnelSchlick(surface.f0 * surface.specularWeight, surface.f90, abs(VdotH));
  vec3 fresnelMetallic = fresnelSchlick(surface.diffuse, vec3(1.0), abs(VdotH));

  vec3 diffuse = I * NdotL * BRDF_lambertian(surface.diffuse);

  vec3 specularMetallic = I * NdotL * BRDF_specularGGX(alphaRoughness, NdotL, NdotV, NdotH);
  vec3 specularDielectric = specularMetallic;

  vec3 brdfMetallic = fresnelMetallic * specularMetallic;
  vec3 brdfDielectric = mix(diffuse, specularDielectric, fresnelDielectric);

  return mix(brdfDielectric, brdfMetallic, surface.metallic);
}

vec3 accumulateLights(
  in SurfaceParams surface,
  vec3 viewVec,
  vec3 worldPos
) {

  vec3 color = vec3(0.0);
  ShadeParams shade;
  shade.V = viewVec;

  for(int i = 0; i < LIGHT_COUNT; i++) {
    Light light = global.lights[i];

    int type = int(light.color.w);
    if (type <= 0) {
      break; // stop on first light that is off
    }

    getLight(light, type, worldPos.xyz, shade.L, shade.I);
    color.rgb += shadeLight(shade, surface).rgb;
  }

  return color;
}
`

export const COMMON_EFFECT_GLSL_VS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

// @alias position
layout(location = 0) in vec3 aPosition;
// @alias texture
layout(location = 1) in vec2 aTexture;
// @alias normal
layout(location = 2) in vec3 aNormal;
// @alias tangent
layout(location = 3) in vec4 aTangent;
// @alias color
layout(location = 4) in vec4 aColor;

${BLOCKS}

out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec3 vWorldTangent;
out vec3 vWorldBitangent;
out vec4 vColor;
out vec2 vUvBase;
out float vFogFactor;

void main() {
  mat4 modelMatrix = object.modelMatrix;
  vec4 worldPos = modelMatrix * vec4(aPosition.xyz, 1.0);
  vec4 viewPos = view.viewMatrix * worldPos;
  vec4 clipPos = view.projectionMatrix * viewPos;

  gl_Position = clipPos;
  vWorldPosition = worldPos.xyz;

  mat4 rotMatrix = modelMatrix;
  rotMatrix[3] = vec4(0.0, 0.0, 0.0, 1.0);
  vWorldNormal = normalize((rotMatrix * vec4(aNormal, 1.0)).xyz);
  if (settings.useNormalMap == TRUE && settings.useVertexTangent == TRUE) {
    vWorldTangent = normalize((rotMatrix * vec4(aTangent.xyz, 1.0)).xyz);
    vWorldBitangent = cross(vWorldNormal, vWorldTangent) * aTangent.a;
  }

  vUvBase = aTexture.xy;
  if (settings.useTextureMod == TRUE) {
    vUvBase = (material.textureMod * vec4(vUvBase.xy, 0.0, 1.0)).xy;
  }

  vFogFactor = 1.0;
  if (settings.useFog == TRUE) {
    float dist = length(viewPos.xyz);
    vFogFactor = clamp((global.fogFar - dist) / (global.fogFar - global.fogNear), 0.0, 1.0);
  }

  vColor = vec4(1.0);
  if (settings.useVertexColor == TRUE) {
    vColor = aColor;
  }
}
`

export const COMMON_EFFECT_GLSL_FS: string = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;
#define FRAGMENT_SHADER

${BLOCKS}

// @block texture
// @alias baseMap
uniform sampler2D baseMapSampler;
// @block texture
// @alias metallicRoughnessMap
uniform sampler2D metallicRoughnessMapSampler;
// @block texture
// @alias normalMap
uniform sampler2D normalMapSampler;
// @block texture
// @alias specularMap
uniform sampler2D specularMapSampler;
// @block texture
// @alias smoothnessMap
uniform sampler2D smoothnessMapSampler;
// @block texture
// @alias occlusionMap
uniform sampler2D occlusionMapSampler;
// @block texture
// @alias emissiveMap
uniform sampler2D emissiveMapSampler;

// @block ibl
uniform sampler2D brdfMap;
// @block ibl
uniform samplerCube radianceMap;
// @block ibl
uniform samplerCube irradianceMap;

vec3 getIBLRadianceGGX(vec3 n, vec3 v, float roughness) {
  float NdotV = clamp(dot(n, v), 0.0, 1.0);
  float lod = roughness * float(ibl.mipCount - 1u);
  vec3 reflection = normalize(reflect(-v, n));

  // TODO: fix rotation, mat3 upload
  // vec3 specularLight = textureLod(radianceMap, ibl.rotation * reflection, lod).rgb;
  vec3 specularLight = textureLod(radianceMap, reflection, lod).rgb;
  specularLight.rgb *= ibl.intensity;

  return specularLight;
}

vec3 getIBLGGXFresnel(vec3 n, vec3 v, float roughness, vec3 F0, float specularWeight) {
  // see https://bruop.github.io/ibl/#single_scattering_results at Single Scattering Results
  // Roughness dependent fresnel, from Fdez-Aguera
  float NdotV = clamp(dot(n, v), 0.0, 1.0);
  vec2 brdfSamplePoint = clamp(vec2(NdotV, roughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
  vec2 f_ab = texture(brdfMap, brdfSamplePoint).rg;
  vec3 Fr = max(vec3(1.0 - roughness), F0) - F0;
  vec3 k_S = F0 + Fr * pow(1.0 - NdotV, 5.0);
  vec3 FssEss = specularWeight * (k_S * f_ab.x + f_ab.y);

  // Multiple scattering, from Fdez-Aguera
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = specularWeight * (F0 + (1.0 - F0) / 21.0);
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);

  return FssEss + FmsEms;
}

vec3 shadeIbl(
  in SurfaceParams surface,
  vec3 viewVec
) {

  // TODO: fix rotation, mat3 upload
  // vec3 diffuse = texture(irradianceMap, ibl.rotation * surface.normal).rgb;
  vec3 diffuse = texture(irradianceMap, surface.normal).rgb;
  diffuse *= ibl.intensity;
  diffuse *= surface.diffuse.rgb;

  vec3 specularMetallic   = getIBLRadianceGGX(surface.normal, viewVec, surface.roughness);
  vec3 specularDielectric = specularMetallic;

  vec3 fresnelMetallic = getIBLGGXFresnel(
    surface.normal,
    viewVec,
    surface.roughness,
    surface.diffuse.rgb,
    1.0
  );
  vec3 fresnelDielectric = getIBLGGXFresnel(
    surface.normal,
    viewVec,
    surface.roughness,
    surface.f0,
    surface.specularWeight
  );

  vec3 brdfMetallic = specularMetallic * fresnelMetallic;
  vec3 brdfDielectric = mix(diffuse, specularDielectric, fresnelDielectric);

  return mix(brdfDielectric, brdfMetallic, surface.metallic);
}


in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec3 vWorldTangent;
in vec3 vWorldBitangent;
in vec2 vUvBase;
in vec4 vColor;
in float vFogFactor;
out vec4 fragColor;


void main() {

  vec3 viewVec = normalize(view.cameraPosition - vWorldPosition);

  vec4 baseColor = vColor * vec4(material.baseColor, material.alpha);
  if (settings.useBaseMap == TRUE) {
    baseColor *= texture(baseMapSampler, vUvBase);
  }

  float metallic = material.metallic;
  float roughness = material.roughness;
  if (settings.useMetallicRoughnessMap == TRUE) {
    vec4 px = texture(metallicRoughnessMapSampler, vUvBase);
    metallic *= px.b;
    roughness *= px.g;
  }

  vec3 specular = material.specularColor; // linear color
  float specularWeight = material.specularWeight;
  if (settings.useSpecularMap == TRUE) {
    specular *= texture(specularMapSampler, vUvBase).rgb;
  }
  if (settings.useSmoothnessMap == TRUE) {
    vec4 px = texture(smoothnessMapSampler, vUvBase);
    if (material.ior == 0.0 && metallic == 0.0) {
      // specular glossiness flow
      roughness = 1.0 - ((1.0 - roughness) * px.a);
      specularWeight = 1.0;
    } else {
      // specular flow
      specularWeight *= px.a;
    }
  }

  vec3 emissive = material.emissiveColor * material.emissiveStrength;
  if (settings.useEmissiveMap == TRUE) {
    emissive *= texture(emissiveMapSampler, vUvBase).rgb;
  }

  vec3 normal = normalize(vWorldNormal);
  if (settings.useNormalMap == TRUE) {
    mat3 tbn;
    if (settings.useVertexTangent == TRUE) {
      tbn = mat3(
        normalize(vWorldTangent),
        normalize(vWorldBitangent),
        normal
      );
    } else {
      tbn = getCotangentFrame(vWorldPosition, normal, vUvBase);
    }

    vec3 pixel = texture(normalMapSampler, vUvBase).rgb;
    normal = normalize(tbn * (decodeNormalRGBInt(pixel).rgb));
  }

  float alpha = baseColor.a;
  if (alpha < material.alphaClip) {
    discard;
  }

  if (settings.useBlend == FALSE) {
    alpha = 1.0;
  }

  float ior = material.ior;
  vec3 f0 = vec3(pow((ior - 1.0) / (ior + 1.0), 2.0));
  vec3 f90 = vec3(1.0);
  // specular flow
  f0 = min(f0 * specular.rgb, vec3(1.0));
  f90 = vec3(specularWeight);
  // specular flow end


  SurfaceParams surface;
  surface.diffuse = baseColor.rgb;
  surface.specular = specular.rgb;
  surface.specularWeight = specularWeight;
  surface.normal = normal.xyz;
  surface.ior = ior;
  surface.metallic = metallic;
  surface.roughness = roughness;
  surface.f0 = f0;
  surface.f90 = f90;

  vec3 color = mix(surface.diffuse.rgb, vec3(0.0), float(settings.useLights));
  if (settings.useIBL == TRUE) {
    color = shadeIbl(surface, viewVec);
  }
  if (settings.useOcclusionMap == TRUE) {
    color *= texture(occlusionMapSampler, vUvBase).r;
  }
  if (settings.useLights == TRUE) {
    color += accumulateLights(surface, viewVec, vWorldPosition);
  }
  color += emissive;

  fragColor.rgb = mix(global.fogColor, color.rgb, vFogFactor);
  fragColor.a = alpha;

  // fragColor.rgb = vec3(vUvBase, 0.0);
  // fragColor.rgb = surface.diffuse.rgb;
  // fragColor.rgb = surface.specular.rgb;
  // fragColor.rgb = emissive;
  // fragColor.rgb = normalize(surface.normal) * 0.5 + vec3(0.5);
  // fragColor.rgb = normalize(vWorldNormal) * 0.5 + vec3(0.5);
  // fragColor.rgb = normalize(vWorldTangent) * 0.5 + vec3(0.5);
  // fragColor.rgb = viewVec * 0.5 + vec3(0.5);
  // fragColor.rgb = vec3(surface.ior);
  // fragColor.rgb = vec3(surface.metallic);
  // fragColor.rgb = vec3(surface.roughness);
  // fragColor.rgb = vec3(surface.specularWeight);
  // fragColor.rgb = f0;
  // fragColor.rgb = f90;
  // fragColor.rgb = normalize(vWorldPosition) * 0.5 + vec3(0.5);
  // fragColor.rgb = normalize(view.cameraPosition) * 0.5 + vec3(0.5);
  // fragColor.rgb = vec3(dot(surface.normal, viewVec));
  // fragColor.rgb = texture(normalMapSampler, vUvBase).rgb;
  // fragColor.rgb = texture(baseMapSampler, vUvBase).rgb;
  // fragColor.rgb = texture(baseMapSampler, vUvBase).aaa;
  // fragColor.rgb = texture(specularMapSampler, vUvBase).rgb;
  // fragColor.rgb = texture(smoothnessMapSampler, vUvBase).aaa;
  // fragColor.rgb = texture(metallicRoughnessMapSampler, vUvBase).rgb;
}
`
