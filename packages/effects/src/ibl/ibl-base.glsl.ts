// taken from:
//  https://github.com/KhronosGroup/glTF-Sample-Renderer/blob/main/source/shaders/ibl_filtering.frag

export const IBL_BASE_GLSL = /*glsl*/ `
  #define MATH_PI 3.1415926535897932384626433832795
  #define MATH_INV_PI (1.0 / MATH_PI)

  const int DIST_LAMBERT = 0;
  const int DIST_GGX = 1;
  const int DIST_CHARLIE = 2;

  vec3 uvToXYZ(int face, vec2 uv) {
    switch (face) {
      case 0:
        return vec3( 1.0, uv.y, -uv.x );
      case 1:
        return vec3( -1.0, uv.y, uv.x );
      case 2:
        return vec3( +uv.x, -1.0, +uv.y );
      case 3:
        return vec3( +uv.x, 1.0, -uv.y );
      case 4:
        return vec3( +uv.x, uv.y, 1.0 );
      default:
        return vec3( -uv.x, +uv.y, -1.0 );
    }
  }

  float saturate(float v) {
    return clamp(v, 0.0f, 1.0f);
  }

  // Hammersley Points on the Hemisphere
  // CC BY 3.0 (Holger Dammertz)
  // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
  // with adapted interface
  float radicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
  }

  // hammersley2d describes a sequence of points in the 2d unit square [0,1)^2
  // that can be used for quasi Monte Carlo integration
  vec2 hammersley2d(int i, int N) {
    return vec2(float(i) / float(N), radicalInverse_VdC(uint(i)));
  }

  // TBN generates a tangent bitangent normal coordinate frame from the normal
  // (the normal must be normalized)
  mat3 generateTBN(vec3 normal) {
    vec3 bitangent = vec3(0.0, 1.0, 0.0);

    float NdotUp = dot(normal, vec3(0.0, 1.0, 0.0));
    float epsilon = 0.0000001;
    if (1.0 - abs(NdotUp) <= epsilon) {
      // Sampling +Y or -Y, so we need a more robust bitangent.
      if (NdotUp > 0.0) {
        bitangent = vec3(0.0, 0.0, 1.0);
      } else {
        bitangent = vec3(0.0, 0.0, -1.0);
      }
    }

    vec3 tangent = normalize(cross(bitangent, normal));
    bitangent = cross(normal, tangent);

    return mat3(tangent, bitangent, normal);
  }

  struct MicrofacetDistributionSample {
    float pdf;
    float cosTheta;
    float sinTheta;
    float phi;
  };

  float D_GGX(float NdotH, float roughness) {
    float a = NdotH * roughness;
    float k = roughness / (1.0 - NdotH * NdotH + a * a);
    return k * k * (1.0 / MATH_PI);
  }


  // GGX microfacet distribution
  // https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.html
  // This implementation is based on https://bruop.github.io/ibl/,
  //  https://www.tobias-franke.eu/log/2014/03/30/notes_on_importance_sampling.html
  // and https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch20.html
  MicrofacetDistributionSample GGX(vec2 xi, float roughness)
  {
    MicrofacetDistributionSample ggx;

    // evaluate sampling equations
    float alpha = roughness * roughness;
    ggx.cosTheta = saturate(sqrt((1.0 - xi.y) / (1.0 + (alpha * alpha - 1.0) * xi.y)));
    ggx.sinTheta = sqrt(1.0 - ggx.cosTheta * ggx.cosTheta);
    ggx.phi = 2.0 * MATH_PI * xi.x;

    // evaluate GGX pdf (for half vector)
    ggx.pdf = D_GGX(ggx.cosTheta, alpha);

    // Apply the Jacobian to obtain a pdf that is parameterized by l
    // see https://bruop.github.io/ibl/
    // Typically you'd have the following:
    // float pdf = D_GGX(NoH, roughness) * NoH / (4.0 * VoH);
    // but since V = N => VoH == NoH
    ggx.pdf /= 4.0;

    return ggx;
  }

  // NDF
  float D_Ashikhmin(float NdotH, float roughness) {
    float alpha = roughness * roughness;
    // Ashikhmin 2007, "Distribution-based BRDFs"
    float a2 = alpha * alpha;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    float sin4h = sin2h * sin2h;
    float cot2 = -cos2h / (a2 * sin2h);
    return 1.0 / (MATH_PI * (4.0 * a2 + 1.0) * sin4h) * (4.0 * exp(cot2) + sin4h);
  }

  // NDF
  float D_Charlie(float sheenRoughness, float NdotH) {
    sheenRoughness = max(sheenRoughness, 0.000001); //clamp (0,1]
    float invR = 1.0 / sheenRoughness;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * MATH_PI);
  }


  MicrofacetDistributionSample Charlie(vec2 xi, float roughness) {
    MicrofacetDistributionSample charlie;

    float alpha = roughness * roughness;
    charlie.sinTheta = pow(xi.y, alpha / (2.0*alpha + 1.0));
    charlie.cosTheta = sqrt(1.0 - charlie.sinTheta * charlie.sinTheta);
    charlie.phi = 2.0 * MATH_PI * xi.x;

    // evaluate Charlie pdf (for half vector)
    charlie.pdf = D_Charlie(alpha, charlie.cosTheta);

    // Apply the Jacobian to obtain a pdf that is parameterized by l
    charlie.pdf /= 4.0;

    return charlie;
  }

  MicrofacetDistributionSample Lambertian(vec2 xi, float roughness) {
    MicrofacetDistributionSample lambertian;

    // Cosine weighted hemisphere sampling
    // http://www.pbr-book.org/3ed-2018/Monte_Carlo_Integration/2D_Sampling_with_Multidimensional_Transformations.html#Cosine-WeightedHemisphereSampling
    lambertian.cosTheta = sqrt(1.0 - xi.y);
    lambertian.sinTheta = sqrt(xi.y); // equivalent to sqrt(1.0 - cosTheta*cosTheta);
    lambertian.phi = 2.0 * MATH_PI * xi.x;

    lambertian.pdf = lambertian.cosTheta / MATH_PI; // evaluation for solid angle, therefore drop the sinTheta

    return lambertian;
  }

  // getImportanceSample returns an importance sample direction with pdf in the .w component
  vec4 getImportanceSample(int sampleIndex, vec3 N, float roughness, int samples, int distribution) {
    // generate a quasi monte carlo point in the unit square [0.1)^2
    vec2 xi = hammersley2d(sampleIndex, samples);

    MicrofacetDistributionSample importanceSample;

    // generate the points on the hemisphere with a fitting mapping for
    // the distribution (e.g. lambertian uses a cosine importance)

    if(distribution == DIST_LAMBERT) {
      importanceSample = Lambertian(xi, roughness);
    } else if(distribution == DIST_GGX) {
      // Trowbridge-Reitz / GGX microfacet model (Walter et al)
      // https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.html
      importanceSample = GGX(xi, roughness);
    } else if(distribution == DIST_CHARLIE) {
      importanceSample = Charlie(xi, roughness);
    }

    // transform the hemisphere sample to the normal coordinate frame
    // i.e. rotate the hemisphere to the normal direction
    vec3 localSpaceDirection = normalize(vec3(
        importanceSample.sinTheta * cos(importanceSample.phi),
        importanceSample.sinTheta * sin(importanceSample.phi),
        importanceSample.cosTheta
    ));
    mat3 TBN = generateTBN(N);
    vec3 direction = TBN * localSpaceDirection;

    return vec4(direction, importanceSample.pdf);
  }

  // From the filament docs. Geometric Shadowing function
  // https://google.github.io/filament/Filament.html#toc4.4.2
  float V_SmithGGXCorrelated(float NoV, float NoL, float roughness) {
    float a2 = pow(roughness, 4.0);
    float GGXV = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
    float GGXL = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
    return 0.5 / (GGXV + GGXL);
  }

  // https://github.com/google/filament/blob/master/shaders/src/brdf.fs#L136
  float V_Ashikhmin(float NdotL, float NdotV) {
    return clamp(1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV)), 0.0, 1.0);
  }

`
