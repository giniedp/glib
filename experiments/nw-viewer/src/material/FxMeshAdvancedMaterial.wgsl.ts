import { COMMON_WGSL } from './common.wgsl'
export default /* wgsl */ `

struct MaterialBlock {
  diffuseColor            : vec4f,
  specularColor           : vec4f,
  emissiveColor           : vec4f,
  emittanceMapGamma       : f32,   // default 1.0

  indirectcolor            : vec4f, // default 0.25, 0.25, 0.25, 0.25
  emissivescaleintensity   : f32, // default 1.0
  sssindex                 : f32, // default 0

  animamplitudewav0        : f32, // default 0.0
  animamplitudewav2        : f32, // default 0.0
  animfrequency            : f32, // default 0.0
  animphase                : f32, // default 1.0

  dissolveFresnelFalloff   : f32, // default 1.0
  dissolveFresnelInvert    : f32, // default 0.0
  dissolvePercent          : f32, // default 0.0

  fresnelExponent          : f32, // default 1.0
  fresnelInvert            : f32, // default 1.0
  fresnelStrength          : f32, // default 1.0

  fxNormalStrength         : f32, // default 0.5
  fxNormalTileX            : f32, // default 1.0
  fxNormalTileY            : f32, // default 1.0

  paletteFalloff           : f32, // default 1.0
  palettePhase             : f32, // default 0.0
  paletteSdfInf            : f32, // default 0.0
  paletteSourceBlend       : f32, // default 0.0
  paletteSpeed             : f32, // default 1.0

  sdf2dPhaseX              : f32, // default 0.0
  sdf2dPhaseY              : f32, // default 0.0
  sdf2dSpeedX              : f32, // default 0.0
  sdf2dSpeedY              : f32, // default 0.0
  sdf2dStrength            : f32, // default 0.1
  sdf2dTileX               : f32, // default 1.0
  sdf2dTileY               : f32, // default 1.0

  sinewaveAmp              : f32, // default 0.1
  sinewaveAxis             : f32, // default 0
  sinewaveFreq             : f32, // default 1.0
  sinewaveNormal           : f32, // default 0
  sinewavePhase            : f32, // default 0.1
  sinewaveSpeed            : f32, // default 0.1

  source2dPhaseX           : f32, // default 0.0
  source2dPhaseY           : f32, // default 0.0
  source2dSpeedX           : f32, // default 0.0
  source2dSpeedY           : f32, // default 0.0
  source2dTileX            : f32, // default 1.0
  source2dTileY            : f32, // default 1.0

  stencilInvert             : f32, // default 0.0
  stencilNormalInfluence    : f32, // default 0.0
  stencilOffsetX            : f32, // default 0.0
  stencilOffsetY            : f32, // default 0.0

  subSurfaceClarity         : f32, // default 1.0
  subSurfaceColor           : vec4f, // default 0.5, 0.7, 1.0, 1.0
  subSurfaceDetailBlend     : f32, // default 0.0
  subSurfaceDetailPow       : f32, // default 1.0
  subSurfaceDirX            : f32, // default 0.0
  subSurfaceDirY            : f32, // default 0.0
  subSurfaceDirZ            : f32, // default 0.0
  subSurfaceFalloff         : f32, // default 2.0
  subSurfaceParallax        : f32, // default -
  subSurfaceThreshold       : f32, // default 2.0
  subSurfaceTile            : f32, // default 1.0


  // EMITTANCE_MAP
  // SPECULAR_MAP
  // VERTCOLORS
  // VERT_DEFORM_SINWAVE
  // NORMAL_MAP
  // ENABLE_FADEOUT
  // FX_SS_CUSTOM_DIR
  // GLOW_FRESNEL
  // FX_ADVANCED_SS
  // SIGNED_DISTANCE_FIELD_2D
  // SUBSURFACE_SCATTERING
  // USE_ADVANCED_DISSOLVE
  // USE_FRESNEL_DISSOLVE_MASK
  // USE_FX_NORMAL_PARAMS
  // USE_PALETTE_MAP
  // USE_STENCIL_DISSOLVE_MASK

  // -- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  // uvModCustom                 : mat4x4f,
  // uvModDetail                 : mat4x4f,
  uvModEmittance                 : mat4x4f,
  uvModDecalEmissive             : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
  // enabledUvModCustom          : u32,     // _ModifyBlendLayerUV
  // enabledUvModDetail          : u32,     // _ModifyDetailUV
  enabledUvModEmittance          : u32,     // _ModifyEmittanceUV
  enabledUvModDecalEmissive      : u32,     // _ModifyEmissiveMultiplierUV

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,
}

@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
@group(0) @binding(3) var<uniform>       lights  : LightBlock;
@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock, 1>; // per instance data
@group(2) @binding(0) var<uniform>       material: MaterialBlock;

@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;

// @block view
@group(1) @binding(4) var sceneDepthMap      : texture_2d<f32>;

// -- Texture bindings
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
@group(3) @binding(10) var normalMap2        : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
@group(3) @binding(14) var occlusionMap      : texture_2d<f32>; // $Occlusion    (OcclusionMap)
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2    (SpecularMap2)

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) tangent  : vec4f,
  @location(3) texture  : vec2f,
  @location(4) color    : vec4f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) worldPos      : vec3f,
  @location(1) uvBase        : vec4f,
  @location(2) uvEmittance   : vec4f,
  @location(3) uvScreen      : vec4f,
  @location(4) worldTangent  : vec4f,
  @location(5) worldNormal   : vec3f,
  @location(6) worldBitangent: vec3f,
  @location(7) vertexColor   : vec4f,
  @location(8) toEye         : vec3f,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {

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

  if (VERT_DEFORM_SINWAVE) {
    vPos = fxSinWave(
      input.position.xyz,
      material.sinewaveAmp,
      material.sinewaveFreq,
      material.sinewaveSpeed,
      material.sinewavePhase,
      material.sinewaveAxis,
      select(vec3f(0.0), input.normal.xyz, material.sinewaveNormal == 1.0)
    );
  }

  // --- Common
  let modelMatrix = object[input.id].modelMatrix;
  let worldPos    = modelMatrix * vec4f(vPos, 1.0);
  let viewPos     = view.viewMatrix * worldPos;
  var clipPos     = view.projectionMatrix * viewPos;
  let toEye       = normalize(view.cameraPosition - worldPos.xyz);
  let view        = -toEye;

  // --- UV
  var uvBase = vec4f(input.texture, 0.0, 1.0);
  var uvBaseMod = uvBase;
  if (material.enabledUvModDiffuse != 0u) {
    uvBaseMod = uvBase * material.uvModDiffuse;
  }
  // --- UV MOD EMITTANCE/EMISSIVE --
  var uvEmittance = vec4f(0.0);
  if (EMITTANCE_MAP) {
    var uv1 = uvBase;
    var uv2 = uvBase;
    if (material.enabledUvModEmittance != 0u) {
      uv1 = uv1 * material.uvModEmittance;
    }
    if (material.enabledUvModDecalEmissive != 0u) {
      uv2 = uv2 * material.uvModDecalEmissive;
    }
    uvEmittance = vec4f(uv1.xy, uv2.xy);
  }


  // --- TBN
  let rotScaleMat = mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  );
  let normalMat = inverseScaleMatrix(rotScaleMat);
  let vNormal   = input.normal.xyz;
  let vTangent  = input.tangent.xyz;
  // let vBitangent = cross(vNormal, vTangent) * input.tangent.w;

  let handedness = input.tangent.w;
  let tangent    = normalize(rotScaleMat  * vTangent);
  let normal     = normalize(normalMat    * vNormal);
  let bitangent  = cross(normal, tangent) * handedness;

  // --- Fog
  // #if %_RT_FOG && !%_RT_DECAL_TEXGEN_2D

  // --- Ambient TODO:
  // #if %_RT_FOG || %_RT_DECAL_TEXGEN_2D || %DECAL
  //   // Output ambient color - for alpha blending, recursive rendering passes, decals also require ambient.w (opacity parameter)
  //   OUT.Ambient = GetInstance_AmbientOpacity(vertPassPos);
  // #endif

  var output: FragmentInput;
  output.position       = clipPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = vec4f(tangent, handedness);
  output.worldBitangent = bitangent;
  output.vertexColor    = input.color;
  output.toEye          = toEye;
  output.uvBase         = uvBaseMod;
  output.uvEmittance    = uvEmittance;
  output.uvScreen       = clipPosToSceenUv(clipPos);

  // --- Dissolve
  // #if %USE_ADVANCED_DISSOLVE && %USE_STENCIL_DISSOLVE_MASK
  //   // screen position
  //   OUT.screenPos = HPosToScreenTC(v2FG.HPosition);

  //     // object position ws to screen space position
  //   float4 inst = float4(vertPassPos.InstMatrix[0].w, vertPassPos.InstMatrix[1].w, vertPassPos.InstMatrix[2].w, 1.0f);
  //   inst.xyz += PerView_WorldViewPos.xyz;
  //   OUT.objScreenPos = HPosToScreenTC(mul(PerView_ViewProjMatr, inst));
  // #endif

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let time = frame.elapsedTime / 1000.0;

  let toEye = normalize(input.toEye);
  let tbn = mat3x3f(
    normalize(input.worldTangent.xyz),
    normalize(input.worldBitangent.xyz),
    normalize(input.worldNormal.xyz),
  );
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;
  let viewVec = -toEye;

  // --- UV
  var uvBase              = input.uvBase;
  var uvBlendMap          = input.uvBase.xy; // input.uvBlend.xy * material.blendMaskTiling;
  var uvBlendLayer        = input.uvBase.xy; // input.uvBlend.zw * material.blendLayer2Tiling;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvBase.xy; // input.uvDetail.xy;

  // --- SDF / Source 2D
  var sdf2d = 0.0;
  if (EMITTANCE_MAP) {
    if (SIGNED_DISTANCE_FIELD_2D) {
      var uvSdf  = uvEmittance.xy;
          uvSdf *= vec2f(material.sdf2dTileX, material.sdf2dTileY);
          uvSdf += vec2f(
            material.sdf2dSpeedX * time + material.sdf2dPhaseX,
            material.sdf2dSpeedY * time + material.sdf2dPhaseY,
          );
      sdf2d = textureSample(heightMap, samplerLinear, uvSdf).r;

      uvEmittance *= vec2f(material.source2dTileX, material.source2dTileY);
      uvEmittance += vec2f(sdf2d);
      uvEmittance += vec2f(
        material.source2dSpeedX * time + material.source2dPhaseX,
        material.source2dSpeedY * time + material.source2dPhaseY,
      );
    }
  }

  // #if %_RT_FOG ||%_RT_DECAL_TEXGEN_2D || %DECAL
  //   pPass.IN.Ambient = IN.Ambient;
  // #else
  //   pPass.IN.Ambient = 1.0;
  // #endif

  // pPass.IN.screenProj = IN.screenProj;
  // pPass.IN.vView = IN.vView;
  // pPass.IN.Color = IN.Color;

  // #if %_RT_DECAL_TEXGEN_2D
  //   pPass.IN.DistAtten = IN.DistAtten;
  // #elif %_RT_FOG
  //   pPass.IN.AvgFogVolumeContrib = IN.AvgFogVolumeContrib;
  // #endif

  // === frag_shared_output
  // let microDetailBaseTC = pPass.IN.baseTC.xy;
  // const float dispAmount = pPass.fBumpHeightScale;

  // --- Blend layer -- factor
  var blendFac = 0.0;
  // if (BLENDLAYER) {
  //   let blendMapColor  = textureSample(opacityMap, samplerLinear, uvBlendMap.xy).r;
  //   blendFac = input.vertexColor.a * blendMapColor * (1 + material.blendFactor);
  //   blendFac = saturate(pow(abs(blendFac), material.blendFalloff));
  // }

  // ---

  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);

  // TODO: port POM
  cDiffuseMap = textureSample(diffuseMap, samplerLinear, uvBase.xy);
  cBumpMap = decodeNormal(textureSample(normalMap, samplerLinear, uvBump.xy).xy);

  if (BLENDLAYER) {
    let cBumpMap2 = decodeNormal(textureSample(normalMap2, samplerLinear, uvBlendLayer.xy).xy);
    cBumpMap = mix(cBumpMap, cBumpMap2, blendFac);
  }

  // --- Detail map (never enabled)
  var cDetailMap = vec4f(0.0);
  // if (material.enabledDetailMapping != 0u) {
  //   // detail tiling not applied in original
  //   // .ga = normal.xy, .rb = diffuse/gloss
  //   cDetailMap = textureSample(detailMap, samplerLinear, uvDetail).garb * vec4f(2.0) - vec4f(1.0);
  //   cDetailMap = cDetailMap * vec4f(
  //     material.detailBumpScale,
  //     material.detailBumpScale,
  //     material.detailDiffuseScale,
  //     material.detailGlossScale,
  //   );

  //   if (material.enabledDetailMapAlphaMasking != 0u) {
  //     cDetailMap *= cDiffuseMap.a;
  //   }

  //   cBumpMap += vec3f(cDetailMap.xy, 0.0);
  // }




  var albedo   = cDiffuseMap.rgb;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  var normal   = normalize(tbn * normalize(cBumpMap));
  var specular = vec3f(0.0);
  var gloss    = material.specularColor.a;
  // let fNdotE   = (dot(pPass.vView.xyz, pPass.vNormal.xyz));
  // let vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;

  // #region frag_custom_begin(pPass);
  albedo *= material.diffuseColor.rgb;

  var cShadingBack = vec3f(0.0);
  // if (TRANSMITTANCE) {
  //   let cBackDiffuseMap = textureSample(opacityMap, samplerLinear, uvBase.xy).r;
  //   cShadingBack = material.backDiffuseMultiplier * cBackDiffuseMap * material.transmittanceColor.rgb;
  // }

  if (SPECULAR_MAP) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  specular *= material.specularColor.rgb;
  gloss    *= textureSample(smoothnessMap, samplerLinear, uvBase.xy).r;

  // TODO: for transparent, the normal is re-fetched with a bump tile scale
  // // Normal Map
  // const BumpMapTile = 2.0;
  // pPass.cBumpMap = GetNormalMap(normalMap, samplerLinear, uvBump.xy * BumpMapTile);
  // // Transparent
  // if(GetInstance_Opacity() < 1.0) {
  //   pPass.vNormal = normalize(mul(pPass.cBumpMap.xyz, pPass.mTangentToWS));
  // }


  if (VERTCOLORS) {
    alpha *= input.vertexColor.a;
  }
  // pPass.fAlpha = fAlpha * pPass.IN.Ambient.w;


  // --- Detail mapping
  // if (DETAIL_MAPPING) {
  //   albedo += albedo * cDetailMap.z;
  //   gloss  += gloss * cDetailMap.w;
  // }


  // --- Environment mapping
  // if (ENVIRONMENT_MAP) {
  //   if (pPass.nReflectionMapping > 0) {
  //     if (pPass.nReflectionMapping == REFLECT_CUBE) {
  //       pPass.cEnvironment = GetEnvironmentCMap(envMapCUBE, envMapCUBESampler, pPass.vReflVec.xyz, pPass.fGloss).xyz;
  //     } else if (pPass.nReflectionMapping == REFLECT_SPHERE) {
  //       // should be transformed to view space - but adds quite a lot instructions
  //       pPass.cEnvironment = GetEnvironment2DMap(envMap, envMapSampler, pPass.vReflVec.xy);
  //     }
  //   }
  // }



  // --- Ambient occlusion ------------------------------------
  var ao = 1.0;
  // if (material.enabledOcclusionMap != 0u) {
  //   ao = textureSample(occlusionMap, samplerLinear, uvBase.xy).r;
  // }

  var surface: SurfaceParams;
  // surface.Transmittance = vec4f(cShadingBack.rgb, material.normalViewDependency);
  surface.BaseColor = vec4f(albedo, alpha);
  surface.Specular  = specular;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);
  surface.Metallic  = 0.0;
  surface.Ior       = 0.0;

  var color = accumulateLight(lights, global, surface, toEye, input.worldPos);

  // --- Ambient / Environment
  // TODO:
  // --- frag_final_composition
  // TODO:

  // --- Emittance (frag_custom_end()
  var emittance = vec3f(0.0);
  let emissiveLum = getLuminance(material.emissiveColor.xyz);
  if (emissiveLum > 0.0) {
    if (EMITTANCE_MAP) {
      let sample = textureSample(emittanceMap, samplerLinear, uvEmittance.xy);
      emittance  = sample.rgb;
      emittance *= sample.a; // DEPRECATED
    }

    if (GLOW_FRESNEL) {
      let fresnelApprox = fxFresnelApprox(
        toEye.xyz,
        normal.xyz,
        material.fresnelInvert,
        material.fresnelExponent,
        material.fresnelStrength
      );
      emittance += vec3f(fresnelApprox);
    }

    emittance *= getMaterialEmittance();
  }

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
      out.color = vec4f(emittance.rgb, 1.0);
    }
    case DEBUG_MTL_AO: {

    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(alpha), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      out.color = vec4f(vec3f(sdf2d), 1.0);
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
      out.color = vec4f(normal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_POSITION_WS: {
      out.color = vec4f(fract(input.worldPos.xyz), 1.0);
    }
    case DEBUG_GV_DEPTH: {
      out.color = vec4f(vec3f(fract(out.depth)), 1.0);
    }
    // #endregion

    // #region Vertex attributes
    case DEBUG_V_COLOR0: {
      out.color = vec4f(input.vertexColor.xyz, 1.0);
    }
    case DEBUG_V_COLOR1: {
      //
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(fract(uvEmittance.xy), 0.0, 1.0);
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

fn getMaterialEmittance() -> vec3f {
  return material.emissiveColor.rgb * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE;
}

fn inverseScaleMatrix(worldMat: mat3x3f) -> mat3x3f {
  let twMat = transpose(worldMat);

  let scaleVec = vec3f(
    1.0 / dot(twMat[0], twMat[0]),
    1.0 / dot(twMat[1], twMat[1]),
    1.0 / dot(twMat[2], twMat[2])
  );

  let row0 = twMat[0] * scaleVec.x;
  let row1 = twMat[1] * scaleVec.y;
  let row2 = twMat[2] * scaleVec.z;

  return transpose(mat3x3f(row0, row1, row2));
}

fn fxSinWave( pos: vec3f, amp: f32, freq: f32, speed: f32, phase: f32, axis: f32, normal: vec3f ) -> vec3f {
  var newPos = vec3f(0.0, 0.0, 0.0);

  let sinWave = amp * sin(pos * freq + phase + (frame.elapsedTime / 1000.0 * speed));

  if axis >= 0.0 && axis < 1.0 {
    newPos.x = sinWave.x * normal.x;
  }
  if axis >= 1.0 && axis < 2.0 {
    newPos.y = sinWave.y * normal.y;
  }
  if axis >= 2.0 && axis < 3.0 {
    newPos.z = sinWave.z * normal.z;
  }
  if axis == 3.0               {
    newPos = vec3f(sinWave.x, sinWave.y, sinWave.z) * normal;
  }

  return pos + newPos;
}

fn fxFresnelApprox(view: vec3f, normal: vec3f, invert: f32, exponent: f32, power: f32) -> f32 {
  let approx = pow(saturate(dot(normalize(view), normalize(normal))), exponent) * power;
  let s = step(1.0 - 1e-7, invert);
  let a = saturate(approx);
  let b = 1.0 - saturate(approx);
  let c = a * (1.0 - s) + b * step(1.0, s);
  return c;
}
${COMMON_WGSL}
`
