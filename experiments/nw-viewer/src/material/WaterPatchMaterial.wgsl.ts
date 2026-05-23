import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `
${COMMON_WGSL}

struct MaterialBlock {
  heightMapUvTransform : vec4<f32>,
  heightMapSize        : f32,
  mountainHeight       : f32,
  waterHeight          : f32,

  // Water column
  shallowColor    : vec3f,
  deepColor       : vec3f,
  waterLevel      : f32,   // world-space Y of the water surface in metres
  depthScale      : f32,   // metres below waterLevel for full deep-colour blend

  // Surface
  roughness       : f32,
  reflectStrength : f32,
  refractStrength : f32,

  // Shore
  shoreFade       : f32,   // transition width in metres at the waterline

  // Foam
  foamDepth       : f32,   // metres below waterLevel where shore foam appears
  foamStrength    : f32,
  foamSpeed       : f32,   // scroll speed in metres per second

  // Waves
  waveSpeed       : f32,   // propagation speed in metres per second
  waveScale       : f32,   // spatial frequency in radians per metre
  waveHeight      : f32,   // peak displacement in metres
};


struct InstanceBlock {
  transform:               mat4x4<f32>,

  // x: patch size (32, 64 etc.),
  // y: base factor (e.g. 2)
  // z: morphLod
  params1:                 vec4f,

  // x: fine layer color map index
  // y: coarse layer color map index
  // z: 1 = fine ready
  // w: 1 = coarse ready
  params2:                 vec4f,

  // x: this region's heightmap layer
  // y: +X neighbour, -1 if none
  // z: +Z neighbour, -1 if none
  // w: +X+Z neighbour, -1 if none
  params3:                 vec4f,

  colorUvTransform:        vec4f,
  colorUvTransformCoarse:  vec4f,
  heightUvTransform:       vec4f,
  heightUvTransformCoarse: vec4f,
};

@group(0) @binding(0) var<uniform> global: GlobalBlock;
@group(0) @binding(1) var<uniform> frame: FrameBlock;
@group(0) @binding(2) var<uniform> view: ViewBlock;
@group(0) @binding(3) var<uniform> object: ObjectBlock;
@group(0) @binding(4) var<uniform> material: MaterialBlock;

// @block material
@group(1) @binding(0) var heightMapSampler : sampler;

// @block material
@group(1) @binding(1) var heightMap : texture_2d_array<f32>;

@group(2) @binding(0) var<storage, read> instances: array<InstanceBlock, 1>;

struct Varyings {
  @builtin(position) position : vec4f,
  @location(0) worldPos       : vec3f,
  @location(1) uv             : vec2f,
  @location(2) groundHeight: f32,
  @location(3) @interpolate(flat) iid:  u32,
};


struct VertexIn {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) position:     vec3f,
  @location(1) texture:      vec2f,
};


@vertex
fn vsMain(input: VertexIn) -> Varyings {
  let instance = instances[input.instanceIndex];

  var worldPos = (instance.transform * object.modelMatrix * vec4f(input.position, 1.0));

  let patchSize = f32(instance.params1.x);
  let baseFactor = f32(instance.params1.y);
  let morphLod = f32(instance.params1.z);
  let morph = lod_morph(
    input.position.xy,         // raw grid position 0..64
    worldPos.xy,                // world space position
    view.cameraPosition.xy,
    patchSize,
    baseFactor,
    morphLod,
  );
  worldPos.x -= morph.offset.x;
  worldPos.y += morph.offset.y;

  let patchWorldSize = patchSize * exp2(morphLod);
  let uvDelta = -morph.offset / patchWorldSize;


  var uv = vec2f(input.texture.x, 1.0 - input.texture.y);
  uv = uvScaleOffset(uv + uvDelta, instance.heightUvTransform);
  let data     = readMapData(uv, instance.params3);
  let waterHeight = data.x;
  let groundHeight = data.y + data.x;

  worldPos.z   = data.x;

  let timeSec      = frame.elapsedTime * 0.001;
  let mat          = material;

  // Derive base spatial frequency from waveHeight so the two stay coupled:
  // a 0.4 m swell at ~420 m wavelength → freq ≈ 0.015 rad/m.
  let baseFreq = 0.015;
  let dispY    = waveSumY(worldPos.xy, baseFreq, mat.waveHeight, mat.waveSpeed, timeSec);
  worldPos.z   = waterHeight + dispY;

  var out : Varyings;
  out.position     = view.projectionMatrix * view.viewMatrix * worldPos;
  out.worldPos     = worldPos.xyz;
  out.groundHeight = groundHeight;
  out.uv           = uv;
  out.iid          = input.instanceIndex;
  return out;
}


// ── Fragment ──────────────────────────────────────────────────

@fragment
fn fsMain(in: Varyings) -> @location(0) vec4f {
  let instance = instances[in.iid];
  let timeSec = frame.elapsedTime * 0.001;
  let mat     = material;
  let sun     = normalize(global.sunDirection);

  let baseFreq = 0.015;

  // ── Depth ─────────────────────────────────────────────────
  let waterDepth = mat.waterLevel - in.groundHeight;
  let shoreAlpha = smoothstep(0.0, mat.shoreFade, waterDepth);
  let depthT     = clamp(waterDepth / mat.depthScale, 0.0, 1.0);
  let subsurface = mix(mat.shallowColor, mat.deepColor, depthT);

  // ── Surface geometry ──────────────────────────────────────
  let viewDir = normalize(view.cameraPosition - in.worldPos);
  let normal  = waveNormal(in.worldPos.xy, baseFreq, mat.waveHeight, mat.waveSpeed, timeSec);

  // ── Refraction tint ───────────────────────────────────────
  let refrBend   = normal.xy * mat.refractStrength * (1.0 - depthT) * 0.01;
  let data = readMapData(in.uv + refrBend, instance.params3);
  let refrGround = data.x + data.y;// in.groundHeight; //textureSample(heightMap, heightMapSampler, in.uv + refrBend).r;
  let refrDepthT = clamp((mat.waterLevel - refrGround) / mat.depthScale, 0.0, 1.0);
  let refrColor  = mix(mat.shallowColor, mat.deepColor, refrDepthT);

  // ── Fresnel ───────────────────────────────────────────────
  let nDotV      = max(dot(normal, viewDir), 0.0);
  let fresnelVal = fresnel(nDotV, 0.04);

  // ── Reflection ────────────────────────────────────────────
  let reflDir    = reflect(-viewDir, normal);
  let skyHorizon = pow(max(reflDir.z, 0.0), 0.3);
  let skyColor   = mix(vec3f(0.05, 0.12, 0.25), vec3f(0.4, 0.65, 0.9), skyHorizon);
  let sunDot     = max(dot(reflDir, sun), 0.0);
  let sunRefl    = global.sunColor * pow(sunDot, 64.0);
  let reflection = (skyColor + sunRefl) * mat.reflectStrength;

  // ── Specular ──────────────────────────────────────────────
  let specColor = global.sunColor * ggxSpecular(normal, viewDir, sun, mat.roughness);


  // ── Foam ──────────────────────────────────────────────────
  // Foam lives only in the shore band [0, foamDepth] metres below waterLevel.
  // A scrolling noise mask breaks it into clumps so it reads as surf, not
  // a flat ring. The band itself is a smooth ramp so there is no hard edge.
  let shoreBand  = 1.0 - smoothstep(0.0, mat.foamDepth, waterDepth);
  let foamUV     = in.worldPos.xy * 0.04 + timeSec * mat.foamSpeed * vec2f(0.6, 0.35);
  let foamMask   = smoothstep(0.0, 1.0, fbm(foamUV));
  let foamAmount = clamp(shoreBand * foamMask * mat.foamStrength, 0.0, 1.0);

  // ── Combine ───────────────────────────────────────────────
  let underwater = mix(refrColor, subsurface, 0.5);
  var color      = mix(underwater, reflection, fresnelVal);
  color         += specColor;
  color          = mix(color, vec3f(0.92, 0.96, 1.0), foamAmount);

  let alpha = shoreAlpha * mix(0.75, 1.0, depthT);


  let debug = global.debug;
  if (debug > 0u) {
    // if (debug == DEBUG_MTL_BASE) {
    //   return vec4<f32>(surface.BaseColor.rgb, 1.0);
    // }
    // if (debug == DEBUG_MTL_SPEC) {
    //   return vec4<f32>(surface.Specular.rgb, 1.0);
    // }
    // if (debug == DEBUG_MTL_PBR) {
    //   return vec4<f32>(surface.Metallic, surface.Roughness, surface.Ior, 1.0);
    // }

    if (debug == DEBUG_NORMALS) {
      return vec4<f32>(normal.xyz * 0.5 + 0.5, 1.0);
    }
    // if (debug == DEBUG_TANGENTS) {
    //   return vec4<f32>(input.vTangent.xyz * 0.5 + 0.5, 1.0);
    // }
    // if (debug == DEBUG_BINORMALS) {
    //   return vec4<f32>(input.vBinormal.xyz * 0.5 + 0.5, 1.0);
    // }

    // if (debug == DEBUG_COLOR1) {
    //   return input.vColor;
    // }
    // if (debug == DEBUG_COLOR2) {
    //   return input.vColor;
    // }

    // if (debug == DEBUG_UV1) {
    //   return vec4<f32>(texCoord, 0.0, 1.0);
    // }
    // if (debug == DEBUG_UV2) {
    //   return vec4<f32>(texCoord, 0.0, 1.0);
    // }
  }
  return applyFog(color, alpha, in.worldPos, view.cameraPosition);
}

const WAVE_COUNT : i32 = 6;

// Column layout: dirX, dirZ, freqScale, ampScale
const waveTable = array<vec4f, 6>(
    vec4f( 0.831,  0.556, 1.00, 1.00),   // 0 — primary swell
    vec4f(-0.371,  0.928, 1.30, 0.60),   // 1 — secondary swell
    vec4f( 0.500,  0.866, 2.70, 0.25),   // 2 — mid chop
    vec4f(-0.866,  0.500, 3.10, 0.18),   // 3 — mid chop cross
    vec4f( 0.940, -0.342, 6.00, 0.08),   // 4 — fine ripple
    vec4f( 0.174,  0.985, 7.20, 0.06),   // 5 — fine ripple angled
);

// Speed scaling per band — fine ripples move slower relative to their freq.
const speedScale = array<f32, 6>(1.00, 0.80, 0.65, 0.60, 0.45, 0.40);


// ── Wave helpers ──────────────────────────────────────────────

// Y-only sine wave. freq = radians/metre, speed = m/s, time = seconds.
fn waveY(pos: vec2f, dir: vec2f, freq: f32, amp: f32, speed: f32, timeSec: f32) -> f32 {
    let phase = freq * dot(normalize(dir), pos) - speed * freq * timeSec;
    return amp * sin(phase);
}

// Sum all bands into a single vertical displacement.
fn waveSumY(pos: vec2f, baseFreq: f32, baseAmp: f32, baseSpeed: f32, timeSec: f32) -> f32 {
    var y = 0.0;
    for (var i = 0; i < WAVE_COUNT; i++) {
        let w     = waveTable[i];
        let spdSc = speedScale[i];
        y += waveY(pos,
                   w.xy,
                   baseFreq  * w.z,
                   baseAmp   * w.w,
                   baseSpeed * spdSc,
                   timeSec);
    }
    return y;
}

// Finite-difference surface normal from the summed wave field.
fn waveNormal(pos: vec2f, baseFreq: f32, baseAmp: f32, baseSpeed: f32, timeSec: f32) -> vec3f {
    let eps = 0.05;
    let h   = waveSumY(pos,                   baseFreq, baseAmp, baseSpeed, timeSec);
    let hx  = waveSumY(pos + vec2f(eps, 0.0), baseFreq, baseAmp, baseSpeed, timeSec);
    let hz  = waveSumY(pos + vec2f(0.0, eps), baseFreq, baseAmp, baseSpeed, timeSec);
    return normalize(vec3f(-(hx - h) / eps, -(hz - h) / eps, 1.0));
}

// ── Noise helpers ─────────────────────────────────────────────

fn hash(p: vec2f) -> f32 {
    var q = fract(p * vec2f(127.1, 311.7));
    q += dot(q, q + 19.19);
    return fract(q.x * q.y);
}

fn noise(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
        mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
        u.y
    );
}

fn fbm(p: vec2f) -> f32 {
    return noise(p) * 0.65 + noise(p * 2.1 + vec2f(5.3, 1.7)) * 0.35;
}

// Single Gerstner wave — returns (dx, dy, dz) displacement.
// All spatial units metres, time in seconds.
fn gerstner(
    pos     : vec2f,
    dir     : vec2f,
    freq    : f32,
    amp     : f32,
    speed   : f32,
    timeSec : f32,
) -> vec3f {
    let phase = freq * dot(dir, pos) - speed * freq * timeSec;
    return vec3f(dir.x * amp * cos(phase),
                 dir.y * amp * cos(phase),
                 amp * sin(phase));
}


fn fresnel(cosTheta: f32, f0: f32) -> f32 {
    return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn ggxSpecular(normal: vec3f, viewDir: vec3f, lightDir: vec3f, roughness: f32) -> f32 {
    let h     = normalize(viewDir + lightDir);
    let nDotH = max(dot(normal, h), 0.0);
    let r2    = roughness * roughness;
    let denom = nDotH * nDotH * (r2 - 1.0) + 1.0;
    return r2 / (3.14159 * denom * denom + 1e-5);
}










struct MorphInfo {
  offset:   vec2f, // world space offset to apply to the vertex position for morphing
  t:        f32,
}

// gridPos is the raw vertex position in grid space, e.g. 0..64
// worldPos is the vertex position in world space
fn lod_morph(
  gridPos: vec2f,
  worldPos: vec2f,
  cameraPos: vec2f,
  patchSize: f32,
  baseFactor: f32, // e.g. 2, used on CPU for LOD selection (AABB nearest distance check)
  morphLod: f32,
) -> MorphInfo {

  //
  // in world units
  //
  let spacing     = exp2(morphLod);      // e.g. 1, 2, 4, 8 etc
  let sizeInWorld = patchSize * spacing; // e.g. 64, 128, 256 etc

  // HINT: rangeFactor of 1.0 is too tight
  //
  // constants for tweaking, maybe should be material parameters
  let morphEnd     = sizeInWorld * baseFactor * 2.0;  // 2.0 hits right at the end of the patch
  let morphRange   = sizeInWorld * baseFactor * 0.3;

  let distance   = (distance(worldPos, cameraPos));
  let morphLerpK = 1.0 - clamp((morphEnd - distance)/morphRange, 0.0, 1.0);
  let morphLerp = fract(vec2f(gridPos.x, gridPos.y) * 0.5) * 2.0 * morphLerpK;

  var result: MorphInfo;
  result.offset   = morphLerp * spacing;
  result.t        = morphLerpK;

  return result;
}

// UV → texel, accounting for 2049 vertices over 2048 texels
fn uvToTexel(uv: vec2f, dims: vec2i) -> vec2i {
  return vec2i(uv * vec2f(dims - vec2i(1)));
}

fn remapaUV(params3: vec4f, uv: vec2f) -> vec3f {
  let crossX = uv.x >= 1.0;
  let crossZ = uv.y <= 0.0;

  var layer    : i32;
  var sampleUV : vec2f;

  if crossX && crossZ {
    // corner
    layer    = i32(params3.w);
    sampleUV = vec2f(uv.x - 1.0, 1.0);
  } else if crossX {
    // right
    layer    = i32(params3.y);
    sampleUV = vec2f(uv.x - 1.0, uv.y);
  } else if crossZ {
    // bottom
    layer    = i32(params3.z);
    sampleUV = vec2f(uv.x, 1.0);
  } else {
    // this region
    layer    = i32(params3.x);
    sampleUV = uv;
  }

  if layer < 0 {
    layer    = i32(params3.x);
    sampleUV = clamp(uv, vec2f(0.0), vec2f(1.0));
  }

  return vec3f(sampleUV, f32(layer));
}

fn readMapData(uv: vec2f, params3: vec4f) -> vec2f {
  let remapped = remapaUV(params3, uv);

  let groundHeight = textureSampleLevel(heightMap, heightMapSampler, remapped.xy, i32(remapped.z), 0.0).r / 65535.0 * material.mountainHeight;
  let waterHeight = material.waterHeight;// textureSampleLevel(waterMap, heightMapSampler, remapped.xy, i32(remapped.z), 0.0).r;

  return vec2f(waterHeight, groundHeight - waterHeight);
}

`
