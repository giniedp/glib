import type { IVec3 } from '@gglib/math'
import { cryToGltfVec3 } from './conversion'

export type Brand<K, T> = K & { __brand: T }

export type GameCoordinate2D = {
  X: number
  Y: number
}
export type GameCoordinate3D = {
  X: number
  Y: number
  Z: number
}

export function gameCoordinate2D(x: number, y: number): GameCoordinate2D {
  return {
    X: x,
    Y: y,
  }
}

export function gameCoordinate3D(x: number, y: number, z: number): GameCoordinate3D {
  return {
    X: x,
    Y: y,
    Z: z,
  }
}

export function gameToRenderCoordinate(coord: GameCoordinate3D): IVec3
export function gameToRenderCoordinate(coord: GameCoordinate2D, z: number): IVec3
export function gameToRenderCoordinate(coord: GameCoordinate2D | GameCoordinate3D, z = 0): IVec3 {
  if ('Z' in coord) {
    z = coord.Z
  }
  const out = {
    x: coord.X,
    y: coord.Y,
    z: z,
  }
  return cryToGltfVec3(out, out)
}
