import { ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface ShadeDefs {
  SHADE_FUNCTION?: string
}

/**
 * @public
 */
export type ShadeFunctionNone = 'shadeNone'

/**
 * @public
 */
export const SHADE: ShaderChunkSet<ShadeDefs> = {
  defines: /* glsl */ `
    #ifndef SHADE_FUNCTION
    #define SHADE_FUNCTION shadeNone
    #endif
  `,
  structs: /* glsl */ `
    struct ShadeParams {
      vec3 V; // Vector to eye (camPos - worldPos)
      vec3 L; // Vector to light
      vec3 I; // Light intensity
    };
  `,
  functions: /* glsl */ `
    highp vec3 shadeNone(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      return surface.BaseColor.rgb;
    }
  `,
  functions_after: /* glsl */ `
    highp vec4 shade(in SurfaceParams surface) {
      vec4 color = vec4(0.0, 0.0, 0.0, surface.BaseColor.a);
      vec3 toEye = normalize(vToEyeInWS);

      #ifdef LIGHT
      for (int i = 0; i < LIGHT_COUNT; i++)
      {
        LightParams light = uLights[i];
        int type = int(light.Color.w);
        if (type <= 0) {
          break; // stop on first light that is off
        }

        ShadeParams shade;
        shade.V = toEye;
        getLight(light, type, vPositionInWS.xyz, shade.L, shade.I);
        color.rgb += SHADE_FUNCTION(shade, surface).rgb;
      }
      color.rgb += surface.Emission.rgb;
      #else
      color.rgb += surface.BaseColor.rgb;
      #endif

      color.rgb += getEnvironmentColor(toEye, surface);

      return color;
    }
  `,
  fs_shade: /* glsl */ `
    color = shade(surface);
  `,
}
