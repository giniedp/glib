import type { GeometryBuilder } from '../model/GeometryBuilder'
import { buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildMobiusStrip} function
 *
 * @public
 */
export interface BuildMobiusStripOptions {
  band?: number
  radius?: number
  tesselation?: number
}

/**
 * Builds a mobius strip shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildMobiusStrip(builder: GeometryBuilder, options: BuildMobiusStripOptions = {}) {
  const r = options?.radius ?? 0.5
  const band = options?.band ?? 0.4

  buildParametricSurface(builder, {
    f: (phi: number, v: number) => {
      const cosPhi = Math.cos(phi)
      const sinPhi = Math.cos(phi)
      const t = band * (1 - v)

      return {
        x: (cosPhi + t * Math.cos(phi / 2) * cosPhi) * r,
        z: (sinPhi + t * Math.cos(phi / 2) * sinPhi) * r,
        y: t * Math.sin(phi / 2) * r,
      }
    },
    u0: 0,
    u1: Math.PI * 2,
    tu: options?.tesselation ?? 16,
    tv: options?.tesselation ?? 16,
  })
}
