import type { Primitive } from '../emit/Primitive'
import { fade, fadePrimitive, grad, gradPrimitive, hash3, hash3Primitive, lerp } from './hash'

/**
 * 3D gradient noise (improved perlin noise) in about [-1, 1]
 * @public
 */
export const perlinPrimitive: Primitive = {
  name: 'noise_perlin3',
  deps: [hash3Primitive, fadePrimitive, gradPrimitive],
  wgsl: /* wgsl */ `
fn noise_perlin3(p: vec3f) -> f32 {
  let cell = floor(p);
  let c = vec3i(cell);
  let f = p - cell;
  let u = noise_fade(f);
  let n000 = noise_grad(noise_hash3(c), f);
  let n100 = noise_grad(noise_hash3(c + vec3i(1, 0, 0)), f - vec3f(1.0, 0.0, 0.0));
  let n010 = noise_grad(noise_hash3(c + vec3i(0, 1, 0)), f - vec3f(0.0, 1.0, 0.0));
  let n110 = noise_grad(noise_hash3(c + vec3i(1, 1, 0)), f - vec3f(1.0, 1.0, 0.0));
  let n001 = noise_grad(noise_hash3(c + vec3i(0, 0, 1)), f - vec3f(0.0, 0.0, 1.0));
  let n101 = noise_grad(noise_hash3(c + vec3i(1, 0, 1)), f - vec3f(1.0, 0.0, 1.0));
  let n011 = noise_grad(noise_hash3(c + vec3i(0, 1, 1)), f - vec3f(0.0, 1.0, 1.0));
  let n111 = noise_grad(noise_hash3(c + vec3i(1, 1, 1)), f - vec3f(1.0, 1.0, 1.0));
  let x00 = mix(n000, n100, u.x);
  let x10 = mix(n010, n110, u.x);
  let x01 = mix(n001, n101, u.x);
  let x11 = mix(n011, n111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}`,
  glsl: /* glsl */ `
float noise_perlin3(vec3 p) {
  vec3 cell = floor(p);
  ivec3 c = ivec3(cell);
  vec3 f = p - cell;
  vec3 u = noise_fade(f);
  float n000 = noise_grad(noise_hash3(c), f);
  float n100 = noise_grad(noise_hash3(c + ivec3(1, 0, 0)), f - vec3(1.0, 0.0, 0.0));
  float n010 = noise_grad(noise_hash3(c + ivec3(0, 1, 0)), f - vec3(0.0, 1.0, 0.0));
  float n110 = noise_grad(noise_hash3(c + ivec3(1, 1, 0)), f - vec3(1.0, 1.0, 0.0));
  float n001 = noise_grad(noise_hash3(c + ivec3(0, 0, 1)), f - vec3(0.0, 0.0, 1.0));
  float n101 = noise_grad(noise_hash3(c + ivec3(1, 0, 1)), f - vec3(1.0, 0.0, 1.0));
  float n011 = noise_grad(noise_hash3(c + ivec3(0, 1, 1)), f - vec3(0.0, 1.0, 1.0));
  float n111 = noise_grad(noise_hash3(c + ivec3(1, 1, 1)), f - vec3(1.0, 1.0, 1.0));
  float x00 = mix(n000, n100, u.x);
  float x10 = mix(n010, n110, u.x);
  float x01 = mix(n001, n101, u.x);
  float x11 = mix(n011, n111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}`,
}

/**
 * CPU version of {@link perlinPrimitive}
 * @public
 */
export function perlin3(x: number, y: number, z: number): number {
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  const cz = Math.floor(z)
  const fx = x - cx
  const fy = y - cy
  const fz = z - cz
  const ux = fade(fx)
  const uy = fade(fy)
  const uz = fade(fz)
  const n000 = grad(hash3(cx, cy, cz), fx, fy, fz)
  const n100 = grad(hash3(cx + 1, cy, cz), fx - 1, fy, fz)
  const n010 = grad(hash3(cx, cy + 1, cz), fx, fy - 1, fz)
  const n110 = grad(hash3(cx + 1, cy + 1, cz), fx - 1, fy - 1, fz)
  const n001 = grad(hash3(cx, cy, cz + 1), fx, fy, fz - 1)
  const n101 = grad(hash3(cx + 1, cy, cz + 1), fx - 1, fy, fz - 1)
  const n011 = grad(hash3(cx, cy + 1, cz + 1), fx, fy - 1, fz - 1)
  const n111 = grad(hash3(cx + 1, cy + 1, cz + 1), fx - 1, fy - 1, fz - 1)
  const x00 = lerp(n000, n100, ux)
  const x10 = lerp(n010, n110, ux)
  const x01 = lerp(n001, n101, ux)
  const x11 = lerp(n011, n111, ux)
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz)
}
