import { glsl } from '../glsl'

export interface ShadeDefs {
  SHADE_FUNCTION?: any
}

export const SHADE = Object.freeze({
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
      for (int i = 0; i < LIGHT_COUNT; i++)
      {
        LightParams light = uLights[i];
        int type = int(light.Misc.w);
        if (type <= 0) break; // stop on first light that is off

        ShadeParams shade;
        shade.V = normalize(uCameraPosition.xyz - vWorldPosition.xyz);
        getLight(light, type, vWorldPosition.xyz, shade.L, shade.I);
        color.rgb += SHADE_FUNCTION(shade, surface).rgb;
      }
      return color;
      #else
      return surface.Diffuse;
      #endif
    }
  `,
  fs_shade: glsl`
    color = shade(surface);
  `,
})
