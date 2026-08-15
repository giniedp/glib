// https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

import { FULLSCREEN_WGSL_VS } from '../image/common.wgsl'
import { IBL_BASE_WGSL } from './ibl-base.wgsl'

export const IBL_SAMPLE_WGSL = /* wgsl */ `

  ${FULLSCREEN_WGSL_VS}
  ${IBL_BASE_WGSL}

  struct Uniforms {
    currentFace     : i32,
    roughness       : f32,
    samples         : i32,
    width           : i32,
    lodBias         : f32,
    distribution    : i32, // enum: DISTRIBUTION_*
    isGeneratingLUT : i32,
    floatTexture    : i32, // 0: byte, 1: float
    intensity       : f32,
  };

  // @block params
  @group(0) @binding(0) var<uniform> params: Uniforms;

  // @alias cubemap
  @group(1) @binding(0) var cubemap: texture_cube<f32>;
  @group(1) @binding(1) var cubemapSampler: sampler;

  // Mipmap Filtered Samples (GPU Gems 3, 20.4)
  // https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-20-gpu-based-importance-sampling
  // https://cgg.mff.cuni.cz/~jaroslav/papers/2007-sketch-fis/Final_sap_0073.pdf
  fn computeLod(pdf: f32) -> f32 {
    // Adapted from Krivanek & Colbert, cubemap solid-angle ratio formulation.
    let lod = 0.5 * log2(6.0 * f32(params.width) * f32(params.width) / (f32(params.samples) * pdf));
    return lod;
  }

  fn filterColor(N: vec3f) -> vec3f {
    var color = vec3f(0.0);
    var weight = 0.0;

    for (var i: i32 = 0; i < params.samples; i++) {
      let importanceSample = getImportanceSample(i, N, params.roughness, params.samples, params.distribution);

      let H = importanceSample.xyz;
      let pdf = importanceSample.w;

      // mipmap filtered samples (GPU Gems 3, 20.4)
      var lod = computeLod(pdf);

      // apply the bias to the lod
      lod += params.lodBias;

      if (params.distribution == DISTRIBUTION_LAMBERT) {
        // sample lambertian at a lower resolution to avoid fireflies
        color += textureSampleLevel(cubemap, cubemapSampler, H, lod).rgb * params.intensity;
      } else {
        // params.distribution == DISTRIBUTION_GGX || params.distribution == DISTRIBUTION_CHARLIE
        // Note: reflect takes incident vector.
        let V = N;
        let L = normalize(reflect(-V, H));
        let NdotL = dot(N, L);

        if (NdotL > 0.0) {
          if (params.roughness == 0.0) {
            // without this the roughness=0 lod is too high
            lod = params.lodBias;
          }
          let sampleColor = textureSampleLevel(cubemap, cubemapSampler, L, lod).rgb * params.intensity;
          color += sampleColor * NdotL;
          weight += NdotL;
        }
      }
    }

    if (weight != 0.0) {
      color /= weight;
    } else {
      color /= f32(params.samples);
    }

    return color;
  }

  fn filterCubemap(uv: vec2f, currentFace: u32) -> vec3f {
    var color = vec3f(0.0);
    let newUV = uv * 2.0 - 1.0;
    let scan = uvToXYZ(currentFace, newUV);

    var direction = normalize(scan);
    direction.y = -direction.y;

    color = filterColor(direction);

    if (params.floatTexture == 0) {
      color /= params.intensity;
      color = clamp(color, vec3f(0.0), vec3f(1.0));
    }

    return color;
  }




  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    let currentFace = in.instanceIndex;
    return vec4f(filterCubemap(in.uv, currentFace), 1.0);
  }
`
