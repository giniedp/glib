/**
 * GBuffer encoding of the deferred pipeline (see tmp/render-pipeline/plan.md, step 3.2).
 *
 * Follows Lumberyard's layout (CryFX/Common.cfi EncodeGBuffer/DecodeGBuffer) except for the normal:
 * - A (rgb10a2unorm): octahedral normal (rg), transmittance luma (b), lighting model (a, 2 bit)
 * - B (rgba8unorm):   sqrt(albedo) (rgb), occlusion (a)
 * - C (rgba8unorm):   smoothness (r), reflectance as sqrt YCbCr (gba). With the transmittance lighting model the
 *                     chroma (ba) holds the transmittance color instead, the reflectance keeps its luma only.
 * - location 3 (r32float): linear view depth, as the forward materials write it
 *
 * Requires COMMON_WGSL (LIGHTINGMODEL_* constants).
 */
export const GBUFFER_WGSL = /* wgsl */ `
struct GBufferSurface {
  normal        : vec3f, // world space, normalized
  albedo        : vec3f,
  reflectance   : vec3f, // specular color (F0)
  smoothness    : f32,
  occlusion     : f32,   // material ambient occlusion
  transmittance : vec3f, // back light color, only with LIGHTINGMODEL_TRANSMITTANCE
  lightingModel : u32,
};

struct GBufferOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
  @location(3) depth: f32,
};

const GBUFFER_MIDPOINT_8_BIT: f32 = 127.0 / 255.0;

fn gbufferOctWrap(v: vec2f) -> vec2f {
  return (vec2f(1.0) - abs(v.yx)) * select(vec2f(-1.0), vec2f(1.0), v >= vec2f(0.0));
}

// octahedral normal encoding into [0, 1]
fn gbufferEncodeNormal(n: vec3f) -> vec2f {
  var p = n.xy / (abs(n.x) + abs(n.y) + abs(n.z));
  if (n.z < 0.0) {
    p = gbufferOctWrap(p);
  }
  return p * 0.5 + 0.5;
}

fn gbufferDecodeNormal(e: vec2f) -> vec3f {
  let f = e * 2.0 - 1.0;
  var n = vec3f(f.x, f.y, 1.0 - abs(f.x) - abs(f.y));
  let t = saturate(-n.z);
  n.x += select(t, -t, n.x >= 0.0);
  n.y += select(t, -t, n.y >= 0.0);
  return normalize(n);
}

// sqrt(color) as YCbCr, chroma remapped into [0, 1] (EncodeColorYCC)
fn gbufferEncodeYCC(color: vec3f) -> vec3f {
  let c = sqrt(max(color, vec3f(0.0)));
  let y  = dot(vec3f(0.299, 0.587, 0.114), c);
  let cb = dot(vec3f(-0.1687, -0.3312, 0.5), c);
  let cr = dot(vec3f(0.5, -0.4186, -0.0813), c);
  return vec3f(y, cb * GBUFFER_MIDPOINT_8_BIT + GBUFFER_MIDPOINT_8_BIT, cr * GBUFFER_MIDPOINT_8_BIT + GBUFFER_MIDPOINT_8_BIT);
}

// DecodeColorYCC
fn gbufferDecodeYCC(encoded: vec3f, useChroma: bool) -> vec3f {
  var e = vec3f(encoded.x, encoded.y / GBUFFER_MIDPOINT_8_BIT - 1.0, encoded.z / GBUFFER_MIDPOINT_8_BIT - 1.0);
  if (!useChroma) {
    e = vec3f(e.x, 0.0, 0.0);
  }
  let c = vec3f(
    e.x + 1.402 * e.z,
    dot(vec3f(1.0, -0.3441, -0.7141), e),
    e.x + 1.772 * e.y,
  );
  return c * c;
}

fn encodeGBuffer(s: GBufferSurface, linearDepth: f32) -> GBufferOutput {
  var out: GBufferOutput;
  out.a = vec4f(gbufferEncodeNormal(s.normal), 0.0, f32(min(s.lightingModel, 3u)) / 3.0);
  out.b = vec4f(sqrt(max(s.albedo, vec3f(0.0))), s.occlusion);
  out.c = vec4f(s.smoothness, gbufferEncodeYCC(s.reflectance));
  if (s.lightingModel == LIGHTINGMODEL_TRANSMITTANCE) {
    let t = gbufferEncodeYCC(s.transmittance);
    out.a.z = t.x;
    out.c = vec4f(out.c.xy, t.yz); // keeps smoothness and reflectance luma
  }
  out.depth = linearDepth;
  return out;
}

fn decodeGBuffer(a: vec4f, b: vec4f, c: vec4f) -> GBufferSurface {
  var s: GBufferSurface;
  s.lightingModel = u32(round(a.w * 3.0));
  s.normal = gbufferDecodeNormal(a.xy);
  s.albedo = b.rgb * b.rgb;
  s.occlusion = b.a;
  s.smoothness = c.x;
  if (s.lightingModel == LIGHTINGMODEL_TRANSMITTANCE) {
    s.reflectance = gbufferDecodeYCC(c.yzw, false);
    s.transmittance = gbufferDecodeYCC(vec3f(a.z, c.zw), true);
  } else {
    s.reflectance = gbufferDecodeYCC(c.yzw, true);
    s.transmittance = vec3f(0.0);
  }
  return s;
}
`
