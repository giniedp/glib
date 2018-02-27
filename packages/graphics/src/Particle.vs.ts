export default `
precision highp float;
precision highp int;

// @binding view
uniform mat4 uView;
// @binding projection
uniform mat4 uProjection;
// @binding viewportScale
uniform vec2 uViewportScale;

// @binding currentTime
uniform float uCurrentTime;

// @binding duration
// @default 1000
uniform float uDuration;
// @binding durationRandomness
// @default 0
uniform float uDurationRandomness;
// @binding gravity
// @default [0, 0, 0]
uniform vec3 uGravity;
// @binding endVelocity
// @default 1
uniform float uEndVelocity;
// @binding minColor
// @default [1, 1, 1, 1]
uniform vec4 uMinColor;
// @binding maxColor
// @default [1, 1, 1, 1]
uniform vec4 uMaxColor;

// @binding rotateSpeed
// @default [0, 0]
uniform vec2 uRotateSpeed;
// @binding startSize
// @default [100, 100]
uniform vec2 uStartSize;
// @binding endSize
// @default [100, 100]
uniform vec2 uEndSize;

// @binding texture
// @register 0
// @filter LinearClamp
uniform sampler2D Texture;

// @binding position
attribute vec3 vPosition;
// @binding velocity
attribute vec3 vVelocity;
// @binding corner
attribute vec2 vCorner;
// @binding random
attribute vec4 vRandom;
// @binding time
attribute float vTime;

varying vec2 texCoord;
varying vec4 texColor;


// Vertex shader helper for computing the position of a particle.
vec4 gePosition(
  vec3 position,
  vec3 velocity,
  float age,
  float normalizedAge
) {
  float startVelocity = length(velocity);

  // Work out how fast the particle should be moving at the end of its life,
  // by applying a constant scaling factor to its starting velocity.
  float endVelocity = startVelocity * uEndVelocity;

  // Our particles have constant acceleration, so given a starting velocity
  // S and ending velocity E, at time T their velocity should be S + (E-S)*T.
  // The particle position is the sum of this velocity over the range 0 to T.
  // To compute the position directly, we must integrate the velocity
  // equation. Integrating S + (E-S)*T for T produces S*T + (E-S)*T*T/2.

  float velocityIntegral = startVelocity * normalizedAge + (endVelocity - startVelocity) * normalizedAge * normalizedAge / 2.0;

  position += normalize(velocity) * velocityIntegral * uDuration;

  // Apply the gravitational force.
  position += uGravity * age * normalizedAge;

  // Apply the camera view and projection transforms.
  return uProjection * uView * vec4(position, 1);
}

// Vertex shader helper for computing the size of a particle.
float geSize(float randomValue, float normalizedAge)
{
  // Apply a random factor to make each particle a slightly different size.
  float startSize = mix(uStartSize.x, uStartSize.y, randomValue);
  float endSize = mix(uEndSize.x, uEndSize.y, randomValue);

  // Compute the actual size based on the age of the particle.
  float size = mix(startSize, endSize, normalizedAge);

  // Project the size into screen coordinates.
  return size * uProjection[0][0];
}


// Vertex shader helper for computing the color of a particle.
vec4 geColor(vec4 projectedPosition, float randomValue, float normalizedAge)
{
  // Apply a random factor to make each particle a slightly different color.
  vec4 color = mix(uMinColor, uMaxColor, randomValue);

  // Fade the alpha based on the age of the particle. This curve is hard coded
  // to make the particle fade in fairly quickly, then fade out more slowly:
  // plot x*(1-x)*(1-x) for x=0:1 in a graphing program if you want to see what
  // this looks like. The 6.7 scaling factor normalizes the curve so the alpha
  // will reach all the way up to fully solid.

  color.a *= normalizedAge * (1.0-normalizedAge) * (1.0-normalizedAge) * 6.7;

  return color;
}


// Vertex shader helper for computing the rotation of a particle.
mat2 geRotation(float randomValue, float age) {
  // Apply a random factor to make each particle rotate at a different speed.
  float rotateSpeed = mix(uRotateSpeed.x, uRotateSpeed.y, randomValue);

  float rotation = rotateSpeed * age;

  // Compute a 2x2 rotation matrix.
  float c = cos(rotation);
  float s = sin(rotation);

  return mat2(c, -s, s, c);
}


// Custom vertex shader animates particles entirely on the GPU.
void main(void) {
  // Compute the age of the particle.
  float age = uCurrentTime - vTime;

  // Apply a random factor to make different particles age at different rates.
  age *= 1.0 + vRandom.x * uDurationRandomness;

  // Normalize the age into the range zero to one.
  float normalizedAge = clamp(age / uDuration, 0.0, 1.0);

  // Compute the particle position, size, color, and rotation.
  vec4 position = gePosition(vPosition, vVelocity,
                                            age, normalizedAge);

  float size = geSize(vRandom.y, normalizedAge);
  mat2 rotation = geRotation(vRandom.w, age);

  position.xy += (vCorner * rotation) * size * uViewportScale;

  texColor = geColor(position, vRandom.z, normalizedAge);
  texCoord = (vCorner + vec2(1.0)) / vec2(2.0);
  gl_Position = position;
}
`
