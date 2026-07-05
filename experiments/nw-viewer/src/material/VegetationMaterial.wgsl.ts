import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `
${COMMON_WGSL}

struct MaterialBlock {
  diffuseColor  : vec4f,
  specularColor : vec4f,
  emissiveColor : vec4f,

  transmittanceColor    : vec4f, // default {1, 1, 0.6, 1}

  capOpacityFalloff     : f32, // default 1.0
  normalViewDependency  : f32, // default 0.5
  backDiffuseMultiplier : f32, // default 1.0
  blendTerrainCol       : f32, // default 0.0

  blendTerrainColDist   : f32, // default 0.5
  detailBumpScale       : f32, // default 0.5
  detailDiffuseScale    : f32, // default 0.5
  detailGlossScale      : f32, // default 0.5

  blendMaskTiling       : f32, // default 1.0
  emittanceMapGamma     : f32, // default 1.0

  blendFactor           : f32, // default 8.0
  blendLayer2Tiling     : f32, // default 1.0
  blendFalloff          : f32, // default 32.0
  blendLayer2Smoothness : f32, // default 10.0

  alphaTestRef                   : f32,

  heightBias                     : f32,    // default 1.0  — center height; offset = (h - bias) × scale
  heightScale                    : f32,    // default 0.004 — UV displacement amount (obmDisplacement)
  detailTiling                   : vec2f,  // PerMaterial_DetailTiling.xy — scales detail UV
  blendTerrainColInfo            : vec4f, // .xy = terrain UV offset, .z = UV scale, .w = blend distance


  enabledAlphaBlend              : u32,
  enabledAlphaTest               : u32,
  enabledTerrainBlend            : u32,   // %_RT_BLEND_WITH_TERRAIN_COLOR

  // -- Texture modifier matrices
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

// -- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
// @group(3) @binding(5) var translucencyMap : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
// @group(3) @binding(8) var subsurfaceMap   : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
// @group(3) @binding(14) var occlusionMap   : texture_2d<f32>; // $Occlusion    (OcclusionMap)
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2    (SpecularMap2)
@group(3) @binding(16) var fromObjTex        : texture_2d<f32>; // $FromObj  terrain color



struct VertexInput {
  @builtin(instance_index) id   : u32,
  @location(0) position         : vec3f,
  @location(1) normal           : vec3f,
  @location(2) texture          : vec4f, // .xy = uv0, .zw = uv1
  @location(3) color            : vec4f,
  @location(4) tangent          : vec4f, // .w = handedness sign
};

struct FragmentInput {
  @builtin(position) position   : vec4f,
  @location(0) toEye            : vec3f, // cameraPosition - worldPos
  @location(1) worldPos         : vec3f, // world space position
  @location(2) worldTangent     : vec4f, // .xyz = world tangent,   .w = handedness
  @location(3) worldBitangent   : vec3f, // .xyz = world bitangent
  @location(4) worldNormal      : vec3f, // .xyz = world normal
  @location(5) uvBase           : vec4f, //
  @location(6) uvBlend          : vec4f, // unused
  @location(7) uvEmittance      : vec4f, // .xy = emittance UV, .zw = intensity UV
  @location(8) uvDetail         : vec4f,

  @location(9)  color0          : vec4f, // .x= render quality, .y= alpha blend term, .z = wsNormal.z component, .w = alpha
  @location(10) vertColor       : vec4f, // pass-through vertex color
  @location(11) backLight       : vec3f,
  @location(12) frontLight      : vec3f,
};

@vertex
fn vs_main(input : VertexInput) -> FragmentInput {


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

  let modelMatrix = object[input.id].modelMatrix;
  let worldPos = modelMatrix * vec4f(vPos, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = view.cameraPosition - worldPos.xyz;
  let view     = -toEye;

  var output : FragmentInput;

  // -- TBN
  var normal    = normalize((modelMatrix * vec4f(input.normal,          0.0)).xyz);
  let tangent   = normalize((modelMatrix * vec4f(input.tangent.xyz,     0.0)).xyz);
  let bitangent = cross(normal, tangent) * input.tangent.w;
  var handedness = input.tangent.w;

  // #region UV Modifiers
  // -- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    output.uvBase = input.texture * material.uvModDiffuse;
  } else {
    output.uvBase = input.texture;
  }

  // -- UV MOD BLEND --
  // not used, calculated in fragment shader

  // -- UV MOD DETAIL --
  if (DETAIL_MAPPING) {
    output.uvDetail = input.texture * material.uvModDetail;
  }

  // -- UV MOD EMITTANCE/EMISSIVE --
  if (EMITTANCE_MAP) {
    // uses premodified UVs
    // TODO: figure out whether this is intentional or by accident
    var uv1 = output.uvBase;
    var uv2 = output.uvBase;

    if (material.enabledUvModEmittance == TRUE) {
      uv1 = uv1 * material.uvModEmittance;
    }
    if (material.enabledUvModDecalEmissive == TRUE) {
      uv2 = uv2 * material.uvModDecalEmissive;
    }
    output.uvEmittance = vec4f(uv1.xy, uv2.xy);
  }
  // #endregion

  var ambientObjectOcclusion = vec4f(1.0);
  // #if %_RT_INSTANCING_ATTR
	//   AmbObjectCol = float4(1,1,1,1);
  // #else
  //   AmbObjectCol = AmbientObjectCol;
  // #endif
  let flipN = min(dot(toEye, normal) + 0.1, 1.0);
  if (LEAVES || GRASS) {
    normal     *= flipN;
    handedness *= flipN;
  }
  if (GRASS) {
    output.frontLight = vec3f(saturate(dot(global.sunDirection.xyz, normal)));
  }

  output.color0 = vec4f(
    ambientObjectOcclusion.w, // render quality
    ambientObjectOcclusion.y, // alpha blend term
    normal.z * 0.25 + 0.75,   // world normal Z
    1.0
  );

  var alpha = input.color.a;
  if (BLENDLAYER) {
    // blend layer vtx alpha overlaps with alpha on vegetation. Use blue channel instead
    alpha = input.color.z;
    output.color0.z = input.color.a;
  }
  // #if !%_RT_BLEND_WITH_TERRAIN_COLOR
  //   #if !%_RT_FOG
  //   fAlpha *= AmbObjectCol.x;
  //   #endif
  // #endif
  output.color0.w = alpha;

  // -- Back lighting for leaves and grass ------------------------------------------------
  if (LEAVES || GRASS) {
    var backDiffuse = vec3f(material.backDiffuseMultiplier) * output.color0.x; // render quality
    if (LEAVES) {
      output.backLight = backDiffuse;
    } else {
      // ??? why multiply, if default value is 0.0?
      output.backLight *= backDiffuse;
    }
  }

  // -- Terrain blend UVs ---------------------------------------------------------------
  if (material.enabledTerrainBlend == TRUE) {
    let tcInfo = material.blendTerrainColInfo;
    let camDist   = length(view);
    let blendDist = tcInfo.w * (1.0 - material.blendTerrainColDist);
    let blendFac  = saturate(material.blendTerrainCol + camDist / max(blendDist, 0.001));
    // clipPos.z = blendFac * blendFac;
    // OUT.screenProj.z =  fBlendFactor*fBlendFactor; // TODO
    output.uvBase.z = tcInfo.z * worldPos.y + tcInfo.x;
    output.uvBase.w = tcInfo.z * worldPos.x + tcInfo.y;
  }

  output.position        = clipPos;
  output.worldPos        = worldPos.xyz;
  output.worldTangent    = vec4f(tangent, handedness);
  output.worldBitangent  = bitangent;
  output.worldNormal     = normal;
  output.vertColor       = input.color;
  output.toEye           = toEye;

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {

  var wTangent = normalize(input.worldTangent.xyz);
  var wBitangent = normalize(input.worldBitangent.xyz);
  var wNormal = normalize(input.worldNormal.xyz);
  if (!GRASS) {
    wNormal = cross(wTangent, wBitangent) * input.worldTangent.w;
  }

  let toEye  = normalize(input.toEye);
  let tbn    = mat3x3f(wTangent, wBitangent, wNormal);
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;

  var uvBase              = input.uvBase;
  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvDetail.xy;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  var uvBlendMap          = input.uvBase.xy;
  var uvBlendLayer        = input.uvBase.xy;
  if (material.enabledUvModCustom == TRUE) {
    uvBlendLayer = (input.uvBase * material.uvModCustom).xy;
  }
  var nMicroDetailQuality = MICRO_DETAIL_QUALITY_DEF;
  var fBumpHeightScale = 0.0;
  // var fHeightBias = material.heightBias;
  // var fSelfShadowStrength = material.selfShadowStrength;

  var cBackLight = vec3f(0.0);
  var cFrontLight = vec3f(0.0);
  var cShadingBack = vec3f(0.0);
  if (LEAVES || GRASS) {
    cBackLight = input.backLight;
  }
  if (GRASS) {
    cFrontLight = input.frontLight.rgb * global.sunColor.rgb;
  }
  // #if %_RT_FOG
  //   pPass.IN.AvgFogVolumeContrib = IN.AvgFogVolumeContrib;
  // #endif

  // --
  // #region frag_unify_parameters(pPass);

  // pPass.bCustomComposition = true;
  // pPass.bRenormalizeNormal = true;
  // pPass.bDeferredSpecularShading = true;
  // pPass.pCustom.fRenderQuality = pPass.pCustom.cColor0.x;
  // #if %DETAIL_MAPPING
  //   pPass.bDetailBumpMapping = true;
  //   pPass.vDetailBumpTiling = float2(PerMaterial_DetailTiling.xy);
  //   pPass.fDetailBumpScale = DetailBumpScale;
  //   pPass.vDetailBlendAmount = float2(DetailDiffuseScale, DetailGlossScale);
  // #endif
  // #endregion
  // --

  // --
  // #region frag_shared_output

  // -- TODO: frag_get_deferred_buffers(pPass)

  // -- Blend layer factor --
  var blendFac = 0.0;
  if (BLENDLAYER) {
    let blendMapColor  = textureSample(opacityMap, samplerLinear, uvBlendMap.xy).r;
    blendFac = input.vertColor.a * blendMapColor * (1 + material.blendFactor);
    blendFac = saturate(pow(abs(blendFac), material.blendFalloff));
  }

  // -- MICRO_DETAIL QUALITY (OBM/POM) --
  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);
  switch (nMicroDetailQuality) {
    // TODO:
    // case MICRO_DETAIL_QUALITY_OBM: {
    //   uv = ApplyOBM(uv, viewTS);
    //   const float3 viewDir = mul(pPass.mTangentToWS, pPass.vView);
    //   #if %BLENDLAYER
    //       const float4 newCoords = OffsetMap(microDetailBaseTC, pPass.IN.blendLayerTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
    //       pPass.IN.blendLayerTC = newCoords.zw;
    //   #else
    //       const float4 newCoords = OffsetMap(microDetailBaseTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
    //   #endif
    //   pPass.IN.baseTC.xy = newCoords.xy;
    //   pPass.IN.bumpTC.xy = newCoords.xy;
    // }
    // case MICRO_DETAIL_QUALITY_POM: {
    //     uv = ApplyPOM(uv, viewTS);
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

  // -- Detail Mapping --
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

    // if (bDetailBumpMappingMasking) {
    //   cDetailMap *= cDiffuseMap.a;
    // }

    cBumpMap += vec3f(cDetailMap.xy, 0.0);
  }

  cDiffuseMap *= material.diffuseColor;

  var vertCol  = input.vertColor;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  var albedo   = cDiffuseMap.rgb;
  var normal   = normalize(tbn * normalize(cBumpMap));
  var specular = vec3f(1.0);
  var gloss    = material.specularColor.a;
  // pPass.fNdotE   = (dot(pPass.vView.xyz, pPass.vNormal.xyz));
  // pPass.vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;
  var cFilterColor    = vec3f(1.0);

  // -- frag_custom_begin
  vertCol = vec4f(1.0); // Vegetation has custom color ouput - override vtx color back to default

  if (LEAVES || GRASS) {
    if (LEAVES) {
      cShadingBack = cBackLight.rgb * textureSample(opacityMap, samplerLinear, uvBase.xy).r;
    } else {
      cShadingBack = cBackLight.rgb;
    }
  }

  if (!GRASS) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  albedo   *= material.diffuseColor.rgb;
  specular *= material.specularColor.rgb;

  // -- Blend layer ------------------------------------------
  if (BLENDLAYER) {
    // not used
    // var diffuseMap2   = textureSample(diffuseMap2,    samplerLinear, uvBlendLayer.xy);
    // var specularMap2  = textureSample(specularMap2,   samplerLinear, uvBlendLayer.xy);
    // var glossLayer2   = textureSample(smoothnessMap2, samplerLinear, uvBlendLayer).a;

    // // Diffuse blend layer calculation
    // diffuseMap2      *= vec4f(material.blendLayer2Diffuse.rgb, 1.0);
    // albedo            = mix(albedo, diffuseMap2.rgb, blendFac);

    // // Specular blend layer calculation
    // specularMap2     *= vec4f(material.blendLayer2Specular.rgb, 1.0);
    // specular          = mix(specular, specularMap2.rgb, blendFac);

    // // Gloss blend layer calculation
    // glossLayer2      *= (material.blendLayer2Smoothness / 256.0);
    // gloss             = mix(gloss, glossLayer2, blendFac);
  }
  // #endregion
  // --

  // -- Detail mapping
  if (DETAIL_MAPPING) {
    albedo += albedo * cDetailMap.z;
    gloss  += gloss  * cDetailMap.w;
  }



  // -- Environment mapping
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


  var surface: SurfaceParams;
  surface.Transmittance = vec4f(cShadingBack.rgb, material.normalViewDependency);
  surface.BaseColor = vec4f(albedo, alpha);
  surface.Specular  = specular;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);
  surface.Metallic  = 0.0;
  surface.Ior       = 0.0;

  var shade = accumulateLightOut(lights, global, surface, toEye, input.worldPos);



  // #region Apply Light
  // ApplyClusterForwardLighting(pPass, pPass.IN.vView.xyz);
  // #endregion


  // #region frag_ambient(pPass, vAmbientNormal);
  // #if %_RT_FOG
  //     #if %_RT_HDR_MODE
  //         float3 amb = pPass.IN.Ambient.xyz;

  //         // custom ambient pass
  //         frag_custom_ambient(pPass, amb); ->  pPass.cAmbientAcc.xyz += cAmbient.xyz;
  //     #else
  //         // Use default probe in secondary viewports until we have tiled shading support there
  //         pPass.cAmbientAcc += GetEnvironmentCMap(defaultProbeCUBE, defaultProbeCUBESampler, pPass.vNormal.xyz, 0).xyz * pPass.IN.Ambient.xyz;
  //         pPass.cSpecularAcc += GetEnvironmentCMap(defaultProbeCUBE, defaultProbeCUBESampler, pPass.vReflVec.xyz, pPass.fGloss).xyz * pPass.IN.Ambient.xyz * pPass.cSpecularMap.rgb;
  //         pPass.nReflectionMapping = 0;
  //     #endif
  // #endif
  // #endregion



  // #region frag_custom_end(pPass, cOut.xyz);
  if (GRASS) {
    cShadingBack *= cFilterColor;
    shade.diffuseBack = vec3f(1.0);
    shade.diffuse += cFrontLight.rgb * cFilterColor;
  }

  // Vertex color are not yet working on Cluster Forward
  // #if !%_RT_CLUSTER_FORWARD
  //     albedo *= pPass.pCustom.cColor0.w;
  //     specular *= pPass.pCustom.cColor0.w;
  // #endif

  // #if %_RT_BLEND_WITH_TERRAIN_COLOR && %_RT_AMBIENT
  //     float2 texCoords = pPass.IN.baseTC.zw;
  //     float4 terrainColor = GetTerrainColor(fromObjTex0, fromObjSampler0, texCoords);
  //     albedo = lerp(albedo, terrainColor.xyz, pPass.IN.screenProj.z);
  //     specular = lerp(specular, terrainColor.xyz, pPass.IN.screenProj.z);
  // #endif

  // Final composition
  // TODO: this uses PBF but shouldn't. albedo factor moved out of diffuse+ambient term, as it's aready in diffuseColor
  albedo =  ((shade.diffuse.rgb + shade.ambient.rgb) + shade.diffuseBack.rgb * cShadingBack.rgb);
  specular = shade.specular.rgb * input.color0.x;// pPass.pCustom.fRenderQuality;

  // #endregion



  // -- Alpha test (%_RT_ALPHATEST) --------------------------
  if (material.enabledAlphaTest != 0u && alpha < material.alphaTestRef) {
    discard;
  }



  // #region frag_fog_setup(pPass, cOut);
  // frag_fog_setup(pPass, cOut);
  // #endregion


  // #region frag_hdr_setup(pPass, cOut);
  // frag_hdr_setup(pPass, cOut);
  // #endregion



  // -- Emittance --------------------------------------------
  var emittance = vec3f(0.0);
  let emissiveLum = getLuminance(material.emissiveColor.xyz);
  if (emissiveLum > 0.0) {

    var emitMapCol = vec4f(1.0);
    var emitMapInt = vec4f(0.5);
    if (EMITTANCE_MAP) {
      emitMapCol     = textureSample(emittanceMap,     samplerLinear, uvEmittance.xy);
      if (!BLENDLAYER) {
        emitMapInt = textureSample(decalEmissiveMap, samplerLinear, uvEmissiveIntensity.xy);
      }
    }

    emittance = emitMapCol.rgb;
    emittance *= pow(max(getLuminance(emitMapCol.rgb), 1e-6), material.emittanceMapGamma - 1.0);
    emittance *= emitMapInt.rgb;
    emittance *= (material.emissiveColor.xyz * material.emissiveColor.a * 0.1);
  }



  // -- Compose final color ---------------------------------------------------
  var color = albedo + specular + emittance;

  var out: FragmentOutput;
  out.color = applyFog(color, alpha, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(albedo, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      out.color = vec4f(specular, 1.0);
    }
    case DEBUG_MTL_METALLIC: {
      out.color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      out.color = vec4f(vec3f(surface.Roughness), 1.0);
    }
    case DEBUG_MTL_IOR: {
      out.color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      out.color = vec4f(vec3f(emittance), 1.0);
    }
    case DEBUG_MTL_AO: {
      out.color = vec4f(vec3f(input.vertColor.a), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(alpha), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      out.color = vec4f(vec3f(material.emissiveColor.rgb), 1.0);
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
      out.color = vec4f(input.vertColor.xyz, 1.0);
    }
    case DEBUG_V_COLOR1: {
      //
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(fract(uvBase.zw), 0.0, 1.0);
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

// Blinn-Phong specular with smoothness remapped from [0,1] to a reasonable exponent.
fn blinnPhong(N: vec3f, L: vec3f, V: vec3f, smoothness: f32) -> f32 {
    let H = normalize(L + V);
    let exponent = exp2(smoothness * 10.0 + 1.0);   // 0→2, 1→2048
    return pow(max(0.0, dot(N, H)), exponent);
}


// Luminance (BT.601 coefficients, matching GetLuminance in CryEngine).
fn luminance(c: vec3f) -> f32 {
    return dot(c, vec3f(0.212671, 0.715160, 0.072169));
}
`
