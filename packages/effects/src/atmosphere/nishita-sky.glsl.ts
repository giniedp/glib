export const NISHITA_SKY_UTILS_GLSL = /* glsl */ `

  #define PI 3.141592653589793

  float coordToHeightScale(float t) {
    return exp(10.0 * (t - 1.0)) * t;
  }

  float coordToCosAngle(float t) {
    return 1.0 - 2.0 * t;
  }

  float cosAngleToCoord(float cosAngle) {
    return 0.5 - cosAngle * 0.5;
  }

  vec3 latLonToDir(float latitude, float longitude) {
    float cosLat = cos(latitude);
    float sinLat = sin(latitude);
    float cosLon = cos(longitude);
    float sinLon = sin(longitude);
    return vec3(
      cosLat * cosLon,
      cosLat * sinLon,
      sinLat
    );
  }

  vec3 uvToDir(vec2 uv) {
    float latitude  = (1.0 -       uv.y) * PI * 0.5;
    float longitude = (1.0 - 2.0 * uv.x) * PI;
    return latLonToDir(latitude, longitude);
  }

  float getMiePhase(float g, float cosine) {
    float g2 = g * g;
    float miePart = 1.5 * (1.0 - g2) / (2.0 + g2);
    return miePart * (1.0 + (cosine * cosine)) / pow(1.0 + g2 - 2.0 * g * cosine, 1.5);
  }

  float getRayleighPhase(float cosine) {
    return 0.75 * (1.0 + cosine * cosine);
  }

  float getOpticalScale(float height, float avgDensityHeightInv) {
    return exp(-max(height, 0.0) * avgDensityHeightInv);
  }

  float getOpticalDepth(
    float viewHeight,
    vec3 viewDir,
    float avgDensityHeightInv,
    float radius,
    float thickness
  ) {
    vec3 viewPos = vec3(0.0, viewHeight + radius, 0.0);

    // check if ray hits earth
    // compute B, and C of quadratic function (A=1, as looking direction is normalized)
    float B = 2.0 * dot(viewPos, viewDir);
    float B2 = B * B;
    float Cpart = dot(viewPos, viewPos);

    float C = Cpart - radius * radius;
    float det = B2 - 4.0 * C;

    if (det >= 0.0) {
      float sq = sqrt(det);
      float t1 = 0.5 * (-B - sq);
      float t2 = 0.5 * (-B + sq);
      if ((t1 > 1e-4) || (t2 > 1e-4)) {
        // ray hits earth
        return 60000.0; // half-float-safe sentinel
      }
    }

    // find intersection with atmosphere top
    C = Cpart - (radius + thickness) * (radius + thickness);
    det = B2 - 4.0 * C;
    float t = max(0.0, 0.5 * (-B + sqrt(det)));

    // integrate depth along ray from camera to atmosphere top
    // use Composite Simpson's 1/3 rule
    // https://en.wikipedia.org/wiki/Simpson%27s_rule#Composite_Simpson's_1/3_rule_2
    float depth = 0.0;
    const int steps = 32;
    float h = t / float(steps);
    for (int i = 0; i <= steps; ++i) {
      vec3 samplePos = viewPos + viewDir * (h * float(i));
      float sampleHeight = length(samplePos) - radius;
      float density = getOpticalScale(sampleHeight, avgDensityHeightInv);
      float weight = (i == 0 || i == steps) ? 1.0 : ((i & 1) == 0 ? 2.0 : 4.0);
      depth += density * weight;
    }
    return depth * h / 3.0;
  }
`

