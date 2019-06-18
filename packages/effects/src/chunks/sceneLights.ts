import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

export interface LightDefs {
  /**
   * Enables lighting
   */
  LIGHT?: any
  /**
   * Defines total number of lights
   *
   * @remarks
   * defaults to `4`
   */
  LIGHT_COUNT?: any
  /**
   * Defines the light type constat for no light
   *
   * @remarks
   * defaults to `0`
   */
  LIGHT_TYPE_NONE?: any
  /**
   * Defines the light type constat for directional light
   *
   * @remarks
   * defaults to `1`
   */
  LIGHT_TYPE_DIRECTIONAL?: any
  /**
   * Defines the light type constat for point light
   *
   * @remarks
   * defaults to `2`
   */
  LIGHT_TYPE_POINT?: any
  /**
   * Defines the light type constat for spot light
   *
   * @remarks
   * defaults to `3`
   */
  LIGHT_TYPE_SPOT?: any
}

export const LIGHTS: ShaderChunkSet = Object.freeze({
  defines: glsl`
    #ifndef LIGHT_COUNT
      #define LIGHT_COUNT 4
    #endif
    #ifndef LIGHT_TYPE_NONE
      #define LIGHT_TYPE_NONE 0
    #endif
    #ifndef LIGHT_TYPE_DIRECTIONAL
      #define LIGHT_TYPE_DIRECTIONAL 1
    #endif
    #ifndef LIGHT_TYPE_POINT
      #define LIGHT_TYPE_POINT 2
    #endif
    #ifndef LIGHT_TYPE_SPOT
      #define LIGHT_TYPE_SPOT 3
    #endif
    #ifdef LIGHT
    #ifndef V_NORMAL
      #define V_NORMAL
    #endif
    #endif
  `,
  structs: glsl`
    struct LightParams {
      vec4 Position;  // xyz = position       , w is unused
      vec4 Direction; // xyz = direction      , w is unused
      vec4 Color;     // rgb = diffuse color  , a = intensity
      vec4 Misc;      // xyz components are implementation dependent light attributes
                      //   w component is light type
                      //     0 = off
                      //     1 = directional,
                      //     2 = point
                      //     3 = spot
    };
    // @binding Lights
    uniform LightParams uLights[LIGHT_COUNT];
  `,
  functions: glsl`
    void getLight(in LightParams light, int type, in vec3 position, out vec3 lightDir, out vec3 lightColor) {
      #ifdef LIGHT_TYPE_DIRECTIONAL
      // directional light (constant attenuation)
      if (type == LIGHT_TYPE_DIRECTIONAL)
      {
        lightDir = normalize(-light.Direction.xyz);
        lightColor = light.Color.rgb * light.Color.a;
        return;
      }
      #endif

      #ifdef LIGHT_TYPE_POINT
      // point light (radial linear attenuation)
      if (type == LIGHT_TYPE_POINT)
      {
        float range = max(0.00001, light.Misc.x);
        vec3 toLight = light.Position.xyz - position;
        lightDir = normalize(toLight);
        lightColor = light.Color.rgb * light.Color.a * max(1.0 - min(1.0, length(toLight) / range), 1.0);
        return;
      }
      #endif

      #ifdef LIGHT_TYPE_SPOT
      // spot light (cone and linear attenuation)
      if (type == LIGHT_TYPE_SPOT)
      {
        float range = max(0.00001, light.Misc.x);
        float cosOuter = light.Misc.y;
        float cosInner = light.Misc.z;
        vec3 toLight = light.Position.xyz - position;
        lightDir = normalize(toLight);
        float spot = smoothstep(cosOuter, cosInner, dot(lightDir, -light.Direction.xyz));
        lightColor = light.Color.rgb * light.Color.a * (1.0 - min(1.0, length(toLight) / range)) * spot;
        return;
      }
      #endif

      lightColor = vec3(0.0);
      return;
    }
  `,
})
