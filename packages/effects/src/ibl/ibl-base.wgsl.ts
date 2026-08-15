// https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

export const IBL_BASE_WGSL = /* wgsl */ `

  const MATH_PI: f32 = 3.1415926535897932384626433832795;
  const MATH_INV_PI: f32 = 1.0 / MATH_PI;

  const DISTRIBUTION_LAMBERT: i32 = 0;
  const DISTRIBUTION_GGX: i32       = 1;
  const DISTRIBUTION_CHARLIE: i32   = 2;

  fn uvToXYZ(face: u32, uv: vec2f) -> vec3f {
    switch (face) {
      case 0: {
        return vec3f( 1.0, uv.y, -uv.x );
      }
      case 1: {
        return vec3f( -1.0, uv.y, uv.x );
      }
      case 2: {
        return vec3f( uv.x, -1.0, uv.y );
      }
      case 3: {
        return vec3f( uv.x, 1.0, -uv.y );
      }
      case 4: {
        return vec3f( uv.x, uv.y, 1.0 );
      }
      default: {
        return vec3f( -uv.x, uv.y, -1.0 );
      }
    }
  }

  fn saturate(v: f32) -> f32 {
    return clamp(v, 0.0, 1.0);
  }

  // Hammersley Points on the Hemisphere
  // CC BY 3.0 (Holger Dammertz)
  // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
  fn radicalInverse_VdC(bits_in: u32) -> f32 {
    var bits = bits_in;
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return f32(bits) * 2.3283064365386963e-10; // / 0x100000000
  }

  // hammersley2d describes a sequence of points in the 2d unit square [0,1)^2
  // that can be used for quasi Monte Carlo integration
  fn hammersley2d(i: i32, n: i32) -> vec2f {
    return vec2f(f32(i) / f32(n), radicalInverse_VdC(u32(i)));
  }

  // TBN generates a tangent bitangent normal coordinate frame from the normal
  // (the normal must be normalized)
  fn generateTBN(normal: vec3f) -> mat3x3f {
    var bitangent = vec3f(0.0, 1.0, 0.0);

    let NdotUp = dot(normal, vec3f(0.0, 1.0, 0.0));
    let epsilon = 0.0000001;
    if (1.0 - abs(NdotUp) <= epsilon) {
      // Sampling +Y or -Y, so we need a more robust bitangent.
      if (NdotUp > 0.0) {
        bitangent = vec3f(0.0, 0.0, 1.0);
      } else {
        bitangent = vec3f(0.0, 0.0, -1.0);
      }
    }

    let tangent = normalize(cross(bitangent, normal));
    let newBitangent = cross(normal, tangent);

    return mat3x3f(tangent, newBitangent, normal);
  }

  struct MicrofacetDistributionSample {
    pdf: f32,
    cosTheta: f32,
    sinTheta: f32,
    phi: f32,
  };

  fn D_GGX(NdotH: f32, roughness: f32) -> f32 {
    let a = NdotH * roughness;
    let k = roughness / (1.0 - NdotH * NdotH + a * a);
    return k * k * (1.0 / MATH_PI);
  }

  // GGX microfacet distribution
  // https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.html
  // This implementation is based on https://bruop.github.io/ibl/,
  //  https://www.tobias-franke.eu/log/2014/03/30/notes_on_importance_sampling.html
  // and https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch20.html
  fn GGX(xi: vec2f, roughness: f32) -> MicrofacetDistributionSample {
    var ggx: MicrofacetDistributionSample;

    let alpha = roughness * roughness;
    ggx.cosTheta = saturate(sqrt((1.0 - xi.y) / (1.0 + (alpha * alpha - 1.0) * xi.y)));
    ggx.sinTheta = sqrt(1.0 - ggx.cosTheta * ggx.cosTheta);
    ggx.phi = 2.0 * MATH_PI * xi.x;

    // evaluate GGX pdf (for half vector)
    ggx.pdf = D_GGX(ggx.cosTheta, alpha);

    // Apply the Jacobian to obtain a pdf that is parameterized by l
    // see https://bruop.github.io/ibl/
    ggx.pdf /= 4.0;

    return ggx;
  }

  // NDF
  fn D_Ashikhmin(NdotH: f32, roughness: f32) -> f32 {
    let alpha = roughness * roughness;
    // Ashikhmin 2007, "Distribution-based BRDFs"
    let a2 = alpha * alpha;
    let cos2h = NdotH * NdotH;
    let sin2h = 1.0 - cos2h;
    let sin4h = sin2h * sin2h;
    let cot2 = -cos2h / (a2 * sin2h);
    return 1.0 / (MATH_PI * (4.0 * a2 + 1.0) * sin4h) * (4.0 * exp(cot2) + sin4h);
  }

  // NDF
  fn D_Charlie(sheenRoughness_in: f32, NdotH: f32) -> f32 {
    let sheenRoughness = max(sheenRoughness_in, 0.000001); // clamp (0,1]
    let invR = 1.0 / sheenRoughness;
    let cos2h = NdotH * NdotH;
    let sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * MATH_PI);
  }

  fn Charlie(xi: vec2f, roughness: f32) -> MicrofacetDistributionSample {
    var charlie: MicrofacetDistributionSample;

    let alpha = roughness * roughness;
    charlie.sinTheta = pow(xi.y, alpha / (2.0 * alpha + 1.0));
    charlie.cosTheta = sqrt(1.0 - charlie.sinTheta * charlie.sinTheta);
    charlie.phi = 2.0 * MATH_PI * xi.x;

    // evaluate Charlie pdf (for half vector)
    charlie.pdf = D_Charlie(alpha, charlie.cosTheta);

    // Apply the Jacobian to obtain a pdf that is parameterized by l
    charlie.pdf /= 4.0;

    return charlie;
  }

  fn Lambertian(xi: vec2f, roughness: f32) -> MicrofacetDistributionSample {
    var lambertian: MicrofacetDistributionSample;

    // Cosine weighted hemisphere sampling
    // http://www.pbr-book.org/3ed-2018/Monte_Carlo_Integration/2D_Sampling_with_Multidimensional_Transformations.html#Cosine-WeightedHemisphereSampling
    lambertian.cosTheta = sqrt(1.0 - xi.y);
    lambertian.sinTheta = sqrt(xi.y); // equivalent to sqrt(1.0 - cosTheta*cosTheta)
    lambertian.phi = 2.0 * MATH_PI * xi.x;

    lambertian.pdf = lambertian.cosTheta / MATH_PI; // evaluation for solid angle, therefore drop the sinTheta

    return lambertian;
  }

  // getImportanceSample returns an importance sample direction with pdf in the .w component
  fn getImportanceSample(sampleIndex: i32, N: vec3f, roughness: f32, samples: i32, distribution: i32) -> vec4f {
    // generate a quasi monte carlo point in the unit square [0,1)^2
    let xi = hammersley2d(sampleIndex, samples);

    var importanceSample: MicrofacetDistributionSample;

    // generate the points on the hemisphere with a fitting mapping for
    // the distribution (e.g. lambertian uses a cosine importance)
    switch (distribution) {
      case DISTRIBUTION_GGX: {
        // Trowbridge-Reitz / GGX microfacet model (Walter et al)
        importanceSample = GGX(xi, roughness);
      }
      case DISTRIBUTION_CHARLIE: {
        importanceSample = Charlie(xi, roughness);
      }
      default: {
        importanceSample = Lambertian(xi, roughness);
      }
    }

    // transform the hemisphere sample to the normal coordinate frame
    // i.e. rotate the hemisphere to the normal direction
    let localSpaceDirection = normalize(vec3f(
      importanceSample.sinTheta * cos(importanceSample.phi),
      importanceSample.sinTheta * sin(importanceSample.phi),
      importanceSample.cosTheta
    ));
    let TBN = generateTBN(N);
    let direction = TBN * localSpaceDirection;

    return vec4f(direction, importanceSample.pdf);
  }

  // From the filament docs. Geometric Shadowing function
  // https://google.github.io/filament/Filament.html#toc4.4.2
  fn V_SmithGGXCorrelated(NoV: f32, NoL: f32, roughness: f32) -> f32 {
    let a2 = pow(roughness, 4.0);
    let GGXV = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
    let GGXL = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
    return 0.5 / (GGXV + GGXL);
  }

  // https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L136
  fn V_Ashikhmin(NdotL: f32, NdotV: f32) -> f32 {
    return clamp(1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV)), 0.0, 1.0);
  }

`