export const NISHITA_OPTICAL_LUT_GLSL_FS = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  ${NISHITA_SKY_UTILS_GLSL}

  // @block params
  layout(std140) uniform Uniforms {
    float radius;              // planet radius in km e.g. 6368.0 for earth
    float thickness;           // atmosphere thickness in km e.g. 100 for earth
    float mieScaleHeight;      // height in km where average aerosols density is found, e.g. 1.2 for earth
    float rayleighScaleHeight; // height in km where average air molecule density is found, e.g. 7.994 for earth
  } params;

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    float earthRadius = params.radius;
    float atmosphereHeight = params.thickness;

    float viewHeight = coordToHeightScale(uv.y) * atmosphereHeight;
    float cosAngle   = coordToCosAngle(uv.x);
    vec3 viewDir = vec3(sqrt(max(1.0 - cosAngle * cosAngle, 0.0)), cosAngle, 0.0);

    float mieInv = 1.0 / params.mieScaleHeight;
    float rayInv = 1.0 / params.rayleighScaleHeight;

    float mieDepth = getOpticalDepth(viewHeight, viewDir, mieInv, earthRadius, atmosphereHeight);
    float rayDepth = getOpticalDepth(viewHeight, viewDir, rayInv, earthRadius, atmosphereHeight);
    float mieScale = getOpticalScale(viewHeight, mieInv);
    float rayScale = getOpticalScale(viewHeight, rayInv);

    fragColor = vec4(mieDepth, rayDepth, mieScale, rayScale);
  }
`

export const NISHITA_SCATTERING_GLSL_FS = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  ${NISHITA_SKY_UTILS_GLSL}

  // @block params
  layout(std140) uniform Uniforms {
    vec3  waveLengthInv;      // pow(waveLength * 0.001, -4.0)
    float sunLatitude;
    float sunLongitude;
    float radius;
    float thickness;
    float mieScattering;      // km
    float rayleighScattering; // kr
    float phaseAsymmetry;     // g
  } params;

  // @alias opticalLutMap
  uniform sampler2D opticalLutSampler;

  struct PartialScattering {
    vec3 mie;
    vec3 rayleigh;
  };

  PartialScattering partialInScatteringAtHeight(
    float outScatteringMie,
    vec3 outScatteringRayleigh,
    vec2 osAtHeight,    // x = mie, y = rayleigh
    vec2 odAtHeightSky, // x = mie, y = rayleigh
    vec2 odAtViewerSky, // x = mie, y = rayleigh
    vec2 odAtHeightSun  // x = mie, y = rayleigh
  ) {

    // mie out-scattering
    float sampleExpArgMie = outScatteringMie * (-odAtHeightSun.x - (odAtViewerSky.x - odAtHeightSky.x));

    // rayleigh out-scattering
    vec3 sampleExpArgRayleigh = outScatteringRayleigh * (-odAtHeightSun.y - (odAtViewerSky.y - odAtHeightSky.y));

    // partial in-scattering sampling result
    vec3 sampleRes = exp(vec3(sampleExpArgMie) + sampleExpArgRayleigh);

    PartialScattering result;
    result.mie = osAtHeight.x * sampleRes;
    result.rayleigh = osAtHeight.y * sampleRes;

    return result;
  }

  in vec2 uv;
  layout(location = 0) out vec4 colorMie;
  layout(location = 1) out vec4 colorRayleigh;

  void main() {
    vec3 skyDir = uvToDir(uv);
    vec3 sunDir = latLonToDir(params.sunLatitude, params.sunLongitude);
    float km = params.mieScattering;
    float kr = params.rayleighScattering;
    float g = params.phaseAsymmetry;

    float outScatteringMie      = 4.0 * PI * km;
    vec3  outScatteringRayleigh = 4.0 * PI * kr * params.waveLengthInv;

    vec3 upDir = vec3(0.0, 0.0, 1.0);
    vec3 viewPos = upDir * params.radius;
    vec3 rayPos = viewPos;

    // to be reused by ray-sphere intersection code in loop below
    float B = 2.0 * dot(viewPos, skyDir);
    float B2 = B * B;
    float Cpart = dot(viewPos, viewPos);

    vec4 sampleViewerSky = texture(opticalLutSampler, vec2(cosAngleToCoord(dot(skyDir, upDir)), 0.0));
    vec4 sampleViewerSun = texture(opticalLutSampler, vec2(cosAngleToCoord(dot(sunDir, upDir)), 0.0));

    PartialScattering current = partialInScatteringAtHeight(
      outScatteringMie,
      outScatteringRayleigh,
      sampleViewerSky.zw,
      sampleViewerSky.xy,
      sampleViewerSky.xy,
      sampleViewerSun.xy
    );

    vec3 resultMie = vec3(0.0);
    vec3 resultRayleigh = vec3(0.0);

    const int steps = 10;
    float stepSize = 1.0 / float(steps);
    for (int i = 1; i <= steps; ++i) {
      float s = stepSize * float(i);
      float height = params.radius + coordToHeightScale(s) * params.thickness;

      float C = Cpart - height * height;
      float det = B2 - 4.0 * C;
      float t = 0.5 * (-B + sqrt(det));

      vec3 newRayPos = viewPos + t * skyDir;
      vec3 newUp = normalize(newRayPos);

      vec4 sampleHeightSky = texture(opticalLutSampler, vec2(cosAngleToCoord(dot(skyDir, newUp)), s));
      vec4 sampleHeightSun = texture(opticalLutSampler, vec2(cosAngleToCoord(dot(sunDir, newUp)), s));
      vec2 odHeightSky = min(sampleHeightSky.xy, sampleViewerSky.xy);
      PartialScattering next = partialInScatteringAtHeight(
        outScatteringMie,
        outScatteringRayleigh,
        sampleHeightSky.zw,
        odHeightSky,
        sampleViewerSky.xy,
        sampleHeightSun.xy
      );

      float weight = length(newRayPos - rayPos) * 0.5;
      resultMie += (current.mie + next.mie) * weight;
      resultRayleigh += (current.rayleigh + next.rayleigh) * weight;

      rayPos = newRayPos;
      current = next;
    }

    // clamp to safe half float value
    resultMie = min(resultMie, vec3(60000.0));
    resultRayleigh = min(resultRayleigh, vec3(60000.0));

    colorMie = vec4(resultMie, 1.0);
    colorRayleigh = vec4(resultRayleigh, 1.0);
  }
`

