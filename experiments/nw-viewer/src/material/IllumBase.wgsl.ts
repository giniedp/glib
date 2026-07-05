import { COMMON_WGSL } from './common.wgsl'

export const ILLUM_SHADER_BASE = /* wgsl */ `


struct MaterialBlock {
  // --- Base material color slots (c0–c2) ------------------
  diffuseColor     : vec4f,   // PerMaterial_DiffuseColor  .xyz=tint .w=opacity
  specularColor    : vec4f,   // PerMaterial_SpecularColor .xyz=F0   .w=smoothness scalar
  emissiveColor    : vec4f,   // PerMaterial_EmissiveColor .xyz=energy (non-zero gates emittance)
  detailTiling     : vec2f,   // PerMaterial_DetailTiling  .xy


  backDiffuseMultiplier: f32,   // default 1.0

  blendFactor          : f32,   // default 8.0  - sharpness exponent
  blendFalloff         : f32,   // default 32.0 - linear scale after power
  blendLayer2Diffuse   : vec4f, // default {1, 1, 1, 1}
  blendLayer2Smoothness: f32,   // default 10.0 (divided by 256 at use)
  blendLayer2Specular  : vec4f, // default {0.23, 0.23, 0.23, 0}
  blendLayer2Tiling    : f32,   // default 1.0
  blendMaskTiling      : f32,   // default 1.0

  colorMaskStrength    : f32, // default 0.0
  colorMaskOverride    : f32, // default 0.0
  colorMaskAlphaInf    : f32, // default 0.0

  decalFalloff         : f32,   // default 1.0
  decalAlphaMult       : f32,   // default 1.0
  decalDiffuseOpacity  : f32,   // default 1.0

  depthFixupThreshold  : f32,   // default 0.05

  detailBumpScale      : f32,   // default 0.5
  detailDiffuseScale   : f32,   // default 0.5
  detailGlossScale     : f32,   // default 0.5

  dissolveColor        : vec4f, // default {1, 1, 1, 1}
  dissolveEdgeThickness: f32,   // default 0.0
  dissolvePercentage   : f32,   // default 0.0

  emittanceMapGamma    : f32,   // default 1.0

  // fresnelBias                | number
  // fresnelPower               | number
  // fresnelScale               | number

  // glossFromDiffuseAmount     | number
  // glossFromDiffuseBrightness | number
  // glossFromDiffuseContrast   | number
  // glossFromDiffuseOffset     | number

  heightBias           : f32,   // default 1.0
  indirectColor        : vec3f, // default 0.25, 0.25, 0.25, 0.25
  transmittanceColor   : vec4f, // default {1, 1, 0.6, 1}

  maskR                : f32,   // default 0.0
  maskRColor           : vec3f, // default 0.0,0.0,0.0
  maskROverride        : f32,   // default 0.0

  maskG                : f32,   // default 0.0
  maskGColor           : vec3f, // default 0.0,0.0,0.0
  maskGOverride        : f32,   // default 0.0

  maskB                : f32,   // default 0.0
  maskBColor           : vec3f, // default 0.0,0.0,0.0
  maskBOverride        : f32,   // default 0.0

  maskA                 : f32,  // default 0.0
  maskAGloss            : f32,  // default 0.0
  maskAGlossShift       : f32,  // default 0.5
  maskASpecColor        : vec3f,// default 0.0,0.0,0.0
  maskASpecColorOverride: f32,  // default 0.0

  normalViewDependency : f32,   // default 0.0 surface thickness
  obmDisplacement      : f32,   // default 0.004
  pomDisplacement      : f32,   // default 0.025

  // rim_Blend_Center_Alpha     | number
  // rim_Blend_Center_Color     | vec4
  // rim_Blend_Color_Blend      | number
  // rim_Blend_Fill_Alpha       | number
  // rim_Blend_Fill_Color       | vec4
  // rim_Blend_Fill_Width       | number
  // rim_Blend_Major_Alpha      | number
  // rim_Blend_Major_Color      | vec4
  // rim_Blend_Major_Width      | number
  // rim_Blend_Smoothness       | number
  // rim_Center_Color           | vec4
  // rim_Center_Intensity       | number
  // rim_Color_Blend            | number

  rimMajorColor        : vec4f, // default 1.0, 1.0, 1.0, 1.0
  rimMajorIntensity    : f32,   // default 1.0
  rimMajorWidth        : f32,   // default 1.0
  rimFillIntensity     : f32,   // default 0.4
  rimFillWidth         : f32,   // default 1.0
  rimFillColor         : vec4f, // default 1.0, 1.0, 1.0, 1.0
  rimSmoothness        : f32,   // default 1.0

  roughnessBoost       : f32,   // default 2.0
  roughnessMaxFootprint: f32,   // default 0.3
  selfShadowStrength   : f32,   // default 3.0
  sssIndex             : f32,   // default 0
  sssSpecularCutoff    : f32,   // default 1.0

  // tessellationDispBias       | number
  // tessellationFaceCull       | number
  // tessellationFactor         | number
  // tessellationFactorMax      | number
  // tessellationFactorMin      | number
  // tessellationHeightScale    | number

  alphaTestRef         : f32,

  // --- Feature flags - 0=disabled, 1=enabled -------------
  enabledAlphaBlend              : u32,
  enabledAlphaTest               : u32,

  // --- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  uvModCustom                    : mat4x4f,
  uvModDetail                    : mat4x4f,
  uvModEmittance                 : mat4x4f,
  uvModDecalEmissive             : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
  enabledUvModCustom             : u32,     // _ModifyBlendLayerUV
  enabledUvModDetail             : u32,     // _ModifyDetailUV
  enabledUvModEmittance          : u32,     // _ModifyEmittanceUV
  enabledUvModDecalEmissive      : u32,     // _ModifyEmissiveMultiplierUV

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,
};

@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
@group(0) @binding(3) var<uniform>       lights  : LightBlock;
@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock, 1>; // per instance data
@group(2) @binding(0) var<uniform>       material: MaterialBlock;

@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;

// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
@group(3) @binding(5) var translucencyMap    : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
@group(3) @binding(8) var subsurfaceMap      : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
@group(3) @binding(14) var occlusionMap      : texture_2d<f32>; // $Occlusion    (OcclusionMap)
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2    (SpecularMap2)


struct VertexInputNoColor {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
  @location(2) texture : vec2f,
  @location(3) normal  : vec3f,
  @location(4) tangent : vec4f, // .w = handedness
};

struct VertexInputColor {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
  @location(1) color   : vec4f,
  @location(2) texture : vec2f,
  @location(3) normal  : vec3f,
  @location(4) tangent : vec4f, // .w = handedness
};

struct VertexInput {
  id      : u32,
  position: vec3f,
  color   : vec4f,
  texture : vec2f,
  normal  : vec3f,
  tangent : vec4f, // .w = handedness
};

struct FragmentInput {
  @builtin(position) position      : vec4f,
  @location(0)       worldPos      : vec3f,
  @location(1)       uvBase        : vec4f, // .xy=animated uv, .zw=original uv
  @location(2)       uvBlend       : vec4f,
  @location(3)       uvEmittance   : vec4f,
  @location(4)       uvDetail      : vec4f,
  @location(5)       worldTangent  : vec3f,
  @location(6)       worldBitangent: vec3f,
  @location(7)       worldNormal   : vec3f,
  @location(8)       vertexColor   : vec4f,
  @location(9)       viewVec       : vec3f,  // un-normalized; normalize in PS
  @location(10)      ambient       : vec4f,
};

fn illumVS(input : VertexInput) -> FragmentInput {

  let modelMatrix = object[input.id].modelMatrix;

  var vPos = input.position.xyz;
  if (material.deformWave1.w > 0) {
    var vmod: VertexMod;
    vmod.deformWave0 = material.deformWave0;
    vmod.deformWave1 = material.deformWave1;
    vmod.position = vPos;
    vmod.normal   = input.normal.xyz;
    vmod.color    = input.color.rgb;
    vmod.texture  = input.texture.xy;
    vmod.time     = frame.elapsedTime / 1000.0;
    vmod.typ      = u32(material.deformWave1.w);
    vPos = vertexModify(vmod);
  }

  let worldPos = modelMatrix * vec4f(vPos, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = normalize(view.cameraPosition - worldPos.xyz);

  // --- TBN
  let normal    = normalize((modelMatrix * vec4f(input.normal,          0.0)).xyz);
  let tangent   = normalize((modelMatrix * vec4f(input.tangent.xyz,     0.0)).xyz);
  let bitangent = cross(normal, tangent) * input.tangent.w;

  var output: FragmentInput;
  output.position       = clipPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = tangent;
  output.worldBitangent = bitangent;
  output.viewVec        = toEye;
  output.vertexColor    = input.color;

  let uvBase = vec4f(input.texture.xy, 0.0, 1.0);

  // --- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    output.uvBase = material.uvModDiffuse * uvBase;
  } else {
    output.uvBase = uvBase;
  }

  // --- UV MOD BLEND --
  if (BLENDLAYER) {
    var uv1 = uvBase; // The blend map uses unmodified texture coordinates from either uv set 1 or uv set 2
    var uv2 = uvBase; // The 2nd diffuse map, 2nd height map, etc. use a modified texture coordinate
    if (material.enabledUvModCustom == TRUE) {
      uv2 = material.uvModCustom * uv2;
    }
    output.uvBlend = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD EMITTANCE/EMISSIVE --
  if (EMITTANCE_MAP) {
    // Both the emissive map and the emissive intensity map (from the decal overlay texture) use the same uv set
    // The emissive map and emissive intensity map each have their own independent modifier
    var uv1 = uvBase;
    var uv2 = uvBase;
    if (material.enabledUvModEmittance == TRUE) {
      uv1 = material.uvModEmittance * uv1;
    }
    if (material.enabledUvModDecalEmissive == TRUE) {
      uv2 = material.uvModDecalEmissive * uv2;
    }
    output.uvEmittance = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD DETAIL --
  if (DETAIL_MAPPING) {
    output.uvDetail = material.uvModDetail * uvBase;
  }

  return output;
}

fn illumFS(input: FragmentInput) -> FragmentOutput {

  let toEye = normalize(input.viewVec);
  let tbn = mat3x3f(
    normalize(input.worldTangent),
    normalize(input.worldBitangent),
    normalize(input.worldNormal),
  );
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;

  var uvBase              = input.uvBase;
  var uvBlendMap          = input.uvBlend.xy * material.blendMaskTiling;
  var uvBlendLayer        = input.uvBlend.zw * material.blendLayer2Tiling;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  // TODO: SIGNED_DISTANCE_FIELD_2D

  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvDetail.xy;


  // #if %_RT_FOG ||%_RT_DECAL_TEXGEN_2D || %DECAL
  //   pPass.IN.Ambient = IN.Ambient;
  // #else
  //   pPass.IN.Ambient = 1.0;
  // #endif

  // pPass.IN.vTangent = IN.vTangent;
  // pPass.IN.vBinormal = IN.vBinormal;
  // pPass.IN.vNormal.xyz = (cross(IN.vTangent.xyz, IN.vBinormal.xyz)) * IN.vTangent.w;
  // pPass.IN.screenProj = IN.screenProj;
  // pPass.IN.vView = IN.vView;

  // #if %VERTCOLORS || %BLENDLAYER
  //   pPass.IN.Color = IN.Color;
  // #endif

  // #if %_RT_DECAL_TEXGEN_2D
  //     pPass.IN.DistAtten = IN.DistAtten;
  // #elif %_RT_FOG
  //     pPass.IN.AvgFogVolumeContrib = IN.AvgFogVolumeContrib;
  // #endif

  var nMicroDetailQuality = MICRO_DETAIL_QUALITY_DEF;
  var fBumpHeightScale = 0.0;
  var fHeightBias = material.heightBias;
  var fSelfShadowStrength = material.selfShadowStrength;

  if (PARALLAX_OCCLUSION_MAPPING) {
    nMicroDetailQuality = MICRO_DETAIL_QUALITY_POM;
    fBumpHeightScale = material.pomDisplacement;
  } else if (OFFSET_BUMP_MAPPING) {
    nMicroDetailQuality = MICRO_DETAIL_QUALITY_OBM;
    fBumpHeightScale = material.obmDisplacement;
  }

  // #if %VERTCOLORS
  //     pPass.bVertexColors = true;
  // #endif


  // #if %DETAIL_MAPPING
  //   pPass.bDetailBumpMapping = true;
  //   pPass.vDetailBumpTiling = float2(PerMaterial_DetailTiling.xy);
  //   pPass.fDetailBumpScale = DetailBumpScale;
  //   pPass.vDetailBlendAmount = float2(DetailDiffuseScale, DetailGlossScale);

  //   #if %ALPHAMASK_DETAILMAP
  //     pPass.bDetailBumpMappingMasking = true;
  //   #endif
  // #endif

  // --- Blend layer -- factor
  var blendFac = 0.0;
  if (BLENDLAYER) {
    let blendMapColor  = textureSample(opacityMap, samplerLinear, uvBlendMap.xy).r;
    blendFac = input.vertexColor.a * blendMapColor * (1 + material.blendFactor);
    blendFac = saturate(pow(abs(blendFac), material.blendFalloff));
  }
  // ---

  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);

  switch (nMicroDetailQuality) {
    case MICRO_DETAIL_QUALITY_OBM: {
      //     uv = ApplyOBM(uv, viewTS);

      // const float3 viewDir = mul(pPass.mTangentToWS, pPass.vView);
      // #if %BLENDLAYER
      //     const float4 newCoords = OffsetMap(microDetailBaseTC, pPass.IN.blendLayerTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
      //     pPass.IN.blendLayerTC = newCoords.zw;
      // #else
      //     const float4 newCoords = OffsetMap(microDetailBaseTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
      // #endif
      // pPass.IN.baseTC.xy = newCoords.xy;
      // pPass.IN.bumpTC.xy = newCoords.xy;
    }
    // case MICRO_DETAIL_QUALITY_POM: {
    //     uv = ApplyPOM(uv, viewTS);
    // TODO:
    // }
    default: {
      cDiffuseMap = textureSample(diffuseMap, samplerLinear, uvBase.xy);
      cBumpMap = decodeNormal(textureSample(normalMap, samplerLinear, uvBase.xy).xy);

      if (BLENDLAYER) {
        let cBumpMap2 = decodeNormal(textureSample(normalMap2, samplerLinear, uvBlendLayer.xy).xy);
        cBumpMap = mix(cBumpMap, cBumpMap2, blendFac);
      }
    }
  }

  // --- Detail Mapping --
  var cDetailMap = vec4f(0.0);
  if (DETAIL_MAPPING) {
    // detail tiling not applied in original
    // .ga = normal.xy, .rb = diffuse/gloss
    cDetailMap = textureSample(detailMap, samplerLinear, uvDetail).garb * vec4f(2.0) - vec4f(1.0);
    cDetailMap = cDetailMap * vec4f(
      material.detailBumpScale,
      material.detailBumpScale,
      material.detailDiffuseScale,
      material.detailGlossScale,
    );

    if (ALPHAMASK_DETAILMAP) {
      cDetailMap *= cDiffuseMap.a;
    }

    cBumpMap += vec3f(cDetailMap.xy, 0.0);
  }

  // pPass.fNdotE   = (dot(pPass.vView.xyz, pPass.vNormal.xyz));
  // pPass.vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;
  cDiffuseMap *= material.diffuseColor;

  var albedo   = cDiffuseMap.rgb;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  var normal   = normalize(tbn * normalize(cBumpMap));
  var specular = vec3f(0.0);
  var gloss    = material.specularColor.a;

  // #if %RIM_DIFFUSE_LIGHTING || %RIM_SPEC_LIGHTING || %_RT_CLUSTER_FORWARD
  //     pPass.cBumpMap = GetNormalMap(normalMap, normalMapSampler, pPass.IN.bumpTC.xy);                                // 2 alu
  //     pPass.mTangentToWS = half3x3(pPass.IN.vTangent.xyz, pPass.IN.vBinormal.xyz, pPass.IN.vNormal.xyz);
  //     pPass.vNormal = mul(pPass.cBumpMap.xyz, pPass.mTangentToWS);                                  // 3 alu
  // #endif

  var cShadingBack = vec3f(0.0);
  if (TRANSMITTANCE) {
    let cBackDiffuseMap = textureSample(opacityMap, samplerLinear, uvBase.xy).r;
    cShadingBack = material.backDiffuseMultiplier * cBackDiffuseMap * material.transmittanceColor.rgb;
  }

  if (SPECULAR_MAP) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  specular *= material.specularColor.rgb;
  gloss    *= textureSample(smoothnessMap, samplerLinear, uvBase.xy).a;

  if (VERTCOLORS) {
    alpha *= input.vertexColor.a;
  }

  if (DECAL) {
    alpha *= textureSample(opacityMap, samplerLinear, uvBase.zw).r;
    alpha = saturate(pow(alpha * material.decalAlphaMult, material.decalFalloff));
    // only in z prepass??
    // material.decalDiffuseOpacity;
  }
  // alpha = alpha * pPass.IN.Ambient.w;

  // --- Blend layer ------------------------------------------
  if (BLENDLAYER) {
    var diffuseMap2   = textureSample(diffuseMap2,         samplerLinear, uvBlendLayer.xy);
    var specularMap2  = textureSample(specularMap2,   samplerLinear, uvBlendLayer.xy);
    var glossLayer2   = textureSample(translucencyMap,      samplerLinear, uvBlendLayer).a;

    // Diffuse blend layer calculation
    diffuseMap2      *= vec4f(material.blendLayer2Diffuse.rgb, 1.0);
    albedo            = mix(albedo, diffuseMap2.rgb, blendFac);

    // Specular blend layer calculation
    specularMap2     *= vec4f(material.blendLayer2Specular.rgb, 1.0);
    specular          = mix(specular, specularMap2.rgb, blendFac);

    // Gloss blend layer calculation
    glossLayer2      *= (material.blendLayer2Smoothness / 256.0);
    gloss             = mix(gloss, glossLayer2, blendFac);
  }

  // --- Overlay mask -----------------------------------------
  if (OVERLAY_MASK) {
    // Map defining the color/intensity of each texel
    let mask = textureSample(diffuseMap2, samplerLinear, uvBase.xy);

    // Diffuse Masking Colors ( use either [the mask color]  or [a blend between the material and the mask color] )
     let luminance = getLuminance(albedo);

    // For using override, we found the final diffuse albedo to be much too bright - artifically darkening, hence the Mask_R_Color*Mask_R_Color
    let releveledMaskRColor = material.maskRColor * material.maskRColor;
    let releveledMaskGColor = material.maskGColor * material.maskGColor;
    let releveledMaskBColor = material.maskBColor * material.maskBColor;
    let maskColorR = mix(getOverlayBlend(vec3f(luminance), material.maskRColor), releveledMaskRColor, material.maskROverride);
    let maskColorG = mix(getOverlayBlend(vec3f(luminance), material.maskGColor), releveledMaskGColor, material.maskGOverride);
    let maskColorB = mix(getOverlayBlend(vec3f(luminance), material.maskBColor), releveledMaskBColor, material.maskBOverride);

    // Apply the mask colors where its allowed (using each channel of the MaskMap and the Mask activation value)
    albedo = mix(albedo, maskColorR, mask.r * material.maskR);
    albedo = mix(albedo, maskColorG, mask.g * material.maskG);
    albedo = mix(albedo, maskColorB, mask.b * material.maskB);

    // Gloss Masking - modify material gloss based Mask_A_GlossShift, then Mask_A_Gloss determines how far we shift towards the modified gloss value
    // 0.5 is neutral: unmodified material gloss
    // 0: pull gloss to zero
    // 1: full gloss
    var glossMod = gloss;
    glossMod     = mix(0, glossMod, saturate(material.maskAGlossShift / 0.5));
    glossMod     = mix(glossMod, 1.0, saturate((material.maskAGlossShift - 0.5)/ 0.5));
    gloss        = mix(gloss, glossMod, mask.a * material.maskA);

    // Specular Masking
    specular = mix(specular, material.maskASpecColor.rgb, mask.a * material.maskASpecColorOverride);
  } else if (COLOR_SAMPLER_OVERLAY_MASK) {
    // Map defining the color/intensity of each texel
    let mask = textureSample(diffuseMap2, samplerLinear, uvBase.xy);

    // Diffuse Masking Colors ( use either [the mask color]  or [a blend between the material and the mask color] )
    let luminance = getLuminance(albedo);

    // Determine the final mask color based on override strength (diffuse texture detail preserving vs full color override)
    let maskColor = mix(getOverlayBlend(vec3f(luminance), mask.rgb), mask.rgb, material.colorMaskOverride);

    // Apply the mask color
    let blend = mix(1.0, mask.a, material.colorMaskAlphaInf);     // ColorMaskAlphaInfluence mutes the alpha channel when at zero
    albedo    = mix(albedo, maskColor, blend * material.colorMaskAlphaInf);   // ColorMaskStrength controls how strong the final effect is
  }

  // --- Alpha test (%_RT_ALPHATEST) --------------------------
  if (material.enabledAlphaTest == TRUE && alpha < material.alphaTestRef) {
    discard;
  }

  // --- Dissolve clip ----------------------------------------
  if (FX_DISSOLVE) {
    // Sample blend mask as dissolve noise. Edge-color fringe omitted for first draft.
    let noise = textureSampleLevel(opacityMap, samplerLinear, uvBase.xy, 0.0).r;
    if (noise < material.dissolvePercentage) {
      discard;
    }
  }



  // --- Detail mapping
  if (DETAIL_MAPPING) {
    albedo += albedo * cDetailMap.z;
    gloss  += gloss * cDetailMap.w;
  }


  // --- Environment mapping
  // #if %ENVIRONMENT_MAP
  //     if (pPass.nReflectionMapping > 0)
  //     {
  //         if (pPass.nReflectionMapping == REFLECT_CUBE)
  //         {
  //             pPass.cEnvironment = GetEnvironmentCMap(envMapCUBE, envMapCUBESampler, pPass.vReflVec.xyz, pPass.fGloss).xyz;
  //         }
  //         else
  //         if (pPass.nReflectionMapping == REFLECT_SPHERE)
  //         {
  //             // should be transformed to view space - but adds quite a lot instructions
  //             pPass.cEnvironment = GetEnvironment2DMap(envMap, envMapSampler, pPass.vReflVec.xy);
  //         }
  //     }
  // #endif





  // --- Ambient occlusion ------------------------------------
  var ao = 1.0;
  if (OCCLUSION_MAP) {
    ao = textureSample(occlusionMap, samplerLinear, uvBase.xy).r;
  }

  var surface: SurfaceParams;
  surface.Transmittance = vec4f(cShadingBack.rgb, material.normalViewDependency);
  surface.BaseColor = vec4f(albedo, alpha);
  surface.Specular  = specular;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);
  surface.Metallic  = 0.0;
  surface.Ior       = 0.0;

  var color = accumulateLight(lights, global, surface, toEye, input.worldPos);

  // --- Ambient / Environment --------------------------------
  // TODO:

  // --- Emittance --------------------------------------------
  var emittance = vec3f(0.0);
  let emissiveLum = getLuminance(material.emissiveColor.xyz);
  if (emissiveLum > 0.0) {

    var emitMapCol = vec4f(1.0);
    var emitMapInt = vec4f(0.5);
    if (EMITTANCE_MAP) {
      emitMapCol = textureSample(emittanceMap,     samplerLinear, uvEmittance.xy);
      emitMapInt = textureSample(decalEmissiveMap, samplerLinear, uvEmissiveIntensity.xy);
    }

    emittance = emitMapCol.rgb;
    emittance *= pow(max(getLuminance(emitMapCol.rgb), 1e-6), material.emittanceMapGamma - 1.0);
    emittance *= emitMapInt.rgb;
    emittance *= emitMapCol.a; // DEPRECATED
    emittance *= getMaterialEmittance();
  }

  // --- Rim lighting (added to emittance term) ---------------
  // if (material.enabledRimLighting == TRUE) {
  //   emittance += ComputeRimLighting(N, V);
  // }

  // --- Final composite --------------------------------------
  alpha = select(1.0, alpha, material.enabledAlphaBlend == TRUE);

  color = color + emittance;

  var out: FragmentOutput;
  out.color = applyFog(color, alpha, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(surface.BaseColor.rgb, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      out.color = vec4f(surface.Specular.rgb, 1.0);
    }
    case DEBUG_MTL_METALLIC: {
      out.color = vec4f(vec3f(surface.Metallic), 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      out.color = vec4f(vec3f(surface.Roughness), 1.0);
    }
    case DEBUG_MTL_IOR: {
      out.color = vec4f(vec3f(surface.Ior), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      out.color = vec4f(vec3f(emittance), 1.0);
    }
    case DEBUG_MTL_AO: {
      out.color = vec4f(vec3f(ao), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(alpha), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      out.color = vec4f(vec3f(gloss), 1.0);
    }
    case DEBUG_MTL_NOISE: {
      //
    }
    // #endregion


    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {
      out.color = vec4f(input.worldNormal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_TANGENT: {
      out.color = vec4f(input.worldTangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_BITANGENT: {
      out.color = vec4f(input.worldBitangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_SHADE_NORMAL: {
      out.color = vec4f(surface.Normal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_POSITION_WS: {
      out.color = vec4f(fract(input.worldPos.xyz), 1.0);
    }
    case DEBUG_GV_DEPTH: {
      out.color = vec4f(vec3f(fract(out.depth)), 1.0);
    }
    // #endregion

    // #region Debug Vertex attributes
    case DEBUG_V_COLOR0: {
      out.color = input.vertexColor;
    }
    case DEBUG_V_COLOR1: {
      out.color = vec4f(cDetailMap.rgb, 1.0);
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(fract(input.uvBase.zw), 0.0, 1.0);
    }
    case DEBUG_V_UV3: {
      out.color = vec4f(fract(uvEmittance.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV4: {
      out.color = vec4f(fract(uvEmissiveIntensity.xy), 0.0, 1.0);
    }

    case DEBUG_V_DEFORM: {
      if (material.deformWave1.w > 0) {
        out.color = vec4f(1.0, 0.0, 1.0, 1.0);
      }
    }
    // #endregion
    default: {

    }
  }
  return out;
}

// =============================================================
// Helpers - Specular AA (Kaplanyan 2016)
// =============================================================
fn ApplySAAFiltering(roughness: f32) -> f32 {
    // Variance-based roughness boost from normal map frequency content.
    // Approximated here as a constant boost; full version needs ddx/ddy of normals.
    let boosted = sqrt(roughness * roughness + material.roughnessBoost * 0.01);
    return clamp(boosted, roughness, material.roughnessMaxFootprint);
}

// Reoriented Normal Mapping blend (better than simple XY-add for large angles)
fn BlendNormalsRNM(base: vec3f, detail: vec3f) -> vec3f {
    let t = base   + vec3f(0.0, 0.0, 1.0);
    let u = detail * vec3f(-1.0, -1.0, 1.0);
    return normalize(t * dot(t, u) - u * t.z);
}

// Single-step offset bump mapping
fn ApplyOBM(uv: vec2f, viewTS: vec3f) -> vec2f {
    let h      = textureSampleLevel(heightMap, samplerLinear, uv, 0.0).r;
    let offset = (h - material.heightBias) * material.obmDisplacement;
    return uv + viewTS.xy * offset;
}

// Iterative POM: 16-step linear search + secant refinement
fn ApplyPOM(uv: vec2f, viewTS: vec3f) -> vec2f {
    let N         = 16;
    let stepDepth = 1.0 / f32(N);
    let uvStep    = (-viewTS.xy / max(abs(viewTS.z), EPSILON))
                  * material.pomDisplacement / f32(N);

    var curUV    = uv;
    var prevUV   = uv;
    var curDepth = 0.0;
    var prevH    = textureSampleLevel(heightMap, samplerLinear, uv, 0.0).r;
    var curH     = prevH;

    for (var i = 0; i < N; i++) {
        prevH    = curH;
        prevUV   = curUV;
        curUV   += uvStep;
        curDepth += stepDepth;
        curH = textureSampleLevel(heightMap, samplerLinear, curUV, 0.0).r;
        // CryFX: break when NB1 >= height (height = 1 - step*i, decreasing threshold).
        // Height map: 1=raised, 0=recessed. Intersection when h >= (1 - curDepth).
        if (curH >= 1.0 - curDepth) {
          break;
        }
    }

    // Secant refinement: solve for where (1 - depth) == h between the two bracketing samples.
    let prevDepth = curDepth - stepDepth;
    let e0 = (1.0 - prevDepth) - prevH;  // > 0: no intersection before this step
    let e1 = (1.0 - curDepth)  - curH;   // <= 0: intersection at or before this step
    let t  = e0 / max(e0 - e1, EPSILON);
    return mix(prevUV, curUV, t);
}


fn ComputeRimLighting(N: vec3f, V: vec3f) -> vec3f {
    let rim = 1.0 - saturate(dot(N, V));

    let major = material.rimMajorColor.rgb * material.rimMajorIntensity
              * pow(rim, max(material.rimMajorWidth, EPSILON));
    let fill  = material.rimFillColor.rgb * material.rimFillIntensity
              * pow(rim, max(material.rimFillWidth, EPSILON));

    return (major + fill) * material.rimSmoothness;
}

fn getMaterialEmittance() -> vec3f {
  return material.emissiveColor.rgb * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE;
}
${COMMON_WGSL}
`
