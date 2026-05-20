export const BASIC_EFFECT_WGSL = /* wgsl */ `

const LIGHT_COUNT: u32 = 4u;
const LIGHT_TYPE_OFF: u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT: u32 = 2u;
const LIGHT_TYPE_SPOT: u32 = 3u;
const LIGHT_TYPE_AREA: u32 = 4u;

struct GlobalBlock {
  fogColor:  vec3f,
  fogNear:   f32,
  fogFar:    f32,
};

struct ViewBlock {
  viewMatrix:       mat4x4f,
  projectionMatrix: mat4x4f,
  cameraPosition:   vec3f,
};

struct ObjectBlock {
  modelMatrix : mat4x4f,
};

struct MaterialBlock {
  baseColor:          vec3f,
  alpha:              f32,
  emissiveColor:      vec3f,
  roughness:          f32,
  specularColor:      vec3f,
  alphaClip:          f32,
  textureScaleOffset: vec4f,
  textureEnabled:     u32,
  lightingEnabled:    u32,
  fogEnabled:         u32,
};

struct LightBlock {
  color:              array<vec4f, LIGHT_COUNT>,
  position:           array<vec4f, LIGHT_COUNT>,
  direction:          array<vec4f, LIGHT_COUNT>,
};


@group(0) @binding(0) var<uniform> global: GlobalBlock;
@group(0) @binding(1) var<uniform> view: ViewBlock;
@group(0) @binding(2) var<uniform> object: ObjectBlock;
@group(0) @binding(3) var<uniform> material: MaterialBlock;
@group(0) @binding(4) var<uniform> lights: LightBlock;

// @block material
@group(0) @binding(5) var baseColorMap : texture_2d<f32>;
// @block material
@group(0) @binding(6) var baseColorSampler : sampler;

struct VertexInput {
  // @alias position
  @location(0) aPosition : vec3f,
  // @alias normal
  @location(1) aNormal : vec3f,
  // @alias texture
  @location(2) aTexture : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) vNormal : vec3f,
  @location(1) vWorldPos : vec3f,
  @location(2) vTexCoord : vec2<f32>,
  @location(3) vToEyeInWS : vec3f,
  @location(4) vFogFactor : f32,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  let worldPos = object.modelMatrix * vec4f(input.aPosition, 1.0);
  let viewPos = view.viewMatrix * worldPos;

  output.vWorldPos = worldPos.xyz;
  output.vNormal = normalize((object.modelMatrix * vec4f(input.aNormal, 0.0)).xyz);
  output.vTexCoord = input.aTexture;
  output.vToEyeInWS = view.cameraPosition - worldPos.xyz;
  output.Position = view.projectionMatrix * viewPos;
  output.vFogFactor = 1.0;

  if (material.fogEnabled == 1u) {
    let dist = length(viewPos.xyz);
    output.vFogFactor = clamp((global.fogFar - dist) / (global.fogFar - global.fogNear) , 0.0, 1.0);
  }
  return output;
}

struct LightParams {
  Color : vec4f,
  Position : vec4f,
  Direction : vec4f,
};

struct ShadeParams {
  V : vec3f,
  L : vec3f,
  I : vec3f,
};

struct SurfaceParams {
  Normal : vec4f,
  BaseColor : vec4f,
  Specular : vec3f,
  Roughness : f32,
};

fn roughnessToPower(r: f32) -> f32 {
  let rr = max(r, 0.04);
  return 2.0 / (rr * rr) - 2.0;
}

fn fresnelSchlick(R: vec3f, dotLH: f32) -> vec3f {
  return R + (1.0 - R) * pow(1.0 - dotLH, 5.0);
}

struct LightResult {
  lightDir: vec3f,
  lightColor: vec3f,
};
fn getLight(light: LightParams, lightType: u32, position: vec3f) -> LightResult {
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

fn shadeLight(shade: ShadeParams, surface: SurfaceParams) -> vec3f {
  let V = shade.V;
  let N = surface.Normal.xyz;
  let L = normalize(shade.L);
  let I = shade.I;
  let H = normalize(V + L);
  let dotNL = max(dot(N, L), 0.0);
  if (dotNL <= 0.0) {
    return vec3f(0.0);
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
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let toEye = normalize(view.cameraPosition - input.vWorldPos);
  var baseColor = vec4f(1.0);

  if (material.textureEnabled == 1u) {
    let uv = input.vTexCoord * material.textureScaleOffset.xy + material.textureScaleOffset.zw;
    baseColor = textureSample(baseColorMap, baseColorSampler, uv);
  }
  let alpha = baseColor.a * material.alpha;
  if (alpha < material.alphaClip) {
    discard;
  }

  var surface : SurfaceParams;
  surface.Normal = vec4f(normalize(input.vNormal), 1.0);
  surface.BaseColor = vec4f(baseColor.rgb * srgbToLinear(material.baseColor), baseColor.a);
  surface.Specular = srgbToLinear(material.specularColor);
  surface.Roughness = material.roughness;

  var color = vec3f(0.0, 0.0, 0.0);
  if (material.lightingEnabled == 1u) {
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
  color = mix(global.fogColor, color, input.vFogFactor);
  // return vec4f(input.vNormal.xyz, alpha);
  // return vec4f(input.Position.z, input.Position.z, input.Position.z, 1.0);
  return vec4f(color, alpha);
}


// sRGB → Linear
fn srgbToLinear(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.04045);
  return select( c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), c > cutoff );
}

// Linear → sRGB
fn linearToSrgb(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.0031308);
  return select( 12.92 * c, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c > cutoff );
}
`
