import type { Primitive } from '../emit/Primitive'

// Integer hashing is exact on CPU and GPU (u32 wraps on overflow, Math.imul in TS),
// so all noise functions hash the same lattice points the same way on both.

/**
 * Hashes an unsigned 32 bit integer (lowbias32)
 * @public
 */
export const hashPrimitive: Primitive = {
  name: 'noise_hash',
  wgsl: /* wgsl */ `
fn noise_hash(x: u32) -> u32 {
  var h = x;
  h ^= h >> 16u;
  h *= 0x7feb352du;
  h ^= h >> 15u;
  h *= 0x846ca68bu;
  h ^= h >> 16u;
  return h;
}`,
  glsl: /* glsl */ `
uint noise_hash(uint x) {
  uint h = x;
  h ^= h >> 16u;
  h *= 0x7feb352du;
  h ^= h >> 15u;
  h *= 0x846ca68bu;
  h ^= h >> 16u;
  return h;
}`,
}

/**
 * Hashes an integer lattice point
 * @public
 */
export const hash3Primitive: Primitive = {
  name: 'noise_hash3',
  deps: [hashPrimitive],
  wgsl: /* wgsl */ `
fn noise_hash3(c: vec3i) -> u32 {
  return noise_hash(bitcast<u32>(c.x) ^ noise_hash(bitcast<u32>(c.y) ^ noise_hash(bitcast<u32>(c.z))));
}`,
  glsl: /* glsl */ `
uint noise_hash3(ivec3 c) {
  return noise_hash(uint(c.x) ^ noise_hash(uint(c.y) ^ noise_hash(uint(c.z))));
}`,
}

/**
 * Maps a hash to [0, 1) using its upper 24 bits, which are exact in a 32 bit float
 * @public
 */
export const unitPrimitive: Primitive = {
  name: 'noise_unit',
  wgsl: /* wgsl */ `
fn noise_unit(h: u32) -> f32 {
  return f32(h >> 8u) * (1.0 / 16777216.0);
}`,
  glsl: /* glsl */ `
float noise_unit(uint h) {
  return float(h >> 8u) * (1.0 / 16777216.0);
}`,
}

/**
 * Quintic interpolation curve 6t^5 - 15t^4 + 10t^3
 * @public
 */
export const fadePrimitive: Primitive = {
  name: 'noise_fade',
  wgsl: /* wgsl */ `
fn noise_fade(t: vec3f) -> vec3f {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}`,
  glsl: /* glsl */ `
vec3 noise_fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}`,
}

/**
 * Dot product of a distance vector with one of 12 gradient directions, selected by the hash
 * @public
 */
export const gradPrimitive: Primitive = {
  name: 'noise_grad',
  wgsl: /* wgsl */ `
fn noise_grad(hash: u32, d: vec3f) -> f32 {
  let h = hash & 15u;
  let u = select(d.y, d.x, h < 8u);
  let v = select(select(d.z, d.x, h == 12u || h == 14u), d.y, h < 4u);
  return select(-u, u, (h & 1u) == 0u) + select(-v, v, (h & 2u) == 0u);
}`,
  glsl: /* glsl */ `
float noise_grad(uint hash, vec3 d) {
  uint h = hash & 15u;
  float u = h < 8u ? d.x : d.y;
  float v = h < 4u ? d.y : ((h == 12u || h == 14u) ? d.x : d.z);
  return ((h & 1u) == 0u ? u : -u) + ((h & 2u) == 0u ? v : -v);
}`,
}

/**
 * CPU version of the `noise_hash` primitive
 * @public
 */
export function hash(x: number): number {
  let h = x >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

/**
 * CPU version of the `noise_hash3` primitive, takes integer coordinates
 * @public
 */
export function hash3(x: number, y: number, z: number): number {
  return hash((x >>> 0) ^ hash((y >>> 0) ^ hash(z >>> 0)))
}

/**
 * CPU version of the `noise_unit` primitive
 * @public
 */
export function unit(h: number): number {
  return (h >>> 8) / 16777216
}

/**
 * CPU version of the `noise_fade` primitive for one component
 * @public
 */
export function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * CPU version of the `noise_grad` primitive
 * @public
 */
export function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

/**
 * Linear interpolation like `mix` in WGSL and GLSL
 * @public
 */
export function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}