export const NISHITA_PANORAMA_GLSL_FS = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  ${NISHITA_SKY_UTILS_GLSL}

  // @block params
  layout(std140) uniform Uniforms {
    vec3  groundColor;
    vec3  waveLengthInv;      // pow(waveLength * 0.001, -4)
    vec3  sunIntensity;
    float sunLatitude;
    float sunLongitude;
    float mieScattering;      // km
    float rayleighScattering; // kr
    float phaseAsymmetry;     // g

  } params;


  // @alias mieScatteringMap
  uniform sampler2D mieScatteringSampler;
  // @alias rayleighScatteringMap
  uniform sampler2D rayleighScatteringSampler;

  in vec2 uv;
  out vec4 fragColor;
  void main() {
    vec2 texCoord = uv;
    // expand uv.y to cover lower hemisphere
    // which will receive the ground color below
    texCoord.y = 2.0 * texCoord.y;

    vec3 skyDir = uvToDir(texCoord);
    vec3 sunDir = latLonToDir(params.sunLatitude, params.sunLongitude);
    float km = params.mieScattering;
    float kr = params.rayleighScattering;
    float g = params.phaseAsymmetry;
    vec3 ground = params.groundColor;

    vec3 mieColor      = texture(mieScatteringSampler, texCoord).rgb;
    vec3 rayleighColor = texture(rayleighScatteringSampler, texCoord).rgb;

    float cosAngle      = dot(skyDir, -sunDir);
    float miePhase      = getMiePhase(g, cosAngle);
    float rayleighPhase = getRayleighPhase(cosAngle);

    vec3 partialMieConst      = params.sunIntensity * km;
    vec3 partialRayleighConst = params.sunIntensity * kr * params.waveLengthInv;

    vec3 color = vec3(0.0);
    if (texCoord.y <= 1.0) {
      // upper hemisphere
      color += mieColor * partialMieConst * miePhase;
      color += rayleighColor * partialRayleighConst * rayleighPhase;
    } else {
      // lower hemisphere, ground color contribution
      color += rayleighColor * partialRayleighConst * rayleighPhase * ground;
    }

    color = min(color, vec3(60000.0));
    fragColor = vec4(color, 1.0);
  }
`
