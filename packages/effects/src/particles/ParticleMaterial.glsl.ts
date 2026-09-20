const BASE = /* glsl */ `

  // @block view
  layout(std140) uniform ViewBlock {
    mat4 viewMatrix;
    mat4 projectionMatrix;
  } view;

  // @block settings
  layout(std140) uniform SettingsBlock {
    vec4 minColor;
    vec4 maxColor;

    vec2 startSize;    // .x=min .y=max
    vec2 endSize;      // .x=min .y=max

    vec2 rotateSpeed;  // .x=min .y=max
    float duration;
    float durationRandomness;

    vec3 gravity;
    float endVelocity;
    float time;
    vec2 scale;
  } settings;

  // @alias colorMap
  uniform sampler2D colorMapSampler;

  // Vertex shader helper for computing the position of a particle.
  vec4 getPosition(
    vec3 position,
    vec3 velocity,
    float age,
    float normalizedAge
  ) {
    float startVelocity = length(velocity);

    // Work out how fast the particle should be moving at the end of its life,
    // by applying a constant scaling factor to its starting velocity.
    float endVelocity = startVelocity * settings.endVelocity;

    // Our particles have constant acceleration, so given a starting velocity
    // S and ending velocity E, at time T their velocity should be S + (E-S)*T.
    // The particle position is the sum of this velocity over the range 0 to T.
    // To compute the position directly, we must integrate the velocity
    // equation. Integrating S + (E-S)*T for T produces S*T + (E-S)*T*T/2.

    float velocityIntegral = startVelocity * normalizedAge + (endVelocity - startVelocity) * normalizedAge * normalizedAge / 2.0;

    position += normalize(velocity) * velocityIntegral * settings.duration;

    // Apply the gravitational force.
    position += settings.gravity * age * normalizedAge;

    // Apply the camera view and projection transforms.
    return view.projectionMatrix * view.viewMatrix * vec4(position, 1);
  }

  // Vertex shader helper for computing the size of a particle.
  float getSize(float randomValue, float normalizedAge) {
    // Apply a random factor to make each particle a slightly different size.
    float startSize = mix(settings.startSize.x, settings.startSize.y, randomValue);
    float endSize = mix(settings.endSize.x, settings.endSize.y, randomValue);

    // Compute the actual size based on the age of the particle.
    float size = mix(startSize, endSize, normalizedAge);

    // Project the size into screen coordinates.
    return size * view.projectionMatrix[0][0];
  }

  // Vertex shader helper for computing the color of a particle.
  vec4 getColor(vec4 projectedPosition, float randomValue, float normalizedAge) {
    // Apply a random factor to make each particle a slightly different color.
    vec4 color = mix(settings.minColor, settings.maxColor, randomValue);

    // Fade the alpha based on the age of the particle. This curve is hard coded
    // to make the particle fade in fairly quickly, then fade out more slowly:
    // plot x*(1-x)*(1-x) for x=0:1 in a graphing program if you want to see what
    // this looks like. The 6.7 scaling factor normalizes the curve so the alpha
    // will reach all the way up to fully solid.

    color.a *= normalizedAge * (1.0-normalizedAge) * (1.0-normalizedAge) * 6.7;

    return color;
  }

  // Vertex shader helper for computing the rotation of a particle.
  mat2 getRotation(float randomValue, float age) {
    // Apply a random factor to make each particle rotate at a different speed.
    float rotateSpeed = mix(settings.rotateSpeed.x, settings.rotateSpeed.y, randomValue);

    float rotation = rotateSpeed * age;

    // Compute a 2x2 rotation matrix.
    float c = cos(rotation);
    float s = sin(rotation);

    return mat2(c, -s, s, c);
  }
`

export const PARTICLE_EFFECT_GLSL_VS = /* glsl */ `
#version 300 es
precision highp float;
precision highp int;

  const vec2 CORNERS[4] = vec2[](
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0)
  );

  // @alias position
  layout(location = 0) in vec3 aPosition;
  // @alias velocity
  layout(location = 1) in vec3 aVelocity;
  // @alias random
  layout(location = 3) in vec4 aRandom;
  // @alias time
  layout(location = 4) in float aTime;

  out vec2 vUV;
  out vec4 vColor;

  ${BASE}
  void main(void) {
    vec2 uv = CORNERS[gl_VertexID % 4];
    vec4 vCorner = vec4(uv * 2.0 - 1.0, 0.0, 1.0);

    float age = settings.time - aTime;

    // Apply a random factor to make different particles age at different rates.
    age *= 1.0 + aRandom.x * settings.durationRandomness;

    // Normalize the age into the range zero to one.
    float normalizedAge = clamp(age / settings.duration, 0.0, 1.0);

    vec4 position = getPosition(aPosition, aVelocity, age, normalizedAge);
    float size = getSize(aRandom.y, normalizedAge);
    mat2 rotation = getRotation(aRandom.w, age);

    position.xy += (vCorner.xy * rotation) * size * settings.scale;

    vColor = getColor(position, aRandom.z, normalizedAge);
    vUV = (vCorner.xy + vec2(1.0)) / vec2(2.0);
    gl_Position = position;
  }
`

export const PARTICLE_EFFECT_GLSL_FS = /* glsl */ `
  #version 300 es

  precision highp float;

  ${BASE}

  in vec2 vUV;
  in vec4 vColor;

  out vec4 fragColor;

  void main(void) {
    fragColor = texture(colorMapSampler, vUV) * vColor;
  }
`
