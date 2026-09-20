export const PARTICLE_EFFECT_WGSL = /* wgsl */ `

  struct ViewBlock {
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
  };

  struct SettingsBlock {
    minColor: vec4f,
    maxColor: vec4f,

    startSize: vec2f,   // .x=min .y=max
    endSize: vec2f,     // .x=min .y=max

    rotateSpeed: vec2f, // .x=min .y=max
    duration: f32,
    durationRandomness: f32,

    gravity: vec3f,
    endVelocity: f32,
    time: f32,
    scale: vec2f,
  };

  @group(0) @binding(0) var<uniform> view: ViewBlock;
  @group(0) @binding(1) var<uniform> settings: SettingsBlock;
  @group(0) @binding(2) var colorMapSampler: sampler;
  @group(0) @binding(3) var colorMap: texture_2d<f32>;

  const CORNERS = array<vec2f, 4>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0),
  );

  // Vertex shader helper for computing the position of a particle.
  fn getPosition(
    positionIn: vec3f,
    velocity: vec3f,
    age: f32,
    normalizedAge: f32,
  ) -> vec4f {
    var position = positionIn;
    let startVelocity = length(velocity);

    // Work out how fast the particle should be moving at the end of its life,
    // by applying a constant scaling factor to its starting velocity.
    let endVelocity = startVelocity * settings.endVelocity;

    // Our particles have constant acceleration, so given a starting velocity
    // S and ending velocity E, at time T their velocity should be S + (E-S)*T.
    // The particle position is the sum of this velocity over the range 0 to T.
    // To compute the position directly, we must integrate the velocity
    // equation. Integrating S + (E-S)*T for T produces S*T + (E-S)*T*T/2.

    let velocityIntegral = startVelocity * normalizedAge + (endVelocity - startVelocity) * normalizedAge * normalizedAge / 2.0;

    position += normalize(velocity) * velocityIntegral * settings.duration;

    // Apply the gravitational force.
    position += settings.gravity * age * normalizedAge;

    // Apply the camera view and projection transforms.
    return view.projectionMatrix * view.viewMatrix * vec4f(position, 1.0);
  }

  // Vertex shader helper for computing the size of a particle.
  fn getSize(randomValue: f32, normalizedAge: f32) -> f32 {
    // Apply a random factor to make each particle a slightly different size.
    let startSize = mix(settings.startSize.x, settings.startSize.y, randomValue);
    let endSize = mix(settings.endSize.x, settings.endSize.y, randomValue);

    // Compute the actual size based on the age of the particle.
    let size = mix(startSize, endSize, normalizedAge);

    // Project the size into screen coordinates.
    return size * view.projectionMatrix[0][0];
  }

  // Vertex shader helper for computing the color of a particle.
  fn getColor(projectedPosition: vec4f, randomValue: f32, normalizedAge: f32) -> vec4f {
    // Apply a random factor to make each particle a slightly different color.
    var color = mix(settings.minColor, settings.maxColor, randomValue);

    // Fade the alpha based on the age of the particle. This curve is hard coded
    // to make the particle fade in fairly quickly, then fade out more slowly:
    // plot x*(1-x)*(1-x) for x=0:1 in a graphing program if you want to see what
    // this looks like. The 6.7 scaling factor normalizes the curve so the alpha
    // will reach all the way up to fully solid.

    color.a *= normalizedAge * (1.0 - normalizedAge) * (1.0 - normalizedAge) * 6.7;

    return color;
  }

  // Vertex shader helper for computing the rotation of a particle.
  fn getRotation(randomValue: f32, age: f32) -> mat2x2<f32> {
    // Apply a random factor to make each particle rotate at a different speed.
    let rotateSpeed = mix(settings.rotateSpeed.x, settings.rotateSpeed.y, randomValue);

    let rotation = rotateSpeed * age;

    // Compute a 2x2 rotation matrix.
    let c = cos(rotation);
    let s = sin(rotation);

    return mat2x2<f32>(c, -s, s, c);
  }

  struct VertexInput {
    @location(0) position: vec3f,
    @location(1) velocity: vec3f,
    @location(3) random: vec4f,
    @location(4) time: f32,
    @builtin(vertex_index) vertexIndex: u32,
  };

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) vUV: vec2f,
    @location(1) vColor: vec4f,
  };

  @vertex
  fn vs_main(input: VertexInput) -> VertexOutput {
    let uv = CORNERS[input.vertexIndex % 4u];
    let vCorner = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);

    var age = settings.time - input.time;

    // Apply a random factor to make different particles age at different rates.
    age *= 1.0 + input.random.x * settings.durationRandomness;

    // Normalize the age into the range zero to one.
    let normalizedAge = clamp(age / settings.duration, 0.0, 1.0);

    var position = getPosition(input.position, input.velocity, age, normalizedAge);
    let size = getSize(input.random.y, normalizedAge);
    let rotation = getRotation(input.random.w, age);

    position = vec4f(
      position.xy + (rotation * vCorner.xy) * size * settings.scale,
      position.z,
      position.w,
    );

    var output: VertexOutput;
    output.vColor = getColor(position, input.random.z, normalizedAge);
    output.vUV = (vCorner.xy + vec2f(1.0)) / vec2f(2.0);
    output.position = position;
    return output;
  }

  @fragment
  fn fs_main(
    @location(0) vUV: vec2f,
    @location(1) vColor: vec4f,
  ) -> @location(0) vec4f {
    return textureSample(colorMap, colorMapSampler, vUV) * vColor;
  }

`
