import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * @public
 */
export interface MtlSplattingDefs {
  /**
   * Enables texture splatting
   */
  SPLATTING?: any
  /**
   * Adds additional base texture
   *
   * @remarks
   * This will cover all areas where no other channels are present
   */
  SPLATTING_BASE?: any
  /**
   * Adds additional slope texture
   *
   * @remarks
   * The slope is defined by the geometry normal. Steep slopes will be covered by this texture
   */
  SPLATTING_SLOPE?: any
  /**
   * Adds additional tint map
   */
  SPLATTING_TINT?: any
  /**
   * Enables normal mapping
   */
  SPLATTING_NORMAL?: any
}

/**
 * @public
 */
export const MTL_SPLATTING: ShaderChunkSet<MtlSplattingDefs> = {
  uniforms: glsl`
    #ifdef SPLATTING
    // @binding  SplatMap
    uniform sampler2D uSplatMap;

    #ifdef SPLATTING_BASE
    // @binding  BaseColorMap
    uniform sampler2D uBaseColorMap;
    #endif

    // @binding  BaseColorMapR
    uniform sampler2D uBaseColorMapR;

    // @binding  BaseColorMapG
    uniform sampler2D uBaseColorMapG;

    // @binding  BaseColorMapB
    uniform sampler2D uBaseColorMapB;

    #ifdef SPLATTING_ALPHA
    // @binding  BaseColorMapA
    uniform sampler2D uBaseColorMapA;
    #endif

    #ifdef SPLATTING_SLOPE
    // @binding  BaseColorMapSlope
    uniform sampler2D uBaseColorMapSlope;
    #endif

    #ifdef SPLATTING_NORMAL
    #ifdef SPLATTING_BASE
    // @binding  NormalMap
    uniform sampler2D uNormalMap;
    #endif

    // @binding  NormalMapR
    uniform sampler2D uNormalMapR;

    // @binding  NormalMapG
    uniform sampler2D uNormalMapG;

    // @binding  NormalMapB
    uniform sampler2D uNormalMapB;

    #ifdef SPLATTING_ALPHA
    // @binding  NormalMapA
    uniform sampler2D uNormalMapA;
    #endif

    #ifdef SPLATTING_SLOPE
    // @binding  NormalMapSlope
    uniform sampler2D uNormalMapSlope;
    #endif
    #endif

    #ifdef SPLATTING_TINT
    // @binding  TintMap
    uniform sampler2D uTintMap;
    #endif

    // @binding Brightness
    // @default 1.25
    uniform float uBrightness;

    // @binding Saturation
    // @default 0.5
    uniform float uSaturation;

    // @binding Perturbation
    // @default 0.25
    uniform float uPerturbation;

    // @binding Tiling
    // @default 64.0
    uniform float uTiling;

    // @binding SlopeStrength
    // @default 1.0
    uniform float uSlopeStrength;
    #endif
  `,
  functions: glsl`
    #ifdef SPLATTING

    void adjustSaturation(inout vec4 color, float saturation)
    {
        // The constants 0.3, 0.59, and 0.11 are chosen because the
        // human eye is more sensitive to green light, and less to blue.
        float grey = dot(color.xyz, vec3(0.3, 0.59, 0.11));
        color.rgb = mix(vec3(grey), color.rgb, saturation);
    }

    float splatBlendSlope(in float slope, in vec2 uv){
      #ifdef SPLATTING_SLOPE
      float blend = length(texture2D(uBaseColorMapSlope, uv).rgb);

      if(slope < 0.5){
        blend = 2.0 * slope * blend;
      } else {
        blend = 1.0 - 2.0 * (1.0 - slope) * (1.0 - blend);
      }
      return clamp((blend - 0.5) * 5.0 + 0.5, 0.0, 1.0);
      #else
      return 0.0;
      #endif
    }

    vec4 splatColor(in vec2 uv, in vec4 splat, in float slope){
      vec4 tempColor = vec4(0.0, 0.0, 0.0, 0.0);
      vec2 uv0 = uv.xy;
      vec2 uv1 = uv.xy * vec2(uPerturbation, uPerturbation);
      float brightness = uBrightness;//1.5;
      float saturatuion = uSaturation;

      #ifdef SPLATTING_BASE
      tempColor = texture2D(uBaseColorMap, uv0) * brightness;
      adjustSaturation(tempColor, saturatuion);
      tempColor *= texture2D(uBaseColorMap, uv1) * brightness;
      #endif

      vec4 color = tempColor;

      tempColor = texture2D(uBaseColorMapR, uv0) * brightness;
      adjustSaturation(tempColor, saturatuion);
      tempColor *= texture2D(uBaseColorMapR, uv1) * brightness;
      color = mix(color.rgba, tempColor, splat.r);

      tempColor = texture2D(uBaseColorMapG, uv0) * brightness;
      adjustSaturation(tempColor, saturatuion);
      tempColor *= texture2D(uBaseColorMapG, uv1) * brightness;
      color = mix(color.rgba, tempColor, splat.g);

      tempColor = texture2D(uBaseColorMapB, uv0) * brightness;
      adjustSaturation(tempColor, saturatuion);
      tempColor *= texture2D(uBaseColorMapB, uv1) * brightness;
      color = mix(color.rgba, tempColor, splat.b);

      #ifdef SPLATTING_ALPHA
      tempColor = texture2D(uBaseColorMapA, uv0) * brightness;
      adjustSaturation(tempColor, saturatuion);
      tempColor *= texture2D(uBaseColorMapA, uv1) * brightness;
      color = mix(color.rgba, tempColor, splat.a);
      #endif

      #ifdef SPLATTING_SLOPE
      tempColor = texture2D(uBaseColorMapSlope, uv.xy) * brightness;
      color = mix(color.rgba, tempColor, slope);
      #endif

      return color;
    }

    vec3 splatNormal(in vec2 uv, in vec4 splat, in float slope){
      vec4 normal = vec4(0.0, 0.0, 0.0, 0.0);
      #ifdef SPLATTING_NORMAL
      #ifdef SPLATTING_BASE
      normal = texture2D(uNormalMap, uv.xy);
      #endif
      normal = mix(normal, texture2D(uNormalMapR, uv.xy), splat.r);
      normal = mix(normal, texture2D(uNormalMapG, uv.xy), splat.g);
      normal = mix(normal, texture2D(uNormalMapB, uv.xy), splat.b);
      #ifdef SPLATTING_ALPHA
      normal = mix(normal, texture2D(uNormalMapA, uv.xy), splat.a);
      #endif
      #ifdef SPLATTING_SLOPE
      normal = mix(normal, texture2D(uNormalMapSlope, uv.xy), slope);
      #endif
      #endif
      return normalize(normal.xzy * 2.0 - 1.0);
    }

    #endif
  `,
  fs_surface: glsl`
    #ifdef SPLATTING
    vec2 splatUV = vTexture.xy * uTiling;
    vec4 splatWeight = texture2D(uSplatMap, vTexture.xy).rgba;
    float splatSlope = splatBlendSlope((1.0 - vWorldNormal.y) * uSlopeStrength, splatUV);
    surface.BaseColor.rgb = splatColor(splatUV, splatWeight, splatSlope).rgb;
    #ifdef SPLATTING_TINT
    surface.BaseColor.rgb *= texture2D(uTintMap, vTexture.xy).rgb;
    #endif

    #if defined(SPLATTING_NORMAL) && defined(V_TBN)
    surface.Normal.xyz = normalize(vTTW * splatNormal(splatUV, splatWeight, splatSlope).rbg);
    #elif defined(V_NORMAL)
    surface.Normal.xyz = normalize(vWorldNormal.xyz);
    #endif

    surface.BaseColor.a = 1.0;
    #endif
  `,
}
