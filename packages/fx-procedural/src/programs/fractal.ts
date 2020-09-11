import { proceduralProgram } from './base';
import { glsl, ShaderChunkSet } from '@gglib/graphics';

/**
 * @public
 */
export interface FbmDefs {
  FBM?: 'fbmFractal' | 'fbmMultifractal' | 'fbmHyridMultifractal' | 'fbmRigedMultifractal'
  /**
   *
   */
  MAX_FBM_OCTAVES?: number
  /**
   *
   */
  FBM_SAMPLE?: string,
}

export const CHUNK_FBM: ShaderChunkSet<FbmDefs> = Object.freeze({
  defines: glsl`
    #if !defined(MAX_FBM_OCTAVES)
      #define MAX_FBM_OCTAVES 10
    #endif
    #if !defined(FBM_SAMPLE)
      #define FBM_SAMPLE perlinNoise(point.xy)
    #endif
    #if !defined(FBM)
      #define FBM fbmFractal
    #endif
  `,
  uniforms: glsl`
    // @range [1, 10]
    // @default 8
    // @remarks The number of frequencies
    uniform float octaves;
    // @default 1
    uniform float frequency;
    // @default 2
    // @remarks The gap between successive frequencies
    uniform float lacunarity;
    // @default 1
    // @remarks The fractal increment parameter
    uniform float persistence;
    // @default 1
    uniform float offset;
    // @default 2
    uniform float gain;
    // @default 0
    // @binding normalize
    uniform bool uNormalize;
  `,
  functions: glsl`
    float fbmFractal(in vec4 point) {
      float sample = 0.0;
      point *= frequency;
      for (int j = 0; j <= MAX_FBM_OCTAVES; j++) {
        sample += FBM_SAMPLE * pow(lacunarity, float(-j) * persistence);
        point *= lacunarity;
        if (j >= int(octaves)) {
          break;
        }
      }
      return sample;
    }
    float fbmMultifractal(in vec4 point) {
      float sample = 1.0;
      for (int j = 1; j <= MAX_FBM_OCTAVES; j++) {
        sample *= (FBM_SAMPLE + offset) * pow(lacunarity, float(-j) * persistence);
        point *= lacunarity;
        if (j >= int(octaves)) {
          break;
        }
      }
      return sample;
    }
    float fbmHyridMultifractal(in vec4 point) {
      float sample = 0.0;
      float signal = 0.0;
      float weight = 1.0;
      for (int j = 1; j <= MAX_FBM_OCTAVES; j++) {
        point *= lacunarity;
        weight = weight > 1.0 ? 1.0 : weight;
        signal = (FBM_SAMPLE + offset) * pow(lacunarity, float(-j) * persistence);
        sample += signal * weight;
        weight *= signal;
        if (j >= int(octaves)) {
          break;
        }
      }
      return sample;
    }
    float fbmRigedMultifractal(in vec4 point) {
      point *= frequency;
      float sample = 0.0;
      float signal = 0.0;
      float weight = 0.0;

      // get first octave
      signal = FBM_SAMPLE;
      // get absolute value. this creates the ridges
      signal = signal < 0.0 ? -signal : signal;
      // invert and translate (offset should be ~= 1)
      signal = offset - signal;
      // square the signal to increase the sharpness
      signal *= signal;
      // assign initial value
      sample = signal;

      for (int j = 1; j <= MAX_FBM_OCTAVES; j++) {
        point *= lacunarity;

        weight = clamp(signal * gain, 0.0, 1.0);
        weight = weight > 1.0 ? 1.0 : (weight < 0.0 ? 0.0 : weight);

        signal = FBM_SAMPLE;
        signal = signal < 0.0 ? -signal : signal;
        signal = offset - signal;
        signal *= signal;
        sample += signal * pow(lacunarity, float(-j) * persistence);
        if (j >= int(octaves)) {
          break;
        }
      }
      return sample;
    }
  `,
  fs_main_noise: glsl`
    #if defined(FBM)
    sample = FBM(point);
    if (uNormalize) {
      sample = (sample + 1.0) / 2.0;
    }
    #endif
  `,
})

export function fractalProgram(defs?: FbmDefs) {
  return proceduralProgram(defs, [CHUNK_FBM])
}
