import type { Primitive } from '../emit/Primitive'
import { grad, gradPrimitive, hash3, hash3Primitive } from './hash'

const cornerPrimitive: Primitive = {
  name: 'noise_simplex_corner',
  deps: [hash3Primitive, gradPrimitive],
  wgsl: /* wgsl */ `
fn noise_simplex_corner(c: vec3i, d: vec3f) -> f32 {
  let t = max(0.6 - dot(d, d), 0.0);
  let t2 = t * t;
  return t2 * t2 * noise_grad(noise_hash3(c), d);
}`,
  glsl: /* glsl */ `
float noise_simplex_corner(ivec3 c, vec3 d) {
  float t = max(0.6 - dot(d, d), 0.0);
  float t2 = t * t;
  return t2 * t2 * noise_grad(noise_hash3(c), d);
}`,
}

/**
 * 3D simplex noise in about [-1, 1]
 * @public
 */
export const simplexPrimitive: Primitive = {
  name: 'noise_simplex3',
  deps: [cornerPrimitive],
  wgsl: /* wgsl */ `
fn noise_simplex3(p: vec3f) -> f32 {
  let cell = floor(p + (p.x + p.y + p.z) * (1.0 / 3.0));
  let x0 = p - cell + (cell.x + cell.y + cell.z) * (1.0 / 6.0);
  // order of the simplex corners, see webgl-noise
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g, l.zxy);
  let i2 = max(g, l.zxy);
  let x1 = x0 - i1 + (1.0 / 6.0);
  let x2 = x0 - i2 + (1.0 / 3.0);
  let x3 = x0 - 0.5;
  let c = vec3i(cell);
  let n0 = noise_simplex_corner(c, x0);
  let n1 = noise_simplex_corner(c + vec3i(i1), x1);
  let n2 = noise_simplex_corner(c + vec3i(i2), x2);
  let n3 = noise_simplex_corner(c + vec3i(1, 1, 1), x3);
  return 32.0 * (n0 + n1 + n2 + n3);
}`,
  glsl: /* glsl */ `
float noise_simplex3(vec3 p) {
  vec3 cell = floor(p + (p.x + p.y + p.z) * (1.0 / 3.0));
  vec3 x0 = p - cell + (cell.x + cell.y + cell.z) * (1.0 / 6.0);
  // order of the simplex corners, see webgl-noise
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + (1.0 / 6.0);
  vec3 x2 = x0 - i2 + (1.0 / 3.0);
  vec3 x3 = x0 - 0.5;
  ivec3 c = ivec3(cell);
  float n0 = noise_simplex_corner(c, x0);
  float n1 = noise_simplex_corner(c + ivec3(i1), x1);
  float n2 = noise_simplex_corner(c + ivec3(i2), x2);
  float n3 = noise_simplex_corner(c + ivec3(1, 1, 1), x3);
  return 32.0 * (n0 + n1 + n2 + n3);
}`,
}

function corner(cx: number, cy: number, cz: number, x: number, y: number, z: number): number {
  const t = Math.max(0.6 - (x * x + y * y + z * z), 0)
  const t2 = t * t
  return t2 * t2 * grad(hash3(cx, cy, cz), x, y, z)
}

function step(edge: number, x: number): number {
  return x >= edge ? 1 : 0
}

/**
 * CPU version of {@link simplexPrimitive}
 * @public
 */
export function simplex3(x: number, y: number, z: number): number {
  const s = (x + y + z) * (1 / 3)
  const cx = Math.floor(x + s)
  const cy = Math.floor(y + s)
  const cz = Math.floor(z + s)
  const t = (cx + cy + cz) * (1 / 6)
  const x0 = x - cx + t
  const y0 = y - cy + t
  const z0 = z - cz + t
  // step(x0.yzx, x0.xyz)
  const gx = step(y0, x0)
  const gy = step(z0, y0)
  const gz = step(x0, z0)
  // min / max of g and (1 - g).zxy
  const i1x = Math.min(gx, 1 - gz)
  const i1y = Math.min(gy, 1 - gx)
  const i1z = Math.min(gz, 1 - gy)
  const i2x = Math.max(gx, 1 - gz)
  const i2y = Math.max(gy, 1 - gx)
  const i2z = Math.max(gz, 1 - gy)
  const n0 = corner(cx, cy, cz, x0, y0, z0)
  const n1 = corner(cx + i1x, cy + i1y, cz + i1z, x0 - i1x + 1 / 6, y0 - i1y + 1 / 6, z0 - i1z + 1 / 6)
  const n2 = corner(cx + i2x, cy + i2y, cz + i2z, x0 - i2x + 1 / 3, y0 - i2y + 1 / 3, z0 - i2z + 1 / 3)
  const n3 = corner(cx + 1, cy + 1, cz + 1, x0 - 0.5, y0 - 0.5, z0 - 0.5)
  return 32 * (n0 + n1 + n2 + n3)
}
