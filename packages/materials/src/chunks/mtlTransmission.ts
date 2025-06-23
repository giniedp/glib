import { glsl, ShaderChunkSet } from '@gglib/graphics'

export interface MtlTransmissionDefs {
  TRANSMISSION?: boolean
  TRANSMISSION_MAP?: boolean
  TRANSMISSION_MAP_UV?: string
  TRANSMISSION_MAP_SCALE_OFFSET?: boolean
  TRANSMISSION_MAP_TRANSFORM?: boolean
}

export const MTL_TRANSMISSION: ShaderChunkSet<MtlTransmissionDefs> = {
  defines: glsl`

  `,
  uniforms: glsl`
    #ifdef TRANSMISSION
    // @binding Transmission
    // @default 0.0
    uniform float uTransmission;
    #endif

    #ifdef TRANSMISSION_MAP
    // @binding TransmissionMap
    uniform sampler2D uTransmissionMap;
    #endif

    #ifdef TRANSMISSION_MAP_SCALE_OFFSET
    // @binding TransmissionMapScaleOffset
    uniform vec4 uTransmissionMapScaleOffset;
    #endif

    #ifdef TRANSMISSION_MAP_TRANSFORM
    // @binding TransmissionMapTransform
    uniform mat3 uTransmissionMapTransform;
    #endif
  `,
  functions: glsl`
    #ifdef TRANSMISSION_MAP
    vec2 getTransmissionMapUV() {
      vec2 result = TRANSMISSION_MAP_UV;

      #ifdef TRANSMISSION_MAP_SCALE_OFFSET
      result = result * uTransmissionMapScaleOffset.xy + uTransmissionMapScaleOffset.zw;
      #endif

      #ifdef TRANSMISSION_MAP_TRANSFORM
      result = (uTransmissionMapTransform * vec3(result, 1.0)).xy;
      #endif

      return result;
    }
    #endif

    float getTransmission(vec2 uvOffset) {
      float value = 0.0;

      #if defined(TRANSMISSION_MAP)
      value = uTransmission * texture2D(uTransmissionMap, getTransmissionMapUV() + uvOffset).r;
      #elif defined(TRANSMISSION)
      value = uTransmission;
      #endif

      return value;
    }
  `,
  fs_surface: glsl`

  `,
}
