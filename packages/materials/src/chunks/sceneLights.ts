import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface LightDefs {
  /**
   * Enables lighting
   */
  LIGHT?: boolean
  /**
   * Defines total number of lights
   *
   * @remarks
   * defaults to `4`
   */
  LIGHT_COUNT?: number
  /**
   * Defines the light type constant for no light
   *
   * @remarks
   * defaults to `0`
   */
  LIGHT_TYPE_NONE?: number
  /**
   * Defines the light type constant for directional light
   *
   * @remarks
   * defaults to `1`
   */
  LIGHT_TYPE_DIRECTIONAL?: number
  /**
   * Defines the light type constant for point light
   *
   * @remarks
   * defaults to `2`
   */
  LIGHT_TYPE_POINT?: number
  /**
   * Defines the light type constant for spot light
   *
   * @remarks
   * defaults to `3`
   */
  LIGHT_TYPE_SPOT?: number
}

/**
 * @public
 */
export const FXC_SCENE_LIGHTS: ShaderChunkSet<LightDefs> = Object.freeze({
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
      vec4 Color;
      vec4 Position;
      vec4 Direction;

      //              | Directional   | Point Light | Spot Light | Area Light
      // Color     R  | Color.R       | Color.R     | Color.R    | Color.R
      // Color     G  | Color.G       | Color.G     | Color.G    | Color.G
      // Color     B  | Color.B       | Color.B     | Color.B    | Color.B
      // Color     A  | type: 1       | type: 2     | type: 3    | type: 4
      //              |               |             |            |
      // Position  R  | -             | Pos.X       | Pos.X      | Pos.X
      // Position  G  | -             | Pos.Y       | Pos.Y      | Pos.Y
      // Position  B  | -             | Pos.Z       | Pos.Z      | Pos.Z
      // Position  A  | -             | Range       | Range      | Height
      //              |               |             |            |
      // Direction R  | Dir.X         | -           | Dir.X      | Dir.X
      // Direction G  | Dir.Y         | -           | Dir.Y      | Dir.Y
      // Direction B  | Dir.Z         | -           | Dir.Z      | Dir.Z
      // Direction A  | -             | -           | Angle      | Width

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
        lightColor = light.Color.rgb;
        return;
      }
      #endif

      #ifdef LIGHT_TYPE_POINT
      // point light (radial linear attenuation)
      if (type == LIGHT_TYPE_POINT)
      {
        float range = max(0.00001, light.Position.a);
        vec3 toLight = light.Position.xyz - position;
        lightDir = normalize(toLight);
        float lightAtt = clamp(1.0 - min(1.0, length(toLight) / range), 0.0, 1.0);
        lightColor = light.Color.rgb * lightAtt;
        return;
      }
      #endif

      #ifdef LIGHT_TYPE_SPOT
      // spot light (cone and linear attenuation)
      if (type == LIGHT_TYPE_SPOT)
      {
        // same as point light
        float range = max(0.00001, light.Position.a);
        vec3 toLight = light.Position.xyz - position;
        lightDir = normalize(toLight);
        float lightAtt = clamp(1.0 - min(1.0, length(toLight) / range), 0.0, 1.0);
        // spot cutoff
        float cosAngle = light.Direction.w;
        lightAtt *= smoothstep(cosAngle, cosAngle + 0.0174533, dot(lightDir, normalize(-light.Direction.xyz)));

        lightColor = light.Color.rgb * lightAtt;
        return;
      }
      #endif

      lightColor = vec3(0.0);
      return;
    }
  `,
})
