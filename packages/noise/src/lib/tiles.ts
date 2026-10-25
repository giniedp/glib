import type { Primitive } from '../emit/Primitive'
import { hash3, hash3Primitive, unit, unitPrimitive } from './hash'

/**
 * Random value in [0, 1) per unit tile of the xy plane
 * @public
 */
export const tileRandomPrimitive: Primitive = {
  name: 'noise_tile_random',
  deps: [hash3Primitive, unitPrimitive],
  wgsl: /* wgsl */ `
fn noise_tile_random(p: vec3f) -> f32 {
  return noise_unit(noise_hash3(vec3i(i32(floor(p.x)), i32(floor(p.y)), 0)));
}`,
  glsl: /* glsl */ `
float noise_tile_random(vec3 p) {
  return noise_unit(noise_hash3(ivec3(int(floor(p.x)), int(floor(p.y)), 0)));
}`,
}

/**
 * CPU version of {@link tileRandomPrimitive}
 * @public
 */
export function tileRandom(x: number, y: number): number {
  return unit(hash3(Math.floor(x), Math.floor(y), 0))
}
