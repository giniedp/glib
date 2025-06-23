import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface DebugDefs {
  DEBUG?: string
}

export enum DebugOutput {
  DEBUG_UV0 = 0,
  DEBUG_UV1 = 1,
  DEBUG_VC0 = 2,
  DEBUG_VC1 = 3,
  DEBUG_TANGENT = 4,
  DEBUG_BITANGENT = 5,
  DEBUG_NORMAL = 6,
  DEBUG_SURFACE_NORMAL = 7,
  DEBUG_SURFACE_ALBEDO = 8,
  DEBUG_SURFACE_SPECULAR = 9,
  DEBUG_SURFACE_EMISSION = 10,
  DEBUG_SURFACE_METALLIC = 11,
  DEBUG_SURFACE_ROUGHNESS = 12,
  DEBUG_SURFACE_IOR = 13,
}

/**
 * @public
 */
export const DEBUG: ShaderChunkSet<DebugDefs> = {
  defines: glsl`
    #ifdef DEBUG
    // @binding Debug
    uniform int uDebug;
    #define DEBUG_UV0 0
    #define DEBUG_UV1 1
    #define DEBUG_VC0 2
    #define DEBUG_VC1 3
    #define DEBUG_TANGENT 4
    #define DEBUG_BITANGENT 5
    #define DEBUG_NORMAL 6
    #define DEBUG_SURFACE_NORMAL 7
    #define DEBUG_SURFACE_ALBEDO 8
    #define DEBUG_SURFACE_SPECULAR 9
    #define DEBUG_SURFACE_EMISSION 10
    #define DEBUG_SURFACE_METALLIC 11
    #define DEBUG_SURFACE_ROUGHNESS 12
    #define DEBUG_SURFACE_IOR 13
    #endif

  `,

  fs_frag_color: glsl`
    #ifdef DEBUG

    if (uDebug == DEBUG_UV0) {
      #ifdef V_TEXTURE
      color.rgb = vec3(vTexture, 0.0);
      #endif
    } else if (uDebug == DEBUG_UV1) {
      #ifdef V_TEXTURE1
      color.rgb = vec3(vTexture1, 0.0);
      #endif
    } else if (uDebug == DEBUG_VC0) {
      #ifdef V_COLOR
      color.rgb = vColor;
      #endif
    } else if (uDebug == DEBUG_VC1) {
      #ifdef V_COLOR1
      color.rgb = vColor;
      #endif
    } else if (uDebug == DEBUG_TANGENT) {
      // TODO
    } else if (uDebug == DEBUG_BITANGENT) {
      // TODO
    } else if (uDebug == DEBUG_NORMAL) {
      #ifdef V_NORMAL
      color.rgb = vWorldNormal.rgb * 0.5 + 0.5;
      #endif
    } else if (uDebug == DEBUG_SURFACE_NORMAL) {
      color.rgb = surface.Normal.rgb * 0.5 + 0.5;
    } else if (uDebug == DEBUG_SURFACE_ALBEDO) {
      color.rgb = surface.BaseColor.rgb;
    } else if (uDebug == DEBUG_SURFACE_SPECULAR) {
      color.rgb = surface.Specular.rgb;
    } else if (uDebug == DEBUG_SURFACE_EMISSION) {
      color.rgb = surface.Emission.rgb;
    } else if (uDebug == DEBUG_SURFACE_METALLIC) {
      color.rgb = vec3(surface.Metallic);
    } else if (uDebug == DEBUG_SURFACE_ROUGHNESS) {
      color.rgb = vec3(surface.Roughness);
    } else if (uDebug == DEBUG_SURFACE_IOR) {
      color.rgb = vec3(surface.Ior);
    }
    #endif
  `,
}
