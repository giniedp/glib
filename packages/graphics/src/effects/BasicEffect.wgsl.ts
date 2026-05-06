export const BASIC_EFFECT_WGSL = /* wgsl */ `

const LIGHT_COUNT: u32 = 4u;
const LIGHT_TYPE_OFF: u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT: u32 = 2u;
const LIGHT_TYPE_SPOT: u32 = 3u;
const LIGHT_TYPE_AREA: u32 = 4u;

struct ObjectBlock {
  modelMatrix : mat4x4<f32>,
};

struct ViewBlock {
  viewMatrix:       mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  cameraPosition:   vec3<f32>,
};

struct MaterialBlock {
  baseColor:     vec3<f32>,
  alpha:         f32,
  emissiveColor: vec3<f32>,
  roughness:     f32,
  specularColor: vec3<f32>,
  alphaClip:     f32,
  textureScaleOffset: vec4<f32>,
};

struct LightBlock {
  color:     array<vec4<f32>, LIGHT_COUNT>,
  position:  array<vec4<f32>, LIGHT_COUNT>,
  direction: array<vec4<f32>, LIGHT_COUNT>,
};

struct SettingsBlock {
  textureEnabled:  u32,
  lightingEnabled: u32,
  fogEnabled:      u32,
};

struct FogBlock {
  color:  vec3<f32>,
  start:  f32,
  end:    f32,
};

@group(0) @binding(0) var<uniform> object : ObjectBlock;
@group(0) @binding(1) var<uniform> view : ViewBlock;
@group(0) @binding(2) var<uniform> material : MaterialBlock;
@group(0) @binding(3) var<uniform> lights : LightBlock;
@group(0) @binding(4) var<uniform> settings : SettingsBlock;
@group(0) @binding(5) var<uniform> fog : FogBlock;

@group(0) @binding(6) var baseColorMap : texture_2d<f32>;
@group(0) @binding(7) var baseColorSampler : sampler;

struct VertexInput {
  // @alias position
  @location(0) aPosition : vec3<f32>,
  // @alias normal
  @location(1) aNormal : vec3<f32>,
  // @alias texture
  @location(2) aTexture : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) vNormal : vec3<f32>,
  @location(1) vWorldPos : vec3<f32>,
  @location(2) vTexCoord : vec2<f32>,
  @location(3) vToEyeInWS : vec3<f32>,
  @location(4) vFogFactor : f32,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  let worldPos = object.modelMatrix * vec4<f32>(input.aPosition, 1.0);
  let viewPos = view.viewMatrix * worldPos;

  output.vWorldPos = worldPos.xyz;
  output.vNormal = normalize((object.modelMatrix * vec4<f32>(input.aNormal, 0.0)).xyz);
  output.vTexCoord = input.aTexture;
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  output.Position = view.projectionMatrix * viewPos;
  output.vFogFactor = 1.0;

  if (settings.fogEnabled == 1u) {
    let dist = length(viewPos.xyz);
    output.vFogFactor = clamp((fog.end - dist) / (fog.end - fog.start), 0.0, 1.0);
  }
  return output;
}

struct LightParams {
  Color : vec4<f32>,
  Position : vec4<f32>,
  Direction : vec4<f32>,
};

struct ShadeParams {
  V : vec3<f32>,
  L : vec3<f32>,
  I : vec3<f32>,
};

struct SurfaceParams {
  Normal : vec4<f32>,
  BaseColor : vec4<f32>,
  Specular : vec3<f32>,
  Roughness : f32,
};

fn roughnessToPower(r: f32) -> f32 {
  let rr = max(r, 0.04);
  return 2.0 / (rr * rr) - 2.0;
}

fn fresnelSchlick(R: vec3<f32>, dotLH: f32) -> vec3<f32> {
  return R + (1.0 - R) * pow(1.0 - dotLH, 5.0);
}

struct LightResult {
  lightDir: vec3<f32>,
  lightColor: vec3<f32>,
};
fn getLight(light: LightParams, lightType: u32, position: vec3<f32>) -> LightResult {
  var result: LightResult;
  if (lightType == LIGHT_TYPE_DIRECTIONAL) {
    result.lightDir = normalize(-light.Direction.xyz);
    result.lightColor = light.Color.rgb;
    return result;
  }
  if (lightType == LIGHT_TYPE_POINT) {
    let range = max(0.00001, light.Position.w);
    let toLight = light.Position.xyz - position;
    let lightDir = normalize(toLight);
    let lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    result.lightDir = lightDir;
    result.lightColor = light.Color.rgb * lightAtt;
    return result;
  }
  if (lightType == LIGHT_TYPE_SPOT) {
    let range = max(0.00001, light.Position.w);
    let toLight = light.Position.xyz - position;
    let lightDir = normalize(toLight);
    var lightAtt = clamp(1.0 - length(toLight) / range, 0.0, 1.0);
    let cosAngle = light.Direction.w;
    lightAtt = lightAtt * smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightDir, normalize(-light.Direction.xyz)));
    result.lightDir = lightDir;
    result.lightColor = light.Color.rgb * lightAtt;
    return result;
  }
  return result;
}

fn shadeLight(shade: ShadeParams, surface: SurfaceParams) -> vec3<f32> {
  let V = shade.V;
  let N = surface.Normal.xyz;
  let L = normalize(shade.L);
  let I = shade.I;
  let H = normalize(V + L);
  let dotNL = max(dot(N, L), 0.0);
  if (dotNL <= 0.0) {
    return vec3<f32>(0.0);
  }
  let dotNH = max(dot(N, H), 0.0);
  let dotLH = max(dot(L, H), 0.0);
  let D = pow(dotNH, roughnessToPower(surface.Roughness));
  let F = fresnelSchlick(surface.Specular.rgb, dotLH);
  let Fr = (D * F) / (4.0 * dotLH * dotLH);
  let Fd = dotNL;
  return (Fr * surface.Specular.rgb + Fd * surface.BaseColor.rgb) * I;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let toEye = normalize(view.cameraPosition - input.vWorldPos);
  var baseColor = vec4<f32>(1.0);

  if (settings.textureEnabled == 1u) {
    let uv = input.vTexCoord * material.textureScaleOffset.xy + material.textureScaleOffset.zw;
    baseColor = textureSample(baseColorMap, baseColorSampler, uv);
  }
  let alpha = baseColor.a * material.alpha;
  if (alpha < material.alphaClip) {
    discard;
  }

  var surface : SurfaceParams;
  surface.Normal = vec4<f32>(normalize(input.vNormal), 1.0);
  surface.BaseColor = vec4<f32>(baseColor.rgb * srgbToLinear(material.baseColor), baseColor.a);
  surface.Specular = srgbToLinear(material.specularColor);
  surface.Roughness = material.roughness;

  var color = vec3<f32>(0.0, 0.0, 0.0);
  if (settings.lightingEnabled == 1u) {
    var i : u32 = 0u;
    loop {
      if (i >= LIGHT_COUNT) { break; }
      let lightParams = LightParams(
        lights.color[i],
        lights.position[i],
        lights.direction[i]
      );
      let lightType = u32(lightParams.Color.w);
      if (lightType <= 0u) { break; }
      var shade : ShadeParams;
      shade.V = toEye;
      let lightResult = getLight(lightParams, lightType, input.vWorldPos);
      shade.L = lightResult.lightDir;
      shade.I = lightResult.lightColor;
      color = color + shadeLight(shade, surface);
      i = i + 1u;
    }
    color = color + material.emissiveColor;
  } else {
    color = surface.BaseColor.rgb;
  }
  color = mix(fog.color, color, input.vFogFactor);
  // return vec4<f32>(input.vNormal.xyz, alpha);
  // return vec4<f32>(input.Position.z, input.Position.z, input.Position.z, 1.0);
  return vec4<f32>(color, alpha);
}


// sRGB → Linear
fn srgbToLinear(c: vec3<f32>) -> vec3<f32> {
  let cutoff = vec3<f32>(0.04045);
  return select( c / 12.92, pow((c + 0.055) / 1.055, vec3<f32>(2.4)), c > cutoff );
}

// Linear → sRGB
fn linearToSrgb(c: vec3<f32>) -> vec3<f32> {
  let cutoff = vec3<f32>(0.0031308);
  return select( 12.92 * c, 1.055 * pow(c, vec3<f32>(1.0 / 2.4)) - 0.055, c > cutoff );
}
`
