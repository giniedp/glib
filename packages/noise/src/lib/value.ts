import type { Primitive } from '../emit/Primitive'
import { fade, fadePrimitive, hash3, hash3Primitive, lerp, unit, unitPrimitive } from './hash'

/**
 * 3D value noise in [-1, 1]: random values at the lattice points, smoothly interpolated
 * @public
 */
export const valuePrimitive: Primitive = {
  name: 'noise_value3',
  deps: [hash3Primitive, unitPrimitive, fadePrimitive],
  wgsl: /* wgsl */ `
fn noise_value3(p: vec3f) -> f32 {
  let cell = floor(p);
  let c = vec3i(cell);
  let u = noise_fade(p - cell);
  let v000 = noise_unit(noise_hash3(c));
  let v100 = noise_unit(noise_hash3(c + vec3i(1, 0, 0)));
  let v010 = noise_unit(noise_hash3(c + vec3i(0, 1, 0)));
  let v110 = noise_unit(noise_hash3(c + vec3i(1, 1, 0)));
  let v001 = noise_unit(noise_hash3(c + vec3i(0, 0, 1)));
  let v101 = noise_unit(noise_hash3(c + vec3i(1, 0, 1)));
  let v011 = noise_unit(noise_hash3(c + vec3i(0, 1, 1)));
  let v111 = noise_unit(noise_hash3(c + vec3i(1, 1, 1)));
  let x00 = mix(v000, v100, u.x);
  let x10 = mix(v010, v110, u.x);
  let x01 = mix(v001, v101, u.x);
  let x11 = mix(v011, v111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z) * 2.0 - 1.0;
}`,
  glsl: /* glsl */ `
float noise_value3(vec3 p) {
  vec3 cell = floor(p);
  ivec3 c = ivec3(cell);
  vec3 u = noise_fade(p - cell);
  float v000 = noise_unit(noise_hash3(c));
  float v100 = noise_unit(noise_hash3(c + ivec3(1, 0, 0)));
  float v010 = noise_unit(noise_hash3(c + ivec3(0, 1, 0)));
  float v110 = noise_unit(noise_hash3(c + ivec3(1, 1, 0)));
  float v001 = noise_unit(noise_hash3(c + ivec3(0, 0, 1)));
  float v101 = noise_unit(noise_hash3(c + ivec3(1, 0, 1)));
  float v011 = noise_unit(noise_hash3(c + ivec3(0, 1, 1)));
  float v111 = noise_unit(noise_hash3(c + ivec3(1, 1, 1)));
  float x00 = mix(v000, v100, u.x);
  float x10 = mix(v010, v110, u.x);
  float x01 = mix(v001, v101, u.x);
  float x11 = mix(v011, v111, u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z) * 2.0 - 1.0;
}`,
}

/**
 * CPU version of {@link valuePrimitive}
 * @public
 */
export function value3(x: number, y: number, z: number): number {
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  const cz = Math.floor(z)
  const ux = fade(x - cx)
  const uy = fade(y - cy)
  const uz = fade(z - cz)
  const v000 = unit(hash3(cx, cy, cz))
  const v100 = unit(hash3(cx + 1, cy, cz))
  const v010 = unit(hash3(cx, cy + 1, cz))
  const v110 = unit(hash3(cx + 1, cy + 1, cz))
  const v001 = unit(hash3(cx, cy, cz + 1))
  const v101 = unit(hash3(cx + 1, cy, cz + 1))
  const v011 = unit(hash3(cx, cy + 1, cz + 1))
  const v111 = unit(hash3(cx + 1, cy + 1, cz + 1))
  const x00 = lerp(v000, v100, ux)
  const x10 = lerp(v010, v110, ux)
  const x01 = lerp(v001, v101, ux)
  const x11 = lerp(v011, v111, ux)
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz) * 2 - 1
}
