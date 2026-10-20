import type { Primitive } from '../emit/Primitive'
import { hash, hash3, hash3Primitive, hashPrimitive, unit, unitPrimitive } from './hash'

/**
 * Distance metric of cell noise
 * @public
 */
export type CellDistance = 'euclidean' | 'manhattan'

interface Metric {
  /**
   * Distance of the vector `d`, same expression in WGSL and GLSL
   */
  distance: string
  /**
   * Function applied to the result, same in WGSL and GLSL
   */
  finish: string
  cpu: (x: number, y: number, z: number) => number
  finishCpu: (value: number) => number
}

const METRICS: Record<CellDistance, Metric> = {
  euclidean: {
    distance: 'dot(d, d)',
    finish: 'sqrt',
    cpu: (x, y, z) => x * x + y * y + z * z,
    finishCpu: Math.sqrt,
  },
  manhattan: {
    distance: 'abs(d.x) + abs(d.y) + abs(d.z)',
    finish: '',
    cpu: (x, y, z) => Math.abs(x) + Math.abs(y) + Math.abs(z),
    finishCpu: (value) => value,
  },
}

// golden ratio offset, decorrelates the hashes of the three feature point components
const JITTER_SEED = 0x9e3779b9

function cellPrimitive(distance: CellDistance): Primitive {
  const metric = METRICS[distance]
  const name = `noise_cell3_${distance}`
  return {
    name,
    deps: [hashPrimitive, hash3Primitive, unitPrimitive],
    wgsl: /* wgsl */ `
fn ${name}(p: vec3f) -> vec2f {
  let cell = floor(p);
  let c = vec3i(cell);
  let f = p - cell;
  var f1 = 1e10;
  var f2 = 1e10;
  for (var z = -1; z <= 1; z++) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let o = vec3i(x, y, z);
        let h = noise_hash3(c + o);
        let jitter = vec3f(noise_unit(h), noise_unit(noise_hash(h)), noise_unit(noise_hash(h + ${JITTER_SEED}u)));
        let d = vec3f(o) + jitter - f;
        let dist = ${metric.distance};
        if (dist < f1) {
          f2 = f1;
          f1 = dist;
        } else if (dist < f2) {
          f2 = dist;
        }
      }
    }
  }
  return vec2f(${metric.finish}(f1), ${metric.finish}(f2));
}`,
    glsl: /* glsl */ `
vec2 ${name}(vec3 p) {
  vec3 cell = floor(p);
  ivec3 c = ivec3(cell);
  vec3 f = p - cell;
  float f1 = 1e10;
  float f2 = 1e10;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        ivec3 o = ivec3(x, y, z);
        uint h = noise_hash3(c + o);
        vec3 jitter = vec3(noise_unit(h), noise_unit(noise_hash(h)), noise_unit(noise_hash(h + ${JITTER_SEED}u)));
        vec3 d = vec3(o) + jitter - f;
        float dist = ${metric.distance};
        if (dist < f1) {
          f2 = f1;
          f1 = dist;
        } else if (dist < f2) {
          f2 = dist;
        }
      }
    }
  }
  return vec2(${metric.finish}(f1), ${metric.finish}(f2));
}`,
  }
}

/**
 * Cell (worley) noise, returns the distances to the nearest and second nearest feature point
 * @public
 */
export const cellPrimitives: Record<CellDistance, Primitive> = {
  euclidean: cellPrimitive('euclidean'),
  manhattan: cellPrimitive('manhattan'),
}

/**
 * Result of {@link cell3}
 * @public
 */
export interface CellResult {
  f1: number
  f2: number
}

/**
 * CPU version of {@link cellPrimitives}
 * @public
 */
export function cell3(x: number, y: number, z: number, distance: CellDistance, out: CellResult): CellResult {
  const metric = METRICS[distance]
  const cx = Math.floor(x)
  const cy = Math.floor(y)
  const cz = Math.floor(z)
  const fx = x - cx
  const fy = y - cy
  const fz = z - cz
  let f1 = 1e10
  let f2 = 1e10
  for (let oz = -1; oz <= 1; oz++) {
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const h = hash3(cx + ox, cy + oy, cz + oz)
        const dx = ox + unit(h) - fx
        const dy = oy + unit(hash(h)) - fy
        const dz = oz + unit(hash(h + JITTER_SEED)) - fz
        const dist = metric.cpu(dx, dy, dz)
        if (dist < f1) {
          f2 = f1
          f1 = dist
        } else if (dist < f2) {
          f2 = dist
        }
      }
    }
  }
  out.f1 = metric.finishCpu(f1)
  out.f2 = metric.finishCpu(f2)
  return out
}
