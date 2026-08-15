// taken from:
//  https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

import { IBL_BASE_GLSL } from './ibl-base.glsl'

export const IBL_SAMPLE_GLSL = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  ${IBL_BASE_GLSL}

  // @alias cubemap
  uniform samplerCube uCubemap;

  // @block params
  layout(std140) uniform Uniforms {
    int currentFace;
    float roughness;
    int samples;
    int width;
    float lodBias;
    int distribution; // enum
    int isGeneratingLUT;
    int floatTexture; // 0: byte, 1: float
    float intensity;
  } params;

  // Mipmap Filtered Samples (GPU Gems 3, 20.4)
  // https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-20-gpu-based-importance-sampling
  // https://cgg.mff.cuni.cz/~jaroslav/papers/2007-sketch-fis/Final_sap_0073.pdf
  float computeLod(float pdf) {

    // https://cgg.mff.cuni.cz/~jaroslav/papers/2007-sketch-fis/Final_sap_0073.pdf
    float lod = 0.5 * log2( 6.0 * float(params.width) * float(params.width) / (float(params.samples) * pdf));

    return lod;
  }

  vec3 filterColor(vec3 N) {
    //return  textureLod(uCubemap, N, 3.0).rgb;
    vec3 color = vec3(0.f);
    float weight = 0.0f;

    for(int i = 0; i < params.samples; ++i) {
      vec4 importanceSample = getImportanceSample(i, N, params.roughness, params.samples, params.distribution);

      vec3 H = vec3(importanceSample.xyz);
      float pdf = importanceSample.w;

      // mipmap filtered samples (GPU Gems 3, 20.4)
      float lod = computeLod(pdf);

      // apply the bias to the lod
      lod += params.lodBias;

      if(params.distribution == DIST_LAMBERT) {
        // sample lambertian at a lower resolution to avoid fireflies
        vec3 lambertian = textureLod(uCubemap, H, lod).rgb * params.intensity;

        //// the below operations cancel each other out
        // lambertian *= NdotH; // lamberts law
        // lambertian /= pdf; // invert bias from importance sampling
        // lambertian /= MATH_PI; // convert irradiance to radiance https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/

        color += lambertian;

      } else if(params.distribution == DIST_GGX || params.distribution == DIST_CHARLIE) {
        // Note: reflect takes incident vector.
        vec3 V = N;
        vec3 L = normalize(reflect(-V, H));
        float NdotL = dot(N, L);

        if (NdotL > 0.0) {
          if(params.roughness == 0.0) {
            // without this the roughness=0 lod is too high
            lod = params.lodBias;
          }
          vec3 sampleColor = textureLod(uCubemap, L, lod).rgb* params.intensity;
          color += sampleColor * NdotL;
          weight += NdotL;
        }
      }
    }

    if(weight != 0.0f) {
      color /= weight;
    } else {
      color /= float(params.samples);
    }

    return color.rgb ;
  }

  vec3 filterCubemap(vec2 texCoord) {
    vec3 scan = uvToXYZ( params.currentFace, texCoord * 2.0 - 1.0 );
    vec3 direction = normalize(scan);
    direction.y = -direction.y;
    vec3 color = filterColor(direction);

    if(params.floatTexture == 0) {
      float maxV = max(max(color.r,color.g),color.b);
      color/= params.intensity;
      color = clamp(color, 0.0f, 1.0f);
    }

    return color;
  }

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(filterCubemap(uv), 1.0) ;
  }
`
