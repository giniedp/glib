import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export interface ShadeDefs {
  SHADE_FUNCTION?: string
}

/**
 * @public
 */
export type SHADE_NON_FUNCTION = 'shadeNone'

/**
 * @public
 */
export const FXC_SHADE: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifndef SHADE_FUNCTION
    #define SHADE_FUNCTION shadeNone
    #endif
  `,
  structs: glsl`
    struct ShadeParams {
      vec3 V; // Vector to eye
      vec3 L; // Vector to light
      vec3 I; // Light intensity
    };
  `,
  functions: glsl`
    highp vec3 shadeNone(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      return surface.Diffuse.rgb;
    }
  `,
  functions_after: glsl`
    highp vec4 shade(in SurfaceParams surface) {
      #ifdef LIGHT
      vec4 color = vec4(0.0, 0.0, 0.0, surface.Diffuse.a);
      vec3 toEye = normalize(vToEyeInWS);
      for (int i = 0; i < LIGHT_COUNT; i++)
      {
        LightParams light = uLights[i];
        int type = int(light.Color.w);
        if (type <= 0) break; // stop on first light that is off

        ShadeParams shade;
        shade.V = toEye;
        getLight(light, type, vPositionInWS.xyz, shade.L, shade.I);
        color.rgb += SHADE_FUNCTION(shade, surface).rgb;
      }
      color.rgb += surface.Emission.rgb;
      return color;
      #else
      return surface.Diffuse;
      #endif
    }
  `,
  fs_shade: glsl`
    color = shade(surface);
    #ifdef DEBUG_NORMAL
    color.rgb = surface.Normal.rgb;
    #endif
    #if defined(DEBUG_V_NORMAL) && defined(V_NORMAL)
    color.rgb = normalize(vWorldNormal.rgb);
    #endif
    #ifdef DEBUG_SPECULAR
    color.rgb = surface.Specular.rgb;
    #endif
    #ifdef DEBUG_EMISSION
    color.rgb = surface.Emission.rgb;
    #endif
    #ifdef DEBUG_PBR
    color.rgb = surface.PBR.rgb;
    #endif
  `,
})
